import type { ComponentProps, ReactElement, ReactNode } from "react"
import { MOTIFS, type Grid } from "./motifs"
import { WOOLS } from "./palette"
import { Cord } from "./parts"
import { registerUninherited } from "./uninherited"
import { GOAT_HAIR, WOOL_CLOTH, Weave } from "./weave"
import "./styles/popup-surface.css"

registerUninherited(["--available-height", "--available-width"])

type PopupEdge = "cord" | "band" | "none"

type PopupSurfaceProps = ComponentProps<"div"> & {
  edge?: PopupEdge
  dye?: string
  arrow?: ReactNode
}

const ARROW: Grid = ["...kk...", "...xx...", "..xxxx..", ".xxxxxx."]
const ARROW_CELL = { width: 4, height: 2.5 }

function PopupSurface({ edge = "cord", dye = WOOLS.madder.hex, arrow, className, children, ...props }: PopupSurfaceProps): ReactElement {
  return (
    <div {...props} className={["sadu-popup", className].filter(Boolean).join(" ")} data-edge={edge}>
      {arrow}
      {edge === "cord" && <Cord size={4} className="sadu-popup__edge" />}
      {edge === "band" && (
        <span className="sadu-popup__edge" aria-hidden="true">
          <Weave grid={MOTIFS.dhurs.grid} colors={{ ground: GOAT_HAIR, dye: WOOL_CLOTH, accent: dye }} level="stitch" />
        </span>
      )}
      {children}
    </div>
  )
}

type PopupArrowProps = Omit<ComponentProps<"span">, "children"> & { dye?: string }

function PopupArrow({ dye = WOOLS.madder.hex, className, ...props }: PopupArrowProps): ReactElement {
  return (
    <span {...props} className={["sadu-popup__arrow", className].filter(Boolean).join(" ")}>
      <span className="sadu-popup__arrow-cloth" aria-hidden="true">
        <Weave grid={ARROW} colors={{ ground: GOAT_HAIR, dye, accent: WOOL_CLOTH }} cell={ARROW_CELL} level="stitch" />
      </span>
    </span>
  )
}

export { PopupArrow, PopupSurface }
export type { PopupArrowProps, PopupEdge, PopupSurfaceProps }
