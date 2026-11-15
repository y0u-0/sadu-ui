import {
  DatePicker,
  DatePickerClear,
  DatePickerContent,
  DatePickerHint,
  DatePickerInput,
  DatePickerPreset,
  DatePickerTrigger,
  createDatePickerController,
  type DatePickerValue,
} from "@ui-sdk/react/date-picker"
import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react/field"
import { CalendarDays } from "lucide-react"
import { useId, useState, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { useLocalized, type Localized } from "./locale"
import { WOOLS } from "./palette"
import { IconButton } from "./parts"
import { PopupSurface } from "./popup-surface"
import { SaduButton } from "./sadu-button"
import { CalendarMonths, turnOf, weaveStartOf, type Turn } from "./sadu-calendar"
import { DhursStrip } from "./sadu-input"
import "./sadu.css"
import "./styles/sadu-calendar.css"
import "./styles/sadu-date-picker.css"

type DatePreset = { label: string; value: DatePickerValue }

type SaduDatePickerProps = Omit<ComponentProps<typeof DatePicker>, "children" | "className"> & {
  label: ReactNode
  description?: ReactNode
  presets?: readonly DatePreset[]
  todayLabel?: string
  clearLabel?: string
  startLabel?: string
  endLabel?: string
  hintLabel?: (example: string) => string
  triggerLabel?: string
  dye?: string
  className?: string
}

type DatePickerCopy = {
  today: string
  clear: string
  start: string
  end: string
  hint: (example: string) => string
  /** Undefined keeps UI SDK's English name, which also reads out the chosen date. */
  choose: string | undefined
  chooseRange: string | undefined
}

const COPY: Localized<DatePickerCopy> = {
  en: {
    today: "Today",
    clear: "Clear",
    start: "start",
    end: "end",
    hint: (example) => `Type a date like ${example}`,
    choose: undefined,
    chooseRange: undefined,
  },
  ar: {
    today: "اليوم",
    clear: "مسح",
    start: "تاريخ البدء",
    end: "تاريخ الانتهاء",
    hint: (example) => `مثال: ${example}`,
    choose: "اختيار التاريخ",
    chooseRange: "اختيار الفترة",
  },
}

const LANDING_REASONS = new Set(["item-press", "preset-press"])

function isoOf(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function SaduDatePicker({
  label,
  description,
  presets = [],
  todayLabel,
  clearLabel,
  startLabel,
  endLabel,
  hintLabel,
  triggerLabel,
  dye = WOOLS.madder.hex,
  mode,
  months = 1,
  weekdayFormat = "short",
  today,
  controller,
  onValueChange,
  onMonthChange,
  className,
  ...props
}: SaduDatePickerProps): ReactElement {
  const copy = useLocalized(COPY)
  const [field, setField] = useState<HTMLDivElement | null>(null)
  const [ownController] = useState(createDatePickerController)
  const picker = controller ?? ownController
  const [landings, setLandings] = useState(0)
  const [turn, setTurn] = useState<Turn>()
  const range = mode === "range"
  const ids = useId()
  const labelId = `${ids}-label`
  const startId = `${ids}-start`
  const endId = `${ids}-end`
  const todayValue = today ?? isoOf(new Date())
  return (
    <Field className={["sadu-date-picker", className].filter(Boolean).join(" ")}>
      <FieldLabel id={labelId} className="sadu-label">
        {label}
      </FieldLabel>
      <DatePicker
        {...props}
        mode={mode}
        months={months}
        weekdayFormat={weekdayFormat}
        today={today}
        controller={picker}
        onValueChange={(value, details) => {
          onValueChange?.(value, details)
          if (!details.canceled && LANDING_REASONS.has(details.reason)) setLandings((count) => count + 1)
        }}
        onMonthChange={(month, details) => {
          onMonthChange?.(month, details)
          if (!details.canceled) setTurn(turnOf(picker.getMonth(), month))
        }}
        className="sadu-date-picker__root"
      >
        {(state) => (
          <>
            <div
              ref={setField}
              className="sadu-input sadu-date-picker__field"
              data-range={range || undefined}
              data-landing={landings === 0 ? undefined : landings % 2 === 0 ? "even" : "odd"}
            >
              <DatePickerInput className="sadu-date-picker__input" aria-labelledby={range ? `${labelId} ${startId}` : undefined} />
              {range && (
                <>
                  <span className="sadu-date-picker__dash" aria-hidden="true">
                    –
                  </span>
                  <DatePickerInput end className="sadu-date-picker__input" aria-labelledby={`${labelId} ${endId}`} />
                  <span id={startId} className="sadu-date-picker__part">
                    {startLabel ?? copy.start}
                  </span>
                  <span id={endId} className="sadu-date-picker__part">
                    {endLabel ?? copy.end}
                  </span>
                </>
              )}
              <DatePickerTrigger
                className="sadu-date-picker__trigger"
                aria-label={triggerLabel ?? (range ? copy.chooseRange : copy.choose)}
                render={<IconButton size={28} />}
              >
                <CalendarDays size={16} strokeWidth={2} aria-hidden="true" />
              </DatePickerTrigger>
              <DhursStrip />
            </div>
            {description ? (
              <FieldDescription className="sadu-date-picker__hint">{description}</FieldDescription>
            ) : (
              <DatePickerHint className="sadu-date-picker__hint">{(hint) => (hintLabel ?? copy.hint)(hint.example)}</DatePickerHint>
            )}
            <DatePickerContent
              className="sadu-date-picker__popup"
              anchor={field}
              align="start"
              sideOffset={8}
              render={<PopupSurface edge="band" dye={dye} />}
            >
              <div className="sadu-date-picker__body" data-presets={presets.length > 0 || undefined}>
                {presets.length > 0 && (
                  <div className="sadu-date-picker__presets">
                    {presets.map((preset) => (
                      <DatePickerPreset key={preset.label} value={preset.value} className="sadu-date-picker__preset">
                        {preset.label}
                      </DatePickerPreset>
                    ))}
                  </div>
                )}
                <div className="sadu-calendar" data-mode={range ? "range" : "single"}>
                  <CalendarMonths months={months} turn={turn} weaveStart={weaveStartOf(state.value, null)} />
                </div>
              </div>
              {presets.length > 0 && (
                <div className="sadu-date-picker__footer">
                  <DatePickerClear render={<SaduButton variant="ghost" size="sm" />}>{clearLabel ?? copy.clear}</DatePickerClear>
                  {!range && (
                    <DatePickerPreset value={todayValue} render={<SaduButton variant="ghost" size="sm" />}>
                      {todayLabel ?? copy.today}
                    </DatePickerPreset>
                  )}
                </div>
              )}
            </DatePickerContent>
          </>
        )}
      </DatePicker>
    </Field>
  )
}

export { SaduDatePicker }
export type { DatePreset }
