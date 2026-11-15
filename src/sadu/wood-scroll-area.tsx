import "./styles/wood-scroll-area.css"
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@ui-sdk/react/scroll-area"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { mergeClass } from "./merge-class"
import { registerUninherited } from "./uninherited"

registerUninherited(
  ["x", "y"].flatMap((axis) => [`--scroll-area-overflow-${axis}-start`, `--scroll-area-overflow-${axis}-end`, `--scroll-area-progress-${axis}`]),
)

type WoodScrollAreaAxis = "vertical" | "horizontal" | "both"

type WoodScrollAreaProps = Omit<ComponentProps<typeof ScrollArea>, "children"> & {
  label?: string
  axis?: WoodScrollAreaAxis
  children: ReactNode
}

function WoodScrollbar({ orientation }: { orientation: "vertical" | "horizontal" }): ReactElement {
  return (
    <ScrollAreaScrollbar orientation={orientation} className="sadu-scroll__bar">
      <ScrollAreaThumb className="sadu-scroll__thumb">
        <span className="sadu-scroll__wood sadu-wood" data-lying={orientation === "horizontal" ? "" : undefined} />
      </ScrollAreaThumb>
    </ScrollAreaScrollbar>
  )
}

function WoodScrollArea({ label, axis = "vertical", className, children, ...props }: WoodScrollAreaProps): ReactElement {
  return (
    <ScrollArea {...props} className={mergeClass("sadu-scroll", className)}>
      <ScrollAreaViewport className="sadu-scroll__viewport" role={label ? "region" : undefined} aria-label={label}>
        <ScrollAreaContent className="sadu-scroll__content">{children}</ScrollAreaContent>
      </ScrollAreaViewport>
      {axis !== "horizontal" && <WoodScrollbar orientation="vertical" />}
      {axis !== "vertical" && <WoodScrollbar orientation="horizontal" />}
      {axis === "both" && <ScrollAreaCorner className="sadu-scroll__corner" />}
    </ScrollArea>
  )
}

export { WoodScrollArea }
export type { WoodScrollAreaAxis, WoodScrollAreaProps }
