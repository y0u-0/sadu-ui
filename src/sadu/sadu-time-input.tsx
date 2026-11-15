import { TimeInput, TimeInputSegment } from "@ui-sdk/react/time-input"
import { useState, type ComponentProps, type CSSProperties, type ReactElement } from "react"
import { useFloatHighlight, wovenSegments } from "./sadu-date-input"
import { partClass } from "./sadu-field"
import "./styles/sadu-time-input.css"

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const DAWN = 6
const DUSK = 18
const STEP_MS = 120

function hourOf(time: string | null | undefined): number | null {
  const hour = time ? Number.parseInt(time.slice(0, 2), 10) : Number.NaN
  return Number.isNaN(hour) ? null : hour
}

function DayBand({ hour }: { hour: number | null }): ReactElement {
  const [shown, setShown] = useState({ hour, distance: 0 })
  if (shown.hour !== hour) setShown({ hour, distance: hour === null || shown.hour === null ? 0 : Math.abs(hour - shown.hour) })
  const style = {
    "--sadu-hour": hour ?? 0,
    "--sadu-hour-steps": Math.max(shown.distance, 1),
    "--sadu-hour-duration": `${shown.distance * STEP_MS}ms`,
  } as CSSProperties
  return (
    <span className="sadu-time__day" style={style} data-empty={hour === null || undefined} aria-hidden="true">
      {HOURS.map((step) => (
        <span key={step} className="sadu-time__float" data-day={(step >= DAWN && step < DUSK) || undefined} />
      ))}
      <span className="sadu-time__hour" />
    </span>
  )
}

type SaduTimeInputProps = Omit<ComponentProps<typeof TimeInput>, "children"> & { dayBand?: boolean }

function SaduTimeInput({
  className,
  dayBand = true,
  value,
  defaultValue,
  onValueChange,
  style,
  onFocus,
  onBlur,
  onKeyDown,
  onKeyUp,
  ...props
}: SaduTimeInputProps): ReactElement {
  const highlight = useFloatHighlight({ style, onFocus, onBlur, onKeyDown, onKeyUp })
  const [draft, setDraft] = useState<string | null>(defaultValue ?? null)
  return (
    <div className="sadu-time">
      <TimeInput
        {...props}
        {...highlight}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next, details) => {
          if (value === undefined) setDraft(next)
          onValueChange?.(next, details)
        }}
        className={partClass("sadu-input sadu-date-input sadu-time-input", className)}
      >
        {(state) => wovenSegments(TimeInputSegment, state.segments)}
      </TimeInput>
      {dayBand && <DayBand hour={hourOf(value === undefined ? draft : value)} />}
    </div>
  )
}

export { SaduTimeInput }
export type { SaduTimeInputProps }
