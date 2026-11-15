import "./styles/popup-surface.css"
import "./styles/sadu-hover-card.css"
import { HoverCard, HoverCardContent, HoverCardTrigger, type HoverCardProps } from "@ui-sdk/react/hover-card"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { useSaduLocale } from "./locale"
import { mergeClass } from "./merge-class"
import { MOTIFS, ROWS, type MotifId } from "./motifs"
import { WOOLS } from "./palette"
import { mainColors } from "./rug"
import { LEVELS, Weave } from "./weave"

type MotifPreviewProps = { motif: MotifId; meaning: ReactNode; dye?: string }

const STRIP_HEIGHT = LEVELS.thread.height * ROWS
const PINK_DEPTH = 3
const PINK_PITCH = 3

function pinkedEdges(): string {
  const teeth = Array.from({ length: STRIP_HEIGHT / PINK_PITCH }, (_, index) => index * PINK_PITCH)
  const start = teeth.flatMap((y) => [`${PINK_DEPTH}px ${y}px`, `0 ${y + PINK_PITCH / 2}px`])
  const end = teeth
    .slice()
    .reverse()
    .flatMap((y) => [`calc(100% - ${PINK_DEPTH}px) ${y + PINK_PITCH}px`, `100% ${y + PINK_PITCH / 2}px`])
  return `polygon(${[...start, `${PINK_DEPTH}px ${STRIP_HEIGHT}px`, ...end, `calc(100% - ${PINK_DEPTH}px) 0`].join(", ")})`
}

const PINKED = pinkedEdges()

function SaduHoverCard({ delay = 400, closeDelay = 150, ...props }: HoverCardProps): ReactElement {
  return <HoverCard delay={delay} closeDelay={closeDelay} {...props} />
}

function SaduHoverCardTrigger({ className, ...props }: ComponentProps<typeof HoverCardTrigger>): ReactElement {
  return <HoverCardTrigger {...props} className={mergeClass("sadu-hover-card-trigger", className)} />
}

function SaduHoverCardContent({ sideOffset = 8, render, className, ...props }: ComponentProps<typeof HoverCardContent>): ReactElement {
  return (
    <HoverCardContent
      {...props}
      sideOffset={sideOffset}
      render={render ?? <span data-edge="none" />}
      className={mergeClass("sadu-popup sadu-hover-card", className)}
    />
  )
}

function SaduHoverCardSpecimen({ children, className }: { children?: ReactNode; className?: string }): ReactElement {
  return (
    <span
      className={["sadu-popup sadu-hover-card", className].filter(Boolean).join(" ")}
      data-edge="none"
      data-specimen=""
      aria-hidden="true"
      inert
    >
      {children}
    </span>
  )
}

function MotifPreview({ motif, meaning, dye = WOOLS.madder.hex }: MotifPreviewProps): ReactElement {
  const { grid, name, arabic } = MOTIFS[motif]
  const arabicPage = useSaduLocale() === "ar"
  return (
    <>
      <span className="sadu-hover-card__strip" style={{ clipPath: PINKED }} aria-hidden="true">
        <Weave grid={grid} colors={mainColors(dye)} level="thread" />
      </span>
      <span className="sadu-hover-card__names">
        {arabicPage ? (
          <>
            <span className="sadu-hover-card__name" lang="ar">
              {arabic}
            </span>
            <span className="sadu-hover-card__arabic" data-script="latin" lang="en" dir="ltr">
              {name}
            </span>
          </>
        ) : (
          <>
            <span className="sadu-hover-card__name">{name}</span>
            <span className="sadu-hover-card__arabic" lang="ar" dir="rtl">
              {arabic}
            </span>
          </>
        )}
      </span>
      <span className="sadu-hover-card__meaning">{meaning}</span>
    </>
  )
}

export { MotifPreview, SaduHoverCard, SaduHoverCardContent, SaduHoverCardSpecimen, SaduHoverCardTrigger }
export type { MotifPreviewProps }
