import type { TokenInputValue } from "@ui-sdk/react/token-input"
import { useState, type ReactElement, type ReactNode } from "react"
import { MOTIFS, type MotifId } from "../../sadu/motifs"
import { WOOLS, WOOL_ORDER, type WoolId } from "../../sadu/palette"
import { SaduAutocomplete, type Suggestion } from "../../sadu/sadu-autocomplete"
import { SaduCombobox, type ComboboxOption } from "../../sadu/sadu-combobox"
import { SaduDateInput } from "../../sadu/sadu-date-input"
import { SaduField, SaduFieldDescription, SaduFieldError, SaduFieldLabel } from "../../sadu/sadu-field"
import { SaduInput } from "../../sadu/sadu-input"
import { SaduNumberInput } from "../../sadu/sadu-number-input"
import { SaduOTPInput } from "../../sadu/sadu-otp-input"
import { SaduPasswordInput } from "../../sadu/sadu-password-input"
import { BandSwatch, SkeinDot } from "../../sadu/parts"
import { mainColors } from "../../sadu/rug"
import { WovenDot } from "../../sadu/sadu-suggestions"
import { SaduTextarea } from "../../sadu/sadu-textarea"
import { SaduTimeInput } from "../../sadu/sadu-time-input"
import { SaduTokenInput, type TokenTrigger } from "../../sadu/sadu-token-input"
import { knob } from "../knobs"
import { playground, type EntryDefinition } from "./define"

const BORDER_IDS: readonly MotifId[] = ["eyoun", "uwairjan", "dhalla", "hubub", "dhurs"]

function motifSuggestions(dye: string): readonly Suggestion[] {
  return (["eyoun", "shajarah", "uwairjan", "dhalla", "hubub", "dhurs"] as const).map((id) => ({
    value: MOTIFS[id].name,
    arabic: MOTIFS[id].arabic,
    keywords: [MOTIFS[id].gloss],
    sample: <BandSwatch grid={MOTIFS[id].grid} colors={mainColors(dye)} center={MOTIFS[id].center} size="sm" />,
  }))
}

const DYE_OPTIONS: readonly ComboboxOption[] = [
  ...WOOL_ORDER.map((id) => ({ value: id, label: WOOLS[id].name, arabic: WOOLS[id].arabic, sample: <SkeinDot wool={id} /> })),
  { value: "undyed", label: "Undyed wool", arabic: "صوف طبيعي", sample: <SkeinDot wool={{ hex: "#e6d9bf", light: "#f6eedd", dark: "#c9b894" }} /> },
]

const WEAVERS: readonly { id: string; name: string; dye: WoolId }[] = [
  { id: "umm-saad", name: "Umm Saad", dye: "indigo" },
  { id: "hessa", name: "Hessa", dye: "madder" },
  { id: "noura", name: "Noura", dye: "camel" },
  { id: "mariam", name: "Mariam", dye: "saffron" },
]

const DYE_TOKENS: readonly WoolId[] = ["madder", "saffron", "indigo", "camel"]

const BRIEF_TRIGGERS: readonly TokenTrigger[] = [
  { char: "@", items: WEAVERS.map((weaver) => ({ type: "person", value: weaver.id, label: weaver.name })) },
  {
    char: "#",
    items: [
      ...BORDER_IDS.map((id) => ({ type: "motif", value: id, label: MOTIFS[id].name.toLowerCase(), arabic: MOTIFS[id].arabic })),
      ...DYE_TOKENS.map((id) => ({ type: "dye", value: id, label: WOOLS[id].name.toLowerCase(), arabic: WOOLS[id].arabic })),
    ],
  },
]

const BRIEF_DRAFT: TokenInputValue = [
  "Divider for ",
  { type: "person", value: "umm-saad", label: "Umm Saad" },
  " in ",
  { type: "motif", value: "uwairjan", label: "uwairjan" },
  " with ",
  { type: "dye", value: "madder", label: "madder" },
  ", due before Eid.",
]

function isMotif(value: string): value is MotifId {
  return value in MOTIFS
}

function isWool(value: string): value is WoolId {
  return value in WOOLS
}

function briefSample(type: string, value: string, dye: string): ReactNode {
  if (type === "person") {
    const weaver = WEAVERS.find((candidate) => candidate.id === value)
    return weaver ? <WovenDot name={weaver.name} /> : null
  }
  if (type === "motif") return isMotif(value) ? <BandSwatch grid={MOTIFS[value].grid} colors={mainColors(dye)} center={MOTIFS[value].center} size="sm" /> : null
  return isWool(value) ? <SkeinDot wool={value} /> : null
}

function rowsError(raw: string): string | null {
  const rows = Number(raw)
  if (raw.trim() === "" || !Number.isInteger(rows)) return "Enter a whole number of rows."
  if (rows < 5 || rows > 21) return "Use 5 to 21 rows."
  if (rows % 2 === 0) return `${rows} is even. Use ${rows - 1} or ${rows + 1}.`
  return null
}

function FieldDemo({ required, disabled, initial }: { required: boolean; disabled: boolean; initial: string }): ReactElement {
  const [rows, setRows] = useState(initial)
  const error = rowsError(rows)
  return (
    <div className="demo-stack demo-narrow">
      <SaduField invalid={error !== null} disabled={disabled}>
        <SaduFieldLabel>Rows per band</SaduFieldLabel>
        <SaduInput value={rows} onValueChange={(value: string) => setRows(value)} inputMode="numeric" required={required} end="rows" />
        <SaduFieldDescription>Between 5 and 21. Odd numbers centre the motif.</SaduFieldDescription>
        {error && <SaduFieldError match>{error}</SaduFieldError>}
      </SaduField>
    </div>
  )
}

function InputDemo({ disabled, readOnly, placeholder }: { disabled: boolean; readOnly: boolean; placeholder: string }): ReactElement {
  return (
    <div className="demo-stack demo-narrow">
      <SaduField disabled={disabled}>
        <SaduFieldLabel>Client name</SaduFieldLabel>
        <SaduInput defaultValue="Umm Saad Al-Ajmi" clearLabel="Clear client name" autoComplete="name" readOnly={readOnly} placeholder={placeholder} />
      </SaduField>
      <SaduField disabled={disabled}>
        <SaduFieldLabel>Price</SaduFieldLabel>
        <SaduInput defaultValue="185.000" inputMode="decimal" end="KD" readOnly={readOnly} />
      </SaduField>
    </div>
  )
}

function NumberDemo({ variant, min, max, step, disabled }: { variant: "tally" | "field"; min: number; max: number; step: number; disabled: boolean }): ReactElement {
  return (
    <SaduField className="demo-narrow" disabled={disabled}>
      <SaduFieldLabel>Rows per band</SaduFieldLabel>
      <SaduNumberInput variant={variant} defaultValue={11} min={min} max={max} step={step} unit="rows" decrementLabel="Fewer rows" incrementLabel="More rows" />
      <SaduFieldDescription>Odd numbers keep the motif centred.</SaduFieldDescription>
    </SaduField>
  )
}

const NOTES = "Client wants the centre band narrower than the last piece, and saffron in place of madder for the border."

function TextareaDemo({ limit }: { limit: number }): ReactElement {
  const [notes, setNotes] = useState(NOTES)
  const over = notes.length > limit
  return (
    <SaduField className="demo-wide-field" invalid={over}>
      <SaduFieldLabel>Notes for the weaver</SaduFieldLabel>
      <SaduTextarea value={notes} onValueChange={(value: string) => setNotes(value)} limit={limit} placeholder="Tension, dye lots, anything the next weaver should know" />
      {over && <SaduFieldError match>Keep notes under {limit} characters so they fit the order slip.</SaduFieldError>}
    </SaduField>
  )
}

function PasswordDemo({ disabled }: { disabled: boolean }): ReactElement {
  return (
    <SaduField className="demo-narrow" disabled={disabled}>
      <SaduFieldLabel>Workshop passphrase</SaduFieldLabel>
      <SaduPasswordInput defaultValue="goathair-loom" autoComplete="current-password" required />
      <SaduFieldDescription>The one pinned inside the dye shed.</SaduFieldDescription>
    </SaduField>
  )
}

const OTP_GROUPS = { "3-3": [3, 3], "2-2-2": [2, 2, 2], "4": [4] } as const

function OtpDemo({ dye, groups }: { dye: WoolId; groups: keyof typeof OTP_GROUPS }): ReactElement {
  return (
    <SaduField>
      <SaduFieldLabel>Code from the workshop</SaduFieldLabel>
      <SaduOTPInput defaultValue="482" dye={WOOLS[dye].hex} groups={OTP_GROUPS[groups]} />
      <SaduFieldDescription>Sent to the number on your guild card.</SaduFieldDescription>
    </SaduField>
  )
}

function AutocompleteDemo({ dye, disabled }: { dye: WoolId; disabled: boolean }): ReactElement {
  return (
    <SaduField className="demo-narrow" disabled={disabled}>
      <SaduFieldLabel>Motif</SaduFieldLabel>
      <SaduAutocomplete suggestions={motifSuggestions(WOOLS[dye].hex)} placeholder="Search motifs" clearLabel="Clear motif" />
      <SaduFieldDescription>Search in English or Arabic.</SaduFieldDescription>
    </SaduField>
  )
}

function ComboboxDemo({ multiple, disabled }: { multiple: boolean; disabled: boolean }): ReactElement {
  return (
    <SaduField className="demo-narrow" disabled={disabled}>
      <SaduFieldLabel>{multiple ? "Dyes for the band" : "Dye for the border"}</SaduFieldLabel>
      {multiple ? (
        <SaduCombobox multiple options={DYE_OPTIONS} defaultValue={["madder", "indigo"]} placeholder="Add a dye" triggerLabel="Show dyes" />
      ) : (
        <SaduCombobox options={DYE_OPTIONS} defaultValue="madder" placeholder="Choose a dye" triggerLabel="Show dyes" />
      )}
      <SaduFieldDescription>Up to four colours per band.</SaduFieldDescription>
    </SaduField>
  )
}

function TokenDemo({ dye }: { dye: WoolId }): ReactElement {
  const hex = WOOLS[dye].hex
  return (
    <SaduField className="demo-wide-field">
      <SaduFieldLabel>Brief</SaduFieldLabel>
      <SaduTokenInput
        defaultValue={BRIEF_DRAFT}
        triggers={BRIEF_TRIGGERS}
        renderSample={(type, value) => briefSample(type, value, hex)}
        placeholder="Describe the piece"
      />
      <SaduFieldDescription>Type @ for a weaver and # for a motif or dye.</SaduFieldDescription>
    </SaduField>
  )
}

const LOCALES = { "en-GB": "Day first", "en-US": "Month first" } as const

function DateInputDemo({ locale, hijri }: { locale: keyof typeof LOCALES; hijri: boolean }): ReactElement {
  return (
    <div className="demo-pair">
      <SaduField>
        <SaduFieldLabel>Due date</SaduFieldLabel>
        <SaduDateInput defaultValue="2027-02-14" locale={locale} />
        <SaduFieldDescription>Order 14, before Eid.</SaduFieldDescription>
      </SaduField>
      <SaduField lang="ar" dir="rtl">
        <SaduFieldLabel>موعد التسليم</SaduFieldLabel>
        <SaduDateInput defaultValue="2027-02-14" locale="ar" hijri={hijri} />
      </SaduField>
    </div>
  )
}

function TimeInputDemo({ hourCycle, dayBand }: { hourCycle: "12" | "24"; dayBand: boolean }): ReactElement {
  return (
    <SaduField className="demo-narrow">
      <SaduFieldLabel>Collection time</SaduFieldLabel>
      <SaduTimeInput defaultValue="16:30" hourCycle={hourCycle === "12" ? 12 : 24} locale="en-US" dayBand={dayBand} />
      <SaduFieldDescription>From Sadu House, after Asr.</SaduFieldDescription>
    </SaduField>
  )
}

const ENTRY: readonly EntryDefinition[] = [
  {
    id: "sadu-field",
    name: "Field",
    base: "Field",
    playground: playground(
      {
        initial: knob.text("Starting value", "12", { remount: true }),
        required: knob.toggle("Required", true),
        disabled: knob.toggle("Disabled"),
      },
      (values) => <FieldDemo {...values} />,
    ),
  },
  {
    id: "sadu-input",
    name: "Input",
    base: "Input",
    playground: playground(
      { placeholder: knob.text("Placeholder", "Client's full name"), readOnly: knob.toggle("Read only"), disabled: knob.toggle("Disabled") },
      (values) => <InputDemo {...values} />,
    ),
  },
  {
    id: "sadu-number-input",
    name: "Number Input",
    base: "Number Input",
    playground: playground(
      {
        variant: knob.choice("Variant", ["tally", "field"], "tally"),
        min: knob.number("Min", 3, { min: 0, max: 20 }),
        max: knob.number("Max", 21, { min: 5, max: 99 }),
        step: knob.number("Step", 2, { min: 1, max: 10 }),
        disabled: knob.toggle("Disabled"),
      },
      (values) => <NumberDemo {...values} />,
    ),
  },
  {
    id: "sadu-password-input",
    name: "Password Input",
    base: "Password Input",
    playground: playground({ disabled: knob.toggle("Disabled") }, (values) => <PasswordDemo {...values} />),
  },
  {
    id: "sadu-textarea",
    name: "Textarea",
    base: "Textarea",
    playground: playground({ limit: knob.number("Limit", 240, { min: 60, max: 400, step: 20 }) }, (values) => <TextareaDemo {...values} />),
  },
  {
    id: "sadu-otp-input",
    name: "OTP Input",
    base: "OTP Input",
    playground: playground(
      { dye: knob.dye(), groups: knob.choice("Groups", ["3-3", "2-2-2", "4"], "3-3", { remount: true }) },
      (values) => <OtpDemo {...values} />,
    ),
  },
  {
    id: "sadu-autocomplete",
    name: "Autocomplete",
    base: "Autocomplete",
    playground: playground({ dye: knob.dye(), disabled: knob.toggle("Disabled") }, (values) => <AutocompleteDemo {...values} />),
  },
  {
    id: "sadu-combobox",
    name: "Combobox",
    base: "Combobox",
    playground: playground(
      { multiple: knob.toggle("Several dyes", true, { remount: true }), disabled: knob.toggle("Disabled") },
      (values) => <ComboboxDemo {...values} />,
    ),
  },
  {
    id: "sadu-token-input",
    name: "Token Input",
    base: "Token Input",
    playground: playground({ dye: knob.dye() }, (values) => <TokenDemo {...values} />),
  },
  {
    id: "sadu-date-input",
    name: "Date Input",
    base: "Date Input",
    playground: playground(
      {
        locale: knob.choice("Latin field order", ["en-GB", "en-US"], "en-GB", { labels: LOCALES, remount: true }),
        hijri: knob.toggle("Hijri line under Arabic", true, { remount: true }),
      },
      (values) => <DateInputDemo {...values} />,
    ),
  },
  {
    id: "sadu-time-input",
    name: "Time Input",
    base: "Time Input",
    playground: playground(
      { hourCycle: knob.choice("Clock", ["12", "24"], "12", { labels: { "12": "12 hour", "24": "24 hour" }, remount: true }), dayBand: knob.toggle("Day band", true) },
      (values) => <TimeInputDemo {...values} />,
    ),
  },
]

export { ENTRY }
