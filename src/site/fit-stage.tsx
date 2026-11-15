import { useLayoutEffect, useRef, type ReactElement, type ReactNode } from "react"

const MIN_SCALE = 0.5

const fitOf = new Map<Element, HTMLElement>()
const pending = new Set<Element>()
let observer: ResizeObserver | undefined
let frame = 0

function refitNextFrame(stage: Element): void {
  pending.add(stage)
  frame ||= requestAnimationFrame(() => {
    frame = 0
    refit(pending)
    pending.clear()
  })
}

/* Every stage is refitted in three passes (reset, measure, apply) so N cards cost one layout, not N. */
function refit(stages: Iterable<Element>): void {
  const pairs = [...stages].flatMap((stage) => {
    const fit = fitOf.get(stage)
    return fit && stage instanceof HTMLElement ? [[stage, fit] as const] : []
  })
  for (const [, fit] of pairs) fit.style.zoom = "1"
  const scales = pairs.map(([stage, fit]) => {
    const styles = getComputedStyle(stage)
    const width = stage.clientWidth - parseFloat(styles.paddingInlineStart) - parseFloat(styles.paddingInlineEnd)
    const height = stage.clientHeight - parseFloat(styles.paddingBlockStart) - parseFloat(styles.paddingBlockEnd)
    return Math.min(1, width / Math.max(1, fit.scrollWidth), height / Math.max(1, fit.scrollHeight))
  })
  pairs.forEach(([, fit], index) => {
    const scale = scales[index] ?? 1
    fit.style.zoom = scale < 0.995 ? String(Math.max(MIN_SCALE, Math.floor(scale * 100) / 100)) : ""
  })
}

function FitStage({ children }: { children: ReactNode }): ReactElement {
  const box = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const fit = box.current
    const stage = fit?.parentElement
    if (!fit || !stage) return
    fitOf.set(stage, fit)
    observer ??= new ResizeObserver((entries) => refit(entries.map((entry) => entry.target)))
    observer.observe(stage)
    refitNextFrame(stage)
    return () => {
      pending.delete(stage)
      observer?.unobserve(stage)
      fitOf.delete(stage)
    }
  }, [])
  return (
    <div ref={box} className="fit-stage">
      {children}
    </div>
  )
}

export { FitStage }
