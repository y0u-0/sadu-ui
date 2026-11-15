import type { ReactElement } from "react"
import type { Grid } from "./motifs"
import type { Wool } from "./palette"
import { BandSwatch, SkeinDot, type BandSwatchSize, type SkeinDotSize } from "./parts"
import { GOAT_HAIR, WOOL_CLOTH, Weave } from "./weave"
import { WeaverAvatar } from "./weaver-avatar"
import "./styles/sadu-suggestions.css"

type BandSampleProps = {
  grid: Grid
  dye: string
  size?: BandSwatchSize
  center?: number
  rows?: readonly [number, number]
  columns?: number
}

function BandSample({ grid, dye, size, center, columns }: BandSampleProps): ReactElement {
  return <BandSwatch grid={grid} colors={{ ground: GOAT_HAIR, dye, accent: WOOL_CLOTH }} size={size ?? (columns ? "sm" : "md")} center={center} />
}

function Skein({ wool, size = 16 }: { wool: Pick<Wool, "hex" | "light" | "dark">; size?: SkeinDotSize | 12 }): ReactElement {
  return <SkeinDot wool={wool} size={size === 20 ? 20 : 16} />
}

const PLAIN: Grid = ["xxk", "xxk"]

function WovenDot({ name, dye }: { name?: string; dye?: string }): ReactElement {
  return (
    <span className="sadu-suggestions__avatar" aria-hidden="true">
      {name ? (
        <WeaverAvatar name={name} size={20} />
      ) : (
        <span className="sadu-suggestions__dot">
          <Weave grid={PLAIN} colors={{ ground: dye ?? GOAT_HAIR, dye: dye ?? GOAT_HAIR, accent: WOOL_CLOTH }} level="stitch" />
        </span>
      )}
    </span>
  )
}

export { BandSample, Skein, WovenDot }
