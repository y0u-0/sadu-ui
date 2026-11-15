import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
  NumberInputScrubArea,
} from "@ui-sdk/react/number-input"
import { Minus, Plus } from "lucide-react"
import { useRef, useState, type ComponentProps, type CSSProperties, type PointerEvent, type ReactElement } from "react"
import { useLocalized } from "./locale"
import { WoodButton } from "./parts"
import { partClass } from "./sadu-field"
import { DhursStrip } from "./sadu-input"
import "./styles/sadu-input.css"
import "./styles/sadu-number-input.css"

type SaduNumberInputProps = ComponentProps<typeof NumberInput> & {
  unit?: string
  placeholder?: string
  decrementLabel?: string
  incrementLabel?: string
  variant?: CounterVariant
  tallyLimit?: number
  inputProps?: ComponentProps<typeof NumberInputControl>
}

const GROUP = 5
const PLUCK: Keyframe[] = [
  { translate: "0 0" },
  { translate: "0 1.5px" },
  { translate: "0 -1.5px" },
  { translate: "0 1px" },
  { translate: "0 -1px" },
  { translate: "0 0.5px" },
  { translate: "0 0" },
]

function prefersStill(element: Element): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true || element.closest("[data-motion='reduced']") !== null
}

function Tally({ count, capacity }: { count: number; capacity: number }): ReactElement {
  const groups = Math.ceil(capacity / GROUP)
  return (
    <span className="sadu-counter__tally" aria-hidden="true">
      {Array.from({ length: groups }, (_, group) => {
        const size = Math.min(GROUP, capacity - group * GROUP)
        return (
          <span key={group} className="sadu-counter__group" style={{ "--sadu-group-size": size } as CSSProperties}>
            {Array.from({ length: size }, (_, index) => (
              <span key={index} className="sadu-counter__float" data-woven={group * GROUP + index < count || undefined} />
            ))}
          </span>
        )
      })}
    </span>
  )
}

type CounterVariant = "tally" | "field"

function focusControl(event: PointerEvent<HTMLSpanElement>): void {
  const control = event.currentTarget.querySelector("input")
  if (!control || event.target !== event.currentTarget) return
  event.preventDefault()
  control.focus()
}

const COPY = { en: { decrement: "Decrease", increment: "Increase" }, ar: { decrement: "إنقاص", increment: "زيادة" } }

function SaduNumberInput({
  className,
  variant = "tally",
  unit,
  placeholder,
  decrementLabel,
  incrementLabel,
  tallyLimit = 40,
  inputProps,
  value,
  defaultValue,
  onValueChange,
  ...props
}: SaduNumberInputProps): ReactElement {
  const copy = useLocalized(COPY)
  const tallyRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<number | null>(defaultValue ?? null)
  const current = value === undefined ? draft : value
  const capacity = props.max === undefined ? 0 : Math.round(props.max)
  const showTally = variant === "tally" && capacity > 0 && capacity <= tallyLimit

  return (
    <NumberInput
      {...props}
      value={value}
      defaultValue={defaultValue}
      className={partClass("sadu-counter", className)}
      data-variant={variant}
      onValueChange={(next, details) => {
        if (value === undefined) setDraft(next)
        onValueChange?.(next, details)
        const tally = tallyRef.current
        const atBound = next !== null && (next === props.min || next === props.max)
        if (tally && atBound && details.reason !== "reset" && !prefersStill(tally)) tally.animate?.(PLUCK, { duration: 240, easing: "linear" })
      }}
    >
      <NumberInputGroup className="sadu-counter__row">
        <NumberInputDecrement render={<WoodButton />} className="sadu-counter__peg" aria-label={decrementLabel ?? copy.decrement}>
          <Minus size={16} strokeWidth={2} aria-hidden="true" />
        </NumberInputDecrement>
        <span className="sadu-input sadu-counter__field" onPointerDown={focusControl}>
          <span className="sadu-counter__digits">
            <NumberInputControl {...inputProps} placeholder={placeholder} className="sadu-counter__control" />
            {unit && (
              <NumberInputScrubArea className="sadu-counter__unit">
                <span>{unit}</span>
              </NumberInputScrubArea>
            )}
          </span>
          <DhursStrip />
        </span>
        <NumberInputIncrement render={<WoodButton />} className="sadu-counter__peg" aria-label={incrementLabel ?? copy.increment}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
        </NumberInputIncrement>
        {showTally && (
          <div ref={tallyRef} className="sadu-counter__loom">
            <Tally count={Math.max(0, Math.min(capacity, Math.round(current ?? 0)))} capacity={capacity} />
          </div>
        )}
      </NumberInputGroup>
    </NumberInput>
  )
}

export { SaduNumberInput }
export type { CounterVariant, SaduNumberInputProps }
