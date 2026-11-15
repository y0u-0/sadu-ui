import { OverlayHost } from "@ui-sdk/react/overlays"
import { Suspense, lazy, type ReactElement } from "react"
import { Gallery } from "./gallery"
import { Site } from "./site/site"

const CoreFixture = lazy(() => import("./site/core-fixture").then((module) => ({ default: module.CoreFixture })))

function App(): ReactElement {
  const params = new URLSearchParams(window.location.search)
  const only = params.get("gallery")
  if (only) {
    return (
      <main className="page">
        <OverlayHost />
        <Gallery only={only} />
      </main>
    )
  }
  if (params.get("fixture") === "core") {
    return (
      <Suspense fallback={null}>
        <OverlayHost />
        <CoreFixture />
      </Suspense>
    )
  }
  return <Site />
}

export { App }
