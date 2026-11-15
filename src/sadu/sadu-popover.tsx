import "./styles/sadu-popover.css"
import {
  Popover,
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
  type PopoverProps,
} from "@ui-sdk/react/popover"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { mergeClass } from "./merge-class"
import { SpecimenButton, SpecimenScope, SpecimenText, joinClass, textClass, useSpecimen } from "./overlay-kit"
import { WOOLS } from "./palette"
import { PopupArrow, PopupSurface } from "./popup-surface"
import { SaduButton } from "./sadu-button"
import type { ButtonLook } from "./sadu-dialog"

type SaduPopoverContentProps = ComponentProps<typeof PopoverContent> & { dye?: string }

type SaduPopoverSpecimenProps = { dye?: string; children?: ReactNode; className?: string }

function SaduPopoverSpecimen({ dye = WOOLS.madder.hex, children, className }: SaduPopoverSpecimenProps): ReactElement {
  return (
    <SpecimenScope>
      <PopupSurface
        dye={dye}
        arrow={<PopupArrow dye={dye} data-side="bottom" className="sadu-popover__specimen-arrow" />}
        className={joinClass("sadu-popover", className)}
        data-side="bottom"
        data-specimen=""
        aria-hidden="true"
        inert
      >
        {children}
      </PopupSurface>
    </SpecimenScope>
  )
}

function SaduPopover(props: PopoverProps): ReactElement {
  return <Popover {...props} />
}

function SaduPopoverTrigger({
  variant = "secondary",
  size,
  render,
  className,
  ...props
}: ComponentProps<typeof PopoverTrigger> & ButtonLook): ReactElement {
  return (
    <PopoverTrigger
      {...props}
      className={mergeClass("sadu-popover-trigger", className)}
      render={render ?? <SaduButton variant={variant} size={size} />}
    />
  )
}

function SaduPopoverContent({
  dye = WOOLS.madder.hex,
  sideOffset = 12,
  arrowPadding = 18,
  render,
  className,
  children,
  ...props
}: SaduPopoverContentProps): ReactElement {
  return (
    <PopoverContent
      {...props}
      sideOffset={sideOffset}
      arrowPadding={arrowPadding}
      render={render ?? <PopupSurface dye={dye} />}
      className={mergeClass("sadu-popover", className)}
    >
      {(state) => (
        <>
          <PopoverArrow render={<PopupArrow dye={dye} />} />
          {typeof children === "function" ? children(state) : children}
        </>
      )}
    </PopoverContent>
  )
}

function SaduPopoverTitle({ className, ...props }: ComponentProps<typeof PopoverTitle>): ReactElement {
  const specimen = useSpecimen()
  if (specimen) {
    return (
      <SpecimenText as="h2" className={joinClass("sadu-popover__title", textClass(className))}>
        {props.children}
      </SpecimenText>
    )
  }
  return <PopoverTitle {...props} className={mergeClass("sadu-popover__title", className)} />
}

function SaduPopoverDescription({ className, ...props }: ComponentProps<typeof PopoverDescription>): ReactElement {
  const specimen = useSpecimen()
  if (specimen) {
    return (
      <SpecimenText as="p" className={joinClass("sadu-popover__description", textClass(className))}>
        {props.children}
      </SpecimenText>
    )
  }
  return <PopoverDescription {...props} className={mergeClass("sadu-popover__description", className)} />
}

function SaduPopoverClose({
  variant = "secondary",
  size = "sm",
  render,
  ...props
}: ComponentProps<typeof PopoverClose> & ButtonLook): ReactElement {
  const specimen = useSpecimen()
  if (specimen) {
    return (
      <SpecimenButton variant={variant} size={size} className={props.className}>
        {props.children}
      </SpecimenButton>
    )
  }
  return <PopoverClose {...props} render={render ?? <SaduButton variant={variant} size={size} />} />
}

export {
  SaduPopover,
  SaduPopoverClose,
  SaduPopoverContent,
  SaduPopoverDescription,
  SaduPopoverSpecimen,
  SaduPopoverTitle,
  SaduPopoverTrigger,
}
export type { SaduPopoverContentProps, SaduPopoverSpecimenProps }
