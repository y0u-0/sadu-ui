import { Field, FieldLabel } from "@ui-sdk/react/field"
import { Radio, RadioGroup } from "@ui-sdk/react/radio"
import { useState, type ReactElement, type ReactNode } from "react"
import { useLocalized, useSaduLocale } from "./locale"
import { WOOLS, WOOL_ORDER, type WoolId } from "./palette"
import { yarnStyle } from "./parts"

type SkeinRadioProps = {
  label?: ReactNode
  wools?: readonly WoolId[]
  value?: WoolId | null
  defaultValue?: WoolId
  onValueChange?: (value: WoolId) => void
  nameSlot?: ReactNode
  nameOf?: (id: WoolId) => ReactNode
  name?: string
  disabled?: boolean
  target?: string
  className?: string
}

const LABEL = { en: "Wool", ar: "الصوف" }

function SkeinRadio({
  label,
  wools = WOOL_ORDER,
  value,
  defaultValue,
  onValueChange,
  nameSlot,
  nameOf: ownNameOf,
  name,
  disabled,
  target,
  className,
}: SkeinRadioProps): ReactElement {
  const fallbackLabel = useLocalized(LABEL)
  const arabic = useSaduLocale() === "ar"
  const plainName = (id: WoolId): string => (arabic ? WOOLS[id].arabic : WOOLS[id].name)
  const nameOf = ownNameOf ?? plainName
  const accessibleName = (id: WoolId): string => {
    const shown = nameOf(id)
    return typeof shown === "string" ? shown : plainName(id)
  }
  const [pointed, setPointed] = useState<WoolId | null>(null)
  const [uncontrolled, setUncontrolled] = useState<WoolId | undefined>(defaultValue)
  const selected = value === undefined ? uncontrolled : (value ?? undefined)
  const fallback = nameSlot ?? (selected ? nameOf(selected) : null)
  return (
    <Field className={["sadu-skeins", className].filter(Boolean).join(" ")}>
      <div className="sadu-skeins__head">
        <FieldLabel className="sadu-label">{label ?? fallbackLabel}</FieldLabel>
        <span className="sadu-skeins__name" aria-hidden={pointed ? true : undefined} data-pointed={pointed ? "" : undefined}>
          {pointed ? nameOf(pointed) : fallback}
        </span>
      </div>
      <RadioGroup<WoolId>
        className="sadu-skeins__group"
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => {
          if (!next) return
          setUncontrolled(next)
          onValueChange?.(next)
        }}
        name={name}
        disabled={disabled}
        onPointerLeave={() => setPointed(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPointed(null)
        }}
      >
        {wools.map((id) => {
          const wool = WOOLS[id]
          return (
            <Radio
              key={id}
              value={id}
              aria-label={accessibleName(id)}
              className="sadu-skein"
              data-target={target && `${target}-${id}`}
              data-cursor="pointer"
              onPointerEnter={() => setPointed(id)}
              onFocus={() => setPointed(id)}
              style={yarnStyle(id)}
            >
              <span className="sadu-skein__yarn sadu-yarn" aria-hidden="true" />
            </Radio>
          )
        })}
      </RadioGroup>
    </Field>
  )
}

export { SkeinRadio }
