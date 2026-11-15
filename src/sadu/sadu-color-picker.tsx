import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerAreaThumb,
  ColorPickerEyeDropper,
  ColorPickerInput,
  ColorPickerSlider,
  ColorPickerSliderThumb,
  ColorPickerSwatches,
  ColorPickerSwatchItem,
} from "@ui-sdk/react/color-picker"
import { Field, FieldLabel } from "@ui-sdk/react/field"
import { Pipette } from "lucide-react"
import { useState, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { useLocalized, useSaduLocale, type Localized } from "./locale"
import { MOTIFS } from "./motifs"
import { INK, WOOLS, WOOL_ORDER } from "./palette"
import { IconButton } from "./parts"
import { DhursStrip } from "./sadu-input"
import { Weave } from "./weave"
import "./sadu.css"
import "./styles/sadu-color-picker.css"

type Dye = { id: string; name: string; hex: string }

const NATURAL_DYES: readonly Dye[] = WOOL_ORDER.map((id) => ({ id, name: WOOLS[id].name, hex: WOOLS[id].hex }))

const NATURAL_DYES_ARABIC: readonly Dye[] = WOOL_ORDER.map((id) => ({ id, name: WOOLS[id].arabic, hex: WOOLS[id].hex }))

type ColorPickerCopy = {
  dyes: string
  custom: string
  closest: (name: string) => string
  hex: string
  eyeDropper: string
  /** Undefined keeps UI SDK's English channel names. */
  area: string | undefined
  hue: string | undefined
}

const COPY: Localized<ColorPickerCopy> = {
  en: {
    dyes: "Dyes",
    custom: "Custom dye",
    closest: (name: string) => `Closest to ${name.toLowerCase()}`,
    hex: "Hex",
    eyeDropper: "Pick from screen",
    area: undefined,
    hue: undefined,
  },
  ar: {
    dyes: "الصبغات",
    custom: "صبغة مخصّصة",
    closest: (name: string) => `الأقرب: ${name}`,
    hex: "رمز اللون",
    eyeDropper: "التقاط لون من الشاشة",
    area: "التشبّع والسطوع",
    hue: "درجة اللون",
  },
}

type SaduColorPickerProps = Omit<ComponentProps<typeof ColorPicker>, "className" | "children" | "format"> & {
  label: ReactNode
  dyes?: readonly Dye[]
  saved?: readonly Dye[]
  dyesLabel?: string
  customLabel?: string
  closestLabel?: (name: string) => string
  hexLabel?: string
  eyeDropperLabel?: string
  className?: string
}

function channelsOf(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace("#", "").slice(0, 6), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function closestOf(hex: string, dyes: readonly Dye[]): Dye | undefined {
  const [r, g, b] = channelsOf(hex)
  const distance = (dye: Dye) => {
    const [dr, dg, db] = channelsOf(dye.hex)
    return (r - dr) ** 2 * 0.3 + (g - dg) ** 2 * 0.59 + (b - db) ** 2 * 0.11
  }
  return [...dyes].sort((a, b) => distance(a) - distance(b))[0]
}

function SaduColorPicker({
  label,
  dyes: ownDyes,
  saved = [],
  dyesLabel,
  customLabel,
  closestLabel,
  hexLabel,
  eyeDropperLabel,
  onValueCommit,
  className,
  ...props
}: SaduColorPickerProps): ReactElement {
  const copy = useLocalized(COPY)
  const arabic = useSaduLocale() === "ar"
  const dyes = ownDyes ?? (arabic ? NATURAL_DYES_ARABIC : NATURAL_DYES)
  const [pointed, setPointed] = useState<Dye | null>(null)
  const [beats, setBeats] = useState(0)
  const all = [...dyes, ...saved]
  return (
    <Field className={["sadu-color", className].filter(Boolean).join(" ")}>
      <ColorPicker
        {...props}
        format="hex"
        onValueCommit={(value, details) => {
          onValueCommit?.(value, details)
          setBeats((count) => count + 1)
        }}
        className="sadu-color__picker"
      >
        {(state) => {
          const chosen = all.find((dye) => dye.hex.toLowerCase() === state.value.toLowerCase())
          const closest = closestOf(state.value, dyes)
          return (
            <>
              <div className="sadu-color__head">
                <FieldLabel className="sadu-label">{label}</FieldLabel>
                <span className="sadu-color__name">{pointed?.name ?? chosen?.name ?? customLabel ?? copy.custom}</span>
              </div>
              <ColorPickerSwatches aria-label={dyesLabel ?? copy.dyes} className="sadu-color__skeins">
                {all.map((dye) => (
                  <ColorPickerSwatchItem
                    key={dye.id}
                    value={dye.hex}
                    aria-label={dye.name}
                    className="sadu-color__skein"
                    data-saved={saved.includes(dye) || undefined}
                    onPointerEnter={() => setPointed(dye)}
                    onPointerLeave={() => setPointed(null)}
                    onFocus={() => setPointed(dye)}
                    onBlur={() => setPointed(null)}
                  >
                    <span className="sadu-yarn sadu-color__yarn" aria-hidden="true" />
                  </ColorPickerSwatchItem>
                ))}
              </ColorPickerSwatches>
              <div className="sadu-color__band" aria-hidden="true">
                <Weave
                  grid={MOTIFS.eyoun.grid}
                  colors={{ ground: INK.black, dye: state.value, accent: INK.wool }}
                  level="cloth"
                />
                {beats > 0 && <span key={beats} className="sadu-color__beat sadu-wood" />}
              </div>
              <ColorPickerArea className="sadu-color__area">
                <span className="sadu-cloth-fill sadu-color__cloth" aria-hidden="true" />
                <ColorPickerAreaThumb className="sadu-lozenge sadu-color__thumb" aria-label={copy.area} data-chosen="" />
              </ColorPickerArea>
              <ColorPickerSlider channel="hue" className="sadu-color__hue">
                <span className="sadu-cloth-fill sadu-color__cloth" aria-hidden="true" />
                <ColorPickerSliderThumb className="sadu-color__beater sadu-wood" aria-label={copy.hue} />
              </ColorPickerSlider>
              <div className="sadu-color__entry">
                <div className="sadu-input sadu-color__field">
                  <ColorPickerInput aria-label={hexLabel ?? copy.hex} className="sadu-color__input" spellCheck={false} />
                  <DhursStrip />
                </div>
                <ColorPickerEyeDropper aria-label={eyeDropperLabel ?? copy.eyeDropper} className="sadu-color__dropper" render={<IconButton size={36} />}>
                  <Pipette size={16} strokeWidth={2} aria-hidden="true" />
                </ColorPickerEyeDropper>
              </div>
              {closest && !chosen && <span className="sadu-color__closest">{(closestLabel ?? copy.closest)(closest.name)}</span>}
            </>
          )
        }}
      </ColorPicker>
    </Field>
  )
}

export { NATURAL_DYES, SaduColorPicker }
export type { Dye }
