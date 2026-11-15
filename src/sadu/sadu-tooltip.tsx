import "./styles/sadu-tooltip.css"
import { formatShortcut } from "@ui-sdk/core"
import { Tooltip, TooltipContent, TooltipShortcut, TooltipTrigger, type TooltipProps } from "@ui-sdk/react/tooltip"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { mergeClass } from "./merge-class"
import { Cord, Kbd } from "./parts"
import { SaduButton } from "./sadu-button"
import type { ButtonLook } from "./sadu-dialog"

type SaduTooltipSpecimenProps = { shortcut?: string; children?: ReactNode; className?: string }

function TooltipCord(): ReactElement {
  return (
    <span className="sadu-tooltip__cord">
      <Cord size={2} />
    </span>
  )
}

function SaduTooltipSpecimen({ shortcut, children, className }: SaduTooltipSpecimenProps): ReactElement {
  return (
    <div className={["sadu-tooltip", className].filter(Boolean).join(" ")} data-side="top" data-specimen="" aria-hidden="true" inert>
      <TooltipCord />
      {children}
      {shortcut && <Kbd className="sadu-tooltip__shortcut">{formatShortcut(shortcut)}</Kbd>}
    </div>
  )
}

function SaduTooltip({ delay = 500, ...props }: TooltipProps): ReactElement {
  return <Tooltip delay={delay} {...props} />
}

function SaduTooltipTrigger({ variant, size, render, ...props }: ComponentProps<typeof TooltipTrigger> & ButtonLook): ReactElement {
  const look = variant || size ? <SaduButton variant={variant} size={size} /> : undefined
  return <TooltipTrigger {...props} render={render ?? look} />
}

function SaduTooltipContent({ sideOffset = 6, className, children, ...props }: ComponentProps<typeof TooltipContent>): ReactElement {
  return (
    <TooltipContent {...props} sideOffset={sideOffset} className={mergeClass("sadu-tooltip", className)}>
      {(state) => (
        <>
          <TooltipCord />
          {typeof children === "function" ? children(state) : children}
        </>
      )}
    </TooltipContent>
  )
}

function SaduTooltipShortcut({ className, render, ...props }: ComponentProps<typeof TooltipShortcut>): ReactElement {
  return (
    <TooltipShortcut
      {...props}
      className={mergeClass("sadu-tooltip__shortcut", className)}
      render={render ?? ((shortcutProps, state) => <Kbd {...shortcutProps}>{state.text}</Kbd>)}
    />
  )
}

export { SaduTooltip, SaduTooltipContent, SaduTooltipShortcut, SaduTooltipSpecimen, SaduTooltipTrigger }
export type { SaduTooltipSpecimenProps }
