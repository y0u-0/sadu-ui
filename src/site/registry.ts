import { downloadZip, type ZipEntry } from "./zip"

type RegistryFile = { path: string; type: string; target: string; content: string }

type RegistryItem = {
  name: string
  title: string
  description: string
  dependencies: string[]
  registryDependencies: string[]
  files: RegistryFile[]
}

type RegistryIndex = { name: string; items: { name: string }[] }

const CORE_ITEM = "sadu-core"

const CONFIGURED_ORIGIN: unknown = import.meta.env.VITE_SADU_PUBLIC_ORIGIN

function registryAt(origin: string): string {
  return new URL("r", new URL(import.meta.env.BASE_URL, origin)).href
}

function registryBase(): string {
  return registryAt(window.location.origin)
}

function publicRegistryBase(): string {
  return registryAt(typeof CONFIGURED_ORIGIN === "string" && CONFIGURED_ORIGIN ? CONFIGURED_ORIGIN : window.location.origin)
}

function itemUrl(name: string): string {
  return `${registryBase()}/${name}.json`
}

function installCommand(name: string): string {
  return `npx shadcn@latest add ${publicRegistryBase()}/${name}.json`
}

function installPrompt(): string {
  const base = publicRegistryBase()
  return [
    `Install components from the Sadu shadcn registry. ${base}/registry.json lists every item.`,
    `Add one with \`npx shadcn@latest add ${base}/<name>.json\`; each item brings sadu-core and the items it needs.`,
    "Import `components/sadu/sadu.css` once.",
    "Set data-theme=\"day\" or \"tent\" on the root, and dir=\"rtl\" on pages that read right to left.",
  ].join("\n")
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string")
}

function isRegistryFile(value: unknown): value is RegistryFile {
  if (typeof value !== "object" || value === null) return false
  const file = value as Record<string, unknown>
  return typeof file.path === "string" && typeof file.target === "string" && typeof file.content === "string"
}

function isRegistryItem(value: unknown): value is RegistryItem {
  if (typeof value !== "object" || value === null) return false
  const item = value as Record<string, unknown>
  return (
    typeof item.name === "string" &&
    isStringArray(item.dependencies) &&
    isStringArray(item.registryDependencies) &&
    Array.isArray(item.files) &&
    item.files.every(isRegistryFile)
  )
}

function isRegistryIndex(value: unknown): value is RegistryIndex {
  if (typeof value !== "object" || value === null) return false
  const index = value as Record<string, unknown>
  return Array.isArray(index.items) && index.items.every((item) => typeof (item as { name?: unknown }).name === "string")
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} answered ${response.status}`)
  return response.json()
}

const itemCache = new Map<string, Promise<RegistryItem>>()

function fetchItem(name: string): Promise<RegistryItem> {
  const cached = itemCache.get(name)
  if (cached) return cached
  const request = fetchJson(itemUrl(name)).then((value) => {
    if (!isRegistryItem(value)) throw new Error(`${name}.json is not a registry item`)
    return value
  })
  request.catch(() => itemCache.delete(name))
  itemCache.set(name, request)
  return request
}

function dependencyName(url: string): string {
  return url.slice(url.lastIndexOf("/") + 1).replace(/\.json$/, "")
}

async function itemWithDependencies(name: string): Promise<RegistryItem[]> {
  const seen = new Map<string, RegistryItem>()
  const visit = async (next: string): Promise<void> => {
    if (seen.has(next)) return
    const item = await fetchItem(next)
    seen.set(next, item)
    await Promise.all(item.registryDependencies.map((url) => visit(dependencyName(url))))
  }
  await visit(name)
  return [...seen.values()]
}

function entriesOf(items: readonly RegistryItem[]): ZipEntry[] {
  const byTarget = new Map<string, ZipEntry>()
  for (const item of items) {
    for (const file of item.files) byTarget.set(file.target, { path: `sadu/${file.target}`, content: file.content })
  }
  return [...byTarget.values()].sort((a, b) => a.path.localeCompare(b.path))
}

async function downloadItem(name: string): Promise<void> {
  downloadZip(`${name}.zip`, entriesOf(await itemWithDependencies(name)))
}

async function downloadLibrary(): Promise<void> {
  const index = await fetchJson(`${registryBase()}/registry.json`)
  if (!isRegistryIndex(index)) throw new Error("registry.json has no items")
  const items = await Promise.all(index.items.map((item) => fetchItem(item.name)))
  downloadZip("sadu.zip", entriesOf(items))
}

export { CORE_ITEM, dependencyName, downloadItem, downloadLibrary, fetchItem, installCommand, installPrompt, itemUrl, registryBase }
export type { RegistryFile, RegistryItem }
