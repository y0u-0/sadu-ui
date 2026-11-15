import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, watch, writeFileSync } from "node:fs"
import { dirname, join, posix, relative, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const SOURCE = join(ROOT, "src/sadu")
const OUTPUT = join(ROOT, "public/r")
const PACKAGE = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"))

const ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json"
const REGISTRY_SCHEMA = "https://ui.shadcn.com/schema/registry.json"
const TARGET_ROOT = "components/sadu"
const CORE_ID = "sadu-core"
const PEER_PACKAGES = new Set(["react", "react-dom"])

const CORE_FILES = [
  "sadu.css",
  "weave.tsx",
  "weave.css",
  "motifs.ts",
  "palette.ts",
  "parts.tsx",
  "styles/parts.css",
  "rug.tsx",
  "merge-class.ts",
  "popup-surface.tsx",
  "locale.tsx",
]

const NOT_ITEMS = new Set(["index.ts"])

const EXTRA_REGISTRY_DEPENDENCIES = {
  "sadu-menubar": ["sadu-menu"],
}

const DESCRIPTIONS = {
  [CORE_ID]: "The Sadu foundation: tokens, the Weave and Rug primitives, motifs, palette and the shared parts (Cord, Thread, Eye, Fringe).",
}

const registryUrl = (
  process.env.SADU_REGISTRY_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/r` : "http://localhost:5191/r")
).replace(/\/$/, "")

const IMPORT_PATTERNS = [
  /\bimport\s+(?:type\s+)?(?:[^"'`;]*?\sfrom\s+)?["']([^"']+)["']/g,
  /\bexport\s+(?:type\s+)?[^"'`;]*?\sfrom\s+["']([^"']+)["']/g,
  /\bimport\(\s*["']([^"']+)["']\s*\)/g,
  /@import\s+(?:url\()?["']([^"']+)["']/g,
]

function read(file) {
  return readFileSync(join(SOURCE, file), "utf8")
}

function specifiersOf(file) {
  const source = read(file)
  const found = new Set()
  for (const pattern of IMPORT_PATTERNS) {
    for (const match of source.matchAll(pattern)) found.add(match[1])
  }
  return [...found]
}

function resolveRelative(from, specifier) {
  const base = posix.normalize(posix.join(posix.dirname(from), specifier))
  const candidates = [base, `${base}.tsx`, `${base}.ts`, `${base}/index.ts`, `${base}/index.tsx`]
  const hit = candidates.find((candidate) => existsSync(join(SOURCE, candidate)) && !candidate.endsWith("/"))
  if (!hit) throw new Error(`Cannot resolve "${specifier}" from src/sadu/${from}`)
  return hit
}

function packageOf(specifier) {
  const parts = specifier.split("/")
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]
}

function dependencyOf(name) {
  const range = PACKAGE.dependencies?.[name]
  if (!range) throw new Error(`"${name}" is imported by the library but missing from package.json dependencies`)
  return `${name}@${range}`
}

function walk(entry, stopAt) {
  const files = new Set()
  const packages = new Set()
  const reached = new Set()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.shift()
    if (files.has(file)) continue
    files.add(file)
    for (const specifier of specifiersOf(file)) {
      if (!specifier.startsWith(".")) {
        const name = packageOf(specifier)
        if (!PEER_PACKAGES.has(name)) packages.add(name)
        continue
      }
      const target = resolveRelative(file, specifier)
      if (target !== entry && stopAt(target)) {
        reached.add(target)
        continue
      }
      queue.push(target)
    }
  }
  return { files, packages, reached }
}

function fileTypeOf(file) {
  if (file.endsWith(".css")) return "registry:file"
  if (file.endsWith(".ts")) return "registry:lib"
  return "registry:ui"
}

function fileOf(file, withContent) {
  const entry = { path: `src/sadu/${file}`, type: fileTypeOf(file), target: `${TARGET_ROOT}/${file}` }
  return withContent ? { ...entry, content: read(file) } : entry
}

function titleOf(id) {
  return id
    .split("-")
    .map((word) => (word === "otp" ? "OTP" : word[0].toUpperCase() + word.slice(1)))
    .join(" ")
}

function descriptionOf(id, entry) {
  if (DESCRIPTIONS[id]) return DESCRIPTIONS[id]
  const exports = [...read(entry).matchAll(/^export\s*{([^}]*)}/gm)].flatMap((match) =>
    match[1].split(",").map((name) => name.trim()).filter(Boolean),
  )
  return `Exports ${exports.join(", ")}. Styled in Al Sadu over UI SDK behaviors.`
}

function sortedFiles(files) {
  return [...files].sort((a, b) => {
    const rank = (file) => (file.endsWith(".css") ? 1 : 0) + (file.startsWith("styles/") ? 1 : 0)
    return rank(a) - rank(b) || a.localeCompare(b)
  })
}

function build() {
  const topLevel = readdirSync(SOURCE).filter((file) => /\.(tsx|ts)$/.test(file) && !NOT_ITEMS.has(file))
  const core = new Set(CORE_FILES)
  const entries = topLevel.filter((file) => !core.has(file) && file.endsWith(".tsx"))
  const entryFiles = new Set(entries)
  const idOf = (file) => file.replace(/\.tsx$/, "")

  const walked = new Map(
    entries.map((entry) => [entry, walk(entry, (target) => core.has(target) || entryFiles.has(target))]),
  )

  const directDependencies = new Map(
    entries.map((entry) => {
      const reachedEntries = [...walked.get(entry).reached].filter((file) => entryFiles.has(file)).map(idOf)
      return [entry, [...new Set([...reachedEntries, ...(EXTRA_REGISTRY_DEPENDENCIES[idOf(entry)] ?? [])])]]
    }),
  )

  const closureOf = (entry, seen = new Set()) => {
    for (const id of directDependencies.get(entry)) {
      if (seen.has(id)) continue
      seen.add(id)
      closureOf(`${id}.tsx`, seen)
    }
    return seen
  }

  const ownFiles = new Map(
    entries.map((entry) => {
      const inherited = new Set([...closureOf(entry)].flatMap((id) => [...walked.get(`${id}.tsx`).files]))
      return [entry, new Set([...walked.get(entry).files].filter((file) => file === entry || !inherited.has(file)))]
    }),
  )

  const owners = new Map()
  for (const [entry, files] of ownFiles) {
    for (const file of files) {
      if (file === entry) continue
      owners.set(file, [...(owners.get(file) ?? []), entry])
    }
  }
  const reachesEntry = (file) =>
    [...walk(file, (target) => core.has(target) || entryFiles.has(target)).reached].some((target) => entryFiles.has(target))
  for (const [file, holders] of owners) {
    if (holders.length < 2 || reachesEntry(file)) continue
    core.add(file)
    for (const holder of holders) ownFiles.get(holder).delete(file)
  }

  const coreWalk = [...core].map((file) => walk(file, (target) => entryFiles.has(target)))
  const strayEntries = coreWalk.flatMap((result) => [...result.reached])
  if (strayEntries.length > 0) throw new Error(`Core files import component entries: ${strayEntries.join(", ")}`)
  const coreFiles = new Set(coreWalk.flatMap((result) => [...result.files]))
  const corePackages = new Set(coreWalk.flatMap((result) => [...result.packages]))

  const items = [
    {
      name: CORE_ID,
      type: "registry:ui",
      title: "Sadu Core",
      description: descriptionOf(CORE_ID),
      dependencies: [...corePackages].sort().map(dependencyOf),
      registryDependencies: [],
      files: sortedFiles(coreFiles),
    },
    ...entries.map((entry) => {
      const id = idOf(entry)
      const files = [...ownFiles.get(entry)].filter((file) => !coreFiles.has(file))
      const packages = new Set([...files].flatMap((file) => [...walk(file, () => true).packages]))
      return {
        name: id,
        type: "registry:ui",
        title: titleOf(id),
        description: descriptionOf(id, entry),
        dependencies: [...packages].sort().map(dependencyOf),
        registryDependencies: [CORE_ID, ...directDependencies.get(entry)].map((dependency) => `${registryUrl}/${dependency}.json`),
        files: sortedFiles([entry, ...files.filter((file) => file !== entry)]),
      }
    }),
  ]

  mkdirSync(OUTPUT, { recursive: true })
  const written = new Set()
  const write = (name, value) => {
    written.add(name)
    writeFileSync(join(OUTPUT, name), `${JSON.stringify(value, null, 2)}\n`)
  }

  for (const item of items) {
    write(`${item.name}.json`, { $schema: ITEM_SCHEMA, ...item, files: item.files.map((file) => fileOf(file, true)) })
  }
  write("registry.json", {
    $schema: REGISTRY_SCHEMA,
    name: "sadu",
    homepage: registryUrl.replace(/\/r$/, ""),
    items: items.map((item) => ({ ...item, files: item.files.map((file) => fileOf(file, false)) })),
  })

  for (const stale of readdirSync(OUTPUT).filter((name) => !written.has(name))) rmSync(join(OUTPUT, stale), { recursive: true, force: true })

  const fileCount = new Set(items.flatMap((item) => item.files)).size
  console.log(`registry: ${items.length} items, ${fileCount} files → ${relative(ROOT, OUTPUT)} (${registryUrl})`)
}

const REBUILD_DELAY = 150

function watchRegistry() {
  let timer
  const rebuild = () => {
    try {
      build()
    } catch (error) {
      console.error(`registry: kept the last good build. ${error instanceof Error ? error.message : error}`)
    }
  }
  rebuild()
  return watch(SOURCE, { recursive: true }, (_event, file) => {
    if (!file || !/\.(tsx|ts|css)$/.test(file)) return
    clearTimeout(timer)
    timer = setTimeout(rebuild, REBUILD_DELAY)
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--watch")) watchRegistry()
  else build()
}

export { build as buildRegistry, watchRegistry }
