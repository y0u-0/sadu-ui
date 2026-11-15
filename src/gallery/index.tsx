import type { ComponentType, ReactElement } from "react"
import { DisplayGallery } from "./display"
import { InputsGallery } from "./inputs"
import { MenusGallery } from "./menus"
import { OverlaysGallery } from "./overlays"
import { PickersGallery } from "./pickers"

const BATCHES: Record<string, ComponentType> = {
  overlays: OverlaysGallery,
  menus: MenusGallery,
  inputs: InputsGallery,
  pickers: PickersGallery,
  display: DisplayGallery,
}

function Gallery({ only }: { only: string }): ReactElement {
  const Batch = BATCHES[only]
  if (Batch) return <Batch />
  return (
    <>
      {Object.entries(BATCHES).map(([id, All]) => (
        <All key={id} />
      ))}
    </>
  )
}

export { Gallery }
