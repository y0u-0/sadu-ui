import "./styles/warp-toggle.css"
import { Toggle, ToggleGroup, ToggleIcon } from "@ui-sdk/react/toggle"
import type { ComponentProps, CSSProperties, ReactElement, ReactNode } from "react"
import { mergeClass } from "./merge-class"
import type { Grid } from "./motifs"
import { WOOLS } from "./palette"
import { Weave } from "./weave"

type WarpToggleProps = Omit<ComponentProps<typeof Toggle>, "children"> & {
  icon?: ReactNode
  dye?: string
  children?: ReactNode
}

type WarpToggleGroupProps = ComponentProps<typeof ToggleGroup>

const WARP: Grid = ["."]
const WARP_CELL = { width: 6, height: 4 }
const WARP_COLORS = { ground: "var(--sadu-edge)", dye: "var(--sadu-edge)", accent: "var(--sadu-edge)" }

function WarpToggle({ icon, dye = WOOLS.madder.hex, className, style, children, ...props }: WarpToggleProps): ReactElement {
  const label = typeof children === "string" ? children : undefined
  return (
    <Toggle
      {...props}
      className={mergeClass("sadu-warp-toggle", className)}
      style={(state) => ({ ...(typeof style === "function" ? style(state) : style), "--cloth": dye }) as CSSProperties}
    >
      <span className="sadu-warp-toggle__face" aria-hidden="true">
        <span className="sadu-warp-toggle__warp">
          <Weave bare grid={WARP} colors={WARP_COLORS} cell={WARP_CELL} />
        </span>
        <span className="sadu-warp-toggle__cloth sadu-cloth-fill" />
      </span>
      {icon && <ToggleIcon className="sadu-warp-toggle__icon">{icon}</ToggleIcon>}
      {children !== undefined && (
        <span className="sadu-warp-toggle__label" data-label={label}>
          <span>{children}</span>
        </span>
      )}
    </Toggle>
  )
}

function WarpToggleGroup({ className, ...props }: WarpToggleGroupProps): ReactElement {
  return <ToggleGroup {...props} className={mergeClass("sadu-warp-toggle-group", className)} />
}

export { WarpToggle, WarpToggleGroup }
export type { WarpToggleGroupProps, WarpToggleProps }
