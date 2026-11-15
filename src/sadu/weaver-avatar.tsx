import "./styles/weaver-avatar.css"
import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/react/avatar"
import { Children, useState, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { useLocalized, type Localized } from "./locale"
import { mergeClass } from "./merge-class"
import { INK, WOOLS } from "./palette"
import { Eye } from "./parts"

type WeaverAvatarSize = 20 | 28 | 40 | 64
type WeaverAvatarStatus = "present" | "away"

type AvatarCopy = { status: Record<WeaverAvatarStatus, string>; more: (count: number) => string }

const COPY: Localized<AvatarCopy> = {
  en: { status: { present: "Present", away: "Away" }, more: (count) => `and ${count} more` },
  ar: { status: { present: "حاضر", away: "غائب" }, more: (count) => `و${count} غيرهم` },
}

type WeaverAvatarProps = Omit<ComponentProps<typeof Avatar>, "children"> & {
  name: string
  src?: string
  size?: WeaverAvatarSize
  status?: WeaverAvatarStatus
  fallbackDelay?: number
}

type WeaverAvatarGroupProps = {
  label: string
  max?: number
  size?: WeaverAvatarSize
  children: ReactNode
  className?: string
}

type Brand = { mark: string; ground: string; light: boolean }

const WOOL_CLOTH = "#e6d9bf"
const BRANDS: readonly Brand[] = [
  { mark: WOOLS.madder.light, ground: INK.black, light: false },
  { mark: WOOLS.saffron.light, ground: INK.black, light: false },
  { mark: WOOLS.indigo.hex, ground: WOOL_CLOTH, light: true },
  { mark: WOOLS.camel.light, ground: INK.black, light: false },
  { mark: WOOLS.madder.hex, ground: WOOL_CLOTH, light: true },
]
const FLOAT: Record<WeaverAvatarSize, { width: number; height: number }> = {
  20: { width: 3, height: 2 },
  28: { width: 4, height: 2 },
  40: { width: 6, height: 3 },
  64: { width: 8, height: 4 },
}
const MARK_ROWS = 7
const MARK_COLUMNS = 5
const EDGE_STROKES = ["..x..", ".xxx.", "x.x.x", "xxxxx", "x...x"] as const
const STROKES = [...EDGE_STROKES, ".x.x.", "xx.xx", "....."] as const

function hashOf(text: string): number {
  let hash = 2166136261
  for (const char of text.trim().toLowerCase()) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return hash >>> 0
}

function randomFrom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = Math.imul(state ^ (state >>> 15), state | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function wasmOf(seed: number): boolean[][] {
  const random = randomFrom(seed)
  return Array.from({ length: MARK_ROWS }, (_, row) => {
    const strokes = row === 0 || row === MARK_ROWS - 1 ? EDGE_STROKES : STROKES
    const stroke = strokes[Math.floor(random() * strokes.length)] ?? "..x.."
    return [...stroke].map((cell) => cell === "x")
  })
}

function Wasm({ name, size }: { name: string; size: WeaverAvatarSize }): ReactElement {
  const { width: w, height: h } = FLOAT[size]
  const seed = hashOf(name)
  const brand = BRANDS[(seed >>> 9) % BRANDS.length] ?? BRANDS[0]!
  const cells = wasmOf(seed)
  return (
    <span className="sadu-avatar__wasm" style={{ background: brand.ground }} data-light={brand.light || undefined}>
      <svg width={MARK_COLUMNS * w} height={MARK_ROWS * h} aria-hidden="true" focusable="false">
        {cells.flatMap((row, y) =>
          row.map((on, x) =>
            on ? (
              <g key={`${x}-${y}`}>
                <rect x={x * w} y={y * h} width={w} height={h} rx={0.5} fill={brand.mark} />
                {row[x - 1] && <rect x={x * w - 0.5} y={y * h} width={1} height={h} fill="#000" opacity={0.22} />}
              </g>
            ) : null,
          ),
        )}
      </svg>
    </span>
  )
}

function WeaverAvatar({
  name,
  src,
  size = 40,
  status,
  fallbackDelay,
  onLoadingStatusChange,
  className,
  ...props
}: WeaverAvatarProps): ReactElement {
  const copy = useLocalized(COPY)
  const [revealing, setRevealing] = useState(false)
  return (
    <Avatar
      title={name}
      {...props}
      className={mergeClass("sadu-avatar", className)}
      data-size={size}
      data-revealing={revealing || undefined}
      onLoadingStatusChange={(next, details) => {
        setRevealing(next === "loaded" && details.event !== undefined)
        onLoadingStatusChange?.(next, details)
      }}
    >
      <span className="sadu-avatar__patch">
        <AvatarFallback className="sadu-avatar__fallback" delay={fallbackDelay}>
          {(state) => (
            <>
              {state.loadingStatus === "loading" ? <span className="sadu-avatar__threads" /> : <Wasm name={name} size={size} />}
              <span className="sadu-avatar__name">{name}</span>
            </>
          )}
        </AvatarFallback>
        {src && <AvatarImage className="sadu-avatar__image" src={src} alt={name} />}
      </span>
      {status && (
        <span className="sadu-avatar__status" data-status={status}>
          <Eye size={10} tone={status === "present" ? "value" : "separator"} state={status === "present" ? "on" : "off"} />
          <span className="sadu-avatar__name">{copy.status[status]}</span>
        </span>
      )}
    </Avatar>
  )
}

function WeaverAvatarGroup({ label, max, size = 40, children, className }: WeaverAvatarGroupProps): ReactElement {
  const copy = useLocalized(COPY)
  const avatars = Children.toArray(children)
  const shown = max === undefined ? avatars : avatars.slice(0, Math.max(0, max))
  const hidden = avatars.length - shown.length
  return (
    <div role="group" aria-label={label} className={["sadu-avatar-group", className].filter(Boolean).join(" ")} data-size={size}>
      {shown}
      {hidden > 0 && (
        <span className="sadu-avatar-group__more">
          <span aria-hidden="true" dir="ltr">+{hidden}</span>
          <span className="sadu-avatar__name">{copy.more(hidden)}</span>
        </span>
      )}
    </div>
  )
}

export { WeaverAvatar, WeaverAvatarGroup }
export type { WeaverAvatarGroupProps, WeaverAvatarProps, WeaverAvatarSize, WeaverAvatarStatus }
