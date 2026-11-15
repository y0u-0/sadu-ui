import "./styles/sadu-dialog.css"
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  type DialogProps,
} from "@ui-sdk/react/dialog"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { useLocalized } from "./locale"
import { mergeClass } from "./merge-class"
import { MOTIFS, type Grid, type MotifId } from "./motifs"
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
import { WOOLS, type Colors } from "./palette"
import { IconButton } from "./parts"
import { mainColors } from "./rug"
import { SaduButton, type SaduButtonSize, type SaduButtonVariant } from "./sadu-button"
import { GOAT_HAIR, LEVELS, Reweave, WOOL_CLOTH, Weave, beatStyle, useColumns } from "./weave"

type ButtonLook = { variant?: SaduButtonVariant; size?: SaduButtonSize }

type SaduDialogContentProps = ComponentProps<typeof DialogContent> & {
  motif?: MotifId
  dye?: string
  backdropClassName?: string
}

type SaduDialogSpecimenProps = { motif?: MotifId; dye?: string; children?: ReactNode; className?: string }

const FLAP_CAP = 900
const FLAP_TEETH: Grid = ["kkkkkkkk", "xxxx....", "xxxx....", "....xxxx", "....xxxx", "kkkkkkkk"]

function teethColors(dye: string): Colors {
  return { ground: WOOL_CLOTH, dye: GOAT_HAIR, accent: dye }
}

function TentFlap({ motif, dye }: { motif: MotifId; dye: string }): ReactElement {
  const [ref, columns] = useColumns(LEVELS.cloth.width)
  return (
    <div ref={ref} className="sadu-dialog__flap" style={beatStyle(columns, FLAP_CAP)} aria-hidden="true">
      <div className="sadu-dialog__cloth">
        <Weave className="sadu-dialog__teeth" grid={FLAP_TEETH} colors={teethColors(dye)} level="stitch" />
        <Reweave className="sadu-dialog__motif" grid={MOTIFS[motif].grid} colors={mainColors(dye)} level="cloth" cap={FLAP_CAP} />
        <Weave className="sadu-dialog__teeth" grid={FLAP_TEETH} colors={teethColors(dye)} level="stitch" offset={LEVELS.stitch.width * 4} />
      </div>
      <span className="sadu-beater sadu-dialog__beater" />
    </div>
  )
}

function SaduDialogSpecimen({ motif = "uwairjan", dye = WOOLS.madder.hex, children, className }: SaduDialogSpecimenProps): ReactElement {
  return (
    <SpecimenScope>
      <div className={["sadu-dialog", className].filter(Boolean).join(" ")} data-specimen="" aria-hidden="true" inert>
        <TentFlap motif={motif} dye={dye} />
        <div className="sadu-dialog__body">{children}</div>
      </div>
    </SpecimenScope>
  )
}

function SaduDialog(props: DialogProps): ReactElement {
  return <Dialog {...props} />
}

function SaduDialogTrigger({
  variant = "secondary",
  size,
  render,
  ...props
}: ComponentProps<typeof DialogTrigger> & ButtonLook): ReactElement {
  return <DialogTrigger {...props} render={render ?? <SaduButton variant={variant} size={size} />} />
}

function SaduDialogContent({
  motif = "uwairjan",
  dye = WOOLS.madder.hex,
  backdropClassName,
  className,
  children,
  ...props
}: SaduDialogContentProps): ReactElement {
  return (
    <>
      <DialogBackdrop className={mergeClass("sadu-dialog-backdrop", backdropClassName)} />
      <DialogContent {...props} className={mergeClass("sadu-dialog", className)}>
        {(state) => (
          <>
            <TentFlap motif={motif} dye={dye} />
            <div className="sadu-dialog__body">{typeof children === "function" ? children(state) : children}</div>
          </>
        )}
      </DialogContent>
    </>
  )
}

function SaduDialogTitle({ className, ...props }: ComponentProps<typeof DialogTitle>): ReactElement {
  const specimen = useSpecimen()
  if (specimen) {
    return (
      <SpecimenText as="h2" className={joinClass("sadu-overlay-title", textClass(className))}>
        {props.children}
      </SpecimenText>
    )
  }
  return <DialogTitle {...props} className={mergeClass("sadu-overlay-title", className)} />
}

function SaduDialogDescription({ className, ...props }: ComponentProps<typeof DialogDescription>): ReactElement {
  const specimen = useSpecimen()
  if (specimen) {
    return (
      <SpecimenText as="p" className={joinClass("sadu-overlay-description", textClass(className))}>
        {props.children}
      </SpecimenText>
    )
  }
  return <DialogDescription {...props} className={mergeClass("sadu-overlay-description", className)} />
}

function SaduDialogClose({ variant = "secondary", size, render, ...props }: ComponentProps<typeof DialogClose> & ButtonLook): ReactElement {
  const specimen = useSpecimen()
  if (specimen) {
    return (
      <SpecimenButton variant={variant} size={size} className={props.className}>
        {props.children}
      </SpecimenButton>
    )
  }
  return <DialogClose {...props} render={render ?? <SaduButton variant={variant} size={size} />} />
}

const CLOSE = { en: "Close", ar: "إغلاق" }

function SaduDialogDismiss({
  className,
  children,
  "aria-label": ownLabel,
  render,
  ...props
}: ComponentProps<typeof DialogClose>): ReactElement {
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
    <DialogClose
      {...props}
      aria-label={label}
      render={render ?? <IconButton size={28} />}
      className={mergeClass("sadu-overlay-close", className)}
    >
      {children ?? <CloseIcon />}
    </DialogClose>
  )
}

export {
  SaduDialog,
  SaduDialogClose,
  SaduDialogContent,
  SaduDialogDescription,
  SaduDialogDismiss,
  OverlayFooter as SaduDialogFooter,
  SaduDialogSpecimen,
  OverlayHeader as SaduDialogHeader,
  SaduDialogTitle,
  SaduDialogTrigger,
}
export type { ButtonLook, SaduDialogContentProps, SaduDialogSpecimenProps }
