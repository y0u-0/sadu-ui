import "./styles/overlay-kit.css"
import { X } from "lucide-react"
import { createContext, useContext, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { SaduButton, type SaduButtonSize, type SaduButtonVariant } from "./sadu-button"

type OverlayDetail = { term: ReactNode; detail: ReactNode }

type SpecimenTextProps = {
  as: "h2" | "p"
  className: string
  children?: ReactNode | ((state: never) => ReactNode)
}

const SpecimenContext = createContext(false)

function SpecimenScope({ children }: { children?: ReactNode }): ReactElement {
  return <SpecimenContext value>{children}</SpecimenContext>
}

function useSpecimen(): boolean {
  return useContext(SpecimenContext)
}

function SpecimenText({ as: Tag, className, children }: SpecimenTextProps): ReactElement {
  return <Tag className={className}>{typeof children === "function" ? null : children}</Tag>
}

type SpecimenButtonProps = {
  variant?: SaduButtonVariant
  size?: SaduButtonSize
  className?: unknown
  children?: ReactNode | ((state: never) => ReactNode)
}

function SpecimenButton({ variant, size, className, children }: SpecimenButtonProps): ReactElement {
  return (
    <SaduButton variant={variant} size={size} className={textClass(className)}>
      {typeof children === "function" ? null : children}
    </SaduButton>
  )
}

function textClass(className: unknown): string | undefined {
  return typeof className === "string" ? className : undefined
}

function joinClass(base: string, className: string | undefined): string {
  return className ? `${base} ${className}` : base
}

function CloseIcon(): ReactElement {
  return <X size={16} strokeWidth={2} aria-hidden="true" />
}

function OverlayHeader({ className, ...props }: ComponentProps<"div">): ReactElement {
  return <div {...props} className={joinClass("sadu-overlay-header", className)} />
}

function OverlayFooter({ className, ...props }: ComponentProps<"div">): ReactElement {
  return <div {...props} className={joinClass("sadu-overlay-footer", className)} />
}

function OverlayDetails({ items, className }: { items: readonly OverlayDetail[]; className?: string }): ReactElement {
  return (
    <dl className={joinClass("sadu-overlay-details", className)}>
      {items.map((item, index) => (
        <div key={index} className="sadu-overlay-details__row">
          <dt>{item.term}</dt>
          <dd>{item.detail}</dd>
        </div>
      ))}
    </dl>
  )
}

export {
  CloseIcon,
  OverlayDetails,
  OverlayFooter,
  OverlayHeader,
  SpecimenButton,
  SpecimenScope,
  SpecimenText,
  joinClass,
  textClass,
  useSpecimen,
}
export type { OverlayDetail }
