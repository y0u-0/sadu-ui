import type { ComponentType, ReactElement } from "react"
import { GalleryFilterProvider } from "../gallery/card"
import { DisplayGallery } from "../gallery/display"
import { InputsGallery } from "../gallery/inputs"
import { MenusGallery } from "../gallery/menus"
import { OverlaysGallery } from "../gallery/overlays"
import { PickersGallery } from "../gallery/pickers"
import type { Family } from "./catalog/define"

type GalleryFamily = Exclude<Family, "signature">

const BATCHES: Record<GalleryFamily, ComponentType> = {
  actions: MenusGallery,
  overlays: OverlaysGallery,
  entry: InputsGallery,
  pickers: PickersGallery,
  display: DisplayGallery,
}

function GalleryDemo({ family, name }: { family: GalleryFamily; name: string }): ReactElement {
  const Batch = BATCHES[family]
  return (
    <GalleryFilterProvider value={{ only: name }}>
      <Batch />
    </GalleryFilterProvider>
  )
}

export { GalleryDemo }
export type { GalleryFamily }
