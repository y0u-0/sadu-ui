import { OverlayHost } from "@ui-sdk/react/overlays"
import { Activity, useLayoutEffect, type ReactElement } from "react"
import { MOTIFS } from "../sadu/motifs"
import { INK } from "../sadu/palette"
import { Fringe } from "../sadu/parts"
import { SaduToastRegion } from "../sadu/sadu-toast"
import { Reweave } from "../sadu/weave"
import { CATALOG } from "./catalog"
import { DetailPage } from "./detail-page"
import { HomePage } from "./home-page"
import { historyEntry, useRoute, type Route } from "./route"
import { useCopy } from "./locale"
import { SettingsProvider, useDye } from "./settings"
import { TopBar } from "./top-bar"
import "./styles/site.css"
import "./styles/catalogue.css"
import "./styles/demos.css"
import "./styles/detail.css"

function routeKey(route: Route): string {
  return route.page === "component" ? `component:${route.id}` : route.page
}

function Page({ route }: { route: Route }): ReactElement {
  return (
    <>
      <Activity mode={route.page === "home" ? "visible" : "hidden"}>
        <HomePage />
      </Activity>
      {route.page === "component" && <DetailPage key={route.id} id={route.id} />}
    </>
  )
}

const UNESCO_SEARCH = "https://ich.unesco.org/en/lists?text=sadu"

function Colophon(): ReactElement {
  const copy = useCopy()
  const { dyeHex } = useDye()
  return (
    <footer className="colophon">
      <div className="colophon__selvedge" aria-hidden="true">
        <Reweave grid={MOTIFS.dhurs.grid} colors={{ ground: INK.black, dye: dyeHex, accent: INK.wool }} level="cloth" />
      </div>
      <Fringe className="colophon__fringe" />
      <div className="colophon__inner">
        <p>{copy.colophon}</p>
        <ul className="colophon__sources" aria-label={copy.sources}>
          <li>Al Sadu Society</li>
          <li>Sadu House</li>
          <li>
            <a href={UNESCO_SEARCH}>UNESCO Intangible Cultural Heritage</a>
          </li>
          <li>Crichton</li>
          <li>Canavan</li>
        </ul>
        <p className="colophon__meta" dir="ltr">
          {copy.colophonMeta(CATALOG.length)}
        </p>
      </div>
    </footer>
  )
}

const scrollByEntry = new Map<string, number>()

function useScrollMemory(routeKey: string): void {
  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual"
    const entry = historyEntry()
    window.scrollTo({ top: scrollByEntry.get(entry) ?? 0 })
    const remember = () => scrollByEntry.set(entry, window.scrollY)
    window.addEventListener("scroll", remember, { passive: true })
    return () => window.removeEventListener("scroll", remember)
  }, [routeKey])
}

function Shell(): ReactElement {
  const route = useRoute()
  const key = routeKey(route)
  useScrollMemory(key)

  return (
    <>
      <OverlayHost />
      <SaduToastRegion />
      <TopBar />
      <main className="site" data-page={route.page}>
        <Page route={route} />
      </main>
      <Colophon />
    </>
  )
}

function Site(): ReactElement {
  return (
    <SettingsProvider>
      <Shell />
    </SettingsProvider>
  )
}

export { Site }
