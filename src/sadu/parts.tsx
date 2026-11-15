import { Button } from "@ui-sdk/react/button"
import { X } from "lucide-react"
import { useId, type ComponentProps, type CSSProperties, type ReactElement, type ReactNode } from "react"
import { useLocalized } from "./locale"
import { mergeClass } from "./merge-class"
import type { Grid } from "./motifs"
import { WOOLS, type Colors, type Wool, type WoolId } from "./palette"
import { LEVELS, Weave } from "./weave"
import "./styles/parts.css"

type EyeSize = 10 | 15 | 20
type EyeState = "on" | "off" | "closed"
type EyeTone = "value" | "structure" | "separator"

const EYE_FLOAT: Record<EyeSize, { width: number; height: number }> = {
  10: { width: 4, height: 2 },
  15: { width: 6, height: 3 },
  20: { width: 8, height: 4 },
}

const EYE_ROWS = [1, 2, 3, 2, 1]
const FLOAT_RADIUS = 0.5

type EyeProps = {
  size?: EyeSize
  state?: EyeState
  tone?: EyeTone
  label?: string
  className?: string
  style?: CSSProperties
}

function Eye({ size = 15, state = "on", tone, label, className, style }: EyeProps): ReactElement {
  const float = EYE_FLOAT[size]
  const width = float.width * 3
  const height = float.height * 5
  const rows = state === "closed" ? [{ row: 2, count: 3 }] : EYE_ROWS.map((count, row) => ({ row, count }))
  const inset = state === "off" ? 0.5 : 0
  return (
    <svg
      className={["sadu-eye-mark", className].filter(Boolean).join(" ")}
      style={style}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      data-state={state}
      data-tone={tone}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {rows.flatMap(({ row, count }) =>
        Array.from({ length: count }, (_, index) => {
          const start = (width - count * float.width) / 2
          return (
            <rect
              key={`${row}-${index}`}
              x={start + index * float.width + 0.5}
              y={row * float.height + inset}
              width={float.width - 1}
              height={float.height - inset * 2}
              rx={FLOAT_RADIUS}
            />
          )
        }),
      )}
    </svg>
  )
}

type LozengeProps = { chosen?: boolean; children?: ReactNode; className?: string; style?: CSSProperties }

function Lozenge({ chosen = false, children, className, style }: LozengeProps): ReactElement {
  return (
    <span className={["sadu-lozenge", className].filter(Boolean).join(" ")} style={style} data-chosen={chosen || undefined}>
      <span className="sadu-lozenge__label">{children}</span>
    </span>
  )
}

type CordProps = { size?: 2 | 4; className?: string; style?: CSSProperties }

function Cord({ size = 4, className, style }: CordProps): ReactElement {
  const id = `cord-${useId().replace(/[^a-zA-Z0-9]/g, "")}`
  const float = size === 4 ? { width: 6, height: 2 } : { width: 4, height: 2 }
  const rows = size / float.height
  return (
    <svg
      className={["sadu-cord", className].filter(Boolean).join(" ")}
      style={style}
      height={size}
      aria-hidden="true"
      focusable="false"
      data-size={size}
    >
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" width={float.width * 2} height={size}>
          {Array.from({ length: rows }, (_, row) => {
            const shift = row % 2 === 1 ? float.width / 2 : 0
            return [0, 1, 2].map((index) => (
              <rect
                key={`${row}-${index}`}
                x={index * float.width + shift - float.width}
                y={row * float.height}
                width={float.width - 0.5}
                height={float.height}
                rx={0.8}
                style={{ fill: index % 2 === 0 ? "var(--sadu-cord-a)" : "var(--sadu-cord-b)" }}
              />
            ))
          })}
        </pattern>
      </defs>
      <rect width="100%" height={size} fill={`url(#${id})`} />
    </svg>
  )
}

type ThreadProps = {
  orientation?: "horizontal" | "vertical"
  dashed?: boolean
  className?: string
  style?: CSSProperties
}

function Thread({ orientation = "horizontal", dashed = false, className, style }: ThreadProps): ReactElement {
  return (
    <span
      className={["sadu-thread", className].filter(Boolean).join(" ")}
      style={style}
      data-orientation={orientation}
      data-dashed={dashed || undefined}
      aria-hidden="true"
    />
  )
}

const FRINGE_LENGTHS = [8, 10, 7, 9, 8, 7, 10, 9]

type FringeProps = { className?: string; style?: CSSProperties }

function Fringe({ className, style }: FringeProps): ReactElement {
  const id = `fringe-${useId().replace(/[^a-zA-Z0-9]/g, "")}`
  return (
    <svg className={["sadu-fringe", className].filter(Boolean).join(" ")} style={style} height={10} aria-hidden="true" focusable="false">
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" width={FRINGE_LENGTHS.length * 3} height={10}>
          {FRINGE_LENGTHS.map((length, index) => (
            <rect key={index} x={index * 3 + 1} width={1} height={length} style={{ fill: "var(--sadu-fringe, var(--sadu-edge))" }} />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height={10} fill={`url(#${id})`} />
    </svg>
  )
}

type EmptyWarpProps = { children?: ReactNode; className?: string }

const NOTHING_WOVEN = { en: "Nothing woven yet.", ar: "لم يُنسج شيء بعد." }

function EmptyWarp({ children, className }: EmptyWarpProps): ReactElement {
  const fallback = useLocalized(NOTHING_WOVEN)
  return (
    <div className={["sadu-empty", className].filter(Boolean).join(" ")}>
      <svg width={120} height={25} viewBox="0 0 120 25" aria-hidden="true" focusable="false">
        {[0, 1, 2, 3, 4].map((index) => (
          <rect key={index} y={index * 6} width={120} height={1} />
        ))}
      </svg>
      <span className="sadu-empty__text">{children ?? fallback}</span>
    </div>
  )
}

type SkeinDotSize = 16 | 20
type SkeinWool = WoolId | Pick<Wool, "hex" | "light" | "dark">

type SkeinDotProps = { wool: SkeinWool; size?: SkeinDotSize; label?: string; className?: string }

function yarnStyle(wool: SkeinWool): CSSProperties {
  const { hex, light, dark } = typeof wool === "string" ? WOOLS[wool] : wool
  return { "--wool": hex, "--wool-light": light, "--wool-dark": dark } as CSSProperties
}

function SkeinDot({ wool, size = 16, label, className }: SkeinDotProps): ReactElement {
  return (
    <span
      className={["sadu-skein-dot sadu-yarn", className].filter(Boolean).join(" ")}
      style={yarnStyle(wool)}
      data-size={size}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}

type BandSwatchSize = "sm" | "md" | "lg"

const BAND_SWATCH_WIDTH: Record<BandSwatchSize, number> = { sm: 32, md: 48, lg: 64 }

type BandSwatchProps = {
  grid: Grid
  colors: Colors
  center?: number
  size?: BandSwatchSize
  width?: number
  className?: string
}

function BandSwatch({ grid, colors, center, size = "md", width, className }: BandSwatchProps): ReactElement {
  const stitch = LEVELS.stitch
  const boxWidth = width ?? BAND_SWATCH_WIDTH[size]
  const columns = grid[0]?.length ?? 0
  const offset = boxWidth / 2 - (center ?? columns / 2) * stitch.width
  const style = { "--sadu-swatch-band": `${grid.length * stitch.height}px`, width } as CSSProperties
  return (
    <span className={["sadu-swatch", className].filter(Boolean).join(" ")} style={style} data-size={size} aria-hidden="true">
      <Weave grid={grid} colors={colors} level="stitch" offset={offset} />
    </span>
  )
}

const MODIFIER_KEYS = new Set(["⌘", "⇧", "⌥", "⌃"])
const INVISIBLE = /[\s‎‏⁦-⁩]/g

function keysOf(shortcut: string): string[] {
  const visible = shortcut.replace(INVISIBLE, "")
  if (/.\+./.test(visible)) return visible.split("+")
  const characters = [...visible]
  const modifiers = characters.findIndex((character) => !MODIFIER_KEYS.has(character))
  if (modifiers === -1) return characters
  const rest = characters.slice(modifiers).join("")
  return [...characters.slice(0, modifiers), ...(rest ? [rest] : [])]
}

type KbdProps = Omit<ComponentProps<"kbd">, "children"> & { children: string | readonly string[] }

function Kbd({ children, className, ...props }: KbdProps): ReactElement {
  const keys = typeof children === "string" ? keysOf(children) : children
  return (
    <kbd {...props} className={["sadu-kbd", className].filter(Boolean).join(" ")}>
      {keys.map((key, index) => (
        <kbd key={`${key}-${index}`} className="sadu-kbd__key">
          {key}
        </kbd>
      ))}
    </kbd>
  )
}

type ChipProps = Omit<ComponentProps<"span">, "children"> & {
  sample?: ReactNode
  remove?: ReactNode
  children: ReactNode
}

function Chip({ sample, remove, children, className, ...props }: ChipProps): ReactElement {
  return (
    <span {...props} className={["sadu-chip", className].filter(Boolean).join(" ")}>
      {sample && <span className="sadu-chip__sample">{sample}</span>}
      <span className="sadu-chip__label">{children}</span>
      {remove}
    </span>
  )
}

type ButtonProps = ComponentProps<typeof Button>

function ChipRemove({ className, children, ...props }: ButtonProps): ReactElement {
  return (
    <Button {...props} className={mergeClass("sadu-chip__remove", className)}>
      {children ?? <X size={12} strokeWidth={2} aria-hidden="true" />}
    </Button>
  )
}

type IconButtonSize = 28 | 36
type IconButtonVariant = "ghost" | "outline"

type IconButtonProps = ButtonProps & { size?: IconButtonSize; variant?: IconButtonVariant }

function IconButton({ size = 36, variant = "ghost", className, ...props }: IconButtonProps): ReactElement {
  return <Button {...props} className={mergeClass("sadu-icon-button", className)} data-size={size} data-variant={variant} />
}

type WoodButtonProps = ButtonProps & { upright?: boolean }

function WoodButton({ upright = false, className, ...props }: WoodButtonProps): ReactElement {
  return <Button {...props} className={mergeClass("sadu-wood-button sadu-wood", className)} data-lying={upright ? undefined : ""} />
}

export { BandSwatch, Chip, ChipRemove, Cord, EmptyWarp, Eye, Fringe, IconButton, Kbd, Lozenge, SkeinDot, Thread, WoodButton, keysOf, yarnStyle }
export type {
  BandSwatchProps,
  BandSwatchSize,
  ChipProps,
  EyeSize,
  EyeState,
  EyeTone,
  IconButtonProps,
  IconButtonSize,
  IconButtonVariant,
  KbdProps,
  LozengeProps,
  SkeinDotProps,
  SkeinDotSize,
  SkeinWool,
  WoodButtonProps,
}
