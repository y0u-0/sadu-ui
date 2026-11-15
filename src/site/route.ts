import { useSyncExternalStore } from "react"

type Route = { page: "home" } | { page: "component"; id: string }

const HOME: Route = { page: "home" }

let current: { hash: string; route: Route } = { hash: "", route: HOME }

function parse(hash: string): Route | null {
  if (hash === "" || hash === "#" || hash === "#/") return HOME
  if (!hash.startsWith("#/")) return null
  const [section, id] = hash.slice(2).split("/")
  if (section === "c" && id) return { page: "component", id: decodeURIComponent(id) }
  return HOME
}

function snapshot(): Route {
  const hash = window.location.hash
  if (hash === current.hash) return current.route
  current = { hash, route: parse(hash) ?? current.route }
  return current.route
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}

function useRoute(): Route {
  return useSyncExternalStore(subscribe, snapshot, () => HOME)
}

type EntryState = { saduEntry?: string } | null

let entryCount = 0

function historyEntry(): string {
  const state = window.history.state as EntryState
  if (state?.saduEntry) return state.saduEntry
  entryCount += 1
  const entry = `${Date.now().toString(36)}-${entryCount}`
  window.history.replaceState({ ...(state ?? {}), saduEntry: entry }, "")
  return entry
}

function hrefOf(route: Route): string {
  return route.page === "component" ? `#/c/${encodeURIComponent(route.id)}` : "#/"
}

export { historyEntry, hrefOf, useRoute }
export type { Route }
