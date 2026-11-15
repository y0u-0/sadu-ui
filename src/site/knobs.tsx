import { useId, type ReactElement, type ReactNode } from "react"
import { MotifSelect } from "../sadu/motif-select"
import type { MotifId } from "../sadu/motifs"
import { WOOLS, type WoolId } from "../sadu/palette"
import { SaduField, SaduFieldLabel } from "../sadu/sadu-field"
import { SaduInput } from "../sadu/sadu-input"
import { SaduNumberInput } from "../sadu/sadu-number-input"
import { SaduSegment, SaduSegmentedControl } from "../sadu/sadu-segmented-control"
import { SaduSwitch } from "../sadu/sadu-switch"
import { SkeinRadio } from "../sadu/skein-radio"

type DyeKnob = { kind: "dye"; label: string }
type MotifKnob = { kind: "motif"; label: string; initial: MotifId; remount: boolean }
type ToggleKnob = { kind: "toggle"; label: string; initial: boolean; remount: boolean }
type ChoiceKnob<Value extends string = string> = {
  kind: "choice"
  label: string
  options: readonly Value[]
  labels: Partial<Record<Value, string>>
  initial: Value
  remount: boolean
}
type NumberKnob = { kind: "number"; label: string; initial: number; min: number; max: number; step: number; remount: boolean }
type TextKnob = { kind: "text"; label: string; initial: string; remount: boolean }

type Knob = DyeKnob | MotifKnob | ToggleKnob | ChoiceKnob | NumberKnob | TextKnob
type Knobs = Record<string, Knob>
type KnobValue = string | number | boolean
type KnobValues = Record<string, KnobValue>

type ValueOf<K> = K extends DyeKnob
  ? WoolId
  : K extends MotifKnob
    ? MotifId
    : K extends ToggleKnob
      ? boolean
      : K extends NumberKnob
        ? number
        : K extends ChoiceKnob<infer Value>
          ? Value
          : K extends TextKnob
            ? string
            : never

type Values<K extends Knobs> = { [Key in keyof K]: ValueOf<K[Key]> }

type Options = { remount?: boolean }

const knob = {
  dye: (label = "Dye"): DyeKnob => ({ kind: "dye", label }),
  motif: (initial: MotifId = "eyoun", label = "Motif", options: Options = {}): MotifKnob => ({
    kind: "motif",
    label,
    initial,
    remount: options.remount ?? false,
  }),
  toggle: (label: string, initial = false, options: Options = {}): ToggleKnob => ({
    kind: "toggle",
    label,
    initial,
    remount: options.remount ?? false,
  }),
  choice: <const Value extends string>(
    label: string,
    options: readonly Value[],
    initial: Value,
    extra: Options & { labels?: Partial<Record<Value, string>> } = {},
  ): ChoiceKnob<Value> => ({ kind: "choice", label, options, initial, labels: extra.labels ?? {}, remount: extra.remount ?? false }),
  number: (label: string, initial: number, range: { min: number; max: number; step?: number } & Options): NumberKnob => ({
    kind: "number",
    label,
    initial,
    min: range.min,
    max: range.max,
    step: range.step ?? 1,
    remount: range.remount ?? false,
  }),
  text: (label: string, initial: string, options: Options = {}): TextKnob => ({
    kind: "text",
    label,
    initial,
    remount: options.remount ?? false,
  }),
}

function initialValues(knobs: Knobs, dye: WoolId): KnobValues {
  return Object.fromEntries(Object.entries(knobs).map(([key, entry]) => [key, entry.kind === "dye" ? dye : entry.initial]))
}

function remountKey(knobs: Knobs, values: KnobValues): string {
  return Object.entries(knobs)
    .filter(([, entry]) => entry.kind !== "dye" && entry.remount)
    .map(([key]) => `${key}:${String(values[key])}`)
    .join("|")
}

function labelOf(entry: ChoiceKnob, value: string): string {
  return entry.labels[value] ?? value.charAt(0).toUpperCase() + value.slice(1)
}

function ChoiceControl({ entry, value, onChange }: { entry: ChoiceKnob; value: string; onChange: (next: string) => void }): ReactElement {
  const id = useId()
  return (
    <div className="knob knob--choice">
      <span className="sadu-label" id={id}>
        {entry.label}
      </span>
      <SaduSegmentedControl
        aria-labelledby={id}
        value={value}
        onValueChange={(next: unknown) => typeof next === "string" && onChange(next)}
      >
        {entry.options.map((option) => (
          <SaduSegment key={option} value={option}>
            {labelOf(entry, option)}
          </SaduSegment>
        ))}
      </SaduSegmentedControl>
    </div>
  )
}

type ControlProps = { entry: Knob; value: KnobValue; dyeHex: string; onChange: (next: KnobValue) => void }

function KnobControl({ entry, value, dyeHex, onChange }: ControlProps): ReactNode {
  switch (entry.kind) {
    case "dye":
      return (
        <SkeinRadio
          className="knob"
          label={entry.label}
          value={value as WoolId}
          onValueChange={onChange}
          nameSlot={WOOLS[value as WoolId].name}
        />
      )
    case "motif":
      return <MotifSelect className="knob" label={entry.label} dye={dyeHex} value={value as MotifId} onValueChange={onChange} />
    case "toggle":
      return (
        <SaduSwitch className="knob knob--toggle" checked={value === true} onCheckedChange={onChange} dye={dyeHex}>
          {entry.label}
        </SaduSwitch>
      )
    case "choice":
      return <ChoiceControl entry={entry} value={String(value)} onChange={onChange} />
    case "number":
      return (
        <SaduField className="knob">
          <SaduFieldLabel>{entry.label}</SaduFieldLabel>
          <SaduNumberInput
            value={Number(value)}
            min={entry.min}
            max={entry.max}
            step={entry.step}
            onValueChange={(next: number | null) => next !== null && onChange(next)}
          />
        </SaduField>
      )
    case "text":
      return (
        <SaduField className="knob">
          <SaduFieldLabel>{entry.label}</SaduFieldLabel>
          <SaduInput value={String(value)} onValueChange={(next: string) => onChange(next)} />
        </SaduField>
      )
  }
}

type KnobPanelProps = { knobs: Knobs; values: KnobValues; dyeHex: string; onChange: (key: string, next: KnobValue) => void }

function KnobPanel({ knobs, values, dyeHex, onChange }: KnobPanelProps): ReactElement {
  const entries = Object.entries(knobs)
  if (entries.length === 0) return <p className="knob-panel__empty">This component has no visual props beyond its content. Try it with the keyboard.</p>
  return (
    <div className="knob-panel">
      {entries.map(([key, entry]) => (
        <KnobControl key={key} entry={entry} value={values[key] ?? ""} dyeHex={dyeHex} onChange={(next) => onChange(key, next)} />
      ))}
    </div>
  )
}

export { KnobPanel, initialValues, knob, remountKey }
export type { Knob, KnobValue, KnobValues, Knobs, Values }
