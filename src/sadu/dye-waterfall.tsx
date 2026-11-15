import "./styles/dye-waterfall.css"
import {
  Waterfall,
  WaterfallAxis,
  WaterfallBar,
  WaterfallCell,
  WaterfallColumnHeader,
  WaterfallHeaderRow,
  WaterfallIndicator,
  WaterfallMark,
  WaterfallRow,
  WaterfallRowHeader,
  WaterfallTick,
} from "@ui-sdk/react/waterfall"
import { useEffect, useState, type ComponentProps, type ReactElement } from "react"
import { mergeClass } from "./merge-class"
import { Eye } from "./parts"

type DyeWaterfallProps = ComponentProps<typeof Waterfall>
type DyeWaterfallHeaderRowProps = ComponentProps<typeof WaterfallHeaderRow>
type DyeWaterfallColumnHeaderProps = ComponentProps<typeof WaterfallColumnHeader>
type DyeWaterfallAxisProps = Omit<ComponentProps<typeof WaterfallAxis>, "children">
type DyeWaterfallMarkProps = ComponentProps<typeof WaterfallMark>
type DyeWaterfallRowProps = ComponentProps<typeof WaterfallRow>
type DyeWaterfallRowHeaderProps = ComponentProps<typeof WaterfallRowHeader>
type DyeWaterfallIndicatorProps = ComponentProps<typeof WaterfallIndicator>
type DyeWaterfallCellProps = ComponentProps<typeof WaterfallCell>
type DyeWaterfallTone = "goat-hair" | "madder" | "saffron" | "indigo" | "camel" | "wool"
type DyeWaterfallBarProps = Omit<ComponentProps<typeof WaterfallBar>, "children"> & { tone?: DyeWaterfallTone }

function DyeWaterfall({ className, ...props }: DyeWaterfallProps): ReactElement | null {
  const [settled, setSettled] = useState(false)
  useEffect(() => setSettled(true), [])
  return <Waterfall {...props} className={mergeClass("sadu-waterfall", className)} data-settled={settled || undefined} />
}

function DyeWaterfallHeaderRow({ className, ...props }: DyeWaterfallHeaderRowProps): ReactElement {
  return <WaterfallHeaderRow {...props} className={mergeClass("sadu-waterfall__header-row", className)} />
}

function DyeWaterfallColumnHeader({ className, ...props }: DyeWaterfallColumnHeaderProps): ReactElement {
  return <WaterfallColumnHeader {...props} className={mergeClass("sadu-waterfall__column-header", className)} />
}

function DyeWaterfallAxis({ className, ...props }: DyeWaterfallAxisProps): ReactElement {
  return (
    <WaterfallAxis {...props} className={mergeClass("sadu-waterfall__axis", className)}>
      {(state) =>
        state.ticks.map((tick) => <WaterfallTick key={tick.time} time={tick.time} className="sadu-waterfall__tick" />)
      }
    </WaterfallAxis>
  )
}

function DyeWaterfallMark({ className, children, ...props }: DyeWaterfallMarkProps): ReactElement {
  return (
    <WaterfallMark {...props} className={mergeClass("sadu-waterfall__mark", className)}>
      {(state) => (
        <>
          <span className="sadu-waterfall__mark-label">{typeof children === "function" ? children(state) : children}</span>
          <Eye size={10} tone="value" className="sadu-waterfall__mark-eye" />
        </>
      )}
    </WaterfallMark>
  )
}

function DyeWaterfallRow({ className, ...props }: DyeWaterfallRowProps): ReactElement {
  return <WaterfallRow {...props} className={mergeClass("sadu-waterfall__row", className)} />
}

function DyeWaterfallRowHeader({ className, ...props }: DyeWaterfallRowHeaderProps): ReactElement {
  return <WaterfallRowHeader {...props} className={mergeClass("sadu-waterfall__row-header", className)} />
}

function DyeWaterfallIndicator({ className, children, ...props }: DyeWaterfallIndicatorProps): ReactElement {
  return (
    <WaterfallIndicator {...props} className={mergeClass("sadu-waterfall__indicator", className)}>
      {children ?? (
        <>
          <Eye size={10} state="closed" tone="structure" className="sadu-waterfall__eye sadu-waterfall__eye--closed" />
          <Eye size={10} tone="structure" className="sadu-waterfall__eye sadu-waterfall__eye--open" />
        </>
      )}
    </WaterfallIndicator>
  )
}

function DyeWaterfallCell({ className, ...props }: DyeWaterfallCellProps): ReactElement {
  return <WaterfallCell {...props} className={mergeClass("sadu-waterfall__cell", className)} />
}

function DyeWaterfallBar({ tone = "goat-hair", className, ...props }: DyeWaterfallBarProps): ReactElement {
  return (
    <WaterfallBar {...props} className={mergeClass("sadu-waterfall__bar", className)}>
      <span className={tone === "wool" ? "sadu-waterfall__span" : "sadu-waterfall__span sadu-cloth-fill"} data-tone={tone} />
    </WaterfallBar>
  )
}

export {
  DyeWaterfall,
  DyeWaterfallAxis,
  DyeWaterfallBar,
  DyeWaterfallCell,
  DyeWaterfallColumnHeader,
  DyeWaterfallHeaderRow,
  DyeWaterfallIndicator,
  DyeWaterfallMark,
  DyeWaterfallRow,
  DyeWaterfallRowHeader,
}
export type {
  DyeWaterfallAxisProps,
  DyeWaterfallBarProps,
  DyeWaterfallCellProps,
  DyeWaterfallColumnHeaderProps,
  DyeWaterfallHeaderRowProps,
  DyeWaterfallIndicatorProps,
  DyeWaterfallMarkProps,
  DyeWaterfallProps,
  DyeWaterfallRowHeaderProps,
  DyeWaterfallRowProps,
  DyeWaterfallTone,
}
