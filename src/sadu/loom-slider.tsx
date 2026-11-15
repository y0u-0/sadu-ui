import { Field, FieldLabel } from "@ui-sdk/react/field"
import { Slider, SliderControl, SliderIndicator, SliderThumb, SliderTrack, SliderValue } from "@ui-sdk/react/slider"
import type { ReactElement, ReactNode } from "react"
import type { Grid } from "./motifs"
import { INK, type Colors } from "./palette"
import { LEVELS, WOOL_CLOTH, Weave, type Level } from "./weave"

type LoomSliderProps = {
  label: ReactNode
  grid: Grid
  colors: Colors
  level?: Level
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  unit?: string
  valueSlot?: ReactNode
  name?: string
  disabled?: boolean
  target?: string
  className?: string
}

const EDGE = "#8a7864"

function warpOf(colors: Colors): Colors {
  const visible = (color: string) => (color === WOOL_CLOTH || color === INK.wool || color === INK.bone ? EDGE : color)
  return { ground: visible(colors.ground), dye: visible(colors.dye), accent: visible(colors.accent) }
}

function LoomSlider({
  label,
  grid,
  colors,
  level = "cloth",
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 80,
  unit = "rows",
  valueSlot,
  name,
  disabled,
  target,
  className,
}: LoomSliderProps): ReactElement {
  const cell = LEVELS[level]
  return (
    <Field className={["sadu-loom", className].filter(Boolean).join(" ")}>
      <Slider
        className="sadu-loom__slider"
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => typeof next === "number" && onValueChange?.(next)}
        min={min}
        max={max}
        name={name}
        disabled={disabled}
      >
        <div className="sadu-loom__head">
          <FieldLabel className="sadu-label">{label}</FieldLabel>
          <span className="sadu-loom__value">
            {valueSlot ?? <SliderValue />}
            <span className="sadu-loom__unit">{unit}</span>
          </span>
        </div>
        <SliderControl
          className="sadu-loom__control"
          style={{ ["--sadu-band" as string]: `${grid.length * cell.height}px`, ["--sadu-cell" as string]: `${cell.width}px` }}
        >
          <span className="sadu-loom__beam sadu-wood" aria-hidden="true" />
          <SliderTrack className="sadu-loom__track" data-target={target && `${target}-track`}>
            <Weave bare grid={grid} colors={warpOf(colors)} level={level} className="sadu-loom__warp" />
            <SliderIndicator className="sadu-loom__cloth">
              <span className="sadu-loom__clip">
                <Weave grid={grid} colors={colors} level={level} className="sadu-loom__weave" />
              </span>
            </SliderIndicator>
            <SliderThumb className="sadu-loom__thumb" data-target={target && `${target}-thumb`} data-cursor="open">
              <span className="sadu-loom__beater sadu-wood" aria-hidden="true" />
            </SliderThumb>
          </SliderTrack>
          <span className="sadu-loom__beam sadu-wood" aria-hidden="true" />
        </SliderControl>
      </Slider>
    </Field>
  )
}

export { LoomSlider }
