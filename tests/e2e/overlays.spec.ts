import { expect, test, type Locator, type Page } from "@playwright/test"

const GALLERY = "/?gallery=overlays"
const FULLY_WOVEN = /^(none|inset\((0(px|%)?\s?)+\))$/

let problems: string[] = []

test.beforeEach(async ({ page }) => {
  problems = []
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") problems.push(`${message.type()}: ${message.text()}`)
  })
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`))
})

test.afterEach(() => {
  expect(problems).toEqual([])
})

async function openGallery(page: Page): Promise<void> {
  await page.goto(GALLERY)
  await expect(page.locator(".gallery-card").first()).toBeVisible()
}

function button(page: Page | Locator, name: string): Locator {
  return page.getByRole("button", { name, exact: true })
}

async function isInTopLayer(locator: Locator): Promise<boolean> {
  return locator.evaluate((element) => element.matches(":popover-open") || element.matches(":modal"))
}

async function runningAnimations(locator: Locator): Promise<number> {
  return locator.evaluate(
    (element) => element.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length,
  )
}

async function visibleBeaters(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      [...document.querySelectorAll(".sadu-beater")].filter((beater) => {
        const style = getComputedStyle(beater)
        return style.display !== "none" && Number(style.opacity) > 0.01
      }).length,
  )
}

async function contrastOf(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const parse = (value: string): number[] => {
      const numbers = (value.match(/[\d.]+/g) ?? []).map(Number)
      if (!value.startsWith("color(srgb")) return numbers
      const [r = 0, g = 0, b = 0, alpha] = numbers
      return [r * 255, g * 255, b * 255, ...(alpha === undefined ? [] : [alpha])]
    }
    const luminance = ([r = 0, g = 0, b = 0]: number[]): number => {
      const channel = (c: number) => {
        const v = c / 255
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
    }
    const blend = (top: number[], bottom: number[]): number[] => {
      const alpha = top[3] ?? 1
      return [0, 1, 2].map((index) => (top[index] ?? 0) * alpha + (bottom[index] ?? 0) * (1 - alpha))
    }
    const layers: number[][] = []
    let node: Element | null = element
    while (node) {
      const color = parse(getComputedStyle(node).backgroundColor)
      if ((color[3] ?? 1) > 0) layers.push(color)
      if ((color[3] ?? 1) >= 1) break
      node = node.parentElement
    }
    const page = parse(getComputedStyle(document.documentElement).backgroundColor)
    const background = layers.reverse().reduce((under, layer) => blend(layer, under), page.length ? page : [255, 255, 255])
    const text = blend(parse(getComputedStyle(element).color), background)
    const [light, dark] = [luminance(text), luminance(background)].sort((a, b) => b - a)
    return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05)
  })
}

test.describe("dialog", () => {
  test("opens in the top layer, weaves its flap once, and settles with no beater left", async ({ page }) => {
    await openGallery(page)
    const trigger = button(page, "Edit main band")
    await trigger.click()
    const dialog = page.getByRole("dialog", { name: "Edit main band" })
    await expect(dialog).toBeVisible()
    expect(await isInTopLayer(dialog)).toBe(true)
    await expect(dialog).toContainText("Order 14")
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    await expect.poll(() => runningAnimations(dialog), { timeout: 3000 }).toBe(0)
    await expect(dialog.locator(".sadu-dialog__cloth")).toHaveCSS("clip-path", FULLY_WOVEN)
    expect(await visibleBeaters(page)).toBe(0)
    await expect(dialog).toHaveCSS("opacity", "1")
  })

  test("re-weaves the band when the motif changes and leaves one layer", async ({ page }) => {
    await openGallery(page)
    await button(page, "Edit main band").click()
    const dialog = page.getByRole("dialog")
    await expect.poll(() => runningAnimations(dialog)).toBe(0)
    const motif = dialog.getByRole("combobox", { name: "Motif" })
    await motif.click()
    await expect(page.getByRole("listbox")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("listbox")).toHaveCount(0)
    await expect(dialog).toBeVisible()
    await expect(motif).toBeFocused()
    await motif.click()
    await page.getByRole("option", { name: /Ain/ }).click()
    await expect(dialog.locator(".sadu-dialog__motif [data-weaving]")).toHaveCount(1)
    await expect(dialog.locator(".sadu-dialog__motif [data-weaving]")).toHaveCount(0, { timeout: 3000 })
    await expect(dialog.locator(".sadu-dialog__motif .sadu-reweave__layer")).toHaveCount(1)
    await expect(dialog.locator(".sadu-reweave__beater")).toHaveCount(0)
    await expect(dialog).toBeVisible()
  })

  test("Escape and Cancel close it and return focus; Save reports through a toast", async ({ page }) => {
    await openGallery(page)
    const trigger = button(page, "Edit main band")
    await trigger.focus()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await page.keyboard.press("Space")
    await button(page.getByRole("dialog"), "Cancel").click()
    await expect(page.getByRole("dialog")).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await trigger.click()
    await button(page.getByRole("dialog"), "Save").click()
    await expect(page.getByRole("dialog")).toHaveCount(0)
    await expect(page.getByRole("region", { name: "Notifications" })).toContainText("Main band saved")
  })

  test("a press on the backdrop closes it", async ({ page }) => {
    await openGallery(page)
    await button(page, "Edit main band").click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.mouse.click(10, 10)
    await expect(page.getByRole("dialog")).toHaveCount(0)
  })

  test("double-clicking the trigger leaves the dialog open", async ({ page }) => {
    await openGallery(page)
    await button(page, "Edit main band").dblclick()
    await page.waitForTimeout(400)
    await expect(page.getByRole("dialog")).toBeVisible()
  })

  test("opening and closing quickly ends closed with nothing left mounted", async ({ page }) => {
    await openGallery(page)
    const trigger = button(page, "Edit main band")
    for (let round = 0; round < 3; round++) {
      await trigger.click()
      await page.keyboard.press("Escape")
    }
    await expect(page.locator(".sadu-dialog")).toHaveCount(0)
    await expect(page.locator(".sadu-dialog-backdrop")).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
})

test.describe("alert dialog", () => {
  test("starts on Keep weaving, traps Tab, ignores outside presses, and unravels to its end state", async ({ page }) => {
    await openGallery(page)
    const trigger = button(page, "Unravel band")
    await trigger.click()
    const dialog = page.getByRole("alertdialog", { name: "Unravel this band?" })
    await expect(dialog).toBeVisible()
    expect(await isInTopLayer(dialog)).toBe(true)
    await expect(button(dialog, "Keep weaving")).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(button(dialog, "Unravel band")).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(button(dialog, "Keep weaving")).toBeFocused()
    await page.keyboard.press("Shift+Tab")
    await expect(button(dialog, "Unravel band")).toBeFocused()
    await page.mouse.click(10, 10)
    await expect(dialog).toBeVisible()
    await expect.poll(() => runningAnimations(dialog), { timeout: 3000 }).toBe(0)
    const ratio = await dialog.locator(".sadu-alert-dialog__cloth").evaluate((cloth) => {
      const warp = cloth.parentElement as HTMLElement
      return cloth.getBoundingClientRect().width / warp.getBoundingClientRect().width
    })
    expect(ratio).toBeCloseTo(0.4, 2)
    await page.keyboard.press("Escape")
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test("Keep weaving closes quietly and confirming reports", async ({ page }) => {
    await openGallery(page)
    const trigger = button(page, "Unravel band")
    await trigger.click()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("alertdialog")).toHaveCount(0)
    await expect(page.getByRole("region", { name: "Notifications" })).toHaveCount(0)
    await trigger.click()
    await button(page.getByRole("alertdialog"), "Unravel band").click()
    await expect(page.getByRole("alertdialog")).toHaveCount(0)
    await expect(page.getByRole("region", { name: "Notifications" })).toContainText("Band unravelled")
  })
})

test.describe("drawer", () => {
  test("slides in from the end edge, flattens its roll, and closes every way", async ({ page }) => {
    await openGallery(page)
    const trigger = button(page, "Open order 14")
    await trigger.click()
    const drawer = page.getByRole("dialog", { name: "Order 14" })
    await expect(drawer).toBeVisible()
    await expect.poll(() => drawer.evaluate((element) => getComputedStyle(element).getPropertyValue("--drawer-progress").trim())).toBe("1")
    const box = await drawer.boundingBox()
    expect(Math.round((box?.x ?? 0) + (box?.width ?? 0))).toBe(1280)
    await expect(drawer.locator(".sadu-drawer__roll")).toHaveCSS("width", "0px")
    expect(await drawer.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    await page.keyboard.press("Escape")
    await expect(drawer).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await trigger.click()
    await button(drawer, "Close").first().click()
    await expect(drawer).toHaveCount(0)
    await trigger.click()
    await expect(drawer).toBeVisible()
    await page.mouse.click(20, 450)
    await expect(drawer).toHaveCount(0)
  })

  test("comes from the left in right to left and keeps its roll on the page side", async ({ page }) => {
    await openGallery(page)
    await page.evaluate(() => (document.documentElement.dir = "rtl"))
    await button(page, "Open order 14").click()
    const drawer = page.getByRole("dialog", { name: "Order 14" })
    await expect(drawer).toHaveAttribute("data-side", "left")
    await expect.poll(async () => Math.round((await drawer.boundingBox())?.x ?? -1)).toBe(0)
    const sides = await drawer.evaluate((element) => {
      const peg = element.querySelector(".sadu-drawer__peg")?.getBoundingClientRect()
      const panel = element.getBoundingClientRect()
      return { pegRight: peg ? panel.right - peg.right : -1 }
    })
    expect(sides.pegRight).toBeGreaterThan(0)
    expect(sides.pegRight).toBeLessThan(30)
  })
})

test.describe("popover", () => {
  test("hangs from its trigger with the arrow on the trigger's centre and keeps nested controls working", async ({ page }) => {
    await openGallery(page)
    const trigger = button(page, "Band width")
    await trigger.click()
    const popover = page.getByRole("dialog", { name: "Band width" })
    await expect(popover).toBeVisible()
    expect(await isInTopLayer(popover)).toBe(true)
    await expect(trigger).toHaveCSS("background-color", /./)
    const [triggerBox, arrowBox, popoverBox] = await Promise.all([
      trigger.boundingBox(),
      popover.locator(".sadu-popup__arrow").boundingBox(),
      popover.boundingBox(),
    ])
    const triggerCentre = (triggerBox?.x ?? 0) + (triggerBox?.width ?? 0) / 2
    const arrowCentre = (arrowBox?.x ?? 0) + (arrowBox?.width ?? 0) / 2
    expect(Math.abs(triggerCentre - arrowCentre)).toBeLessThan(2)
    const below = (popoverBox?.y ?? 0) > (triggerBox?.y ?? 0)
    if (below) expect((arrowBox?.y ?? 0) + (arrowBox?.height ?? 0)).toBeLessThanOrEqual((popoverBox?.y ?? 0) + 2)
    else expect(arrowBox?.y ?? 0).toBeGreaterThanOrEqual((popoverBox?.y ?? 0) + (popoverBox?.height ?? 0) - 2)

    const rows = popover.getByRole("textbox", { name: "Rows" })
    await rows.focus()
    await page.keyboard.press("ArrowUp")
    await expect(rows).toHaveValue("47")
    await popover.getByRole("slider").focus()
    await page.keyboard.press("ArrowRight")
    await expect(rows).toHaveValue("48")
    await expect(popover).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(popover).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await trigger.click()
    await page.mouse.click(10, 10)
    await expect(popover).toHaveCount(0)
    await trigger.click()
    await button(popover, "Done").click()
    await expect(popover).toHaveCount(0)
  })
})

test.describe("hover card", () => {
  test("opens on hover and on keyboard focus, closes on leave and Escape", async ({ page }) => {
    await openGallery(page)
    const link = page.getByRole("link", { name: "Uwairjan" })
    await link.hover()
    const card = page.locator(".sadu-hover-card")
    await expect(card).toBeVisible()
    await expect(card).toContainText("Uwairjan")
    await expect(card).toContainText("عويرجان")
    await expect(card).toContainText("Facing triangles")
    expect(await isInTopLayer(card)).toBe(true)
    await page.mouse.move(5, 5)
    await expect(card).toHaveCount(0)
    await button(page, "Band width").focus()
    await page.keyboard.press("Tab")
    await expect(link).toBeFocused()
    await expect(card).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(card).toHaveCount(0)
    await expect(link).toBeFocused()
  })
})

test.describe("tooltip", () => {
  test("names each icon button, shows on hover and focus, and hides on Escape", async ({ page }) => {
    await openGallery(page)
    for (const name of ["Beat row", "Undo last pick", "Redo pick"]) {
      await expect(page.getByRole("button", { name, exact: true })).toHaveCount(1)
    }
    const undo = button(page, "Undo last pick")
    await undo.hover()
    const tip = page.getByRole("tooltip").filter({ hasText: "Undo last pick" })
    await expect(tip).toBeVisible()
    await expect(tip).toContainText(/Z/)
    const [tipBox, cordBox, undoBox] = await Promise.all([
      tip.boundingBox(),
      tip.locator(".sadu-tooltip__cord").boundingBox(),
      undo.boundingBox(),
    ])
    expect((tipBox?.y ?? 0) + (tipBox?.height ?? 0)).toBeLessThanOrEqual(undoBox?.y ?? 0)
    expect(Math.round((cordBox?.y ?? 0) + (cordBox?.height ?? 0))).toBe(Math.round((tipBox?.y ?? 0) + (tipBox?.height ?? 0)))
    await page.mouse.move(5, 5)
    await expect(tip).toBeHidden()
    await button(page, "Beat row").focus()
    await page.keyboard.press("Tab")
    await expect(undo).toBeFocused()
    await expect(tip).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(tip).toBeHidden()
    await expect(undo).toBeFocused()
  })
})

test.describe("toast", () => {
  test("weaves its timer, pauses on hover, dismisses, and times out while an error stays", async ({ page }) => {
    await openGallery(page)
    await button(page, "Record dye lot").click()
    const region = page.getByRole("region", { name: "Notifications" })
    const success = region.locator("[data-slot='toast'][data-type='success']")
    await expect(success).toContainText("Dye lot recorded")
    await expect(success.locator(".sadu-eye-mark")).toBeVisible()
    await success.hover()
    await expect(region).toHaveAttribute("data-expanded", "")
    const states = await success
      .locator(".sadu-toast__cloth")
      .evaluate((cloth) => cloth.getAnimations().map((animation) => animation.playState))
    expect(states).toEqual(["paused"])
    await page.mouse.move(5, 5)
    await expect(region).not.toHaveAttribute("data-expanded", "")
    await button(page, "Send pattern").click()
    const error = region.locator("[data-slot='toast'][data-type='error']")
    await expect(error).toContainText("Loom not reached")
    await expect(error.locator(".sadu-toast__timer")).not.toHaveAttribute("data-timed", "")
    await expect(success).toHaveCount(0, { timeout: 7000 })
    await expect(error).toBeVisible()
    await error.hover()
    await button(error, "Dismiss").click()
    await expect(region.locator("[data-slot='toast']")).toHaveCount(0)
  })

  test("queues past three and Undo runs once", async ({ page }) => {
    await openGallery(page)
    const record = button(page, "Record dye lot")
    for (let index = 0; index < 4; index++) await record.click()
    const region = page.getByRole("region", { name: "Notifications" })
    await expect(region.locator("[data-slot='toast']:not([data-ending-style])")).toHaveCount(3)
    await region.hover()
    await button(region.locator("[data-slot='toast'][data-front]"), "Undo").click()
    await expect(region).toContainText("Dye lot removed")
  })
})

test.describe("collapsible", () => {
  test("unfolds by keyboard to its full height and folds away", async ({ page }) => {
    await openGallery(page)
    const trigger = button(page, "Wedding tent divider Folded, 3.6 m")
    await trigger.focus()
    await page.keyboard.press("Enter")
    await expect(trigger).toHaveAttribute("aria-expanded", "true")
    const panel = page.locator(".sadu-collapsible__panel").first()
    await expect.poll(() => runningAnimations(panel)).toBe(0)
    await expect(panel.locator(".sadu-collapsible__fold")).toHaveCSS("opacity", "1")
    await expect(panel).toContainText("Camel and goat hair")
    expect((await panel.boundingBox())?.height ?? 0).toBeGreaterThan(80)
    await page.keyboard.press("Space")
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
    await expect(page.locator(".sadu-collapsible__panel")).toHaveCount(0)
  })
})

test.describe("accordion", () => {
  test("weaves the opened stage in and leaves no beater behind", async ({ page }) => {
    await openGallery(page)
    const weaving = button(page, "Weaving")
    const dyeing = button(page, "Dyeing")
    await expect(dyeing).toHaveAttribute("aria-expanded", "true")
    await weaving.click()
    await expect(weaving).toHaveAttribute("aria-expanded", "true")
    await expect(dyeing).toHaveAttribute("aria-expanded", "false")
    await expect.poll(() => runningAnimations(page.locator(".sadu-accordion"))).toBe(0)
    await expect(weaving.locator(".sadu-accordion__swatch-cloth")).toHaveCSS("clip-path", FULLY_WOVEN)
    await expect(weaving.locator(".sadu-accordion__cloth")).toHaveCSS("clip-path", FULLY_WOVEN)
    await expect(dyeing.locator(".sadu-accordion__swatch-cloth")).not.toHaveCSS("clip-path", FULLY_WOVEN)
    expect(await visibleBeaters(page)).toBe(0)
  })

  test("rapid toggling ends in the right state", async ({ page }) => {
    await openGallery(page)
    const spinning = button(page, "Shearing and spinning")
    for (let index = 0; index < 5; index++) await spinning.click()
    await expect(spinning).toHaveAttribute("aria-expanded", "true")
    await expect.poll(() => runningAnimations(page.locator(".sadu-accordion"))).toBe(0)
    await expect(spinning.locator(".sadu-accordion__swatch-cloth")).toHaveCSS("clip-path", FULLY_WOVEN)
    expect(await visibleBeaters(page)).toBe(0)
  })
})

test.describe("preferences", () => {
  test("writes the page's attributes, re-weaves only its band, and resets", async ({ page }) => {
    await openGallery(page)
    const html = page.locator("html")
    await page.getByRole("radio", { name: "Tent" }).click()
    await expect(html).toHaveAttribute("data-theme", "tent")
    await page.getByRole("radio", { name: "Reduced" }).click()
    await expect(html).toHaveAttribute("data-motion", "reduced")
    await page.getByRole("radio", { name: "Indigo" }).click()
    await expect(html).toHaveAttribute("data-dye", "indigo")
    await page.getByRole("radio", { name: "Right to left" }).click()
    await expect(page.getByRole("region", { name: "Display" })).toHaveAttribute("dir", "rtl")
    await expect.poll(() => runningAnimations(page.locator(".sadu-preferences__sampler")), { timeout: 2000 }).toBe(0)
    await expect(page.locator(".sadu-preferences__sampler [data-weaving]")).toHaveCount(0)
    await button(page, "Reset").click()
    await expect(html).toHaveAttribute("data-theme", "system")
    await expect(html).toHaveAttribute("data-motion", "full")
    await expect(page.getByRole("region", { name: "Display" })).toHaveAttribute("dir", "ltr")
  })

  test("reduced motion from the panel still opens everything to its final state", async ({ page }) => {
    await openGallery(page)
    await page.getByRole("radio", { name: "Reduced" }).click()
    await button(page, "Edit main band").click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toHaveCSS("opacity", "1")
    await expect(dialog.locator(".sadu-dialog__cloth")).toHaveCSS("animation-name", "none")
    expect(await visibleBeaters(page)).toBe(0)
    await page.keyboard.press("Escape")
    await expect(dialog).toHaveCount(0)
    await button(page, "Reset").click()
  })
})

test.describe("reduced motion from the system", () => {
  test.use({ colorScheme: "light" })

  test("dialogs, drawers and folds reach their final state", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await openGallery(page)
    await button(page, "Edit main band").click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toHaveCSS("opacity", "1")
    await expect(dialog.locator(".sadu-dialog__cloth")).toHaveCSS("animation-name", "none")
    await page.keyboard.press("Escape")
    await expect(dialog).toHaveCount(0)
    await button(page, "Unravel band").click()
    await expect(page.locator(".sadu-alert-dialog__cloth")).toHaveCSS("animation-name", "none")
    await page.keyboard.press("Escape")
    await button(page, "Open order 14").click()
    await expect(page.locator(".sadu-drawer__roll")).toHaveCSS("display", "none")
    await page.keyboard.press("Escape")
    await expect(page.locator(".sadu-drawer")).toHaveCount(0)
    const weaving = button(page, "Weaving")
    await weaving.click()
    await expect.poll(() => runningAnimations(page.locator(".sadu-accordion"))).toBe(0)
    await expect(weaving.locator(".sadu-accordion__swatch-cloth")).toHaveCSS("clip-path", FULLY_WOVEN)
    expect(await visibleBeaters(page)).toBe(0)
  })
})

test.describe("right to left", () => {
  test("toasts sit on the left and the accordion's marks mirror", async ({ page }) => {
    await openGallery(page)
    await page.evaluate(() => (document.documentElement.dir = "rtl"))
    await button(page, "Record dye lot").click()
    const region = page.getByRole("region", { name: "Notifications" })
    await expect(region).toBeVisible()
    expect(Math.round((await region.boundingBox())?.x ?? -1)).toBe(32)
    const dyeing = button(page, "Dyeing")
    const [swatch, label] = await Promise.all([
      dyeing.locator(".sadu-accordion__swatch").boundingBox(),
      dyeing.locator(".sadu-accordion__label").boundingBox(),
    ])
    expect(swatch?.x ?? 0).toBeGreaterThan(label?.x ?? 0)
  })
})

for (const theme of ["day", "tent"] as const) {
  test(`text and edges meet contrast in the ${theme} theme`, async ({ page }) => {
    test.setTimeout(60_000)
    await openGallery(page)
    await page.evaluate((value) => (document.documentElement.dataset.theme = value), theme)
    await expect.poll(() => runningAnimations(page.locator("body"))).toBe(0)
    await page.waitForTimeout(400)
    const checks: { name: string; locator: Locator; minimum: number }[] = []
    const add = (name: string, locator: Locator, minimum = 4.5) => checks.push({ name, locator, minimum })

    add("accordion header", page.locator(".sadu-accordion__label").first())
    add("accordion text", page.locator(".sadu-accordion__content").first())
    add("collapsible title", page.locator(".overlays-demo__piece-title").first())
    add("collapsible meta", page.locator(".overlays-demo__piece-meta").first())
    add("preferences description", page.locator(".sadu-preferences__description").first())
    add("preferences reset", button(page, "Reset"))
    for (const check of checks) expect.soft(await contrastOf(check.locator), check.name).toBeGreaterThanOrEqual(check.minimum)
    checks.length = 0

    await button(page, "Edit main band").click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    add("dialog title", dialog.locator(".sadu-overlay-title"))
    add("dialog description", dialog.locator(".sadu-overlay-description"))
    add("dialog close", button(dialog, "Close"), 3)
    for (const check of checks) expect.soft(await contrastOf(check.locator), check.name).toBeGreaterThanOrEqual(check.minimum)
    checks.length = 0
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    await expect.poll(() => runningAnimations(page.locator("body"))).toBe(0)

    await button(page, "Band width").click()
    const popover = page.getByRole("dialog", { name: "Band width" })
    await expect(popover).toBeVisible()
    await expect.poll(() => runningAnimations(page.locator("body"))).toBe(0)
    add("popover title", popover.locator(".sadu-popover__title"))
    add("popover description", popover.locator(".sadu-popover__description"))
    for (const check of checks) expect.soft(await contrastOf(check.locator), check.name).toBeGreaterThanOrEqual(check.minimum)
    checks.length = 0
    await page.keyboard.press("Escape")
    await expect(popover).toBeHidden()
    await expect.poll(() => runningAnimations(page.locator("body"))).toBe(0)

    await page.getByRole("link", { name: "Uwairjan" }).hover()
    const card = page.locator(".sadu-hover-card")
    await expect(card).toBeVisible()
    await expect.poll(() => runningAnimations(page.locator("body"))).toBe(0)
    add("hover card name", card.locator(".sadu-hover-card__name"))
    add("hover card arabic", card.locator(".sadu-hover-card__arabic"))
    add("hover card meaning", card.locator(".sadu-hover-card__meaning"))
    for (const check of checks) expect.soft(await contrastOf(check.locator), check.name).toBeGreaterThanOrEqual(check.minimum)
    checks.length = 0
    await page.mouse.move(5, 5)

    await button(page, "Beat row").hover()
    const tip = page.getByRole("tooltip").filter({ hasText: "Beat row" })
    await expect(tip).toBeVisible()
    add("tooltip", tip)
    for (const check of checks) expect.soft(await contrastOf(check.locator), check.name).toBeGreaterThanOrEqual(check.minimum)
    checks.length = 0

    await button(page, "Send pattern").click()
    const toast = page.locator("[data-slot='toast']").first()
    await expect(toast).toBeVisible()
    add("toast title", toast.locator(".sadu-toast__title"))
    add("toast description", toast.locator(".sadu-toast__description"))
    add("toast action", toast.locator(".sadu-toast__action"))
    add("toast dismiss", button(toast, "Dismiss"), 3)
    for (const check of checks) expect.soft(await contrastOf(check.locator), check.name).toBeGreaterThanOrEqual(check.minimum)

    const edge = await page.evaluate(() => {
      const probe = document.createElement("div")
      probe.style.color = "var(--sadu-edge)"
      probe.style.backgroundColor = "var(--sadu-surface)"
      document.querySelector(".gallery-card")?.append(probe)
      const styles = getComputedStyle(probe)
      const result = [styles.color, styles.backgroundColor]
      probe.remove()
      return result
    })
    const parse = (value: string) => {
      const numbers = (value.match(/[\d.]+/g) ?? []).map(Number)
      return value.startsWith("color(srgb") ? numbers.slice(0, 3).map((channel) => channel * 255) : numbers
    }
    const luminance = ([r = 0, g = 0, b = 0]: number[]) =>
      [r, g, b]
        .map((c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4))
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0)
    const [a, b] = [luminance(parse(edge[0] ?? "")), luminance(parse(edge[1] ?? ""))].sort((x, y) => y - x)
    expect((a! + 0.05) / (b! + 0.05)).toBeGreaterThanOrEqual(3)
  })
}

const SITE_PAGES = [
  { id: "sadu-dialog", trigger: "Edit main band", popup: "dialog" },
  { id: "sadu-alert-dialog", trigger: "Unravel band", popup: "alertdialog" },
  { id: "sadu-drawer", trigger: "Open order 14", popup: "dialog" },
  { id: "sadu-popover", trigger: "Band width", popup: "dialog" },
  { id: "sadu-tooltip", trigger: null, popup: null },
  { id: "sadu-hover-card", trigger: null, popup: null },
  { id: "sadu-toast", trigger: "Record dye lot", popup: null },
  { id: "sadu-collapsible", trigger: null, popup: null },
  { id: "sadu-accordion", trigger: null, popup: null },
  { id: "sadu-preferences", trigger: null, popup: null },
] as const

test.describe("catalogue pages", () => {
  for (const entry of SITE_PAGES) {
    test(`${entry.id} renders and its demo works`, async ({ page }) => {
      await page.goto(`/#/c/${entry.id}`)
      await expect(page.locator(".playground__stage")).toBeVisible()
      if (entry.trigger) {
        const trigger = page.locator(".playground__stage").getByRole("button", { name: entry.trigger, exact: true })
        await trigger.click()
        if (entry.popup) {
          await expect(page.getByRole(entry.popup).first()).toBeVisible()
          await page.keyboard.press("Escape")
          await expect(page.getByRole(entry.popup)).toHaveCount(0)
        } else {
          await expect(page.getByRole("region", { name: "Notifications" })).toBeVisible()
        }
      }
      await page.waitForTimeout(300)
    })
  }
})

test("the catalogue hover card opens inside its paragraph without errors", async ({ page }) => {
  await page.goto("/#/c/sadu-hover-card")
  await page.locator(".playground__stage").getByRole("link").first().hover()
  await expect(page.locator(".sadu-hover-card")).toBeVisible()
  await page.waitForTimeout(300)
})

for (const side of ["Top", "Bottom", "Left", "Right"] as const) {
  test(`the catalogue popover's arrow points at its trigger when asked for the ${side.toLowerCase()}`, async ({ page }) => {
    await page.goto("/#/c/sadu-popover")
    await page.getByRole("radio", { name: side, exact: true }).click()
    const trigger = page.locator(".playground__stage .sadu-popover-trigger")
    await trigger.click()
    const arrow = page.locator(".sadu-popup__arrow:not([data-specimen] *)")
    await expect(arrow).toBeVisible()
    const landed = await arrow.getAttribute("data-side")
    const [t, a] = await Promise.all([trigger.boundingBox(), arrow.boundingBox()])
    if (!t || !a) throw new Error("missing boxes")
    if (landed === "top" || landed === "bottom") expect(Math.abs(t.x + t.width / 2 - (a.x + a.width / 2))).toBeLessThan(2)
    else expect(Math.abs(t.y + t.height / 2 - (a.y + a.height / 2))).toBeLessThan(2)
    if (landed === "bottom") expect(a.y).toBeGreaterThanOrEqual(t.y + t.height)
    if (landed === "top") expect(a.y + a.height).toBeLessThanOrEqual(t.y)
    if (landed === "left") expect(a.x + a.width).toBeLessThanOrEqual(t.x)
    if (landed === "right") expect(a.x).toBeGreaterThanOrEqual(t.x + t.width)
  })
}

async function focusRing(locator: Locator): Promise<string> {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element)
    return style.outlineStyle === "none" || style.outlineWidth === "0px" ? "none" : `${style.outlineWidth} ${style.outlineStyle}`
  })
}

test("keyboard focus shows a ring on every overlay control", async ({ page }) => {
  await openGallery(page)
  const trigger = button(page, "Edit main band")
  await trigger.focus()
  await page.keyboard.press("Enter")
  const dismiss = button(page.getByRole("dialog"), "Close")
  await expect(dismiss).toBeFocused()
  expect(await focusRing(dismiss)).toBe("2px solid")
  await page.keyboard.press("Escape")

  await button(page, "Band width").focus()
  await page.keyboard.press("Tab")
  const link = page.getByRole("link", { name: "Uwairjan" })
  await expect(link).toBeFocused()
  expect(await focusRing(link)).toBe("2px solid")
  await page.keyboard.press("Escape")

  const weaving = button(page, "Weaving")
  await weaving.focus()
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Tab")
  await expect(weaving).toBeFocused()
  expect(await focusRing(weaving)).toBe("2px solid")

  const fold = button(page, "Wedding tent divider Folded, 3.6 m")
  await fold.focus()
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Tab")
  expect(await focusRing(fold)).toBe("2px solid")

  const reset = button(page, "Reset")
  await reset.focus()
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Tab")
  expect(await focusRing(reset)).toBe("2px solid")

  await button(page, "Record dye lot").click()
  await page.keyboard.press("F6")
  const region = page.getByRole("region", { name: "Notifications" })
  await expect.poll(() => region.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  await page.keyboard.press("Tab")
  const focused = page.locator(".sadu-toast :focus")
  await expect(focused).toHaveCount(1)
  expect(await focusRing(focused)).toBe("2px solid")
})

test("re-triggering folds and drawers mid-animation settles in the final state", async ({ page }) => {
  await openGallery(page)
  const fold = button(page, "Wedding tent divider Folded, 3.6 m")
  for (let index = 0; index < 3; index++) await fold.click()
  await expect(fold).toHaveAttribute("aria-expanded", "true")
  const panel = page.locator(".sadu-collapsible__panel").first()
  await expect.poll(() => runningAnimations(panel)).toBe(0)
  await expect(panel.locator(".sadu-collapsible__fold")).toHaveCSS("opacity", "1")
  await expect(panel.locator(".sadu-collapsible__fold")).toHaveCSS("rotate", "none")
  await expect(panel).toHaveCSS("height", /^(?!0px)/)

  const open = button(page, "Open order 14")
  await open.click()
  await page.keyboard.press("Escape")
  await open.click()
  const drawer = page.getByRole("dialog", { name: "Order 14" })
  await expect(drawer).toBeVisible()
  await expect.poll(() => drawer.evaluate((element) => getComputedStyle(element).getPropertyValue("--drawer-progress").trim())).toBe("1")
  await expect(drawer.locator(".sadu-drawer__roll")).toHaveCSS("width", "0px")
  await expect(page.locator(".sadu-drawer")).toHaveCount(1)

  await page.keyboard.press("Escape")
  await expect(drawer).toHaveCount(0)
  const unravel = page.locator("button[aria-haspopup]", { hasText: "Unravel band" })
  await unravel.click()
  await page.keyboard.press("Escape")
  await unravel.click()
  const alert = page.getByRole("alertdialog")
  await expect(alert).toBeVisible()
  await expect.poll(() => runningAnimations(alert), { timeout: 3000 }).toBe(0)
  await expect(alert).toHaveCSS("opacity", "1")
  await expect(page.locator(".sadu-alert-dialog")).toHaveCount(1)
})

test("the hover card stays open while the pointer crosses into it", async ({ page }) => {
  await openGallery(page)
  const link = page.getByRole("link", { name: "Uwairjan" })
  await link.hover()
  const card = page.locator(".sadu-hover-card")
  await expect(card).toBeVisible()
  const box = await card.boundingBox()
  if (!box) throw new Error("missing card")
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 })
  await page.waitForTimeout(500)
  await expect(card).toBeVisible()
  await expect(card).toHaveCSS("opacity", "1")
})

const SPECIMEN_PAGES = [
  "sadu-dialog",
  "sadu-alert-dialog",
  "sadu-drawer",
  "sadu-popover",
  "sadu-tooltip",
  "sadu-toast",
  "sadu-hover-card",
] as const

for (const id of SPECIMEN_PAGES) {
  test(`the ${id} open-state specimen on its detail page renders fully opaque on its own`, async ({ page }) => {
    await page.goto(`/#/c/${id}`)
    const specimen = page
      .locator(
        ":is(.sadu-dialog, .sadu-alert-dialog, .sadu-drawer, .sadu-popover, .sadu-tooltip, .sadu-toast, .sadu-hover-card)[data-specimen] >> visible=true",
      )
      .first()
    await expect(specimen).toBeAttached({ timeout: 10000 })
    await page.evaluate(() => {
      for (const sheet of [...document.styleSheets]) {
        let rules: CSSRuleList
        try {
          rules = sheet.cssRules
        } catch {
          continue
        }
        for (let index = rules.length - 1; index >= 0; index--) {
          const rule = rules[index]
          if (rule instanceof CSSStyleRule && rule.selectorText.includes(".specimen") && rule.selectorText.includes("[data-specimen]")) {
            sheet.deleteRule(index)
          }
        }
      }
    })
    const entry = await specimen.evaluate((element) => {
      const hidden = [element, ...element.querySelectorAll("*")]
        .filter((node) => node.textContent?.trim() && node.children.length === 0)
        .filter((node) => {
          let opacity = 1
          for (let current: Element | null = node; current && current !== element.parentElement; current = current.parentElement) {
            opacity *= Number(getComputedStyle(current).opacity)
          }
          return opacity < 1
        })
        .map((node) => node.textContent?.trim())
      return { hidden, running: element.getAnimations({ subtree: true }).length }
    })
    expect(entry.hidden).toEqual([])
    expect(entry.running).toBe(0)
  })
}
