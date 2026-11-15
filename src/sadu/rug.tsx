import { useMemo, useRef, useState, type CSSProperties, type ReactElement } from "react"
import { useSaduLocale } from "./locale"
import { MOTIFS, shajarah, type Grid, type MotifId } from "./motifs"
import { INK, type Colors } from "./palette"
import { GOAT_HAIR, LEVELS, WOOL_CLOTH, Weave, Woven, useBeat, type Cell, type Level } from "./weave"

type Band = { key: string; grid: Grid; colors: Colors; abrash?: boolean }

type RugProps = {
  motif: MotifId
  dye: string
  seed?: number
  level?: Level
  cell?: Cell
  duration?: number
  woven?: number
  rows?: number
  className?: string
  style?: CSSProperties
}

function stripe(rows: number): Grid {
  return Array.from({ length: rows }, () => "x")
}

function solid(color: string): Colors {
  return { ground: color, dye: color, accent: color }
}

function mainColors(dye: string): Colors {
  return { ground: INK.black, dye, accent: INK.wool }
}

const PINSTRIPES: Grid = ["w", "b", "w"]

function bandsOf(motif: MotifId, dye: string, seed: number, rows: number): Band[] {
  const half = (side: string): Band[] => [
    { key: `${side}-hair`, grid: stripe(2), colors: solid(GOAT_HAIR) },
    { key: `${side}-field`, grid: stripe(8), colors: solid(dye), abrash: true },
    { key: `${side}-pin-outer`, grid: PINSTRIPES, colors: solid(WOOL_CLOTH) },
    { key: `${side}-border`, grid: MOTIFS[motif].grid, colors: mainColors(dye) },
    { key: `${side}-pin-inner`, grid: PINSTRIPES, colors: solid(WOOL_CLOTH) },
    { key: `${side}-field-inner`, grid: stripe(4), colors: solid(dye), abrash: true },
    { key: `${side}-hair-inner`, grid: stripe(2), colors: solid(GOAT_HAIR) },
  ]
  const recipe = [
    ...half("top"),
    { key: "shajarah", grid: shajarah(seed), colors: { ground: GOAT_HAIR, dye, accent: WOOL_CLOTH } },
    ...half("bottom").reverse(),
  ]
  const bands = [...recipe]
  let total = bands.reduce((sum, band) => sum + band.grid.length, 0)
  for (let index = 0; total < rows; index++) {
    const band = recipe[index % recipe.length]!
    bands.push({ ...band, key: `repeat-${index}-${band.key}` })
    total += band.grid.length
  }
  return bands
}

function Rug({
  motif,
  dye,
  seed = 7,
  level = "cloth",
  cell,
  duration = 900,
  woven,
  rows = 0,
  className,
  style,
}: RugProps): ReactElement {
  const size = cell ?? LEVELS[level]
  const signature = `${motif}:${dye}:${seed}`
  const [sweep, setSweep] = useState({ signature, generation: 0, beating: false })
  if (sweep.signature !== signature) setSweep({ signature, generation: sweep.generation + 1, beating: true })
  const rest = (generation: number) =>
    setSweep((current) => (current.generation === generation ? { ...current, beating: false } : current))
  const clothRef = useRef<HTMLDivElement>(null)
  useBeat(clothRef, size.width, duration, sweep.beating ? sweep.generation : 0)
  const bands = useMemo(() => bandsOf(motif, dye, seed, rows), [motif, dye, seed, rows])
  const arabic = useSaduLocale() === "ar"
  const height = (band: Band) => band.grid.length * size.height
  return (
    <div
      className={["sadu-rug", className].filter(Boolean).join(" ")}
      style={{ ...style, ["--sadu-woven" as string]: woven === undefined ? "100%" : `${woven}px` }}
      role="img"
      aria-label={arabic ? `بساط بحاشية ${MOTIFS[motif].arabic}` : `Rug with ${MOTIFS[motif].name} borders`}
      data-on-loom={woven === undefined ? undefined : ""}
    >
      {woven !== undefined && (
        <div className="sadu-rug__warp" aria-hidden="true">
          {bands.map((band) => (
            <Weave key={band.key} bare grid={band.grid} colors={band.colors} cell={size} style={{ height: height(band) }} />
          ))}
        </div>
      )}
      <div ref={clothRef} className="sadu-rug__cloth">
        {bands.map((band) => (
          <Woven
            key={band.key}
            ownBeat={false}
            grid={band.grid}
            colors={band.colors}
            level={level}
            cell={cell}
            seed={seed + band.key.length}
            abrash={band.abrash}
            cap={duration}
            beater={false}
            style={{ height: height(band) }}
          />
        ))}
        {sweep.beating && (
          <span
            key={sweep.generation}
            className="sadu-beater"
            aria-hidden="true"
            onAnimationEnd={(event) => event.animationName === "sadu-beat-fade" && rest(sweep.generation)}
          />
        )}
      </div>
    </div>
  )
}

export { Rug, mainColors }
