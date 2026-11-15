#!/usr/bin/env node
/*
 * Sadu performance harness. Real Chrome through Playwright, CPU throttled through CDP.
 *
 *   npm run perf                          build production, preview it, run everything at 1x and 4x
 *   npm run perf -- --url http://localhost:5191 --rates 4 --only "rug|dialog"
 *   npm run perf -- --out after.json --compare before.json
 *
 * Flags: --url <origin> (skip the build), --rates 1,4, --only <regex>, --skip <regex>,
 *        --sections load,scroll,components,settings,routes,galleries,loom,memory,forced
 *        --repeat <n> (median of n runs per interaction scenario), --out <file.json>, --compare <file.json>
 */
import { chromium } from "@playwright/test"
import { readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { installProbes } from "./instrument.mjs"
import { COMPONENTS, POPUP_CYCLES, RESIZABLE, SETTINGS } from "./scenarios.mjs"
import { printComparison, printTables, TARGETS } from "./report.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const VIEWPORT = { width: 1280, height: 900 }
const ALL_SECTIONS = ["load", "scroll", "components", "settings", "resizable", "routes", "galleries", "loom", "memory", "forced"]
const GALLERIES = ["overlays", "menus", "inputs", "pickers", "display"]
const ROUTE_SAMPLE = ["rug", "sadu-dialog", "sadu-carousel", "sadu-calendar", "sadu-color-picker", "beam-resizable"]

function parseArgs(argv) {
  const args = { rates: [1, 4], sections: ALL_SECTIONS, repeat: 1 }
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index]
    const value = argv[index + 1]
    if (flag === "--url") args.url = value.replace(/\/$/, "")
    else if (flag === "--rates") args.rates = value.split(",").map(Number)
    else if (flag === "--only") args.only = new RegExp(value)
    else if (flag === "--skip") args.skip = new RegExp(value)
    else if (flag === "--sections") args.sections = value.split(",")
    else if (flag === "--out") args.out = resolve(value)
    else if (flag === "--compare") args.compare = resolve(value)
    else if (flag === "--repeat") args.repeat = Number(value)
    else continue
    index++
  }
  return args
}

async function serveProduction() {
  const { build, preview } = await import("vite")
  const outDir = join(ROOT, "node_modules/.cache/sadu-perf/dist")
  await build({ root: ROOT, logLevel: "error", build: { outDir, emptyOutDir: true, chunkSizeWarningLimit: Infinity } })
  const server = await preview({ root: ROOT, logLevel: "error", build: { outDir }, preview: { port: 0, host: "127.0.0.1" } })
  const origin = server.resolvedUrls.local[0].replace(/\/$/, "")
  return { origin, close: () => server.httpServer.close() }
}

const percentile = (values, p) => {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]
}
const round = (value) => Math.round(value * 10) / 10

async function nextFrame(page) {
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => setTimeout(done, 0))))
}

async function metrics(cdp) {
  const { metrics: list } = await cdp.send("Performance.getMetrics")
  return Object.fromEntries(list.map((metric) => [metric.name, metric.value]))
}

function helpers(page) {
  const h = { page, interactions: 0 }
  h.settle = async () => {
    await nextFrame(page)
    await nextFrame(page)
    await page.waitForTimeout(80)
  }
  h.wait = (ms) => page.waitForTimeout(ms)
  h.click = async (locator) => {
    if (await locator.isDisabled({ timeout: 5000 })) return
    await locator.click({ timeout: 5000 })
    h.interactions++
    await h.settle()
  }
  h.press = async (key, times = 1) => {
    for (let index = 0; index < times; index++) {
      await page.keyboard.press(key)
      h.interactions++
      await nextFrame(page)
      await page.waitForTimeout(40)
    }
    await h.settle()
  }
  h.typeKeys = async (text) => {
    await page.keyboard.type(text, { delay: 60 })
    h.interactions += text.length
    await h.settle()
  }
  h.type = async (locator, text) => {
    await h.click(locator)
    if (text) await h.typeKeys(text)
  }
  h.focus = async (locator) => {
    await locator.focus({ timeout: 5000 })
    await h.settle()
  }
  h.escape = async () => {
    await page.keyboard.press("Escape")
    h.interactions++
    await h.settle()
    await page.waitForTimeout(250)
  }
  h.hover = async (locator) => {
    await locator.hover({ timeout: 5000 })
    await h.settle()
  }
  h.leave = async () => {
    await page.mouse.move(2, VIEWPORT.height - 2)
    await h.settle()
  }
  const point = async (locator, from) => {
    const box = await locator.boundingBox({ timeout: 5000 })
    if (!box) throw new Error("drag target has no box")
    const [fx, fy] = Array.isArray(from) ? from : [from ?? 0.5, 0.5]
    return { box, x: box.x + box.width * fx, y: box.y + box.height * fy }
  }
  const stroke = async (start, end, steps) => {
    await page.mouse.move(start.x, start.y)
    await page.mouse.down()
    h.interactions++
    for (let step = 1; step <= steps; step++) {
      await page.mouse.move(start.x + ((end.x - start.x) * step) / steps, start.y + ((end.y - start.y) * step) / steps)
      await nextFrame(page)
    }
    await page.mouse.up()
    await h.settle()
  }
  h.drag = async (locator, { from, dx = 0, dy = 0, dxPx, dyPx, steps = 30 }) => {
    await locator.scrollIntoViewIfNeeded({ timeout: 5000 })
    const start = await point(locator, from)
    const end = { x: start.x + (dxPx ?? dx * start.box.width), y: start.y + (dyPx ?? dy * start.box.height) }
    await stroke(start, end, steps)
  }
  h.dragBetween = async (fromLocator, toLocator, steps = 30) => {
    await stroke(await point(fromLocator), await point(toLocator), steps)
  }
  h.glide = async (from, to, steps, lift = true) => {
    if (lift) await page.mouse.move(from.x, from.y)
    for (let step = 1; step <= steps; step++) {
      await page.mouse.move(from.x + ((to.x - from.x) * step) / steps, from.y + ((to.y - from.y) * step) / steps)
      await nextFrame(page)
    }
  }
  h.wheel = async (locator, deltaY, times) => {
    await locator.hover({ timeout: 5000 })
    for (let index = 0; index < times; index++) {
      await page.mouse.wheel(0, deltaY)
      await nextFrame(page)
    }
    await h.settle()
  }
  return h
}

async function openPage(browser, rate, origin, path = "/") {
  const context = await browser.newContext({ viewport: VIEWPORT })
  await context.addInitScript(installProbes)
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send("Performance.enable")
  await cdp.send("Emulation.setCPUThrottlingRate", { rate })
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto(origin + path, { waitUntil: "load" })
  return { context, page, cdp, errors }
}

async function quiet(page, rate, ms = 600) {
  await page.waitForTimeout(ms * Math.max(1, rate / 2))
  await nextFrame(page)
}

async function measure(session, scenario, rate) {
  const { page, cdp } = session
  const h = helpers(page)
  const before = await metrics(cdp)
  const t0 = await page.evaluate(() => {
    window.__perf.moves = []
    window.__perf.startFrames()
    return performance.now()
  })
  let error
  try {
    await scenario.run(h)
  } catch (caught) {
    error = String(caught.message ?? caught).split("\n")[0].slice(0, 160)
  }
  await page.waitForTimeout(300)
  const probe = await page.evaluate((start) => {
    const perf = window.__perf
    perf.stopFrames()
    return {
      longTasks: perf.longTasks.filter((task) => task.start >= start).map((task) => task.duration),
      events: perf.events.filter((event) => event.start >= start),
      frames: perf.frames.map((frame) => frame.delta),
      moves: perf.moves,
    }
  }, t0)
  const after = await metrics(cdp)
  const byInteraction = new Map()
  for (const event of probe.events) {
    if (!event.interactionId) continue
    byInteraction.set(event.interactionId, Math.max(byInteraction.get(event.interactionId) ?? 0, event.duration))
  }
  const latencies = [...byInteraction.values()]
  while (latencies.length < h.interactions) latencies.push(0)
  const worstEvent = probe.events.reduce((worst, event) => (event.duration > worst.duration ? event : worst), { duration: 0, name: "" })
  const frames = probe.frames
  return {
    name: scenario.name,
    group: scenario.group,
    kind: scenario.kind,
    rate,
    error,
    interactions: h.interactions,
    reported: byInteraction.size,
    latencyP98: round(percentile(latencies, 98)),
    latencyMax: round(Math.max(0, ...latencies)),
    worstEvent: round(worstEvent.duration),
    worstEventName: worstEvent.name,
    longTaskMax: round(Math.max(0, ...probe.longTasks)),
    longTasks: probe.longTasks.filter((duration) => duration > 50).length,
    frameP95: round(percentile(frames, 95)),
    frameMax: round(Math.max(0, ...frames)),
    framesOver50: frames.filter((delta) => delta > 50).length,
    frameCount: frames.length,
    moveP98: round(percentile(probe.moves, 98)),
    layouts: after.LayoutCount - before.LayoutCount,
    styleRecalcs: after.RecalcStyleCount - before.RecalcStyleCount,
    layoutMs: round((after.LayoutDuration - before.LayoutDuration) * 1000),
    styleMs: round((after.RecalcStyleDuration - before.RecalcStyleDuration) * 1000),
    scriptMs: round((after.ScriptDuration - before.ScriptDuration) * 1000),
  }
}

/* Median of every numeric metric over the runs that completed; a scenario that cannot repeat keeps its first run. */
function medianRow(runs) {
  const usable = runs.filter((run) => !run.error)
  if (usable.length <= 1) return usable[0] ?? runs[0]
  const row = { ...usable[0], runs: usable.length }
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === "number" && key !== "rate") row[key] = round(percentile(usable.map((run) => run[key]), 50))
  }
  return row
}

async function cleanup(page) {
  await page.keyboard.press("Escape").catch(() => {})
  await page.keyboard.press("Escape").catch(() => {})
  await page.mouse.move(2, VIEWPORT.height - 2).catch(() => {})
}

async function focusCard(page, id, rate) {
  await page.locator(`article[data-id="${id}"]`).evaluate((node) => node.scrollIntoView({ block: "center" }))
  await quiet(page, rate, 700)
}

async function loadHome(browser, rate, origin) {
  const runs = []
  for (let attempt = 0; attempt < 3; attempt++) {
    const session = await openPage(browser, rate, origin)
    const { page, cdp } = session
    await page.waitForSelector("article.catalog-card", { timeout: 60_000 })
    await page.waitForTimeout(4000 + rate * 500)
    await cdp.send("HeapProfiler.collectGarbage")
    const counters = await metrics(cdp)
    const result = await page.evaluate(() => {
      const perf = window.__perf
      const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0
      const lcpEntries = performance.getEntriesByType("largest-contentful-paint")
      const tasks = perf.longTasks
      return {
        fcp,
        lcp: lcpEntries.at(-1)?.startTime ?? fcp,
        tbt: tasks.filter((task) => task.start >= fcp).reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0),
        tbtTotal: tasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0),
        longTaskMax: Math.max(0, ...tasks.map((task) => task.duration)),
        longTasks: tasks.filter((task) => task.duration > 50).length,
        domNodes: document.getElementsByTagName("*").length,
        svgElements: document.querySelectorAll("svg, svg *").length,
        runningAnimations: document.getAnimations().filter((animation) => animation.playState === "running").length,
      }
    })
    runs.push({ ...result, heapMB: counters.JSHeapUsedSize / 1e6, nodes: counters.Nodes, layouts: counters.LayoutCount, styleRecalcs: counters.RecalcStyleCount })
    await session.context.close()
  }
  const median = (key) => percentile(runs.map((run) => run[key]), 50)
  const keys = Object.keys(runs[0])
  return { name: "home page load", group: "page", kind: "load", rate, ...Object.fromEntries(keys.map((key) => [key, round(median(key))])) }
}

async function scrollHome(session, rate) {
  return measure(
    session,
    {
      name: "home page full scroll",
      group: "page",
      kind: "drag",
      run: async (h) => {
        await h.page.mouse.move(640, 500)
        const height = await h.page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
        for (let travelled = 0; travelled < height; travelled += 120) {
          await h.page.mouse.wheel(0, 120)
          await nextFrame(h.page)
        }
        await h.settle()
      },
    },
    rate,
  )
}

async function routeChanges(browser, rate, origin) {
  const session = await openPage(browser, rate, origin)
  const { page } = session
  await page.waitForSelector("article.catalog-card")
  await quiet(page, rate, 2500)
  const navigate = (hash) =>
    page.evaluate(
      (target) =>
        new Promise((done) => {
          const start = performance.now()
          location.hash = target
          const ready = () => {
            const settled = target === "#/" ? document.querySelector("article.catalog-card") : document.querySelector('.site[data-page="component"] h1')
            if (!settled) return requestAnimationFrame(ready)
            requestAnimationFrame(() => setTimeout(() => done(performance.now() - start), 0))
          }
          requestAnimationFrame(ready)
        }),
      hash,
    )
  const toDetail = []
  const toHome = []
  for (const id of ROUTE_SAMPLE) {
    toDetail.push(await navigate(`#/c/${id}`))
    await quiet(page, rate, 400)
    toHome.push(await navigate("#/"))
    await quiet(page, rate, 1200)
  }
  const ids = await page.evaluate(() => [...document.querySelectorAll("article.catalog-card")].map((node) => node.dataset.id))
  const detailToDetail = []
  await navigate(`#/c/${ids[0]}`)
  for (const id of ids.slice(1)) {
    detailToDetail.push({ id, ms: await navigate(`#/c/${id}`) })
    await page.waitForTimeout(150)
  }
  const tasks = await page.evaluate(() => window.__perf.longTasks.map((task) => task.duration))
  await session.context.close()
  const worst = detailToDetail.reduce((top, entry) => (entry.ms > top.ms ? entry : top), { ms: 0 })
  return [
    { name: "route home -> detail", group: "page", kind: "route", rate, latencyP98: round(percentile(toDetail, 98)), latencyMax: round(Math.max(...toDetail)) },
    { name: "route detail -> home", group: "page", kind: "route", rate, latencyP98: round(percentile(toHome, 98)), latencyMax: round(Math.max(...toHome)) },
    {
      name: "route detail -> detail (all 56)",
      group: "page",
      kind: "route",
      rate,
      latencyP98: round(percentile(detailToDetail.map((entry) => entry.ms), 98)),
      latencyMax: round(worst.ms),
      note: `slowest ${worst.id}`,
      longTaskMax: round(Math.max(0, ...tasks)),
    },
  ]
}

async function loadGalleries(browser, rate, origin) {
  const rows = []
  for (const gallery of GALLERIES) {
    const session = await openPage(browser, rate, origin, `/?gallery=${gallery}`)
    await session.page.waitForTimeout(3000 + rate * 400)
    const result = await session.page.evaluate(() => ({
      tasks: window.__perf.longTasks.map((task) => task.duration),
      domNodes: document.getElementsByTagName("*").length,
    }))
    rows.push({
      name: `gallery ${gallery} load`,
      group: "page",
      kind: "load",
      rate,
      tbtTotal: round(result.tasks.reduce((sum, duration) => sum + Math.max(0, duration - 50), 0)),
      longTaskMax: round(Math.max(0, ...result.tasks)),
      domNodes: result.domNodes,
    })
    await session.context.close()
  }
  return rows
}

async function loomLoop(browser, rate, origin) {
  const session = await openPage(browser, rate, origin, "/#/loom")
  await session.page.waitForTimeout(2500)
  const exists = await session.page.locator(".showcase-page").count()
  if (!exists) {
    await session.context.close()
    return { name: "loom page loop (20s)", group: "page", kind: "animation", rate, note: "no #/loom route in this build" }
  }
  const row = await measure(session, { name: "loom page loop (20s)", group: "page", kind: "animation", run: (h) => h.wait(20_000) }, rate)
  await session.context.close()
  return row
}

async function memoryCycles(browser, origin) {
  const session = await openPage(browser, 1, origin)
  const { page, cdp } = session
  await page.waitForSelector("article.catalog-card")
  await quiet(page, 1, 2500)
  const rows = []
  const h = helpers(page)
  const cycle = async (trigger) => {
    await trigger.click({ timeout: 5000 })
    await page.waitForTimeout(120)
    await page.keyboard.press("Escape")
    await page.waitForTimeout(220)
  }
  const sample = async () => {
    await cdp.send("HeapProfiler.collectGarbage")
    await cdp.send("HeapProfiler.collectGarbage")
    const counters = await metrics(cdp)
    return { heap: counters.JSHeapUsedSize / 1e6, nodes: counters.Nodes, listeners: counters.JSEventListeners }
  }
  for (const [id, triggerOf] of POPUP_CYCLES) {
    try {
      await focusCard(page, id, 1)
      const trigger = triggerOf(h)
      for (let index = 0; index < 5; index++) await cycle(trigger)
      const start = await sample()
      for (let index = 0; index < 50; index++) await cycle(trigger)
      const end = await sample()
      rows.push({
        name: `${id} x50 open/close`,
        group: "memory",
        kind: "memory",
        rate: 1,
        heapDeltaMB: round(end.heap - start.heap),
        nodeDelta: end.nodes - start.nodes,
        listenerDelta: end.listeners - start.listeners,
      })
    } catch (caught) {
      rows.push({ name: `${id} x50 open/close`, group: "memory", kind: "memory", rate: 1, error: String(caught.message).split("\n")[0] })
    }
    await cleanup(page)
  }
  await session.context.close()
  return rows
}

const LOOP_EVENTS = new Set(["pointermove", "mousemove", "wheel", "scroll", "touchmove"])
const FORCED_PARENTS = new Set(["EventDispatch", "FireAnimationFrame", "TimerFire", "FunctionCall", "v8.callFunction", "FireIdleCallback"])

async function forcedLayouts(browser, origin, scenarios) {
  const session = await openPage(browser, 1, origin)
  const { page, cdp } = session
  await page.waitForSelector("article.catalog-card")
  await quiet(page, 1, 2500)
  const rows = []
  for (const scenario of scenarios) {
    await focusCard(page, scenario.card, 1)
    const events = []
    const collect = (data) => events.push(...data.value)
    cdp.on("Tracing.dataCollected", collect)
    const complete = new Promise((done) => cdp.once("Tracing.tracingComplete", done))
    await cdp.send("Tracing.start", { categories: "devtools.timeline,disabled-by-default-devtools.timeline", transferMode: "ReportEvents" })
    let error
    try {
      await scenario.run(helpers(page))
    } catch (caught) {
      error = String(caught.message).split("\n")[0]
    }
    await cdp.send("Tracing.end")
    await complete
    cdp.off("Tracing.dataCollected", collect)
    await cleanup(page)
    const main = events.find((event) => event.name === "thread_name" && event.args?.name === "CrRendererMain")
    const own = events.filter((event) => event.ph === "X" && event.dur && main && event.pid === main.pid && event.tid === main.tid)
    const parents = own.filter((event) => FORCED_PARENTS.has(event.name))
    const loops = own.filter((event) => event.name === "FireAnimationFrame" || (event.name === "EventDispatch" && LOOP_EVENTS.has(event.args?.data?.type)))
    const inside = (event, list) => list.some((parent) => parent.ts <= event.ts && parent.ts + parent.dur >= event.ts + event.dur)
    const scripts = own.filter((event) => event.name === "FunctionCall")
    const innermostScript = (event) =>
      scripts.filter((call) => call.ts <= event.ts && call.ts + call.dur >= event.ts + event.dur).sort((a, b) => b.ts - a.ts)[0]
    const fromApp = (event) => innermostScript(event)?.args?.data?.url?.startsWith(origin) ?? false
    const forced = own.filter(
      (event) => (event.name === "Layout" || event.name === "UpdateLayoutTree") && inside(event, parents) && fromApp(event),
    )
    const inLoops = forced.filter((event) => inside(event, loops))
    const frames = own.filter((event) => event.name === "FireAnimationFrame").length
    rows.push({
      name: scenario.name,
      group: "forced",
      kind: scenario.kind,
      rate: 1,
      error,
      forcedLayouts: forced.filter((event) => event.name === "Layout").length,
      forcedStyles: forced.filter((event) => event.name === "UpdateLayoutTree").length,
      forcedMs: round(forced.reduce((sum, event) => sum + event.dur, 0) / 1000),
      forcedInLoops: inLoops.length,
      forcedInLoopsMs: round(inLoops.reduce((sum, event) => sum + event.dur, 0) / 1000),
      animationFrames: frames,
    })
  }
  await session.context.close()
  return rows
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const served = args.url ? { origin: args.url, close: () => {} } : await serveProduction()
  const wanted = (name) => (!args.only || args.only.test(name)) && !(args.skip && args.skip.test(name))
  const has = (section) => args.sections.includes(section)
  const browser = await chromium.launch({ channel: "chrome", headless: true })
  const rows = []
  const log = (row) => {
    rows.push(row)
    process.stderr.write(`  ${row.rate}x ${row.name}${row.error ? `  ERROR ${row.error}` : ""}\n`)
  }
  try {
    for (const rate of args.rates) {
      process.stderr.write(`\n${served.origin} @ ${rate}x CPU\n`)
      if (has("load") && wanted("home page load")) log(await loadHome(browser, rate, served.origin))
      const scenarios = [...(has("components") ? COMPONENTS : []), ...(has("settings") ? SETTINGS : [])].filter((scenario) => wanted(scenario.name))
      if ((has("scroll") && wanted("home page full scroll")) || scenarios.length) {
        const session = await openPage(browser, rate, served.origin)
        await session.page.waitForSelector("article.catalog-card", { timeout: 60_000 })
        await quiet(session.page, rate, 2500)
        if (has("scroll") && wanted("home page full scroll")) {
          log(await scrollHome(session, rate))
          await session.page.evaluate(() => scrollTo(0, 0))
          await quiet(session.page, rate)
        }
        for (const scenario of scenarios) {
          const runs = []
          for (let attempt = 0; attempt < args.repeat; attempt++) {
            if (scenario.card) await focusCard(session.page, scenario.card, rate)
            else await session.page.evaluate(() => scrollTo(0, 0))
            runs.push(await measure(session, scenario, rate))
            await cleanup(session.page)
          }
          log(medianRow(runs))
        }
        if (session.errors.length) process.stderr.write(`  page errors: ${[...new Set(session.errors)].join(" | ")}\n`)
        await session.context.close()
      }
      if (has("resizable")) {
        const byPath = Map.groupBy(RESIZABLE.filter((scenario) => wanted(scenario.name)), (scenario) => scenario.path)
        for (const [path, scenarios] of byPath) {
          const session = await openPage(browser, rate, served.origin, path)
          await session.page.waitForSelector('[data-slot="resizable-handle"]', { timeout: 60_000 })
          await quiet(session.page, rate, 2500)
          for (const scenario of scenarios) {
            const runs = []
            for (let attempt = 0; attempt < args.repeat; attempt++) {
              await session.page.mouse.move(2, VIEWPORT.height - 2)
              await scenario.prepare?.(helpers(session.page))
              await quiet(session.page, rate, 700)
              runs.push(await measure(session, scenario, rate))
              await cleanup(session.page)
            }
            log(medianRow(runs))
          }
          await session.context.close()
        }
      }
      if (has("routes") && wanted("route")) for (const row of await routeChanges(browser, rate, served.origin)) log(row)
      if (has("galleries") && wanted("gallery")) for (const row of await loadGalleries(browser, rate, served.origin)) log(row)
      if (has("loom") && wanted("loom page loop (20s)")) log(await loomLoop(browser, rate, served.origin))
    }
    if (has("memory") && wanted("memory")) for (const row of await memoryCycles(browser, served.origin)) log(row)
    if (has("forced")) {
      const motion = COMPONENTS.filter((scenario) => scenario.kind !== "interact" && wanted(scenario.name))
      for (const row of await forcedLayouts(browser, served.origin, motion)) log(row)
    }
  } finally {
    await browser.close()
    served.close()
  }
  const out = args.out ?? join(tmpdir(), `sadu-perf-${Date.now()}.json`)
  writeFileSync(out, JSON.stringify({ origin: served.origin, at: new Date().toISOString(), targets: TARGETS, rows }, null, 1))
  printTables(rows)
  if (args.compare) printComparison(JSON.parse(readFileSync(args.compare, "utf8")).rows, rows)
  process.stderr.write(`\nresults: ${out}\n`)
}

await main()
