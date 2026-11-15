import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { buildRegistry, watchRegistry } from "./build-registry.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const GALLERY = join(ROOT, "src/gallery")
const SADU = join(ROOT, "src/sadu")
const UI_SDK_DOCS = join(ROOT, "node_modules/@ui-sdk/react/docs/components")
const DOCS_ID = "virtual:sadu-docs"
const RESOLVED_DOCS_ID = `\0${DOCS_ID}`
const USAGE_LINES = 32
const DEMO_CLASS = /\s+className="[a-z]+-demo[^"]*"/g
const DEMO_STYLE = /\s+style=\{[A-Z_]+\}/g
const COMPONENT_TAG = /<(Sadu|Eye|Loom|Warp|Wool|Weaver|Wood|Thread|Beam|Dye|Code|Motif|Skein|Rug)[A-Za-z]*/

function attribute(source, name) {
  const match = source.match(new RegExp(`\\b${name}="([^"]*)"`))
  return match ? match[1] : undefined
}

const QUOTED = /("(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/.source
const TRANSLATED = String.raw`\bt\(\s*${QUOTED}\s*,\s*${QUOTED}\s*,?\s*\)`

/** Gallery demos write copy as t("English", "Arabic"); usage snippets show the English as plain JSX. */
function untranslate(code) {
  const literal = (english) => english.startsWith('"')
  return code
    .replace(new RegExp(`=\\{${TRANSLATED}\\}`, "g"), (_, english) => (literal(english) ? `=${english}` : `={${english}}`))
    .replace(new RegExp(`\\{${TRANSLATED}\\}`, "g"), (_, english) => (literal(english) ? JSON.parse(english) : `{${english}}`))
    .replace(new RegExp(TRANSLATED, "g"), (_, english) => english)
}

function dedent(lines) {
  const indents = lines.filter((line) => line.trim()).map((line) => line.match(/^ */)[0].length)
  const cut = Math.min(...indents)
  return lines.map((line) => line.slice(cut))
}

function functionReturn(source, name) {
  const start = source.search(new RegExp(`function ${name}\\(`))
  if (start < 0) return undefined
  const lines = source.slice(start).split("\n")
  const open = lines.findIndex((line) => /^ {2}return \($/.test(line))
  if (open < 0) {
    const single = lines.find((line) => /^ {2}return </.test(line))
    return single ? [single.replace(/^ {2}return /, "")] : undefined
  }
  const close = lines.findIndex((line, index) => index > open && line === "  )")
  return close < 0 ? undefined : lines.slice(open + 1, close)
}

function focus(lines) {
  if (lines.length <= USAGE_LINES) return lines
  const first = lines.findIndex((line) => COMPONENT_TAG.test(line))
  if (first < 0) return [...lines.slice(0, USAGE_LINES), "…"]
  const indent = lines[first].match(/^ */)[0]
  const end = lines.findIndex((line, index) => index >= first && line.startsWith(`${indent}</`) || (index === first && /\/>\s*$/.test(line)))
  const element = lines.slice(first, end < 0 ? first + USAGE_LINES : end + 1)
  return element.length <= USAGE_LINES ? element : [...element.slice(0, USAGE_LINES), `${indent}…`]
}

function exportsBySource() {
  const owners = new Map()
  for (const file of readdirSync(SADU).filter((name) => /\.tsx?$/.test(name) && name !== "index.ts")) {
    const source = readFileSync(join(SADU, file), "utf8")
    for (const declared of source.matchAll(/^export (?:function|const) ([A-Za-z]+)/gm)) owners.set(declared[1], file.replace(/\.tsx?$/, ""))
    for (const block of source.matchAll(/^export\s*{([^}]*)}/gm)) {
      for (const name of block[1].split(",").map((part) => part.trim().split(/\s+as\s+/).pop()).filter(Boolean)) {
        if (!owners.has(name)) owners.set(name, file.replace(/\.tsx?$/, ""))
      }
    }
  }
  return owners
}

function importsFor(code, owners) {
  const byFile = new Map()
  const withoutStrings = code.replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  for (const match of withoutStrings.matchAll(/\b([A-Z][A-Za-z]+|[a-z][A-Za-z]+(?=\())/g)) {
    const file = owners.get(match[1])
    if (!file) continue
    byFile.set(file, new Set([...(byFile.get(file) ?? []), match[1]]))
  }
  return [...byFile.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, names]) => `import { ${[...names].sort().join(", ")} } from "@/components/sadu/${file}"`)
}

function galleryCards() {
  const owners = exportsBySource()
  const cards = {}
  for (const file of readdirSync(GALLERY).filter((name) => name.endsWith(".tsx")).sort()) {
    const source = readFileSync(join(GALLERY, file), "utf8")
    for (const card of source.matchAll(/<Card\b([^>]*?)>\n([\s\S]*?)\n\s*<\/Card>/g)) {
      const name = attribute(card[1], "name")
      if (!name) continue
      const children = dedent(card[2].split("\n"))
      const call = children.length === 1 ? children[0].match(/^<([A-Z][A-Za-z]+) \/>$/) : null
      const body = call ? functionReturn(source, call[1]) : children
      const lines = body ? untranslate(focus(dedent(body)).join("\n").replace(DEMO_CLASS, "").replace(DEMO_STYLE, "")) : ""
      cards[name] = {
        idea: attribute(card[1], "idea") ?? "",
        arabicIdea: attribute(card[1], "arabicIdea") ?? "",
        usage: lines ? [...importsFor(lines, owners), "", lines].join("\n") : "",
      }
    }
  }
  return cards
}

function keyboardSection(markdown) {
  const lines = markdown.split("\n")
  const start = lines.findIndex((line) => /^(#{2,3} Keyboard( Navigation)?|\*\*Keyboard\*\*)\s*$/.test(line))
  if (start < 0) return undefined
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => /^#{1,3} |^\*\*[^*]+\*\*\s*$/.test(line))
  const section = rest.slice(0, end < 0 ? undefined : end)
  const rows = section
    .filter((line) => line.startsWith("|") && !/^\|\s*-/.test(line))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/`/g, "")))
    .slice(1)
  const clean = (line) => line.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`/g, "").trim()
  const items = section.filter((line) => /^- /.test(line)).map((line) => clean(line.slice(2)))
  const text = section
    .filter((line) => line.trim() && !line.startsWith("|") && !/^- /.test(line))
    .join(" ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`/g, "")
    .trim()
  return { rows, items, text }
}

function keyboardDocs() {
  const docs = {}
  if (!existsSync(UI_SDK_DOCS)) return docs
  for (const file of readdirSync(UI_SDK_DOCS).filter((name) => name.endsWith(".md"))) {
    const section = keyboardSection(readFileSync(join(UI_SDK_DOCS, file), "utf8"))
    if (section && (section.rows.length > 0 || section.items.length > 0 || section.text)) docs[file.replace(/\.md$/, "")] = section
  }
  return docs
}

function saduPlugin() {
  let watcher
  return {
    name: "sadu",
    resolveId(id) {
      return id === DOCS_ID ? RESOLVED_DOCS_ID : undefined
    },
    load(id) {
      if (id !== RESOLVED_DOCS_ID) return undefined
      for (const file of readdirSync(GALLERY)) this.addWatchFile(join(GALLERY, file))
      return `export const cards = ${JSON.stringify(galleryCards())}\nexport const keyboard = ${JSON.stringify(keyboardDocs())}\n`
    },
    buildStart() {
      if (this.meta.watchMode || process.env.VITEST) return
      buildRegistry()
    },
    configureServer(server) {
      if (process.env.VITEST) return
      watcher = watchRegistry()
      server.httpServer?.once("close", () => watcher?.close())
      server.watcher.on("change", (file) => {
        if (!file.startsWith(GALLERY) && !file.startsWith(SADU)) return
        const module = server.moduleGraph.getModuleById(RESOLVED_DOCS_ID)
        if (module) server.reloadModule(module)
      })
    },
  }
}

export { saduPlugin }
