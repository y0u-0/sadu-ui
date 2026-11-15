/*
 * rAF deltas carry ~0.5ms of timer jitter around the 16.67ms vsync, so a frame budget is
 * judged with JITTER of slack; a dropped frame shows up as a whole extra vsync interval.
 */
const JITTER = 0.8

const TARGETS = {
  latencyP98: 100,
  latencyMax: 200,
  longTask: 50,
  frameP95: { 1: 16.7, 4: 33.3 },
  frameMax: 50,
  tbt4x: 200,
  rethemeMs1x: 100,
  heapDeltaMB: 1,
  nodeDelta: 100,
}

const pad = (value, width) => String(value ?? "").padStart(width)
const cell = (value) => (value === undefined || value === null || Number.isNaN(value) ? "-" : value)

function misses(row) {
  const out = []
  if (row.kind === "memory") {
    if (row.heapDeltaMB > TARGETS.heapDeltaMB) out.push("heap")
    if (row.nodeDelta > TARGETS.nodeDelta) out.push("nodes")
    return out
  }
  if (row.kind === "load") {
    if (row.rate === 4 && (row.tbtTotal ?? row.tbt) > TARGETS.tbt4x) out.push("tbt")
    return out
  }
  if (row.kind === "route") {
    if (row.latencyMax > TARGETS.latencyMax) out.push("route")
    return out
  }
  if (row.group === "forced") {
    if (row.forcedInLoops > 0) out.push("thrash-in-loop")
    return out
  }
  if (row.latencyP98 > TARGETS.latencyP98) out.push("p98")
  if (row.latencyMax > TARGETS.latencyMax) out.push("max")
  if (row.longTaskMax > TARGETS.longTask) out.push("longtask")
  if (row.kind !== "interact") {
    const budget = TARGETS.frameP95[row.rate] ?? TARGETS.frameP95[4]
    if (row.frameP95 > budget + JITTER) out.push("p95frame")
    if (row.frameMax > TARGETS.frameMax) out.push("frame>50")
  }
  if (row.name.startsWith("top-bar dye") && row.rate === 1 && row.latencyMax > TARGETS.rethemeMs1x) out.push("retheme")
  return out
}

const COLUMNS = {
  interaction: [
    ["lat p98", (row) => row.latencyP98],
    ["lat max", (row) => row.latencyMax],
    ["worst LT", (row) => row.longTaskMax],
    ["#LT>50", (row) => row.longTasks],
    ["frm p95", (row) => row.frameP95],
    ["frm max", (row) => row.frameMax],
    ["#frm>50", (row) => row.framesOver50],
    ["move p98", (row) => row.moveP98],
    ["layouts", (row) => row.layouts],
    ["style ms", (row) => row.styleMs],
    ["layout ms", (row) => row.layoutMs],
    ["script ms", (row) => row.scriptMs],
  ],
  load: [
    ["FCP", (row) => row.fcp],
    ["LCP", (row) => row.lcp],
    ["TBT", (row) => row.tbtTotal],
    ["TBT>FCP", (row) => row.tbt],
    ["worst LT", (row) => row.longTaskMax],
    ["#LT>50", (row) => row.longTasks],
    ["DOM", (row) => row.domNodes],
    ["SVG els", (row) => row.svgElements],
    ["heap MB", (row) => row.heapMB],
    ["anims", (row) => row.runningAnimations],
  ],
  route: [
    ["p98 ms", (row) => row.latencyP98],
    ["max ms", (row) => row.latencyMax],
    ["worst LT", (row) => row.longTaskMax],
    ["note", (row) => row.note],
  ],
  memory: [
    ["heap dMB", (row) => row.heapDeltaMB],
    ["nodes d", (row) => row.nodeDelta],
    ["listeners d", (row) => row.listenerDelta],
  ],
  forced: [
    ["forced layout", (row) => row.forcedLayouts],
    ["forced style", (row) => row.forcedStyles],
    ["forced ms", (row) => row.forcedMs],
    ["in rAF/move", (row) => row.forcedInLoops],
    ["in loop ms", (row) => row.forcedInLoopsMs],
    ["rAF", (row) => row.animationFrames],
  ],
}

function columnsOf(row) {
  if (row.group === "forced") return COLUMNS.forced
  if (row.kind === "memory") return COLUMNS.memory
  if (row.kind === "load") return COLUMNS.load
  if (row.kind === "route") return COLUMNS.route
  return COLUMNS.interaction
}

function printSection(title, rows) {
  if (!rows.length) return
  const columns = columnsOf(rows[0])
  const nameWidth = Math.max(28, ...rows.map((row) => row.name.length + 1))
  const header = `${"scenario".padEnd(nameWidth)}${pad("cpu", 4)}${columns.map(([label]) => pad(label, Math.max(9, label.length + 1))).join("")}  status`
  console.log(`\n${title}\n${header}\n${"-".repeat(header.length + 10)}`)
  for (const row of rows) {
    const values = columns.map(([label, read]) => pad(cell(read(row)), Math.max(9, label.length + 1))).join("")
    const flags = row.error ? `ERROR ${row.error}` : misses(row).join(",") || "ok"
    console.log(`${row.name.padEnd(nameWidth)}${pad(`${row.rate}x`, 4)}${values}  ${flags}`)
  }
}

function printTables(rows) {
  const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name) || a.rate - b.rate)
  printSection("PAGES: load", rows.filter((row) => row.kind === "load"))
  printSection("PAGES: routes", rows.filter((row) => row.kind === "route"))
  printSection(
    "PAGES: scroll, settings, loom",
    rows.filter((row) => row.group === "page" && !["load", "route"].includes(row.kind)),
  )
  printSection("COMPONENTS (on the live home page)", sorted.filter((row) => row.group === "component"))
  printSection("RESIZABLE (hover, drag, keys in each place it lives)", rows.filter((row) => row.group === "resizable"))
  printSection("MEMORY (50 open/close cycles, after GC)", rows.filter((row) => row.group === "memory"))
  printSection("FORCED LAYOUT by page scripts in event handlers / rAF (traced, 1x)", rows.filter((row) => row.group === "forced"))
  const failing = rows.filter((row) => row.error || misses(row).length)
  console.log(`\n${rows.length - failing.length}/${rows.length} rows on target`)
}

const COMPARE = [
  ["lat p98", "latencyP98"],
  ["worst LT", "longTaskMax"],
  ["frm p95", "frameP95"],
  ["frm max", "frameMax"],
  ["TBT", "tbtTotal"],
  ["DOM", "domNodes"],
  ["forced", "forcedMs"],
  ["heap dMB", "heapDeltaMB"],
]

function printComparison(before, after) {
  const key = (row) => `${row.group}|${row.name}|${row.rate}`
  const earlier = new Map(before.map((row) => [key(row), row]))
  const nameWidth = Math.max(28, ...after.map((row) => row.name.length + 1))
  const header = `${"scenario".padEnd(nameWidth)}${pad("cpu", 4)}${COMPARE.map(([label]) => pad(label, 18)).join("")}`
  console.log(`\nBEFORE -> AFTER\n${header}\n${"-".repeat(header.length)}`)
  for (const row of after) {
    const old = earlier.get(key(row))
    if (!old) continue
    const values = COMPARE.map(([, field]) => {
      if (row[field] === undefined && old[field] === undefined) return pad("", 18)
      return pad(`${cell(old[field])} -> ${cell(row[field])}`, 18)
    })
    console.log(`${row.name.padEnd(nameWidth)}${pad(`${row.rate}x`, 4)}${values.join("")}`)
  }
}

export { TARGETS, misses, printComparison, printTables }
