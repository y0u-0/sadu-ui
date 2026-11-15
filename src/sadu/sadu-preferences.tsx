import "./styles/sadu-preferences.css"
import { createPreference, type Preference, type ValueStorage } from "@ui-sdk/core"
import { Preferences, usePreference } from "@ui-sdk/react/preferences"
import { useId, useSyncExternalStore, type ReactElement, type ReactNode } from "react"
import { useLocalized, type Localized } from "./locale"
import { MOTIFS, type Grid } from "./motifs"
import { WOOLS, WOOL_ORDER, type Colors, type WoolId } from "./palette"
import { mainColors } from "./rug"
import { SaduButton } from "./sadu-button"
import { SaduSegment, SaduSegmentedControl } from "./sadu-segmented-control"
import { SkeinRadio } from "./skein-radio"
import { GOAT_HAIR, Reweave, WOOL_CLOTH, Weave } from "./weave"

type ThemeChoice = "system" | "day" | "tent"
type MotionChoice = "full" | "reduced"
type ContrastChoice = "standard" | "more"
type DirectionChoice = "ltr" | "rtl"

type SaduPreferenceSet = {
  theme: Preference<ThemeChoice>
  dye: Preference<WoolId>
  motion: Preference<MotionChoice>
  contrast: Preference<ContrastChoice>
  direction: Preference<DirectionChoice>
}

type SaduPreferenceOptions = {
  global?: boolean
  storage?: (name: string) => ValueStorage
  /** The panel's direction before anything is saved. Defaults to the document's, so an Arabic page starts right to left. */
  direction?: DirectionChoice
}

type PreferencesVariant = "card" | "plain"

type SaduPreferencesProps = { preferences: SaduPreferenceSet; title?: ReactNode; variant?: PreferencesVariant; className?: string }

type Choice<Value extends string> = { value: Value; label: string }

type PreferencesCopy = {
  title: string
  reset: string
  sampler: string
  theme: { label: string; description: string; choices: Record<ThemeChoice, string> }
  dye: { label: string; description: string }
  motion: { label: string; description: string; choices: Record<MotionChoice, string> }
  contrast: { label: string; description: string; choices: Record<ContrastChoice, string> }
  direction: { label: string; description: string; choices: Record<DirectionChoice, string> }
}

const COPY: Localized<PreferencesCopy> = {
  en: {
    title: "Display",
    reset: "Reset",
    sampler: "Sampler on the loom, woven in the current preferences",
    theme: {
      label: "Theme",
      description: "Day is wool in daylight. Tent is goat hair by lamplight.",
      choices: { system: "System", day: "Day", tent: "Tent" },
    },
    dye: { label: "Dye", description: "Recolours every dyed field." },
    motion: {
      label: "Motion",
      description: "Reduced swaps cloth at once instead of weaving it.",
      choices: { full: "Full", reduced: "Reduced" },
    },
    contrast: {
      label: "Contrast",
      description: "More weaves in two colours and thickens control edges.",
      choices: { standard: "Standard", more: "More" },
    },
    direction: {
      label: "Direction",
      description: "Flips this panel and the direction the sampler weaves.",
      choices: { ltr: "Left to right", rtl: "Right to left" },
    },
  },
  ar: {
    title: "العرض",
    reset: "إعادة الضبط",
    sampler: "عيّنة على النول، منسوجة بالتفضيلات الحالية",
    theme: {
      label: "السمة",
      description: "النهار صوف في ضوء الشمس، والخيمة شعر ماعز على ضوء السراج.",
      choices: { system: "حسب الجهاز", day: "نهار", tent: "خيمة" },
    },
    dye: { label: "الصبغة", description: "تُعيد تلوين كل حقل مصبوغ." },
    motion: {
      label: "الحركة",
      description: "مع الحركة المخفّضة يظهر القماش فورًا بدل أن يُنسج أمامك.",
      choices: { full: "كاملة", reduced: "مخفّضة" },
    },
    contrast: {
      label: "التباين",
      description: "مع التباين الأعلى يُنسج القماش بلونين وتزداد سماكة حواف العناصر.",
      choices: { standard: "عادي", more: "أعلى" },
    },
    direction: {
      label: "الاتجاه",
      description: "يعكس هذه اللوحة واتجاه نسج العيّنة.",
      choices: { ltr: "من اليسار إلى اليمين", rtl: "من اليمين إلى اليسار" },
    },
  },
}

function choicesOf<Value extends string>(order: readonly Value[], labels: Record<Value, string>): Choice<Value>[] {
  return order.map((value) => ({ value, label: labels[value] }))
}

const DARK_QUERY = "(prefers-color-scheme: dark)"
const BEAT_CAP = 600

const THEMES: readonly ThemeChoice[] = ["system", "day", "tent"]
const MOTIONS: readonly MotionChoice[] = ["full", "reduced"]
const CONTRASTS: readonly ContrastChoice[] = ["standard", "more"]
const DIRECTIONS: readonly DirectionChoice[] = ["ltr", "rtl"]

function documentDirection(): DirectionChoice {
  return typeof document !== "undefined" && document.documentElement.dir === "rtl" ? "rtl" : "ltr"
}

function createSaduPreferences({ global = false, storage, direction = documentDirection() }: SaduPreferenceOptions = {}): SaduPreferenceSet {
  return {
    theme: createPreference({
      values: ["system", "day", "tent"],
      defaultValue: "system",
      attribute: "data-theme",
      global,
      storage: storage?.("sadu-theme"),
    }),
    dye: createPreference({
      values: WOOL_ORDER,
      defaultValue: "madder",
      attribute: "data-dye",
      global,
      storage: storage?.("sadu-dye"),
    }),
    motion: createPreference({
      values: ["full", "reduced"],
      defaultValue: "full",
      attribute: "data-motion",
      global,
      storage: storage?.("sadu-motion"),
    }),
    contrast: createPreference({
      values: ["standard", "more"],
      defaultValue: "standard",
      attribute: "data-contrast",
      global,
      storage: storage?.("sadu-contrast"),
    }),
    direction: createPreference({
      values: ["ltr", "rtl"],
      defaultValue: direction,
      attribute: "data-direction",
      storage: storage?.("sadu-direction"),
    }),
  }
}

function subscribeToScheme(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function useSystemTent(): boolean {
  return useSyncExternalStore(
    subscribeToScheme,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  )
}

function dyeColors(dye: WoolId): Colors {
  const hex = WOOLS[dye].hex
  return dye === "indigo" || dye === "charcoal" ? { ground: WOOL_CLOTH, dye: hex, accent: GOAT_HAIR } : mainColors(hex)
}

type SamplerBand = { key: string; grid: Grid; colors: Colors }

function samplerBands(tent: boolean, dye: WoolId, reduced: boolean, more: boolean): SamplerBand[] {
  const madder = WOOLS.madder.hex
  return [
    {
      key: "theme",
      grid: MOTIFS.dhurs.grid,
      colors: tent ? { ground: GOAT_HAIR, dye: WOOL_CLOTH, accent: WOOL_CLOTH } : { ground: WOOL_CLOTH, dye: GOAT_HAIR, accent: GOAT_HAIR },
    },
    { key: "dye", grid: MOTIFS.eyoun.grid, colors: dyeColors(dye) },
    {
      key: "motion",
      grid: reduced ? MOTIFS.dhalla.grid : MOTIFS.uwairjan.grid,
      colors: { ground: GOAT_HAIR, dye: WOOL_CLOTH, accent: madder },
    },
    {
      key: "contrast",
      grid: MOTIFS.hubub.grid,
      colors: more ? { ground: GOAT_HAIR, dye: WOOL_CLOTH, accent: WOOL_CLOTH } : { ground: GOAT_HAIR, dye: madder, accent: WOOL_CLOTH },
    },
  ]
}

type SamplerProps = { tent: boolean; dye: WoolId; reduced: boolean; more: boolean; label: string }

function Sampler({ tent, dye, reduced, more, label }: SamplerProps): ReactElement {
  const bands = samplerBands(tent, dye, reduced, more)
  return (
    <div className="sadu-preferences__sampler" role="img" aria-label={label}>
      <div className="sadu-preferences__warp">
        {bands.map((band) => (
          <Weave key={band.key} bare className="sadu-preferences__band" grid={band.grid} colors={band.colors} level="cloth" />
        ))}
      </div>
      <div className="sadu-preferences__cloth">
        {bands.map((band) => (
          <Reweave key={band.key} className="sadu-preferences__band" grid={band.grid} colors={band.colors} level="cloth" cap={BEAT_CAP} />
        ))}
      </div>
      <span className="sadu-wood sadu-preferences__beater" />
    </div>
  )
}

type SegmentRowProps<Value extends string> = {
  label: string
  description: string
  choices: readonly Choice<Value>[]
  value: Value
  onChange: (value: Value) => void
}

function SegmentRow<Value extends string>({ label, description, choices, value, onChange }: SegmentRowProps<Value>): ReactElement {
  const id = useId()
  return (
    <div className="sadu-preferences__row">
      <span id={`${id}-label`} className="sadu-label">
        {label}
      </span>
      <SaduSegmentedControl
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-description`}
        value={value}
        onValueChange={(next) => next && onChange(next as Value)}
      >
        {choices.map((choice) => (
          <SaduSegment key={choice.value} value={choice.value}>
            {choice.label}
          </SaduSegment>
        ))}
      </SaduSegmentedControl>
      <p id={`${id}-description`} className="sadu-preferences__description">
        {description}
      </p>
    </div>
  )
}

function SaduPreferences({ preferences, title, variant = "card", className }: SaduPreferencesProps): ReactElement {
  const copy = useLocalized(COPY)
  const { theme, dye, motion, contrast, direction } = preferences
  const themeValue = usePreference(theme).value
  const dyeValue = usePreference(dye).value
  const motionValue = usePreference(motion).value
  const contrastValue = usePreference(contrast).value
  const directionValue = usePreference(direction).value
  const systemTent = useSystemTent()
  const id = useId()
  const tent = themeValue === "tent" || (themeValue === "system" && systemTent)
  const reset = () => {
    theme.set(theme.defaultValue)
    dye.set(dye.defaultValue)
    motion.set(motion.defaultValue)
    contrast.set(contrast.defaultValue)
    direction.set(direction.defaultValue)
  }
  return (
    <Preferences preferences={[theme, dye, motion, contrast, direction]}>
      <section
        className={["sadu-preferences", className].filter(Boolean).join(" ")}
        dir={directionValue}
        data-variant={variant}
        aria-labelledby={`${id}-title`}
      >
        <div className="sadu-preferences__head">
          <h3 id={`${id}-title`} className="sadu-preferences__title">
            {title ?? copy.title}
          </h3>
          <SaduButton variant="ghost" size="sm" className="sadu-preferences__reset" onClick={reset}>
            {copy.reset}
          </SaduButton>
        </div>
        <Sampler tent={tent} dye={dyeValue} reduced={motionValue === "reduced"} more={contrastValue === "more"} label={copy.sampler} />
        <SegmentRow
          label={copy.theme.label}
          description={copy.theme.description}
          choices={choicesOf(THEMES, copy.theme.choices)}
          value={themeValue}
          onChange={(next) => theme.set(next)}
        />
        <div className="sadu-preferences__row">
          <SkeinRadio label={copy.dye.label} value={dyeValue} onValueChange={(next) => dye.set(next)} />
          <p className="sadu-preferences__description">{copy.dye.description}</p>
        </div>
        <SegmentRow
          label={copy.motion.label}
          description={copy.motion.description}
          choices={choicesOf(MOTIONS, copy.motion.choices)}
          value={motionValue}
          onChange={(next) => motion.set(next)}
        />
        <SegmentRow
          label={copy.contrast.label}
          description={copy.contrast.description}
          choices={choicesOf(CONTRASTS, copy.contrast.choices)}
          value={contrastValue}
          onChange={(next) => contrast.set(next)}
        />
        <SegmentRow
          label={copy.direction.label}
          description={copy.direction.description}
          choices={choicesOf(DIRECTIONS, copy.direction.choices)}
          value={directionValue}
          onChange={(next) => direction.set(next)}
        />
      </section>
    </Preferences>
  )
}

export { SaduPreferences, createSaduPreferences }
export type { PreferencesVariant, SaduPreferenceSet, SaduPreferencesProps }
