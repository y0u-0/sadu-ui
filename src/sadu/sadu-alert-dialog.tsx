import "./styles/sadu-dialog.css"
import "./styles/sadu-alert-dialog.css"
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  type AlertDialogProps,
} from "@ui-sdk/react/alert-dialog"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { mergeClass } from "./merge-class"
import { MOTIFS, ROWS, type Grid, type MotifId } from "./motifs"
import { OverlayFooter, SpecimenButton, SpecimenScope, SpecimenText, joinClass, textClass, useSpecimen } from "./overlay-kit"
import { WOOLS } from "./palette"
import { mainColors } from "./rug"
import { SaduButton } from "./sadu-button"
import type { ButtonLook } from "./sadu-dialog"
import { LEVELS, WOOL_CLOTH, Weave } from "./weave"

type AlertTone = "danger" | "neutral"

type SaduAlertDialogContentProps = ComponentProps<typeof AlertDialogContent> & {
  tone?: AlertTone
  motif?: MotifId
  backdropClassName?: string
}

type SaduAlertDialogSpecimenProps = { tone?: AlertTone; motif?: MotifId; children?: ReactNode; className?: string }

const BARE_THREAD = "#bcab8f"
const LIVE_ROW = 5
const WARP: Grid = Array.from({ length: ROWS }, (_, row) => (row === LIVE_ROW ? "k" : "x"))
const FELL_STEPS = [0, 2, 1, 3, 1, 0, 2, 1, 3, 2, 1]
const THREAD_ACCENT: Record<AlertTone, string> = { danger: WOOLS.madder.hex, neutral: WOOL_CLOTH }

function raggedFell(): string {
  const reach = (step: number) => `calc(100% - ${step * LEVELS.cloth.width}px)`
  const edge = (row: number) => `${(row / ROWS) * 100}%`
  const points = FELL_STEPS.flatMap((step, row) => [`${reach(step)} ${edge(row)}`, `${reach(step)} ${edge(row + 1)}`])
  return `polygon(0 0, ${points.join(", ")}, 0 100%)`
}

const FELL = raggedFell()

function UnravelledBand({ tone, motif }: { tone: AlertTone; motif: MotifId }): ReactElement {
  return (
    <div className="sadu-alert-dialog__warp" aria-hidden="true">
      <Weave
        bare
        className="sadu-alert-dialog__threads"
        grid={WARP}
        colors={{ ground: BARE_THREAD, dye: BARE_THREAD, accent: THREAD_ACCENT[tone] }}
        level="cloth"
      />
      <div className="sadu-alert-dialog__cloth">
        <div className="sadu-alert-dialog__fell" style={{ clipPath: FELL }}>
          <Weave grid={MOTIFS[motif].grid} colors={mainColors(WOOLS.madder.hex)} level="cloth" />
        </div>
      </div>
    </div>
  )
}

function SaduAlertDialogSpecimen({ tone = "danger", motif = "eyoun", children, className }: SaduAlertDialogSpecimenProps): ReactElement {
  return (
    <SpecimenScope>
      <div
        className={["sadu-dialog sadu-alert-dialog", className].filter(Boolean).join(" ")}
        data-tone={tone}
        data-specimen=""
        aria-hidden="true"
        inert
      >
        <UnravelledBand tone={tone} motif={motif} />
        <div className="sadu-dialog__body">{children}</div>
      </div>
    </SpecimenScope>
  )
}

function SaduAlertDialog(props: AlertDialogProps): ReactElement {
  return <AlertDialog {...props} />
}

function SaduAlertDialogTrigger({
  variant = "destructive",
  size,
  render,
  ...props
}: ComponentProps<typeof AlertDialogTrigger> & ButtonLook): ReactElement {
  return <AlertDialogTrigger {...props} render={render ?? <SaduButton variant={variant} size={size} />} />
}

function SaduAlertDialogContent({
  tone = "danger",
  motif = "eyoun",
  backdropClassName,
  className,
  children,
  ...props
}: SaduAlertDialogContentProps): ReactElement {
  return (
    <>
      <AlertDialogBackdrop className={mergeClass("sadu-dialog-backdrop", backdropClassName)} />
      <AlertDialogContent {...props} className={mergeClass("sadu-dialog sadu-alert-dialog", className)} data-tone={tone}>
        {(state) => (
          <>
            <UnravelledBand tone={tone} motif={motif} />
            <div className="sadu-dialog__body">{typeof children === "function" ? children(state) : children}</div>
          </>
        )}
      </AlertDialogContent>
    </>
  )
}

function SaduAlertDialogTitle({ className, ...props }: ComponentProps<typeof AlertDialogTitle>): ReactElement {
  const specimen = useSpecimen()
  if (specimen) {
    return (
      <SpecimenText as="h2" className={joinClass("sadu-overlay-title", textClass(className))}>
        {props.children}
      </SpecimenText>
    )
  }
  return <AlertDialogTitle {...props} className={mergeClass("sadu-overlay-title", className)} />
}

function SaduAlertDialogDescription({ className, ...props }: ComponentProps<typeof AlertDialogDescription>): ReactElement {
  const specimen = useSpecimen()
  if (specimen) {
    return (
      <SpecimenText as="p" className={joinClass("sadu-overlay-description", textClass(className))}>
        {props.children}
      </SpecimenText>
    )
  }
  return <AlertDialogDescription {...props} className={mergeClass("sadu-overlay-description", className)} />
}

function SaduAlertDialogClose({
  variant = "secondary",
  size,
  render,
  ...props
}: ComponentProps<typeof AlertDialogClose> & ButtonLook): ReactElement {
  const specimen = useSpecimen()
  if (specimen) {
    return (
      <SpecimenButton variant={variant} size={size} className={props.className}>
        {props.children}
      </SpecimenButton>
    )
  }
  return <AlertDialogClose {...props} render={render ?? <SaduButton variant={variant} size={size} />} />
}

export {
  SaduAlertDialog,
  SaduAlertDialogClose,
  SaduAlertDialogContent,
  SaduAlertDialogDescription,
  OverlayFooter as SaduAlertDialogFooter,
  SaduAlertDialogSpecimen,
  SaduAlertDialogTitle,
  SaduAlertDialogTrigger,
}
export type { AlertTone, SaduAlertDialogContentProps, SaduAlertDialogSpecimenProps }
