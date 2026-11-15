/* In-page probes, installed with page.addInitScript before any app code runs. */
export function installProbes() {
  const probe = {
    longTasks: [],
    events: [],
    frames: [],
    moves: [],
    sampling: false,
    lastFrame: 0,
  }
  Object.defineProperty(window, "__perf", { value: probe })

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) probe.longTasks.push({ start: entry.startTime, duration: entry.duration })
  }).observe({ type: "longtask", buffered: true })

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      probe.events.push({
        name: entry.name,
        start: entry.startTime,
        duration: entry.duration,
        interactionId: entry.interactionId ?? 0,
        input: entry.processingStart - entry.startTime,
        processing: entry.processingEnd - entry.processingStart,
      })
    }
  }).observe({ type: "event", durationThreshold: 16, buffered: true })

  const tick = (now) => {
    if (!probe.sampling) return
    if (probe.lastFrame) probe.frames.push({ at: now, delta: now - probe.lastFrame })
    probe.lastFrame = now
    requestAnimationFrame(tick)
  }
  probe.startFrames = () => {
    probe.frames = []
    probe.lastFrame = 0
    if (probe.sampling) return
    probe.sampling = true
    requestAnimationFrame(tick)
  }
  probe.stopFrames = () => {
    probe.sampling = false
  }

  addEventListener(
    "pointermove",
    (event) => {
      if (!probe.sampling) return
      const issued = event.timeStamp
      requestAnimationFrame(() => setTimeout(() => probe.moves.push(performance.now() - issued), 0))
    },
    { capture: true, passive: true },
  )
}
