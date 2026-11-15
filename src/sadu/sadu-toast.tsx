import "./styles/sadu-toast.css"
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastRegion,
  ToastTitle,
  type ToastData,
  type ToastRegionProps,
} from "@ui-sdk/react/toast"
import { Info, LoaderCircle, TriangleAlert } from "lucide-react"
import { useSyncExternalStore, type ComponentProps, type CSSProperties, type ReactElement, type ReactNode } from "react"
import { useLocalized } from "./locale"
import { mergeClass } from "./merge-class"
import { CloseIcon } from "./overlay-kit"
import { Cord, Eye, Fringe } from "./parts"

type SaduToastProps = ComponentProps<typeof Toast> & { toast: ToastData<ReactNode> }

let windowBlurred = false

function subscribeToAway(onChange: () => void): () => void {
  const onBlur = () => {
    windowBlurred = true
    onChange()
  }
  const onFocus = () => {
    windowBlurred = false
    onChange()
  }
  window.addEventListener("blur", onBlur)
  window.addEventListener("focus", onFocus)
  document.addEventListener("visibilitychange", onChange)
  return () => {
    window.removeEventListener("blur", onBlur)
    window.removeEventListener("focus", onFocus)
    document.removeEventListener("visibilitychange", onChange)
  }
}

function useAway(): boolean {
  return useSyncExternalStore(
    subscribeToAway,
    () => windowBlurred || document.visibilityState === "hidden",
    () => false,
  )
}

function TeethMark(): ReactElement {
  return (
    <svg className="sadu-toast__teeth" viewBox="0 0 12 10" aria-hidden="true" focusable="false">
      <rect x={0} y={0} width={12} height={1} />
      <rect x={0} y={1} width={6} height={3.5} />
      <rect x={0} y={4.5} width={12} height={1} />
      <rect x={6} y={5.5} width={6} height={3.5} />
      <rect x={0} y={9} width={12} height={1} />
    </svg>
  )
}

function markOf(type: ToastData["type"]): ReactNode {
  if (type === "success") return <Eye size={10} state="on" />
  if (type === "error") return <TeethMark />
  if (type === "warning") return <TriangleAlert size={16} strokeWidth={2} aria-hidden="true" />
  if (type === "info") return <Info size={16} strokeWidth={2} aria-hidden="true" />
  if (type === "loading") return <LoaderCircle className="sadu-toast__spinner" size={16} strokeWidth={2} aria-hidden="true" />
  return null
}

function FrayedEnd(): ReactElement {
  return (
    <svg className="sadu-toast__frayed" viewBox="0 0 12 10" aria-hidden="true" focusable="false">
      <path d="M0 5C2.5 5 3.6 3.6 5.4 3S8.6 0.8 9.6 0.2M0 5C3 5 5 4.2 7 4.3S10 3.4 11.6 3.7M0 5C3 5 4.6 5.4 6.6 6S9 6.2 10.4 7M0 5C2.4 5 3.4 6.4 4.8 7.2S6.6 8.4 7.4 9" />
    </svg>
  )
}

type ToastKind = ToastData["type"]

type TimerProps = { type: ToastKind; duration: number; progress?: number }

function ToastTimer({ type, duration, progress }: TimerProps): ReactElement {
  const frozen = progress !== undefined
  const timed = !frozen && Number.isFinite(duration)
  const style = frozen
    ? ({ "--sadu-toast-progress": Math.min(1, Math.max(0, progress)) } as CSSProperties)
    : timed
      ? ({ "--sadu-toast-duration": `${duration}ms` } as CSSProperties)
      : undefined
  const state = { "data-timed": timed || undefined, "data-frozen": frozen || undefined }
  if (type === "error") {
    return (
      <span className="sadu-toast__timer" data-frayed="" {...state} style={style} aria-hidden="true">
        <span className="sadu-toast__thread" />
        <span className="sadu-toast__fell">
          <FrayedEnd />
        </span>
      </span>
    )
  }
  return (
    <span className="sadu-toast__timer" {...state} style={style} aria-hidden="true">
      <span className="sadu-toast__warp" />
      <span className="sadu-toast__cloth">
        <Cord size={4} />
      </span>
      {(timed || frozen) && <span className="sadu-toast__fell sadu-toast__beater sadu-wood" />}
    </span>
  )
}

type ToastFaceProps = {
  type: ToastKind
  title: ReactNode
  description: ReactNode
  action: ReactNode
  close: ReactNode
  timer: ReactNode
}

function ToastFace({ type, title, description, action, close, timer }: ToastFaceProps): ReactElement {
  const mark = markOf(type)
  return (
    <>
      <div className="sadu-toast__strip">
        <div className="sadu-toast__content">
          {mark && <span className="sadu-toast__mark">{mark}</span>}
          <div className="sadu-toast__text">
            {title}
            {description}
          </div>
          {action}
          {close}
        </div>
        {timer}
      </div>
      <span className="sadu-toast__fringe" aria-hidden="true">
        <Fringe />
      </span>
    </>
  )
}

type SaduToastSpecimenProps = {
  type?: ToastKind
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  progress?: number
  className?: string
}

function SaduToastSpecimen({
  type = "default",
  title,
  description,
  action,
  progress = 0.6,
  className,
}: SaduToastSpecimenProps): ReactElement {
  return (
    <div className={["sadu-toast", className].filter(Boolean).join(" ")} data-type={type} data-specimen="" aria-hidden="true" inert>
      <ToastFace
        type={type}
        title={<div className="sadu-toast__title">{title}</div>}
        description={description && <div className="sadu-toast__description">{description}</div>}
        action={action && <span className="sadu-toast__action">{action}</span>}
        close={
          <span className="sadu-toast__close">
            <CloseIcon />
          </span>
        }
        timer={<ToastTimer type={type} duration={Infinity} progress={progress} />}
      />
    </div>
  )
}

const DISMISS = { en: "Dismiss", ar: "إغلاق" }

function SaduToast({ toast, className, children, ...props }: SaduToastProps): ReactElement {
  const dismissLabel = useLocalized(DISMISS)
  return (
    <Toast {...props} className={mergeClass("sadu-toast", className)}>
      {(state) => {
        const custom = typeof children === "function" ? children(state) : children
        const timer = <ToastTimer key={toast.version} type={toast.type} duration={toast.duration} />
        if (custom != null) {
          return (
            <>
              <div className="sadu-toast__strip">
                {custom}
                {timer}
              </div>
              <span className="sadu-toast__fringe" aria-hidden="true">
                <Fringe />
              </span>
            </>
          )
        }
        return (
          <ToastFace
            type={toast.type}
            title={<ToastTitle className="sadu-toast__title" />}
            description={<ToastDescription className="sadu-toast__description" />}
            action={<ToastAction className="sadu-toast__action" />}
            close={
              <ToastClose className="sadu-toast__close" aria-label={dismissLabel}>
                <CloseIcon />
              </ToastClose>
            }
            timer={timer}
          />
        )
      }}
    </Toast>
  )
}

function SaduToastRegion({ className, children, ...props }: ToastRegionProps): ReactElement {
  const away = useAway()
  return (
    <ToastRegion {...props} className={mergeClass("sadu-toast-region", className)} data-away={away || undefined}>
      {children ?? ((toast) => <SaduToast toast={toast} />)}
    </ToastRegion>
  )
}

export { SaduToast, SaduToastRegion, SaduToastSpecimen }
export type { SaduToastProps, SaduToastSpecimenProps, ToastKind }
