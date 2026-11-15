import { expect, test, type Locator, type Page } from "@playwright/test"

const FAMILIES = ["overlays", "menus", "inputs", "pickers", "display"] as const

type Family = (typeof FAMILIES)[number]

type Box = { x: number; y: number; width: number; height: number }

function watchConsole(page: Page): string[] {
  const problems: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`${message.type()}: ${message.text()}`)
  })
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`))
  return problems
}

async function openRtlGallery(page: Page, family: Family): Promise<void> {
  await page.addInitScript(() => {
    const force = (): void => {
      const root = document.documentElement
      if (root && (root.dir !== "rtl" || root.lang !== "ar")) {
        root.dir = "rtl"
        root.lang = "ar"
      }
    }
    new MutationObserver(force).observe(document, { attributes: true, childList: true, subtree: true })
    force()
  })
  await page.goto(`/?gallery=${family}`)
  await expect(page.locator(".gallery-card").first()).toBeVisible()
}

async function openRtlSite(page: Page, hash = ""): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem("sadu-site-settings", JSON.stringify({ dye: "madder", theme: "day", direction: "rtl", motion: "reduced" }))
  })
  await page.goto(`/${hash}`)
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
}

function card(page: Page, name: string): Locator {
  return page.locator(".gallery-card", { has: page.locator(".gallery-card__name", { hasText: new RegExp(`^${name}$`) }) })
}

async function box(locator: Locator): Promise<Box> {
  const found = await locator.boundingBox()
  if (!found) throw new Error("element has no box")
  return found
}

async function focusedBox(page: Page): Promise<Box> {
  return page.evaluate(() => {
    const rect = (document.activeElement ?? document.body).getBoundingClientRect()
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
  })
}

const centre = (target: Box): number => target.x + target.width / 2

async function expectInsideViewport(page: Page, popup: Locator): Promise<void> {
  const viewport = page.viewportSize()
  if (!viewport) throw new Error("no viewport")
  const rect = await box(popup)
  expect(rect.x).toBeGreaterThanOrEqual(0)
  expect(rect.y).toBeGreaterThanOrEqual(0)
  expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width)
  expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height)
}

async function pressAndCompare(page: Page, start: Locator, key: string): Promise<{ before: Box; after: Box }> {
  await start.focus()
  const before = await focusedBox(page)
  await page.keyboard.press(key)
  return { before, after: await focusedBox(page) }
}

async function overflowingParts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problems: string[] = []
    const clips = (element: Element, card: Element): boolean => {
      for (let parent = element.parentElement; parent && parent !== card; parent = parent.parentElement) {
        const style = getComputedStyle(parent)
        if (style.overflowX !== "visible") return true
      }
      return false
    }
    for (const card of document.querySelectorAll(".gallery-card")) {
      const name = card.querySelector(".gallery-card__name")?.textContent ?? "?"
      const bounds = card.getBoundingClientRect()
      for (const element of card.querySelectorAll("*")) {
        const rect = element.getBoundingClientRect()
        if (!rect.width || getComputedStyle(element).position === "fixed") continue
        const outside = rect.left < bounds.left - 1 || rect.right > bounds.right + 1
        if (outside && !clips(element, card)) problems.push(`${name}: ${element.tagName.toLowerCase()}.${String(element.getAttribute("class"))}`)
      }
    }
    return problems
  })
}

test.describe("RTL galleries", () => {
  for (const family of FAMILIES) {
    test(`${family} mirrors without overflow or console errors`, async ({ page }) => {
      const problems = watchConsole(page)
      await openRtlGallery(page, family)
      await page.waitForTimeout(600)
      const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
      expect(widths.scroll).toBeLessThanOrEqual(widths.client)
      expect(await overflowingParts(page)).toEqual([])
      expect(problems).toEqual([])
    })
  }

  test("demo copy, captions and accessible names are Arabic", async ({ page }) => {
    const leftovers: Record<string, string[]> = {}
    for (const family of FAMILIES) {
      await openRtlGallery(page, family)
      leftovers[family] = await page.evaluate(() => {
        const words = new Set<string>()
        const latinRun = /[A-Za-z]{2,}/g
        const keepsLatin = (element: Element | null): boolean =>
          Boolean(element?.closest('[lang="en"], [dir="ltr"], .sadu-code, .sadu-file__row, .gallery-card__name'))
        for (const card of document.querySelectorAll(".gallery-card")) {
          const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT)
          while (walker.nextNode()) {
            const node = walker.currentNode
            if (keepsLatin(node.parentElement)) continue
            for (const match of node.textContent?.matchAll(latinRun) ?? []) words.add(match[0])
          }
          for (const element of card.querySelectorAll("[aria-label], [placeholder]")) {
            if (keepsLatin(element)) continue
            for (const name of ["aria-label", "placeholder"]) {
              for (const match of element.getAttribute(name)?.matchAll(latinRun) ?? []) words.add(match[0])
            }
          }
        }
        return [...words].sort()
      })
    }
    expect(leftovers).toEqual({ overlays: [], menus: ["PDF", "Tab"], inputs: [], pickers: ["PDF", "PNG", "px"], display: [] })
  })

  test("Arabic text is never tracked", async ({ page }) => {
    await openRtlGallery(page, "inputs")
    const spacing = await page.locator(".sadu-field__label").first().evaluate((label) => getComputedStyle(label).letterSpacing)
    expect(["0px", "normal"]).toContain(spacing)
  })
})

test.describe("RTL arrow keys follow the visual direction", () => {
  test("menus: segmented control, toolbar, toggle group, menubar and navigation menu move left on ArrowLeft", async ({ page }) => {
    await openRtlGallery(page, "menus")
    const starts = [
      card(page, "Segmented Control").locator('[role="radio"][aria-checked="true"]'),
      card(page, "Toolbar").locator(".sadu-loom-toolbar button").first(),
      card(page, "Toggle").locator(".sadu-warp-toggle-group button").first(),
      card(page, "Menubar").locator('[role="menubar"] [role="menuitem"]').first(),
      card(page, "Navigation Menu").locator(".sadu-nav__trigger").first(),
    ]
    for (const start of starts) {
      const { before, after } = await pressAndCompare(page, start, "ArrowLeft")
      expect(centre(after)).toBeLessThan(centre(before))
    }
  })

  test("calendar: ArrowLeft is the next day, ArrowRight the previous", async ({ page }) => {
    await openRtlGallery(page, "pickers")
    const calendar = card(page, "Calendar")
    await calendar.locator('td[data-value="2026-11-11"]').click()
    await page.keyboard.press("ArrowLeft")
    await expect(calendar.locator("td:focus")).toHaveAttribute("data-value", "2026-11-12")
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight")
    await expect(calendar.locator("td:focus")).toHaveAttribute("data-value", "2026-11-10")
  })

  test("carousel: ArrowLeft picks the next slide, which sits further left", async ({ page }) => {
    await openRtlGallery(page, "pickers")
    const picks = card(page, "Carousel").locator(".sadu-carousel__pick")
    const { before, after } = await pressAndCompare(page, picks.first(), "ArrowLeft")
    expect(centre(after)).toBeLessThan(centre(before))
    await expect(picks.nth(1)).toBeFocused()
  })

  test("tree: ArrowLeft expands and enters, ArrowRight returns to the parent", async ({ page }) => {
    await openRtlGallery(page, "pickers")
    const tree = card(page, "Tree")
    const parent = tree.locator('[role="treeitem"][aria-expanded="true"]').last()
    const value = await parent.getAttribute("id")
    await parent.focus()
    await page.keyboard.press("ArrowRight")
    await expect(tree.locator(`[id="${value}"]`)).toHaveAttribute("aria-expanded", "false")
    await page.keyboard.press("ArrowLeft")
    await expect(tree.locator(`[id="${value}"]`)).toHaveAttribute("aria-expanded", "true")
    await page.keyboard.press("ArrowLeft")
    await expect(tree.locator(`[id="${value}"]`)).not.toBeFocused()
    await page.keyboard.press("ArrowRight")
    await expect(tree.locator(`[id="${value}"]`)).toBeFocused()
  })

  test("color picker hue: ArrowLeft raises the hue and moves the beater left over a mirrored spectrum", async ({ page }) => {
    await openRtlGallery(page, "pickers")
    const picker = card(page, "Color Picker")
    const hue = picker.locator('[role="slider"][aria-label="درجة اللون"]')
    const before = Number(await hue.getAttribute("aria-valuenow"))
    const x = centre(await box(hue))
    await hue.focus()
    await page.keyboard.press("ArrowLeft")
    expect(Number(await hue.getAttribute("aria-valuenow"))).toBeGreaterThan(before)
    expect(centre(await box(hue))).toBeLessThan(x)
    const gradient = await picker.locator(".sadu-color__hue").evaluate((track) => getComputedStyle(track).backgroundImage)
    expect(gradient).toContain("270deg")
  })

  test("resizable: ArrowLeft moves the beam left", async ({ page }) => {
    await openRtlGallery(page, "display")
    const handle = card(page, "Resizable").locator(".sadu-resizable__handle").first()
    const x = (await box(handle)).x
    await handle.focus()
    await page.keyboard.press("ArrowLeft")
    await expect.poll(async () => (await box(handle)).x).toBeLessThan(x)
  })

  test("date segments read right to left in Arabic; time keeps hour before minute", async ({ page }) => {
    await openRtlGallery(page, "inputs")
    const day = card(page, "Date Input").locator('.sadu-date-input [role="spinbutton"]').first()
    const date = await pressAndCompare(page, day, "ArrowLeft")
    expect(centre(date.after)).toBeLessThan(centre(date.before))
    const time = card(page, "Time Input").locator(".sadu-time-input")
    expect(await time.evaluate((element) => getComputedStyle(element).direction)).toBe("ltr")
    const hour = time.locator('[role="spinbutton"]').first()
    const clock = await pressAndCompare(page, hour, "ArrowRight")
    expect(centre(clock.after)).toBeGreaterThan(centre(clock.before))
  })

  test("site: loom slider and tabs follow the reading direction", async ({ page }) => {
    await openRtlSite(page)
    const thumb = page.locator('[data-id="loom-slider"] .sadu-loom__thumb').first()
    const x = (await box(thumb)).x
    await page.locator('[data-id="loom-slider"] [role="slider"]').first().focus()
    await page.keyboard.press("ArrowLeft")
    await expect.poll(async () => (await box(thumb)).x).toBeLessThan(x)
    const tab = page.locator('[data-id="sadu-tabs"] [role="tab"][aria-selected="true"]')
    const { before, after } = await pressAndCompare(page, tab, "ArrowLeft")
    expect(centre(after)).toBeLessThan(centre(before))
  })
})

test.describe("RTL popups", () => {
  test("menu opens inside the viewport and its submenu opens to the left on ArrowLeft", async ({ page }) => {
    await openRtlGallery(page, "menus")
    const menuCard = card(page, "Menu")
    await menuCard.scrollIntoViewIfNeeded()
    await menuCard.locator("button[aria-haspopup]").last().click()
    const menu = page.locator('[role="menu"]:has([aria-haspopup])').last()
    await expect(menu).toBeVisible()
    await expectInsideViewport(page, menu)
    const parent = await box(menu)
    await menu.locator("[aria-haspopup]").first().focus()
    await page.keyboard.press("ArrowLeft")
    const submenu = page.locator('[role="menu"]:not(:has([aria-haspopup]))').last()
    await expect(submenu).toBeVisible()
    await expect(submenu).toContainText(/\S/)
    await expectInsideViewport(page, submenu)
    expect((await box(submenu)).x).toBeLessThan(parent.x)
  })

  test("menubar submenus open toward the inline end", async ({ page }) => {
    await openRtlGallery(page, "menus")
    await card(page, "Menubar").locator('[role="menubar"] [role="menuitem"]').first().click()
    const menu = page.locator('[role="menu"]').last()
    await expect(menu).toBeVisible()
    await expectInsideViewport(page, menu)
    const parent = await box(menu)
    await menu.locator("[aria-haspopup]").first().hover()
    await expect(page.locator('[role="menu"]')).toHaveCount(2)
    const submenu = page.locator('[role="menu"]').last()
    await expectInsideViewport(page, submenu)
    expect((await box(submenu)).x).toBeLessThan(parent.x)
  })

  test("popover, date picker and combobox stay on screen", async ({ page }) => {
    await openRtlGallery(page, "overlays")
    await card(page, "Popover").locator("button").first().click()
    const popover = page.locator('[role="dialog"]').last()
    await expect(popover).toBeVisible()
    await expectInsideViewport(page, popover)

    await openRtlGallery(page, "pickers")
    await card(page, "Date Picker").locator(".sadu-date-picker__trigger").first().click()
    const calendar = page.locator(".sadu-date-picker__popup").first()
    await expect(calendar).toBeVisible()
    await expectInsideViewport(page, calendar)

    await openRtlGallery(page, "inputs")
    await card(page, "Combobox").locator("input").first().click()
    const list = page.locator('[role="listbox"]').last()
    await expect(list).toBeVisible()
    await expectInsideViewport(page, list)
  })

  test("drawer slides in from the inline end, which is the left", async ({ page }) => {
    await openRtlGallery(page, "overlays")
    await card(page, "Drawer").locator("button").first().click()
    const drawer = page.locator('[role="dialog"]').last()
    await expect(drawer).toBeVisible()
    await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))))
    expect((await box(drawer)).x).toBeLessThanOrEqual(1)
  })
})

test.describe("RTL glyphs and runs", () => {
  test("undo, redo and chevrons mirror; plus and search do not", async ({ page }) => {
    await openRtlGallery(page, "menus")
    const scaleOf = (locator: Locator) => locator.evaluate((icon) => getComputedStyle(icon).scale)
    const toolbar = card(page, "Toolbar")
    expect(await scaleOf(toolbar.locator("svg.lucide-undo2"))).toBe("-1 1")
    expect(await scaleOf(toolbar.locator("svg.lucide-redo2"))).toBe("-1 1")
    expect(await scaleOf(card(page, "Button").locator("svg.lucide-plus").first())).toBe("none")
    await openRtlGallery(page, "inputs")
    expect(await scaleOf(card(page, "Autocomplete").locator("svg.lucide-search"))).toBe("none")
    await openRtlGallery(page, "pickers")
    expect(await scaleOf(card(page, "Calendar").locator(".sadu-calendar__step svg").first())).toBe("-1 1")
  })

  test("code stays left to right", async ({ page }) => {
    await openRtlGallery(page, "display")
    const code = card(page, "Code Block").locator("pre, code").first()
    expect(await code.evaluate((element) => getComputedStyle(element).direction)).toBe("ltr")
  })

  test("Arabic weekday headers fit their column", async ({ page }) => {
    await openRtlGallery(page, "pickers")
    const headers = card(page, "Calendar").locator(".sadu-calendar__weekday")
    const fits = await headers.evaluateAll((cells) => cells.every((cell) => cell.scrollWidth <= cell.clientWidth))
    expect(fits).toBe(true)
  })

  test("Latin names in RTL rows sit against the row start", async ({ page }) => {
    await openRtlGallery(page, "pickers")
    const row = card(page, "Listbox").locator(".sadu-listbox__item").first()
    const name = row.locator(".sadu-listbox__name")
    const gapAtStart = await name.evaluate((element) => {
      const range = document.createRange()
      range.selectNodeContents(element)
      return element.getBoundingClientRect().right - range.getBoundingClientRect().right
    })
    expect(gapAtStart).toBeLessThan(1)
  })
})

test.describe("RTL site", () => {
  test("catalogue cards do not overflow and the console stays clean", async ({ page }) => {
    const problems = watchConsole(page)
    await openRtlSite(page)
    await expect(page.locator(".catalog-card").first()).toBeVisible()
    const overflowing = await page.locator(".catalog-card").evaluateAll((cards) =>
      cards.filter((card) => card.scrollWidth > card.clientWidth + 1).map((card) => card.getAttribute("data-id")),
    )
    expect(overflowing).toEqual([])
    expect(problems).toEqual([])
  })

  test("home page never scrolls sideways in RTL", async ({ page }) => {
    await openRtlSite(page)
    await page.waitForTimeout(3000)
    const widths = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
    expect(widths[0]).toBeLessThanOrEqual(widths[1])
  })
})
