import { memo, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactElement, type RefObject } from "react"
import { flushSync } from "react-dom"
import type { Grid } from "./motifs"
import type { Colors } from "./palette"
import "./weave.css"

type Cell = { width: number; height: number }

type Level = "thread" | "cloth" | "stitch"

const LEVELS: Record<Level, Cell> = {
  thread: { width: 10, height: 4 },
  cloth: { width: 8, height: 3 },
  stitch: { width: 6, height: 2 },
}

const DEFAULT_CELL = LEVELS.cloth
const ROW_TONE = [0, -3, 2, -1, 3, -2, 0, 1, -3, 2, -1]
const SLUB_COLUMNS = 37
const WOOL_CLOTH = "#e6d9bf"
const GOAT_HAIR = "#1f1813"

type WeaveProps = {
  grid: Grid
  colors: Colors
  level?: Level
  cell?: Cell
  bare?: boolean
  offset?: number
  seed?: number
  abrash?: boolean
  className?: string
  style?: CSSProperties
}

function useSvgId(prefix: string): string {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, "")}`
}

function colorOf(char: string, colors: Colors): string {
  if (char === "x") return colors.dye
  if (char === "k") return colors.accent
  if (char === "w") return WOOL_CLOTH
  if (char === "b") return GOAT_HAIR
  return colors.ground
}

function hash(value: number): number {
  let x = Math.imul(value ^ 0x9e3779b9, 0x85ebca6b)
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35)
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296
}

const CONTENT_CACHE_LIMIT = 400
const contentCache = new Map<string, ReactElement[]>()

/* Pattern content depends only on its inputs, so identical bands across the page share one element list. */
function cached(key: string, make: () => ReactElement[]): ReactElement[] {
  const hit = contentCache.get(key)
  if (hit) return hit
  const made = make()
  if (contentCache.size >= CONTENT_CACHE_LIMIT) contentCache.delete(contentCache.keys().next().value!)
  contentCache.set(key, made)
  return made
}

function contentKey(kind: string, grid: Grid, colors: Colors, cell: Cell): string {
  return `${kind}|${cell.width}x${cell.height}|${colors.ground}|${colors.dye}|${colors.accent}|${grid.join("/")}`
}

function box(x: number, y: number, width: number, height: number): string {
  return `M${x} ${y}h${width}v${height}h${-width}z`
}

/*
 * One <path> per group of runs instead of one <rect> per run cuts the cloth's element count by about two thirds.
 * Shapes in a group must not share an edge, or anti-aliasing would close the hairline between rows that separate
 * rects leave when the cloth is drawn scaled, so groups are colour by row parity, with wrapped copies apart from
 * the run they meet at the tile edge.
 */
function runsOf(grid: Grid, colors: Colors, cell: Cell): ReactElement[] {
  const columns = grid[0]?.length ?? 0
  const tile = columns * cell.width
  const groups = new Map<string, { color: string; parts: string[] }>()
  const add = (color: string, key: string, part: string) => {
    let group = groups.get(key)
    if (!group) groups.set(key, (group = { color, parts: [] }))
    group.parts.push(part)
  }
  grid.forEach((line, row) => {
    const shift = row % 2 === 1 ? cell.width / 2 : 0
    const y = row * cell.height
    let start = 0
    for (let column = 1; column <= columns; column++) {
      const color = colorOf(line[start] ?? ".", colors)
      if (column < columns && colorOf(line[column] ?? ".", colors) === color) continue
      const x = start * cell.width + shift
      const width = (column - start) * cell.width
      add(color, `${color}|${row % 2}`, box(x, y, width, cell.height))
      if (x + width > tile) add(color, `${color}|${row % 2}|wrap`, box(x - tile, y, width, cell.height))
      start = column
    }
  })
  return [...groups].map(([key, { color, parts }]) => <path key={key} d={parts.join("")} style={{ fill: color }} />)
}

function threadsOf(grid: Grid, colors: Colors, cell: Cell): ReactElement[] {
  return grid.map((line, row) => {
    const counts = new Map<string, number>()
    for (const char of line) counts.set(char, (counts.get(char) ?? 0) + 1)
    const dominant = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "."
    return (
      <rect
        key={row}
        x={0}
        y={row * cell.height + Math.floor(cell.height / 2)}
        width={(line.length || 1) * cell.width}
        height={1}
        style={{ fill: colorOf(dominant, colors) }}
      />
    )
  })
}

function slubsOf(rows: number, cell: Cell, seed: number): ReactElement[] {
  const groups = new Map<number, string[]>()
  for (let index = 0; index < rows * SLUB_COLUMNS; index++) {
    if (hash(index * 31 + seed * 977) >= 1 / 40) continue
    const row = index % rows
    const column = Math.floor(index / rows)
    const shift = row % 2 === 1 ? cell.width / 2 : 0
    const key = (row % 2) * 2 + (column % 2)
    let parts = groups.get(key)
    if (!parts) groups.set(key, (parts = []))
    parts.push(box(column * cell.width + shift - 0.5, row * cell.height, cell.width, cell.height))
  }
  return [...groups].map(([key, parts]) => <path key={key} d={parts.join("")} fill="#fff" opacity="0.06" />)
}

function toneOf(cell: Cell): ReactElement[] {
  const byShade = new Map<number, string[]>()
  ROW_TONE.forEach((tone, row) => {
    if (tone === 0) return
    let parts = byShade.get(tone)
    if (!parts) byShade.set(tone, (parts = []))
    parts.push(box(0, row * cell.height, cell.width, cell.height))
  })
  return [...byShade].map(([tone, parts]) => (
    <path key={tone} d={parts.join("")} fill={tone > 0 ? "#fff" : "#000"} opacity={Math.abs(tone) / 100} />
  ))
}

function WeaveCloth({
  grid,
  colors,
  level = "cloth",
  cell,
  bare = false,
  offset = 0,
  seed = 1,
  abrash = false,
  className,
  style,
}: WeaveProps): ReactElement {
  const id = useSvgId("weave")
  const size = cell ?? LEVELS[level]
  const rows = grid.length
  const tileWidth = (grid[0]?.length ?? 1) * size.width
  const tileHeight = rows * size.height
  const detailed = level !== "stitch" && size.height >= 3
  const classes = ["sadu-weave", className].filter(Boolean).join(" ")

  if (bare) {
    return (
      <svg className={classes} style={style} aria-hidden="true" focusable="false">
        <defs>
          <pattern id={`${id}-warp`} patternUnits="userSpaceOnUse" x={offset} width={tileWidth} height={tileHeight}>
            {cached(contentKey("threads", grid, colors, size), () => threadsOf(grid, colors, size))}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id}-warp)`} />
      </svg>
    )
  }

  return (
    <svg className={classes} style={style} aria-hidden="true" focusable="false" data-level={level}>
      <defs>
        <pattern id={`${id}-cloth`} patternUnits="userSpaceOnUse" x={offset} width={tileWidth} height={tileHeight}>
          {cached(contentKey("runs", grid, colors, size), () => runsOf(grid, colors, size))}
        </pattern>
        <pattern id={`${id}-dimple`} patternUnits="userSpaceOnUse" x={offset} width={size.width} height={size.height * 2}>
          <path d={box(size.width - 1, 0, 1, size.height) + box(size.width / 2 - 1, size.height, 1, size.height)} fill="#000" opacity="0.22" />
        </pattern>
        {detailed && (
          <>
            <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.1" />
              <stop offset="0.33" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.67" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" style={{ stopOpacity: "var(--sadu-thread-shade, 0.16)" }} />
            </linearGradient>
            <pattern id={`${id}-row`} patternUnits="userSpaceOnUse" width={size.width} height={size.height}>
              <rect width={size.width} height={size.height} fill={`url(#${id}-shade)`} />
            </pattern>
            <pattern id={`${id}-tone`} patternUnits="userSpaceOnUse" width={size.width} height={size.height * ROW_TONE.length}>
              {cached(`tone|${size.width}x${size.height}`, () => toneOf(size))}
            </pattern>
            <pattern id={`${id}-slub`} patternUnits="userSpaceOnUse" x={offset} width={SLUB_COLUMNS * size.width} height={tileHeight}>
              {cached(`slubs|${rows}|${size.width}x${size.height}|${seed}`, () => slubsOf(rows, size, seed))}
            </pattern>
            {level === "thread" && (
              <pattern id={`${id}-ply`} patternUnits="userSpaceOnUse" x={offset} width={size.width} height={size.height * 2}>
                <path d={`M2 ${size.height}L${size.width - 2} 0`} stroke="#000" strokeOpacity="0.1" />
                <path d={`M${size.width / 2 + 2} ${size.height * 2}L${size.width * 1.5 - 2} ${size.height}`} stroke="#000" strokeOpacity="0.1" />
                <path d={`M${2 - size.width / 2} ${size.height * 2}L${size.width / 2 - 2} ${size.height}`} stroke="#000" strokeOpacity="0.1" />
              </pattern>
            )}
            {abrash && (
              <linearGradient id={`${id}-abrash`} x1="0" y1="0" x2="240" y2="0" gradientUnits="userSpaceOnUse" spreadMethod="reflect">
                <stop offset="0" stopColor="#000" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity="0.06" />
              </linearGradient>
            )}
          </>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id}-cloth)`} />
      {detailed && <rect width="100%" height="100%" fill={`url(#${id}-tone)`} />}
      {detailed && <rect width="100%" height="100%" fill={`url(#${id}-slub)`} />}
      {detailed && abrash && <rect width="100%" height="100%" fill={`url(#${id}-abrash)`} />}
      <rect width="100%" height="100%" fill={`url(#${id}-dimple)`} />
      {detailed && level === "thread" && <rect width="100%" height="100%" fill={`url(#${id}-ply)`} />}
      {detailed && <rect width="100%" height="100%" fill={`url(#${id}-row)`} />}
    </svg>
  )
}

function sameCell(a: Cell | undefined, b: Cell | undefined): boolean {
  return a === b || (a !== undefined && b !== undefined && a.width === b.width && a.height === b.height)
}

function sameColors(a: Colors, b: Colors): boolean {
  return a === b || (a.ground === b.ground && a.dye === b.dye && a.accent === b.accent)
}

function sameGrid(a: Grid, b: Grid): boolean {
  return a === b || (a.length === b.length && a.every((row, index) => row === b[index]))
}

function sameStyle(a: CSSProperties | undefined, b: CSSProperties | undefined): boolean {
  if (a === b) return true
  if (!a || !b) return false
  const keys = Object.keys(a) as (keyof CSSProperties)[]
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
}

/* Callers build grids, colours, cells and styles inline, so a re-render with equal values must not re-weave. */
function sameWeaveProps<Props extends WeaveProps>(previous: Props, next: Props): boolean {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)] as (keyof Props)[])
  for (const key of keys) {
    const a = previous[key]
    const b = next[key]
    if (a === b) continue
    if (key === "grid" ? sameGrid(a as Grid, b as Grid) : key === "colors" ? sameColors(a as Colors, b as Colors) : key === "cell" ? sameCell(a as Cell, b as Cell) : key === "style" ? sameStyle(a as CSSProperties, b as CSSProperties) : false) continue
    return false
  }
  return true
}

const Weave = memo(WeaveCloth, sameWeaveProps)

type WidthWatcher = (width: number) => void
type Watched = { count: number; watchers: Set<WidthWatcher> }

const lastWidth = new WeakMap<Element, number>()
const watched = new Map<Element, Watched>()
let widthObserver: ResizeObserver | undefined

/*
 * One ResizeObserver for every woven band. It reports after layout and before paint, so nothing reads layout
 * synchronously; React state updates are flushed in the same frame so the first paint is already measured.
 */
function onResize(entries: ResizeObserverEntry[]): void {
  const notify: (() => void)[] = []
  for (const entry of entries) {
    const width = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width
    lastWidth.set(entry.target, width)
    watched.get(entry.target)?.watchers.forEach((watcher) => notify.push(() => watcher(width)))
  }
  if (notify.length) flushSync(() => notify.forEach((run) => run()))
}

function watchWidth(node: Element, watcher?: WidthWatcher): () => void {
  widthObserver ??= new ResizeObserver(onResize)
  let entry = watched.get(node)
  if (!entry) {
    entry = { count: 0, watchers: new Set() }
    watched.set(node, entry)
    widthObserver.observe(node)
  }
  const current = entry
  current.count += 1
  if (watcher) current.watchers.add(watcher)
  return () => {
    if (watcher) current.watchers.delete(watcher)
    current.count -= 1
    if (current.count > 0) return
    watched.delete(node)
    lastWidth.delete(node)
    widthObserver?.unobserve(node)
  }
}

function columnsOf(width: number, cellWidth: number): number {
  return Math.max(1, Math.round(width / cellWidth))
}

function useColumns(cellWidth: number): readonly [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(1)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const known = lastWidth.get(node)
    if (known !== undefined) setColumns(columnsOf(known, cellWidth))
    return watchWidth(node, (width) => setColumns(columnsOf(width, cellWidth)))
  }, [cellWidth])
  return [ref, columns] as const
}

function beatStyle(columns: number, cap: number): CSSProperties {
  return {
    ["--sadu-beat-columns" as string]: columns,
    ["--sadu-beat-duration" as string]: `${Math.min(cap, columns * 40)}ms`,
  }
}

function writeBeat(node: HTMLElement, width: number, cellWidth: number, cap: number): void {
  for (const [name, value] of Object.entries(beatStyle(columnsOf(width, cellWidth), cap))) node.style.setProperty(name, String(value))
}

/*
 * The beat (step count and duration) only matters while a layer is weaving, so it is written straight onto the
 * node when a weave starts, from the shared observer's last width, instead of living in React state. A node the
 * observer has not sized (hidden, or skipped by content-visibility) keeps the stylesheet's default beat until it
 * is laid out, rather than forcing a synchronous layout to measure it.
 */
function useBeat(ref: RefObject<HTMLElement | null>, cellWidth: number, cap: number, weaving: number, enabled = true): void {
  const beat = useRef({ cellWidth, cap, weaving })
  useLayoutEffect(() => {
    const node = ref.current
    if (!node || !enabled) return
    return watchWidth(node, (width) => {
      if (beat.current.weaving) writeBeat(node, width, beat.current.cellWidth, beat.current.cap)
    })
  }, [ref, enabled])
  useLayoutEffect(() => {
    beat.current = { cellWidth, cap, weaving }
    const node = ref.current
    const width = node ? lastWidth.get(node) : undefined
    if (node && enabled && weaving && width !== undefined) writeBeat(node, width, cellWidth, cap)
  }, [ref, enabled, weaving, cellWidth, cap])
}

type Layer = { signature: string; grid: Grid; colors: Colors; generation: number }

type ReweaveProps = WeaveProps & { beater?: boolean; cap?: number; duration?: number }

type WovenProps = ReweaveProps & { ownBeat: boolean }

function signatureOf(grid: Grid, colors: Colors): string {
  return `${grid.join("|")}#${colors.ground}${colors.dye}${colors.accent}`
}

function WovenLayers({ ownBeat, beater = true, cap, duration, className, style, ...weave }: WovenProps): ReactElement {
  const size = weave.cell ?? LEVELS[weave.level ?? "cloth"]
  const signature = signatureOf(weave.grid, weave.colors)
  const ref = useRef<HTMLDivElement>(null)
  const [layers, setLayers] = useState<Layer[]>(() => [{ signature, grid: weave.grid, colors: weave.colors, generation: 0 }])
  const top = layers[layers.length - 1]
  if (top && top.signature !== signature) {
    setLayers([top, { signature, grid: weave.grid, colors: weave.colors, generation: top.generation + 1 }])
  }
  const weaving = layers.length > 1 ? (top?.generation ?? 0) : 0
  useBeat(ref, size.width, cap ?? duration ?? 900, weaving, ownBeat)
  const settle = (generation: number) => setLayers((current) => current.filter((layer) => layer.generation >= generation))
  return (
    <div ref={ref} className={["sadu-reweave", className].filter(Boolean).join(" ")} style={style}>
      {layers.map((layer, index) => (
        <div
          key={layer.generation}
          className="sadu-reweave__layer"
          data-weaving={index > 0 || undefined}
          onAnimationEnd={index > 0 ? (event) => event.target === event.currentTarget && settle(layer.generation) : undefined}
        >
          <Weave {...weave} grid={layer.grid} colors={layer.colors} />
        </div>
      ))}
      {beater && layers.length > 1 && <span key={`beater-${top?.generation}`} className="sadu-beater sadu-reweave__beater" aria-hidden="true" />}
    </div>
  )
}

const Woven = memo(WovenLayers, sameWeaveProps)

function Reweave(props: ReweaveProps): ReactElement {
  return <Woven {...props} ownBeat />
}

export { DEFAULT_CELL, GOAT_HAIR, LEVELS, Reweave, WOOL_CLOTH, Weave, Woven, beatStyle, useBeat, useColumns, watchWidth }
export type { Cell, Level }
