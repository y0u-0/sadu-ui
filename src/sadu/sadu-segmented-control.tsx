import "./styles/sadu-segmented-control.css"
import { SegmentedControl, SegmentedControlIndicator, SegmentedControlItem } from "@ui-sdk/react/segmented-control"
import type { ComponentProps, ReactElement, ReactNode, TransitionEvent } from "react"
import { mergeClass } from "./merge-class"
import type { Grid } from "./motifs"
import { Weave } from "./weave"

type SaduSegmentedControlProps = Omit<ComponentProps<typeof SegmentedControl>, "children"> & { children?: ReactNode }
type SaduSegmentProps = Omit<ComponentProps<typeof SegmentedControlItem>, "children"> & { children?: ReactNode }
type Heading = "left" | "right"

const ITEM = '[data-slot="segmented-control-item"]'
const ROOT = '[data-slot="segmented-control"]'
const KEY_HEADINGS: Record<string, Heading> = { ArrowRight: "right", ArrowLeft: "left" }
const BAND: Grid = ["xxxxxx", "kkk...", ...Array.from({ length: 11 }, () => "......"), "...kkk", "xxxxxx"]
const BAND_COLORS = { ground: "var(--sadu-capsule)", dye: "var(--sadu-madder-cloth)", accent: "var(--sadu-capsule-ink)" }
const LANDING_FALLBACK_MS = 700
const landings = new WeakMap<HTMLElement, number>()

function reducesMotion(element: Element): boolean {
  return element.closest('[data-motion="reduced"]') !== null || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
}

function headingOf(root: Element, event: Event): Heading | undefined {
  if (root.getAttribute("data-orientation") === "vertical") return undefined
  const rtl = root.matches(":dir(rtl)")
  if (event instanceof KeyboardEvent) {
    if (event.key in KEY_HEADINGS) return KEY_HEADINGS[event.key]
    if (event.key === "Home") return rtl ? "right" : "left"
    if (event.key === "End") return rtl ? "left" : "right"
    return undefined
  }
  const target = event.target instanceof Element ? event.target : null
  const items = [...root.querySelectorAll(ITEM)]
  const from = items.findIndex((item) => item.hasAttribute("data-checked"))
  const to = target ? items.findIndex((item) => item.contains(target)) : -1
  if (from < 0 || to < 0 || from === to) return undefined
  return to > from !== rtl ? "right" : "left"
}

function throwShuttle(event: Event | undefined): void {
  const root = event?.target instanceof Element ? event.target.closest<HTMLElement>(ROOT) : null
  if (!root || !event) return
  const heading = headingOf(root, event)
  if (!heading || reducesMotion(root)) {
    delete root.dataset.heading
    delete root.dataset.moving
    return
  }
  root.dataset.heading = heading
  root.dataset.moving = ""
  window.clearTimeout(landings.get(root))
  landings.set(
    root,
    window.setTimeout(() => delete root.dataset.moving, LANDING_FALLBACK_MS),
  )
}

function landShuttle(event: TransitionEvent<HTMLElement>): void {
  const root = event.currentTarget.closest<HTMLElement>(ROOT)
  if (!root || !(event.target instanceof Element) || !event.target.classList.contains("sadu-segmented__thread")) return
  const trailing = root.dataset.heading === "right" ? "left" : "right"
  if (event.propertyName === trailing) delete root.dataset.moving
}

function Band({ className }: { className: string }): ReactElement {
  return (
    <span className={className} aria-hidden="true">
      <Weave grid={BAND} colors={BAND_COLORS} level="stitch" />
    </span>
  )
}

function SaduSegmentedControl({ className, children, onValueChange, ...props }: SaduSegmentedControlProps): ReactElement {
  return (
    <SegmentedControl
      {...props}
      onValueChange={(value, details) => {
        throwShuttle(details.event)
        onValueChange?.(value, details)
      }}
      className={mergeClass("sadu-segmented", className)}
    >
      <SegmentedControlIndicator className="sadu-segmented__indicator" onTransitionEnd={landShuttle}>
        <span className="sadu-segmented__thread" />
        <Band className="sadu-segmented__shuttle" />
      </SegmentedControlIndicator>
      {children}
    </SegmentedControl>
  )
}

function SaduSegment({ className, children, ...props }: SaduSegmentProps): ReactElement {
  const label = typeof children === "string" ? children : undefined
  return (
    <SegmentedControlItem {...props} className={mergeClass("sadu-segmented__item", className)}>
      <Band className="sadu-segmented__band" />
      <span className="sadu-segmented__label" data-label={label}>
        <span>{children}</span>
      </span>
    </SegmentedControlItem>
  )
}

export { SaduSegment, SaduSegmentedControl }
export type { SaduSegmentProps, SaduSegmentedControlProps }
