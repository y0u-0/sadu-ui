import { Slider, SliderControl, SliderThumb, SliderTrack } from "@ui-sdk/react/slider"
import { useEffect, useState, type CSSProperties, type ReactElement } from "react"
import { Rug } from "../sadu/rug"
import { LEVELS, useColumns } from "../sadu/weave"
import { useLocale } from "./locale"
import { useDye } from "./settings"

const RESTING = 62
const WEAVE_IN = 1300
const CELL = LEVELS.thread.width

function prefersStill(): boolean {
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced"
  )
}

function useWeaveIn(target: number): readonly [number, (next: number) => void] {
  const [percent, setPercent] = useState(() => (prefersStill() ? target : 0))
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (touched || percent >= target) return
    const start = performance.now()
    let frame = 0
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / WEAVE_IN)
      setPercent(Math.round(target * progress))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, touched])
  const set = (next: number): void => {
    setTouched(true)
    setPercent(next)
  }
  return [percent, set] as const
}

function MastheadLoom(): ReactElement {
  const { dyeHex } = useDye()
  const locale = useLocale()
  const [percent, setPercent] = useWeaveIn(RESTING)
  const [frameRef, width] = useColumns(1)
  const woven = Math.round((width * percent) / 100 / CELL) * CELL
  return (
    <div ref={frameRef} className="masthead-loom" style={{ "--masthead-woven": `${woven}px` } as CSSProperties}>
      <Rug className="masthead-loom__rug" motif="uwairjan" dye={dyeHex} level="thread" seed={11} woven={woven} />
      <span className="masthead-loom__beam sadu-wood" aria-hidden="true" />
      <span className="masthead-loom__beater sadu-wood" aria-hidden="true" />
      <Slider className="masthead-loom__slider" value={percent} onValueChange={(next) => typeof next === "number" && setPercent(next)}>
        <SliderControl className="masthead-loom__control">
          <SliderTrack className="masthead-loom__track">
            <SliderThumb className="masthead-loom__thumb" aria-label={locale === "ar" ? "المنسوج من البساط" : "Rug woven so far"} />
          </SliderTrack>
        </SliderControl>
      </Slider>
    </div>
  )
}

export { MastheadLoom }
