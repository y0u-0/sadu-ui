import "./styles/sadu-drawer.css"
import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
  type DrawerProps,
} from "@ui-sdk/react/drawer"
import { useLayoutEffect, useRef, useState, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { useLocalized } from "./locale"
import { mergeClass } from "./merge-class"
import { MOTIFS } from "./motifs"
import {
  CloseIcon,
  OverlayFooter,
  OverlayHeader,
  SpecimenButton,
  SpecimenScope,
  SpecimenText,
  joinClass,
  textClass,
  useSpecimen,
} from "./overlay-kit"
import { WOOLS } from "./palette"
import { IconButton } from "./parts"
import { PopupSurface } from "./popup-surface"
import { mainColors } from "./rug"
import { SaduButton } from "./sadu-button"
import type { ButtonLook } from "./sadu-dialog"
import { Weave } from "./weave"

type SaduDrawerContentProps = ComponentProps<typeof DrawerContent> & { dye?: string; backdropClassName?: string }

type DrawerSide = "start" | "end" | "bottom"
type PhysicalSide = "left" | "right" | "bottom"

type SaduDrawerSpecimenProps = { side?: DrawerSide; dye?: string; children?: ReactNode; className?: string }

function RolledEdge({ dye }: { dye: string }): ReactElement {
  return (
    <span className="sadu-drawer__roll" aria-hidden="true">
      <span className="sadu-drawer__rug">
        <Weave grid={MOTIFS.eyoun.grid} colors={mainColors(dye)} level="stitch" />
      </span>
      <span className="sadu-drawer__shade" />
    </span>
  )
}

function Grip(): ReactElement {
  return (
    <span className="sadu-drawer__grip" aria-hidden="true">
      <span className="sadu-wood sadu-drawer__peg" />
    </span>
  )
}

function physicalSide(side: DrawerSide, rtl: boolean): PhysicalSide {
  if (side === "bottom") return side
  return (side === "end") !== rtl ? "right" : "left"
}

function SaduDrawerSpecimen({ side = "end", dye = WOOLS.madder.hex, children, className }: SaduDrawerSpecimenProps): ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  const [rtl, setRtl] = useState(false)
  useLayoutEffect(() => {
    if (ref.current) setRtl(ref.current.matches(":dir(rtl)"))
  }, [])
  return (
    <SpecimenScope>
      <PopupSurface
        ref={ref}
        edge="band"
        dye={dye}
        className={joinClass("sadu-drawer", className)}
        data-side={physicalSide(side, rtl)}
        data-specimen=""
        aria-hidden="true"
        inert
      >
        <Grip />
        <div className="sadu-drawer__body">{children}</div>
      </PopupSurface>
    </SpecimenScope>
  )
}

function SaduDrawer({ side = "end", ...props }: DrawerProps): ReactElement {
  return <Drawer side={side} {...props} />
}

function SaduDrawerTrigger({
  variant = "secondary",
  size,
  render,
  ...props
}: ComponentProps<typeof DrawerTrigger> & ButtonLook): ReactElement {
  return <DrawerTrigger {...props} render={render ?? <SaduButton variant={variant} size={size} />} />
}

function SaduDrawerContent({
  dye = WOOLS.madder.hex,
  backdropClassName,
  render,
  className,
  children,
  ...props
}: SaduDrawerContentProps): ReactElement {
  return (
    <>
      <DrawerBackdrop className={mergeClass("sadu-drawer-backdrop", backdropClassName)} />
      <DrawerContent {...props} render={render ?? <PopupSurface edge="band" dye={dye} />} className={mergeClass("sadu-drawer", className)}>
        {(state) => (
          <>
            <RolledEdge dye={dye} />
            <Grip />
            <div className="sadu-drawer__body">{typeof children === "function" ? children(state) : children}</div>
          </>
        )}
      </DrawerContent>
    </>
  )
}

function SaduDrawerTitle({ className, ...props }: ComponentProps<typeof DrawerTitle>): ReactElement {
  const specimen = useSpecimen()
  if (specimen) {
    return (
      <SpecimenText as="h2" className={joinClass("sadu-overlay-title", textClass(className))}>
        {props.children}
      </SpecimenText>
    )
  }
  return <DrawerTitle {...props} className={mergeClass("sadu-overlay-title", className)} />
}

function SaduDrawerDescription({ className, ...props }: ComponentProps<typeof DrawerDescription>): ReactElement {
  const specimen = useSpecimen()
  if (specimen) {
    return (
      <SpecimenText as="p" className={joinClass("sadu-overlay-description", textClass(className))}>
        {props.children}
      </SpecimenText>
    )
  }
  return <DrawerDescription {...props} className={mergeClass("sadu-overlay-description", className)} />
}

function SaduDrawerClose({ variant = "secondary", size, render, ...props }: ComponentProps<typeof DrawerClose> & ButtonLook): ReactElement {
  const specimen = useSpecimen()
  if (specimen) {
    return (
      <SpecimenButton variant={variant} size={size} className={props.className}>
        {props.children}
      </SpecimenButton>
    )
  }
  return <DrawerClose {...props} render={render ?? <SaduButton variant={variant} size={size} />} />
}

const CLOSE = { en: "Close", ar: "إغلاق" }

function SaduDrawerDismiss({
  className,
  children,
  "aria-label": ownLabel,
  render,
  ...props
}: ComponentProps<typeof DrawerClose>): ReactElement {
  const closeLabel = useLocalized(CLOSE)
  const label = ownLabel ?? closeLabel
  const specimen = useSpecimen()
  if (specimen) {
    return (
      <IconButton size={28} aria-label={label} className={joinClass("sadu-overlay-close", textClass(className))}>
        <CloseIcon />
      </IconButton>
    )
  }
  return (
    <DrawerClose
      {...props}
      aria-label={label}
      render={render ?? <IconButton size={28} />}
      className={mergeClass("sadu-overlay-close", className)}
    >
      {children ?? <CloseIcon />}
    </DrawerClose>
  )
}

export {
  SaduDrawer,
  SaduDrawerClose,
  SaduDrawerContent,
  SaduDrawerDescription,
  SaduDrawerDismiss,
  OverlayFooter as SaduDrawerFooter,
  OverlayHeader as SaduDrawerHeader,
  SaduDrawerSpecimen,
  SaduDrawerTitle,
  SaduDrawerTrigger,
}
export type { DrawerSide, SaduDrawerContentProps, SaduDrawerSpecimenProps }
