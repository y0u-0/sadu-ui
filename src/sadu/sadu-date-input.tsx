import { DateInput, DateInputSegment, type DateInputSegmentData } from "@ui-sdk/react/date-input"
import { FieldDescription, useFieldControl } from "@ui-sdk/react/field"
import { useState, type ComponentProps, type CSSProperties, type FocusEvent, type KeyboardEvent, type ReactElement, type ReactNode } from "react"
import { partClass } from "./sadu-field"
import { DhursStrip } from "./sadu-input"
import { Eye } from "./parts"
import "./styles/sadu-input.css"
import "./styles/sadu-date-input.css"

type SegmentPart = (props: ComponentProps<typeof DateInputSegment>) => ReactNode

type Highlight = { left: number; width: number } | null

const STEP_KEYS: Readonly<Record<string, number>> = { ArrowUp: -1, PageUp: -1, ArrowDown: 1, PageDown: 1 }
const NUDGE = 2

function prefersStill(element: Element): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true || element.closest("[data-motion='reduced']") !== null
}

type FloatHighlight = {
  style: CSSProperties
  "data-float": "" | undefined
  onFocus: (event: FocusEvent<HTMLDivElement>) => void
  onBlur: (event: FocusEvent<HTMLDivElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  onKeyUp: (event: KeyboardEvent<HTMLDivElement>) => void
}

type RootHandlers = {
  style?: CSSProperties | ((state: never) => CSSProperties | undefined)
  onFocus?: (event: FocusEvent<HTMLDivElement>) => void
  onBlur?: (event: FocusEvent<HTMLDivElement>) => void
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void
  onKeyUp?: (event: KeyboardEvent<HTMLDivElement>) => void
}

function measure(segment: EventTarget): Highlight {
  return segment instanceof HTMLInputElement ? { left: segment.offsetLeft, width: segment.offsetWidth } : null
}

function useFloatHighlight({ style, onFocus, onBlur, onKeyDown, onKeyUp }: RootHandlers): FloatHighlight {
  const [highlight, setHighlight] = useState<Highlight>(null)
  return {
    style: {
      ...(typeof style === "object" ? style : undefined),
      ...(highlight && { "--sadu-float-left": `${highlight.left}px`, "--sadu-float-width": `${highlight.width}px` }),
    } as CSSProperties,
    "data-float": highlight ? "" : undefined,
    onFocus: (event) => {
      onFocus?.(event)
      const next = measure(event.target)
      if (next) setHighlight(next)
    },
    onKeyUp: (event) => {
      onKeyUp?.(event)
      const next = measure(event.target)
      if (next && (next.left !== highlight?.left || next.width !== highlight.width)) setHighlight(next)
    },
    onBlur: (event) => {
      onBlur?.(event)
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHighlight(null)
    },
    onKeyDown: (event) => {
      onKeyDown?.(event)
      const direction = STEP_KEYS[event.key]
      const segment = event.target
      if (!direction || !(segment instanceof HTMLElement) || prefersStill(segment)) return
      segment.animate?.([{ translate: "0 0" }, { translate: `0 ${direction * NUDGE}px` }, { translate: "0 0" }], {
        duration: 120,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      })
    },
  }
}

function wovenSegments(Segment: SegmentPart, segments: readonly DateInputSegmentData[]): ReactNode {
  return (
    <>
      <span className="sadu-float-highlight sadu-date-input__float" aria-hidden="true" />
      {segments.map((segment) =>
        segment.type === "literal" ? (
          <Segment key={segment.key} segment={segment} className="sadu-date-input__literal">
            {/[^\s\u200e\u200f]/.test(segment.text) ? <Eye size={10} tone="separator" /> : undefined}
          </Segment>
        ) : (
          <Segment key={segment.key} segment={segment} className="sadu-date-input__segment" />
        ),
      )}
      <DhursStrip />
    </>
  )
}

const HIJRI = new Intl.DateTimeFormat("ar-KW-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "long", year: "numeric" })

function hijriOf(iso: string | null): string | null {
  if (!iso) return null
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number)
  if (!year || !month || !day) return null
  return HIJRI.format(new Date(year, month - 1, day))
}

type SaduDateInputProps = Omit<ComponentProps<typeof DateInput>, "children"> & { hijri?: boolean }

function SaduDateInput({
  className,
  hijri = false,
  value,
  defaultValue,
  onValueChange,
  style,
  onFocus,
  onBlur,
  onKeyDown,
  onKeyUp,
  ...props
}: SaduDateInputProps): ReactElement {
  const highlight = useFloatHighlight({ style, onFocus, onBlur, onKeyDown, onKeyUp })
  const field = useFieldControl()
  const [draft, setDraft] = useState<string | null>(defaultValue ?? null)
  const hijriDate = hijri ? hijriOf(value === undefined ? draft : value) : null
  const HijriLine = field ? FieldDescription : "p"
  return (
    <div className="sadu-date">
      <DateInput
        {...props}
        {...highlight}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next, details) => {
          if (value === undefined) setDraft(next)
          onValueChange?.(next, details)
        }}
        className={partClass("sadu-input sadu-date-input", className)}
      >
        {(state) => wovenSegments(DateInputSegment, state.segments)}
      </DateInput>
      {hijri && (
        <HijriLine className="sadu-date__hijri" lang="ar" dir="rtl">
          {hijriDate}
        </HijriLine>
      )}
    </div>
  )
}

export { SaduDateInput, useFloatHighlight, wovenSegments }
export type { SaduDateInputProps }
