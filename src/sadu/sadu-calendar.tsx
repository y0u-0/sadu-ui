import {
  Calendar,
  CalendarDay,
  CalendarGrid,
  CalendarHeading,
  CalendarNext,
  CalendarPrevious,
  CalendarWeekday,
  CalendarWeekdays,
  CalendarWeeks,
  createCalendarController,
} from "@ui-sdk/react/calendar"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, type ComponentProps, type CSSProperties, type ReactElement } from "react"
import { useLocalized, type Localized } from "./locale"
import type { Grid } from "./motifs"
import { WOOLS, type Colors } from "./palette"
import { Eye, IconButton, Lozenge } from "./parts"
import { WOOL_CLOTH, Weave } from "./weave"
import "./sadu.css"
import "./styles/sadu-calendar.css"

type Turn = "next" | "previous"

const BAND: Grid = ["xxxxx", "xxx..", ".....", ".....", ".....", ".....", ".....", "..xxx", "xxxxx"]
const CLOTH: Colors = { ground: WOOL_CLOTH, dye: WOOLS.camel.hex, accent: WOOLS.madder.hex }
const WARP: Colors = { ground: WOOLS.camel.hex, dye: WOOLS.camel.dark, accent: WOOLS.camel.hex }
const DAY_MS = 86_400_000
const ARABIC_ARTICLE = /^ال(?=\p{Script=Arabic}{3})/u

/** Arabic has no abbreviated weekday names, so the header drops the article to fit the 40px column: الأربعاء → أربعاء. */
function compactWeekday(label: string): string {
  return label.replace(ARABIC_ARTICLE, "")
}

function turnOf(from: string, to: string): Turn {
  return to > from ? "next" : "previous"
}

function weaveStartOf(value: unknown, anchor: string | null): string | null {
  if (anchor) return anchor
  return Array.isArray(value) && typeof value[0] === "string" ? value[0] : null
}

function daysFrom(start: string | null, date: string): number {
  return start ? Math.max(0, Math.round((Date.parse(date) - Date.parse(start)) / DAY_MS)) : 0
}

function WovenDay({ date, weaveStart }: { date: string; weaveStart: string | null }): ReactElement {
  return (
    <CalendarDay
      value={date}
      className="sadu-calendar__day"
      style={{ "--sadu-calendar-pick": daysFrom(weaveStart, date) } as CSSProperties}
    >
      {(day) => (
        <>
          {day.inRange && !(day.rangeStart && day.rangeEnd) && (
            <span className="sadu-calendar__band" aria-hidden="true">
              <Weave bare className="sadu-calendar__warp" grid={BAND} colors={WARP} level="cloth" />
              <Weave className="sadu-calendar__cloth" grid={BAND} colors={CLOTH} level="cloth" />
            </span>
          )}
          <Lozenge className="sadu-calendar__lozenge" chosen={day.rangeStart || day.rangeEnd || (day.selected && !day.inRange)}>
            {day.label}
          </Lozenge>
          {day.today && <Eye size={10} tone="value" className="sadu-calendar__today" />}
        </>
      )}
    </CalendarDay>
  )
}

type CalendarMonthsProps = { months: number; turn?: Turn; weaveStart?: string | null }

const COPY: Localized<{ previous: string | undefined; next: string | undefined }> = {
  en: { previous: undefined, next: undefined },
  ar: { previous: "الشهر السابق", next: "الشهر التالي" },
}

function CalendarMonths({ months, turn, weaveStart = null }: CalendarMonthsProps): ReactElement {
  const copy = useLocalized(COPY)
  return (
    <>
      <CalendarHeading className="sadu-calendar__heading" />
      <div className="sadu-calendar__nav">
        <CalendarPrevious className="sadu-calendar__step" aria-label={copy.previous} render={<IconButton size={36} />}>
          <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
        </CalendarPrevious>
        <CalendarNext className="sadu-calendar__step" aria-label={copy.next} render={<IconButton size={36} />}>
          <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
        </CalendarNext>
      </div>
      <div className="sadu-calendar__months" data-turn={turn}>
        {Array.from({ length: months }, (_, offset) => (
          <CalendarGrid key={offset} offset={offset} className="sadu-calendar__grid">
            {(grid) => (
              <>
                <caption className="sadu-calendar__caption" aria-hidden="true">
                  {grid.label}
                </caption>
                <CalendarWeekdays>
                  {(index) => (
                    <CalendarWeekday index={index} className="sadu-calendar__weekday">
                      {(weekday) => compactWeekday(weekday.label)}
                    </CalendarWeekday>
                  )}
                </CalendarWeekdays>
                <CalendarWeeks key={grid.month} className="sadu-calendar__weeks">
                  {(cell) => <WovenDay key={cell.date} date={cell.date} weaveStart={weaveStart} />}
                </CalendarWeeks>
              </>
            )}
          </CalendarGrid>
        ))}
      </div>
    </>
  )
}

type SaduCalendarProps = Omit<ComponentProps<typeof Calendar>, "children" | "className"> & { className?: string }

function SaduCalendar({
  className,
  months = 1,
  weekdayFormat = "short",
  controller,
  onMonthChange,
  ...props
}: SaduCalendarProps): ReactElement {
  const [ownController] = useState(createCalendarController)
  const calendar = controller ?? ownController
  const [turn, setTurn] = useState<Turn>()
  return (
    <Calendar
      {...props}
      months={months}
      weekdayFormat={weekdayFormat}
      controller={calendar}
      onMonthChange={(month, details) => {
        onMonthChange?.(month, details)
        if (!details.canceled) setTurn(turnOf(calendar.getMonth(), month))
      }}
      className={["sadu-calendar", className].filter(Boolean).join(" ")}
    >
      {(state) => <CalendarMonths months={months} turn={turn} weaveStart={weaveStartOf(state.value, state.anchor)} />}
    </Calendar>
  )
}

export { CalendarMonths, SaduCalendar, turnOf, weaveStartOf }
export type { Turn }
