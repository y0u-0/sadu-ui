import { expect, test, type Locator, type Page } from "@playwright/test"

const GALLERY = "/?gallery=display"

let problems: string[] = []
let allowResourceErrors = false

test.beforeEach(async ({ page }) => {
  problems = []
  allowResourceErrors = false
  page.on("console", (message) => {
    if (message.type() !== "error" && message.type() !== "warning") return
    if (allowResourceErrors && message.text().startsWith("Failed to load resource")) return
    problems.push(`${message.type()}: ${message.text()}`)
  })
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`))
})

test.afterEach(() => {
  expect(problems).toEqual([])
})

function card(page: Page, name: string): Locator {
  return page.locator(".gallery-card").filter({ has: page.locator(".gallery-card__name", { hasText: new RegExp(`^${name}$`) }) })
}

async function openGallery(page: Page): Promise<void> {
  await page.goto(GALLERY)
  await expect(card(page, "Waterfall")).toBeVisible()
}

async function box(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  const rect = await locator.boundingBox()
  if (!rect) throw new Error("element has no box")
  return rect
}

test.describe("Avatar", () => {
  test("woven marks lead, the workshop photo loads locally, the group counts the rest", async ({ page }) => {
    const requests: string[] = []
    page.on("request", (request) => requests.push(request.url()))
    await openGallery(page)
    const avatars = card(page, "Avatar")
    const photo = avatars.getByRole("img", { name: "Sadu House" })
    await expect(photo).toHaveAttribute("data-loading-status", "loaded")
    expect(await photo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
    expect(requests.filter((url) => !url.startsWith("http://localhost"))).toEqual([])
    await expect(avatars.locator(".sadu-avatar__wasm")).toHaveCount(5)
    const group = avatars.getByRole("group", { name: "Weavers on order 14" })
    await expect(group.locator(".sadu-avatar")).toHaveCount(4)
    await expect(group.locator(".sadu-avatar-group__more")).toHaveText("+2and 2 more")
  })

  test("offline, the photo falls back to its woven mark", async ({ page }) => {
    allowResourceErrors = true
    await page.route("**/*.jpg", (route) => route.abort())
    await openGallery(page)
    const avatars = card(page, "Avatar")
    await expect(avatars.locator('.sadu-avatar[data-loading-status="error"]')).toHaveCount(1)
    await expect(avatars.locator('.sadu-avatar[data-loading-status="error"] .sadu-avatar__wasm svg')).toBeVisible()
  })

  test("right to left keeps the overflow count reading +2", async ({ page }) => {
    await openGallery(page)
    await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"))
    const more = card(page, "Avatar").locator(".sadu-avatar-group__more > [dir='ltr']")
    await expect(more).toHaveText("+2")
    const box = await more.evaluate((node) => {
      const at = (text: Node): number => {
        const range = document.createRange()
        range.selectNodeContents(text)
        return range.getBoundingClientRect().left
      }
      return { plus: at(node.firstChild!), two: at(node.lastChild!) }
    })
    expect(box.plus).toBeLessThan(box.two)
  })
})

test("Separator: semantic rules are announced, the labelled one is decorative", async ({ page }) => {
  await openGallery(page)
  const separators = card(page, "Separator")
  await expect(separators.getByRole("separator")).toHaveCount(4)
  await expect(separators.getByRole("separator", { includeHidden: false }).last()).toHaveAttribute("aria-orientation", "vertical")
  await expect(separators.locator('.sadu-separator[role="none"]')).toHaveText("or")
  const cord = separators.locator('.sadu-separator[data-variant="cord"]')
  expect((await box(cord)).height).toBe(4)
})

test.describe("Progress", () => {
  test("beating in rows completes the cloth, and reset takes it back", async ({ page }) => {
    await openGallery(page)
    const stage = card(page, "Progress")
    const bar = stage.getByRole("progressbar", { name: "Weaving order 14" })
    await expect(bar).toHaveAttribute("aria-valuenow", "46")
    await expect(bar).toHaveAttribute("aria-valuetext", "46 of 96 rows")
    const beat = stage.getByRole("button", { name: "Beat in 10 rows" })
    for (let press = 0; press < 8; press++) await beat.click()
    await expect(bar).toHaveAttribute("aria-valuenow", "96")
    await expect(bar).toHaveAttribute("data-complete")
    await expect(bar.locator(".sadu-progress__value")).toHaveText("96of 96 rows")
    await expect(bar.locator(".sadu-progress__value")).toHaveCSS("font-size", "20px")
    await expect(bar.locator(".sadu-progress__done")).toHaveCSS("opacity", "1")
    await expect(bar.locator(".sadu-progress__indicator .sadu-progress__beater")).toHaveCSS("opacity", "0")
    const track = await box(bar.locator(".sadu-progress__track"))
    const cloth = await box(bar.locator(".sadu-progress__cloth"))
    expect(Math.abs(cloth.width - track.width)).toBeLessThan(0.5)
    await stage.getByRole("button", { name: "Reset" }).click()
    await expect(bar).toHaveAttribute("aria-valuenow", "46")
    await expect(bar).not.toHaveAttribute("data-complete")
    await expect(bar.locator(".sadu-progress__indicator .sadu-progress__beater")).toHaveCSS("opacity", "1")
  })

  test("the cloth always ends on a whole float, for every value from 0 to max", async ({ page }) => {
    await openGallery(page)
    const bar = card(page, "Progress").getByRole("progressbar", { name: "Weaving order 14" })
    const results = await bar.evaluate((root) => {
      const indicator = root.querySelector<HTMLElement>(".sadu-progress__indicator")!
      const cloth = root.querySelector<HTMLElement>(".sadu-progress__cloth")!
      const beater = root.querySelector<HTMLElement>(".sadu-progress__indicator .sadu-progress__beater")!
      indicator.style.transition = "none"
      const out: { value: number; fill: number; cloth: number; beater: number }[] = []
      for (let value = 0; value <= 96; value++) {
        indicator.style.width = `${(value / 96) * 100}%`
        const fill = indicator.getBoundingClientRect().width
        const start = indicator.getBoundingClientRect().left
        out.push({ value, fill, cloth: cloth.getBoundingClientRect().width, beater: beater.getBoundingClientRect().left + 1 - start })
      }
      return out
    })
    for (const { fill, cloth, beater } of results) {
      expect(cloth % 6).toBeCloseTo(0, 3)
      expect(cloth).toBeLessThanOrEqual(fill + 0.01)
      expect(fill - cloth).toBeLessThan(6)
      expect(Math.abs(beater - cloth)).toBeLessThan(0.5)
    }
  })

  test("indeterminate: a woven window travels in whole floats", async ({ page }) => {
    await openGallery(page)
    const window = card(page, "Progress").getByRole("progressbar", { name: "Checking dye lot" }).locator(".sadu-progress__window")
    const read = (): Promise<number> =>
      window.evaluate((node) => {
        const match = getComputedStyle(node).clipPath.match(/([-\d.]+)px\)$/)
        return match ? Number(match[1]) : Number.NaN
      })
    const first = await read()
    await page.waitForTimeout(350)
    const second = await read()
    expect(first).not.toBe(second)
    for (const at of [first, second]) expect(at % 6).toBe(0)
  })

  async function reversals(bar: Locator): Promise<{ turns: number; travel: number; offFloat: number }> {
    return bar.evaluate(async (root) => {
      const track = root.querySelector<HTMLElement>(".sadu-progress__track")!
      const beater = root.querySelector<HTMLElement>(".sadu-progress__shuttle .sadu-progress__beater")!
      const window = root.querySelector<HTMLElement>(".sadu-progress__window")!
      const samples: number[] = []
      let offFloat = 0
      const rtl = getComputedStyle(root).direction === "rtl"
      const start = performance.now()
      while (performance.now() - start < 2000) {
        const box = track.getBoundingClientRect()
        const at = beater.getBoundingClientRect()
        samples.push(rtl ? box.right - at.right : at.left - box.left)
        const clip = getComputedStyle(window).clipPath.match(/([-\d.]+)px\)$/)
        if (clip && Number(clip[1]) % 6 !== 0) offFloat++
        await new Promise((resolve) => setTimeout(resolve, 40))
      }
      let turns = 0
      let heading = 0
      for (let index = 1; index < samples.length; index++) {
        const step = Math.sign(samples[index]! - samples[index - 1]!)
        if (step === 0) continue
        if (heading !== 0 && step !== heading) turns++
        heading = step
      }
      return { turns, travel: Math.max(...samples) - Math.min(...samples), offFloat }
    })
  }

  for (const theme of ["day", "tent", "rtl"] as const) {
    test(`indeterminate (${theme}): the beater shuttles end to end and turns back, forever`, async ({ page }) => {
      await openGallery(page)
      await page.evaluate((value) => {
        if (value === "rtl") document.documentElement.setAttribute("dir", "rtl")
        else document.documentElement.setAttribute("data-theme", value)
      }, theme)
      const bar = card(page, "Progress").getByRole("progressbar", { name: "Checking dye lot" })
      await expect(bar.locator(".sadu-progress__shuttle .sadu-progress__beater")).toBeVisible()
      const run = await reversals(bar)
      const track = await box(bar.locator(".sadu-progress__track"))
      expect(run.turns).toBeGreaterThanOrEqual(2)
      expect(run.travel).toBeGreaterThan(track.width - 80)
      expect(run.offFloat).toBe(0)
    })
  }

  test("the detail page's indeterminate knob runs the same shuttle", async ({ page }) => {
    await page.goto("/#/c/loom-progress")
    const visible = page.locator(":visible")
    await page.getByRole("switch", { name: "Indeterminate" }).and(visible).first().click()
    const bar = page.getByRole("progressbar", { name: "Weaving order 14" }).and(visible).first()
    await expect(bar).toHaveAttribute("data-indeterminate", "")
    expect((await reversals(bar)).turns).toBeGreaterThanOrEqual(2)
  })

  for (const mode of ["media", "attribute"] as const) {
    test(`reduced motion (${mode}) holds the window still and fills at once`, async ({ page }) => {
      if (mode === "media") await page.emulateMedia({ reducedMotion: "reduce" })
      await openGallery(page)
      if (mode === "attribute") await page.evaluate(() => document.documentElement.setAttribute("data-motion", "reduced"))
      await page.waitForTimeout(200)
      const stage = card(page, "Progress")
      const window = stage.getByRole("progressbar", { name: "Checking dye lot" }).locator(".sadu-progress__window")
      const beater = stage.getByRole("progressbar", { name: "Checking dye lot" }).locator(".sadu-progress__shuttle .sadu-progress__beater")
      const clip = (): Promise<string> => window.evaluate((node) => getComputedStyle(node).clipPath)
      const first = await clip()
      const resting = (await box(beater)).x
      await page.waitForTimeout(400)
      expect(await clip()).toBe(first)
      expect((await box(beater)).x).toBe(resting)
      const fade = await stage.getByRole("progressbar", { name: "Checking dye lot" }).locator(".sadu-progress__shuttle").evaluate((node) => getComputedStyle(node).animationName)
      expect(fade).toBe("sadu-progress-rest")
      const duration = await stage.locator(".sadu-progress__indicator").first().evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration))
      expect(duration).toBeLessThanOrEqual(0.001)
    })
  }
})

test("Meter: each reading states its meaning and fills its floats", async ({ page }) => {
  await openGallery(page)
  const stage = card(page, "Meter")
  const expectations = [
    { name: "Warp tension", text: "18 kg, even", zone: "optimum", filled: 12 },
    { name: "Spun wool", text: "3 of 20 skeins, low", zone: "low", filled: 3 },
    { name: "Orders booked", text: "19 of 20, overbooked", zone: "high", filled: 19 },
  ]
  const fills = new Set<string>()
  for (const { name, text, zone, filled } of expectations) {
    const meter = stage.getByRole("meter", { name })
    await expect(meter).toHaveAttribute("aria-valuetext", text)
    await expect(meter).toHaveAttribute("data-zone", zone)
    await expect(meter.getByText(text)).toBeVisible()
    await expect(meter.locator(".sadu-meter__float[data-filled]")).toHaveCount(filled)
    fills.add(await meter.locator(".sadu-meter__float[data-filled]").first().evaluate((node) => getComputedStyle(node).backgroundColor))
  }
  expect(fills.size).toBe(3)
})

test.describe("Scroll Area", () => {
  async function geometry(root: Locator): Promise<{ top: number; max: number; thumbTop: number; thumbBottom: number; thumbHeight: number; barTop: number; barBottom: number; ratio: number }> {
    return root.evaluate((node) => {
      const viewport = node.querySelector<HTMLElement>(".sadu-scroll__viewport")!
      const bar = node.querySelector<HTMLElement>(".sadu-scroll__bar")!.getBoundingClientRect()
      const thumb = node.querySelector<HTMLElement>(".sadu-scroll__thumb")!.getBoundingClientRect()
      return {
        top: viewport.scrollTop,
        max: viewport.scrollHeight - viewport.clientHeight,
        thumbTop: thumb.top - bar.top,
        thumbBottom: bar.bottom - thumb.bottom,
        thumbHeight: thumb.height,
        barTop: bar.top,
        barBottom: bar.bottom,
        ratio: viewport.clientHeight / viewport.scrollHeight,
      }
    })
  }

  test("wheel, thumb drag and keys all scroll, and the thumb tracks the view", async ({ page }) => {
    await openGallery(page)
    const root = card(page, "Scroll Area").locator(".sadu-scroll")
    const start = await geometry(root)
    expect(start.top).toBe(0)
    expect(start.thumbTop).toBeLessThan(1)
    expect(start.thumbHeight / (start.barBottom - start.barTop)).toBeCloseTo(start.ratio, 1)

    await root.hover()
    await page.mouse.wheel(0, 120)
    await expect.poll(async () => (await geometry(root)).top).toBeGreaterThan(0)
    expect((await geometry(root)).thumbTop).toBeGreaterThan(1)

    const thumb = await box(root.locator(".sadu-scroll__thumb"))
    await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2)
    await page.mouse.down()
    await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + 400, { steps: 6 })
    await expect(root.locator(".sadu-scroll__thumb")).toHaveAttribute("data-dragging", "")
    await page.mouse.up()
    const end = await geometry(root)
    expect(end.top).toBeCloseTo(end.max, 0)
    expect(end.thumbBottom).toBeLessThan(1)

    const viewport = root.getByRole("region", { name: "Orders this season" })
    await viewport.focus()
    await page.keyboard.press("Home")
    await expect.poll(async () => (await geometry(root)).top).toBe(0)
    await page.keyboard.press("End")
    await expect.poll(async () => (await geometry(root)).top).toBeCloseTo(end.max, 0)
    await expect(root).toHaveCSS("outline-style", "solid")
  })

  test("right to left puts the thread on the start side", async ({ page }) => {
    await openGallery(page)
    await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"))
    const root = card(page, "Scroll Area").locator(".sadu-scroll")
    const area = await box(root)
    const bar = await box(root.locator(".sadu-scroll__bar"))
    const wood = await box(root.locator(".sadu-scroll__wood"))
    expect(bar.x - area.x).toBeLessThan(4)
    expect(Math.abs(wood.x + wood.width / 2 - (bar.x + bar.width / 2))).toBeLessThan(0.6)
  })
})

test.describe("Resizable", () => {
  async function widths(page: Page): Promise<{ group: number; first: number; second: number; overflow: number }> {
    return card(page, "Resizable").locator(".sadu-resizable").evaluate((group) => {
      const panels = group.querySelectorAll<HTMLElement>(":scope > .sadu-resizable__panel")
      return {
        group: group.getBoundingClientRect().width,
        first: panels[0]!.getBoundingClientRect().width,
        second: panels[1]!.getBoundingClientRect().width,
        overflow: group.scrollWidth - group.clientWidth,
      }
    })
  }

  test("drag, arrow keys and limits move the beam; the panels always fill the group", async ({ page }) => {
    await openGallery(page)
    const handle = card(page, "Resizable").getByRole("separator", { name: "Resize pattern draft" })
    const before = await widths(page)
    expect(before.overflow).toBe(0)
    expect(Math.abs(before.first + before.second + 1 - before.group)).toBeLessThan(1.5)
    await expect(handle).toHaveAttribute("aria-valuenow", "40")

    const grip = await box(handle)
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2)
    await expect(handle).toHaveAttribute("data-hovering", "")
    await expect(handle.locator(".sadu-resizable__beam")).toHaveCSS("opacity", "1")
    await page.mouse.down()
    await page.mouse.move(grip.x + grip.width / 2 + 80, grip.y + grip.height / 2, { steps: 8 })
    await expect(handle).toHaveAttribute("data-dragging", "")
    await page.mouse.up()
    const dragged = await widths(page)
    expect(dragged.first - before.first).toBeCloseTo(80, -0.5)
    expect(dragged.overflow).toBe(0)

    await page.mouse.move(grip.x + grip.width / 2 + 80, grip.y + grip.height / 2)
    await page.mouse.down()
    await page.mouse.move(grip.x - 600, grip.y + grip.height / 2, { steps: 8 })
    await page.mouse.up()
    await expect(handle).toHaveAttribute("aria-valuenow", "25")

    await handle.focus()
    await page.keyboard.press("ArrowRight")
    expect(Number(await handle.getAttribute("aria-valuenow"))).toBeGreaterThan(25)
    for (let press = 0; press < 60; press++) await page.keyboard.press("ArrowRight")
    await expect(handle).toHaveAttribute("aria-valuenow", "70")
    await handle.dblclick()
    await expect(handle).toHaveAttribute("aria-valuenow", "70")
    await expect(handle.locator(".sadu-resizable__beam")).toHaveCSS("outline-style", "solid")
  })

  test("right to left, dragging toward the start grows the first panel", async ({ page }) => {
    await openGallery(page)
    await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"))
    const handle = card(page, "Resizable").getByRole("separator", { name: "Resize pattern draft" })
    const before = await widths(page)
    const grip = await box(handle)
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2)
    await page.mouse.down()
    await page.mouse.move(grip.x + grip.width / 2 - 60, grip.y + grip.height / 2, { steps: 6 })
    await page.mouse.up()
    expect((await widths(page)).first - before.first).toBeCloseTo(60, -0.5)
  })
})

test("Resizable, vertical on the site: the beam runs across and drags down", async ({ page }) => {
  await page.goto("/#/c/beam-resizable")
  await page.getByText("Vertical", { exact: true }).click()
  const group = page.locator('.sadu-resizable[data-orientation="vertical"]').first()
  await expect(group).toBeVisible()
  const handle = group.getByRole("separator", { name: "Resize pattern draft" })
  const heights = (): Promise<{ group: number; first: number; second: number }> =>
    group.evaluate((node) => {
      const panels = node.querySelectorAll<HTMLElement>(":scope > .sadu-resizable__panel")
      return { group: node.getBoundingClientRect().height, first: panels[0]!.getBoundingClientRect().height, second: panels[1]!.getBoundingClientRect().height }
    })
  const before = await heights()
  expect(Math.abs(before.first + before.second + 1 - before.group)).toBeLessThan(1.5)
  const grip = await box(handle)
  expect(grip.height).toBe(24)
  const beam = await box(handle.locator(".sadu-resizable__grip"))
  expect(beam.width).toBe(24)
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2)
  await page.mouse.down()
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2 + 30, { steps: 6 })
  await page.mouse.up()
  expect((await heights()).first - before.first).toBeCloseTo(30, -0.5)
  await handle.focus()
  await page.keyboard.press("ArrowUp")
  expect((await heights()).first).toBeLessThan(before.first + 30)
})

test("Timeline: keys move between events, finishing steps ends on a delivered order, reset returns", async ({ page }) => {
  await openGallery(page)
  const stage = card(page, "Timeline")
  const items = stage.getByRole("listitem")
  await expect(items).toHaveCount(7)
  await expect(items.nth(4)).toHaveAttribute("aria-current", "step")
  await items.nth(4).focus()
  await page.keyboard.press("ArrowDown")
  await expect(items.nth(5)).toBeFocused()
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("ArrowUp")
  await expect(items.nth(3)).toBeFocused()

  const finish = stage.getByRole("button", { name: "Finish this step" })
  for (let press = 0; press < 6; press++) await finish.click({ force: true })
  await expect(stage.locator('[aria-current="step"]')).toHaveCount(0)
  await expect(stage.locator(".sadu-timeline__item[data-complete]")).toHaveCount(7)
  await expect(finish).toBeDisabled()
  await expect(stage.locator(".sadu-timeline__connector[data-complete] .sadu-timeline__spun").first()).toHaveCSS("clip-path", "inset(0px)")

  await stage.getByRole("button", { name: "Reset" }).click()
  await expect(items.nth(4)).toHaveAttribute("aria-current", "step")
  await expect(stage.locator(".sadu-timeline__item[data-upcoming]")).toHaveCount(2)
  await expect(finish).toBeEnabled()
})

test.describe("Waterfall", () => {
  async function span(page: Page, name: string): Promise<{ start: number; width: number; bar: number; left: number; right: number }> {
    const row = card(page, "Waterfall").getByRole("row", { name: new RegExp(`^${name}`) }).first()
    return row.evaluate((node) => {
      const bar = node.querySelector<HTMLElement>(".sadu-waterfall__bar")!.getBoundingClientRect()
      const piece = node.querySelector<HTMLElement>(".sadu-waterfall__span")!.getBoundingClientRect()
      return { start: piece.left - bar.left, width: piece.width, bar: bar.width, left: piece.left, right: bar.right - piece.right }
    })
  }

  test("bars sit at their days, ticks are round, labels line up", async ({ page }) => {
    await openGallery(page)
    const stage = card(page, "Waterfall")
    await expect(stage.locator(".sadu-waterfall__tick")).toHaveText(["Day 0", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25"])
    for (const [name, start, duration] of [["Spin", 2, 7], ["Warp", 16, 2], ["Centre", 23, 3]] as const) {
      const placed = await span(page, name)
      expect(placed.start).toBeCloseTo((start / 34) * placed.bar, 0)
      expect(placed.width).toBeCloseTo((duration / 34) * placed.bar, 0)
    }
    const textStart = (name: string): Promise<number> =>
      stage.getByRole("rowheader", { name, exact: true }).evaluate((header) => {
        const range = document.createRange()
        const text = [...header.childNodes].find((child) => child.nodeType === Node.TEXT_NODE)!
        range.selectNodeContents(text)
        return range.getBoundingClientRect().left
      })
    expect(await textStart("Spin")).toBeCloseTo(await textStart("Weave"), 0)
  })

  test("spans expand by mouse and keys; selection is separate", async ({ page }) => {
    await openGallery(page)
    const stage = card(page, "Waterfall")
    const rows = stage.getByRole("row")
    await expect(rows).toHaveCount(13)
    const dye = stage.getByRole("row", { name: /^Dye/ })
    await dye.locator(".sadu-waterfall__indicator").click()
    await expect(dye).toHaveAttribute("aria-expanded", "true")
    await expect(rows).toHaveCount(15)
    await expect(dye).not.toHaveAttribute("aria-selected", "true")
    await expect(stage.getByRole("row", { name: /^Centre/ })).toHaveAttribute("aria-selected", "true")

    const weave = stage.getByRole("row", { name: /^Weave/ })
    await weave.focus()
    await page.keyboard.press("ArrowLeft")
    await expect(weave).toHaveAttribute("aria-expanded", "false")
    await expect(rows).toHaveCount(10)
    await page.keyboard.press("ArrowRight")
    await expect(rows).toHaveCount(15)
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")
    await expect(stage.getByRole("row", { name: /^Border/ }).first()).toHaveAttribute("aria-selected", "true")
    await expect(stage.locator(".sadu-waterfall__row").last()).toHaveCSS("opacity", "1")
  })

  test("rapid toggling ends on the state of the last click", async ({ page }) => {
    await openGallery(page)
    const dye = card(page, "Waterfall").getByRole("row", { name: /^Dye/ })
    const indicator = dye.locator(".sadu-waterfall__indicator")
    for (let click = 0; click < 5; click++) await indicator.click({ delay: 0 })
    await expect(dye).toHaveAttribute("aria-expanded", "true")
    await expect(card(page, "Waterfall").getByRole("row")).toHaveCount(15)
    await expect(card(page, "Waterfall").locator(".sadu-waterfall__row").last()).toHaveCSS("opacity", "1")
  })

  test("at 390px the chart scrolls under a sticky label column and the ticks never collide", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openGallery(page)
    const root = card(page, "Waterfall").locator(".sadu-waterfall")
    const sizes = await root.evaluate((node) => ({ scroll: node.scrollWidth, client: node.clientWidth }))
    expect(sizes.scroll).toBeGreaterThan(sizes.client)
    const ticks = await root.locator(".sadu-waterfall__tick").evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect()).map(({ left, right }) => ({ left, right })))
    for (let index = 1; index < ticks.length; index++) expect(ticks[index]!.left).toBeGreaterThan(ticks[index - 1]!.right + 4)
    await root.evaluate((node) => node.scrollTo({ left: node.scrollWidth }))
    const rootLeft = (await box(root)).x
    const header = await box(root.getByRole("rowheader", { name: "Spin", exact: true }))
    expect(Math.abs(header.x - rootLeft)).toBeLessThan(1)
    const span = await box(root.getByRole("row", { name: /^Spin/ }).locator(".sadu-waterfall__span"))
    expect(span.width).toBeGreaterThan(20)
    const label = await root.getByRole("rowheader", { name: "Umm Saad approves" }).evaluate((node) => node.scrollWidth - node.clientWidth)
    expect(label).toBe(0)
  })

  test("the Eid mark is a dashed thread under a madder eye; the selected bar takes the focus ring", async ({ page }) => {
    await openGallery(page)
    const stage = card(page, "Waterfall")
    const mark = stage.locator(".sadu-waterfall__mark")
    await expect(mark.locator(".sadu-waterfall__mark-label")).toHaveText("Eid")
    await expect(mark.locator('.sadu-eye-mark[data-tone="value"]')).toBeVisible()
    expect(await mark.evaluate((node) => getComputedStyle(node, "::after").backgroundImage)).toContain("repeating-linear-gradient")
    const selected = stage.getByRole("row", { name: /^Centre/ }).locator(".sadu-waterfall__span")
    await expect(selected).toHaveCSS("outline-style", "solid")
    await expect(selected).toHaveCSS("outline-offset", "2px")
  })

  test("right to left, time runs from the start side", async ({ page }) => {
    await openGallery(page)
    await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"))
    const placed = await span(page, "Spin")
    expect(placed.right).toBeCloseTo((2 / 34) * placed.bar, 0)
  })
})

test.describe("Code Block", () => {
  test("copy writes the exact code, toasts, and the eye reverts after 1.2s", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await openGallery(page)
    const stage = card(page, "Code Block")
    const expected = await stage.locator(".sadu-code__panel .sadu-code__text").evaluateAll((lines) =>
      lines.map((line) => (line.textContent ?? "").replace(/\n$/, "")).join("\n"),
    )
    const copy = stage.getByRole("button", { name: "Copy order-band.tsx" })
    await copy.click()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected)
    expect(expected.startsWith('import type { ReactElement } from "react"')).toBe(true)
    await expect(copy).toHaveAttribute("data-copied", "")
    await expect(copy.locator(".sadu-code__copied")).toHaveCSS("opacity", "1")
    await expect(page.locator('[data-slot="toast"]').filter({ hasText: "Copied to the clipboard" })).toBeVisible()
    await page.waitForTimeout(1300)
    await expect(copy).not.toHaveAttribute("data-copied")
    await expect(copy.locator(".sadu-code__copy-icon")).toHaveCSS("opacity", "1")
  })

  test("tabs switch files by keyboard, highlighted lines carry capsules, long code scrolls", async ({ page }) => {
    await openGallery(page)
    const stage = card(page, "Code Block")
    await expect(stage.locator(".sadu-float-highlight")).toHaveText(["9", "10", "11", "12", "13"])
    const viewport = stage.getByRole("region", { name: "order-band.tsx" })
    const scroll = await viewport.evaluate((node) => ({ height: node.scrollHeight, view: node.clientHeight }))
    expect(scroll.height).toBeGreaterThan(scroll.view)
    await viewport.hover()
    await page.mouse.wheel(0, 200)
    await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0)

    await stage.getByRole("tab", { name: "React" }).focus()
    await page.keyboard.press("ArrowRight")
    await expect(stage.getByRole("tab", { name: "CSS" })).toHaveAttribute("aria-selected", "true")
    await expect(stage.locator(".sadu-code__file")).toHaveText("order-band.css")
    await expect(stage.getByRole("button", { name: "Copy order-band.css" })).toBeVisible()
    await expect(stage.locator(".sadu-float-highlight")).toHaveText(["3"])
  })

  test("the block ends on a whole line and fades while there is more below", async ({ page }) => {
    await openGallery(page)
    const stage = card(page, "Code Block")
    const scroll = stage.locator(".sadu-code__scroll")
    const viewport = stage.getByRole("region", { name: "order-band.tsx" })
    expect(await viewport.evaluate((node) => (node.clientHeight - 10) % 20)).toBe(0)
    expect(await scroll.evaluate((node) => getComputedStyle(node, "::after").height)).toBe("32px")
    await viewport.evaluate((node) => node.scrollTo({ top: node.scrollHeight }))
    await expect.poll(() => scroll.evaluate((node) => getComputedStyle(node, "::after").height)).toBe("0px")
  })

  test("narrow screens keep the header inside the block; right to left keeps code left to right", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openGallery(page)
    await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"))
    const stage = card(page, "Code Block")
    const block = await box(stage.locator(".sadu-code"))
    const head = await box(stage.locator(".sadu-code__head"))
    const copy = await box(stage.getByRole("button", { name: /^Copy/ }))
    const cardBox = await box(stage)
    expect(block.x + block.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 0.5)
    expect(head.x + head.width).toBeLessThanOrEqual(block.x + block.width + 0.5)
    expect(copy.x).toBeGreaterThanOrEqual(block.x)
    expect(copy.x + copy.width).toBeLessThanOrEqual(block.x + block.width + 0.5)
    expect(await stage.locator(".sadu-code__head").evaluate((node) => node.scrollWidth - node.clientWidth)).toBe(0)
    await expect(stage.locator(".sadu-code__pre")).toHaveCSS("direction", "ltr")
    await expect(stage.locator(".sadu-code__scroll")).toHaveCSS("direction", "ltr")
    const viewport = stage.getByRole("region", { name: "order-band.tsx" })
    expect(await viewport.evaluate((node) => node.scrollLeft)).toBe(0)
    const number = await box(stage.locator(".sadu-code__number").first())
    expect(number.x).toBeGreaterThanOrEqual(block.x)
  })
})

test.describe("Contrast", () => {
  const TEXT = [
    ".sadu-meter__value",
    ".sadu-meter__label",
    ".sadu-progress__value",
    ".sadu-progress__label",
    ".sadu-timeline__time",
    ".sadu-timeline__description",
    ".sadu-timeline__title[data-upcoming]",
    ".sadu-waterfall__cell",
    ".sadu-waterfall__tick",
    ".sadu-waterfall__mark",
    ".sadu-waterfall__column-header",
    ".sadu-separator__label",
    ".sadu-avatar-group__more",
    ".sadu-code__file",
    ".sadu-code__tab",
    ".sadu-code__number",
    ".sadu-float-highlight",
    '.sadu-code__token[data-kind="keyword"]',
    '.sadu-code__token[data-kind="string"]',
    '.sadu-code__token[data-kind="comment"]',
  ]

  for (const theme of ["day", "tent"] as const) {
    test(`text and control edges hold their ratios in the ${theme}`, async ({ page }) => {
      await openGallery(page)
      await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme)
      await page.waitForTimeout(400)
      const report = await page.evaluate((selectors) => {
        const parse = (value: string): [number, number, number, number] => {
          const parts = value.match(/[\d.]+/g)!.map(Number)
          return [parts[0]!, parts[1]!, parts[2]!, parts[3] ?? 1]
        }
        const backgroundOf = (node: Element | null): [number, number, number] => {
          const layers: [number, number, number, number][] = []
          for (let at = node; at; at = at.parentElement) {
            const color = parse(getComputedStyle(at).backgroundColor)
            if (color[3] > 0) layers.push(color)
            if (color[3] === 1) break
          }
          let base: [number, number, number] = [255, 255, 255]
          for (const [r, g, b, a] of layers.reverse()) base = [r * a + base[0] * (1 - a), g * a + base[1] * (1 - a), b * a + base[2] * (1 - a)]
          return base
        }
        const luminance = ([r, g, b]: number[]): number => {
          const [lr, lg, lb] = [r!, g!, b!].map((channel) => {
            const c = channel / 255
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
          })
          return 0.2126 * lr! + 0.7152 * lg! + 0.0722 * lb!
        }
        const ratio = (a: number[], b: number[]): number => {
          const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
          return (hi! + 0.05) / (lo! + 0.05)
        }
        const text = selectors.map((selector) => {
          const node = document.querySelector(selector)
          if (!node) return { selector, ratio: 0 }
          const background = backgroundOf(node)
          const [r, g, b, a] = parse(getComputedStyle(node).color)
          const color = [r * a + background[0] * (1 - a), g * a + background[1] * (1 - a), b * a + background[2] * (1 - a)]
          return { selector, ratio: Math.round(ratio(color, background) * 100) / 100 }
        })
        const root = getComputedStyle(document.documentElement)
        const surface = parse(root.getPropertyValue("--sadu-surface").trim().replace(/^#(..)(..)(..)$/, (_, r, g, b) => `${parseInt(r, 16)} ${parseInt(g, 16)} ${parseInt(b, 16)}`))
        const edge = parse(root.getPropertyValue("--sadu-edge").trim().replace(/^#(..)(..)(..)$/, (_, r, g, b) => `${parseInt(r, 16)} ${parseInt(g, 16)} ${parseInt(b, 16)}`))
        const cloth = [...document.querySelectorAll(".sadu-meter__float[data-filled], .sadu-waterfall__span:not([data-tone='wool'])")].map((node) => ({
          selector: node.className,
          ratio: Math.round(ratio(parse(getComputedStyle(node).backgroundColor), backgroundOf(node.parentElement)) * 100) / 100,
        }))
        return { text, edge: ratio(edge, surface), cloth }
      }, TEXT)
      for (const entry of report.text) expect(entry, entry.selector).toEqual({ selector: entry.selector, ratio: expect.any(Number) })
      expect(report.text.filter((entry) => entry.ratio < 4.5)).toEqual([])
      expect(report.edge).toBeGreaterThanOrEqual(3)
      expect(report.cloth.filter((entry) => entry.ratio < 3)).toEqual([])
    })
  }
})

test("tent theme and reduced motion render every card cleanly", async ({ page }) => {
  await openGallery(page)
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "tent")
    document.documentElement.setAttribute("data-motion", "reduced")
  })
  for (const name of ["Avatar", "Separator", "Meter", "Progress", "Resizable", "Timeline", "Waterfall", "Code Block", "Scroll Area"]) {
    await expect(card(page, name).locator(".gallery-card__stage > *").first()).toBeVisible()
  }
  await card(page, "Timeline").getByRole("button", { name: "Finish this step" }).click()
  await expect(card(page, "Timeline").locator(".sadu-timeline__connector[data-complete] .sadu-timeline__spun").nth(4)).toHaveCSS("opacity", "1")
})

const SITE_PAGES = {
  "weaver-avatar": ".sadu-avatar",
  "thread-separator": ".sadu-separator",
  "wool-meter": ".sadu-meter",
  "loom-progress": ".sadu-progress",
  "wood-scroll-area": ".sadu-scroll",
  "beam-resizable": ".sadu-resizable",
  "warp-timeline": ".sadu-timeline",
  "dye-waterfall": ".sadu-waterfall",
  "code-block": ".sadu-code",
} as const

for (const [id, selector] of Object.entries(SITE_PAGES)) {
  test(`site page for ${id} renders its demo`, async ({ page }) => {
    await page.goto(`/#/c/${id}`)
    await expect(page.locator(selector).first()).toBeVisible()
    await page.waitForTimeout(400)
  })
}
