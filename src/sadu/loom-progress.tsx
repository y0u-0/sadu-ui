import "./styles/loom-progress.css"
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue } from "@ui-sdk/react/progress"
import { useState, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { mergeClass } from "./merge-class"
import { MOTIFS, type Grid, type MotifId } from "./motifs"
import { INK, WOOLS } from "./palette"
import { Eye } from "./parts"
import { Weave } from "./weave"

type LoomProgressSize = "sm" | "lg"

type LoomProgressProps = Omit<ComponentProps<typeof Progress>, "children"> & {
  label?: ReactNode
  unit?: ReactNode
  size?: LoomProgressSize
  motif?: MotifId
  dye?: string
}

const NARROW_BAND: Grid = [".", "x", "."]

function LoomProgress({
  label,
  unit,
  size = "lg",
  motif = "eyoun",
  dye = WOOLS.madder.hex,
  className,
  ...props
}: LoomProgressProps): ReactElement {
  const complete = typeof props.value === "number" && props.value >= (props.max ?? 100)
  const [wasComplete, setWasComplete] = useState(complete)
  const [taps, setTaps] = useState(0)
  if (complete !== wasComplete) {
    setWasComplete(complete)
    if (complete) setTaps((count) => count + 1)
  }
  const grid = size === "sm" ? NARROW_BAND : MOTIFS[motif].grid
  const cloth = <Weave grid={grid} colors={{ ground: INK.black, dye, accent: INK.wool }} level="stitch" />
  return (
    <Progress {...props} className={mergeClass("sadu-progress", className)} data-size={size}>
      <div className="sadu-progress__head">
        {label && <ProgressLabel className="sadu-progress__label">{label}</ProgressLabel>}
        <span className="sadu-progress__reading">
          <span className="sadu-progress__done">
            <Eye size={10} tone="value" />
          </span>
          <ProgressValue className="sadu-progress__value">
            {(state) => (
              <>
                {state.text}
                {unit && state.text && <span className="sadu-progress__unit">{unit}</span>}
              </>
            )}
          </ProgressValue>
        </span>
      </div>
      <ProgressTrack className="sadu-progress__track">
        <span className="sadu-progress__warp" />
        <ProgressIndicator className="sadu-progress__indicator">
          <span className="sadu-progress__cloth">{cloth}</span>
          <span key={taps} className="sadu-progress__beater sadu-wood" data-tap={complete && taps > 0 ? "" : undefined} />
        </ProgressIndicator>
        <span className="sadu-progress__shuttle">
          <span className="sadu-progress__window">{cloth}</span>
          <span className="sadu-progress__beater sadu-wood" />
        </span>
      </ProgressTrack>
    </Progress>
  )
}

export { LoomProgress }
export type { LoomProgressProps, LoomProgressSize }
