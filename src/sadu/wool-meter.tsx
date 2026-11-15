import "./styles/wool-meter.css"
import { Meter, MeterLabel, MeterTrack, MeterValue } from "@ui-sdk/react/meter"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { useLocalized, type Localized } from "./locale"
import { mergeClass } from "./merge-class"

type WoolMeterZone = "low" | "optimum" | "high"

type WoolMeterProps = Omit<ComponentProps<typeof Meter>, "children"> & {
  label?: ReactNode
  low?: number
  high?: number
  floats?: number
  zoneLabels?: Record<WoolMeterZone, string>
}

const DEFAULT_ZONE_LABELS: Localized<Record<WoolMeterZone, string>> = {
  en: { low: "low", optimum: "enough", high: "high" },
  ar: { low: "منخفض", optimum: "كافٍ", high: "مرتفع" },
}

const ARABIC_SCRIPT = /\p{Script=Arabic}/u

/** Joins the reading and its zone with the comma of the zone label's script, so Arabic labels get "،". */
function reading(text: string, zoneLabel: string): string {
  return `${text}${ARABIC_SCRIPT.test(zoneLabel) ? "، " : ", "}${zoneLabel}`
}

function zoneOf(value: number, low: number, high: number): WoolMeterZone {
  if (value < low) return "low"
  if (value > high) return "high"
  return "optimum"
}

function WoolMeter({
  label,
  value,
  min = 0,
  max = 100,
  low = min + (max - min) * 0.25,
  high = min + (max - min) * 0.85,
  floats = 20,
  zoneLabels: ownZoneLabels,
  getValueLabel,
  className,
  ...props
}: WoolMeterProps): ReactElement {
  const defaultZoneLabels = useLocalized(DEFAULT_ZONE_LABELS)
  const zoneLabels = ownZoneLabels ?? defaultZoneLabels
  const zone = zoneOf(value, low, high)
  return (
    <Meter
      {...props}
      value={value}
      min={min}
      max={max}
      getValueLabel={getValueLabel ?? ((_, details) => reading(details.formatted, zoneLabels[zone]))}
      className={mergeClass("sadu-meter", className)}
      data-zone={zone}
    >
      <div className="sadu-meter__head">
        {label && <MeterLabel className="sadu-meter__label">{label}</MeterLabel>}
        <MeterValue className="sadu-meter__value">{(state) => reading(state.text, zoneLabels[zone])}</MeterValue>
      </div>
      <MeterTrack className="sadu-meter__track" style={{ ["--sadu-meter-columns" as string]: Math.ceil(floats / 2) }}>
        {(state) => {
          const filled = Math.round((state.percent / 100) * floats)
          return Array.from({ length: floats }, (_, index) => (
            <span
              key={index}
              className={index < filled ? "sadu-meter__float sadu-cloth-fill" : "sadu-meter__float"}
              data-filled={index < filled || undefined}
              style={{ gridRow: (index % 2) + 1, gridColumn: `${Math.floor(index / 2) * 2 + (index % 2) + 1} / span 2` }}
            />
          ))
        }}
      </MeterTrack>
    </Meter>
  )
}

export { WoolMeter }
export type { WoolMeterProps, WoolMeterZone }
