import { expect, test, type Locator, type Page } from "@playwright/test"

type Problems = { list: string[] }

function watch(page: Page): Problems {
  const problems: Problems = { list: [] }
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") problems.list.push(`${message.type()}: ${message.text()}`)
  })
  page.on("pageerror", (error) => problems.list.push(`pageerror: ${error.message}`))
  return problems
}

async function openGallery(page: Page): Promise<Problems> {
  const problems = watch(page)
  await page.goto("/?gallery=menus")
  await expect(page.locator(".gallery-card").first()).toBeVisible({ timeout: 15000 })
  return problems
}

function card(page: Page, name: string): Locator {
  return page.locator(".gallery-card").filter({ has: page.locator(".gallery-card__name", { hasText: new RegExp(`^${name}$`) }) })
}

async function box(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  const rect = await locator.boundingBox()
  if (!rect) throw new Error("No box")
  return rect
}

async function setDirection(page: Page, dir: "rtl" | "ltr"): Promise<void> {
  await page.evaluate((value) => document.documentElement.setAttribute("dir", value), dir)
}

test("the gallery renders every card with no console errors or warnings", async ({ page }) => {
  const problems = await openGallery(page)
  await expect(page.locator(".gallery-card")).toHaveCount(10)
  await page.waitForTimeout(600)
  expect(problems.list).toEqual([])
})

test.describe("Button", () => {
  test("a pending press blocks a second one and the beater settles when it ends", async ({ page }) => {
    const problems = await openGallery(page)
    const send = card(page, "Button").getByRole("button", { name: "Send to loom" })
    await send.click()
    await send.click({ force: true })
    await expect(send).toHaveAttribute("data-pending", "")
    await expect(send).toHaveAttribute("aria-busy", "true")
    const beater = send.locator(".sadu-button__beater")
    await expect(beater).toHaveCSS("opacity", "1")
    await expect(send).not.toHaveAttribute("data-pending", "", { timeout: 5000 })
    await expect(beater).toHaveCSS("opacity", "0")
    const cloth = await box(send.locator(".sadu-button__cloth"))
    const hem = await box(send.locator(".sadu-button__hem"))
    expect(cloth.width).toBeGreaterThanOrEqual(hem.width - 0.5)
    expect(problems.list).toEqual([])
  })

  test("Enter and Space press it, and focus is visible", async ({ page }) => {
    await openGallery(page)
    const save = card(page, "Button").getByRole("button", { name: "Save band" })
    await save.focus()
    await page.keyboard.press("Tab")
    await page.keyboard.press("Shift+Tab")
    await expect(save).toBeFocused()
    await expect(save).toHaveCSS("outline-style", "solid")
    await page.keyboard.press("Space")
    await page.keyboard.press("Enter")
  })
})

test.describe("Toggle", () => {
  test("pressing weaves the cloth across the whole face and unpressing unweaves it", async ({ page }) => {
    await openGallery(page)
    const group = card(page, "Toggle").getByRole("group", { name: "Band alignment" })
    const start = group.getByRole("button", { name: "Start" })
    const centre = group.getByRole("button", { name: "Centre" })
    await start.click()
    await expect(start).toHaveAttribute("aria-pressed", "true")
    await expect(centre).toHaveAttribute("aria-pressed", "false")
    await page.waitForTimeout(400)
    const face = await box(start)
    expect((await box(start.locator(".sadu-warp-toggle__cloth"))).width).toBeGreaterThanOrEqual(face.width - 1)
    expect((await centre.locator(".sadu-warp-toggle__cloth").evaluate((node) => node.getBoundingClientRect().width))).toBe(0)
  })

  test("rapid presses end in the state of the last press", async ({ page }) => {
    await openGallery(page)
    const mirror = card(page, "Toggle").getByRole("button", { name: "Mirror" })
    for (let index = 0; index < 5; index++) await mirror.click({ delay: 10 })
    await page.waitForTimeout(400)
    await expect(mirror).toHaveAttribute("aria-pressed", "false")
    expect(await mirror.locator(".sadu-warp-toggle__cloth").evaluate((node) => node.getBoundingClientRect().width)).toBe(0)
  })

  test("arrow keys move between toggles in a group", async ({ page }) => {
    await openGallery(page)
    const group = card(page, "Toggle").getByRole("group", { name: "Band alignment" })
    await group.getByRole("button", { name: "Centre" }).focus()
    await page.keyboard.press("ArrowRight")
    await expect(group.getByRole("button", { name: "End" })).toBeFocused()
    await page.keyboard.press("Space")
    await expect(group.getByRole("button", { name: "End" })).toHaveAttribute("aria-pressed", "true")
  })
})

test.describe("Segmented Control", () => {
  async function bandOn(control: Locator): Promise<boolean> {
    return control.evaluate((root) => {
      const checked = root.querySelector('[data-slot="segmented-control-item"][data-checked]')
      const band = checked?.querySelector(".sadu-segmented__band")
      if (!checked || !band) return false
      const a = checked.getBoundingClientRect()
      const b = band.getBoundingClientRect()
      return getComputedStyle(band).visibility === "visible" && Math.abs(a.left - b.left) < 1 && Math.abs(a.right - b.right) < 1
    })
  }

  test("arrow keys check items, and the band sits on the checked item when the shuttle lands", async ({ page }) => {
    await openGallery(page)
    const control = card(page, "Segmented Control").getByRole("radiogroup", { name: "Ground" })
    await control.getByRole("radio", { name: "Goat hair" }).focus()
    await page.keyboard.press("ArrowRight")
    await expect(control.getByRole("radio", { name: "Camel" })).toHaveAttribute("aria-checked", "true")
    await expect(control).not.toHaveAttribute("data-moving", "", { timeout: 1500 })
    expect(await bandOn(control)).toBe(true)
  })

  test("after a switch to right to left the checked item still shows the band, and arrows follow the reading direction", async ({ page }) => {
    await openGallery(page)
    const control = card(page, "Segmented Control").getByRole("radiogroup", { name: "Ground" })
    await setDirection(page, "rtl")
    await page.waitForTimeout(100)
    expect(await bandOn(control)).toBe(true)
    await control.getByRole("radio", { name: "Goat hair" }).focus()
    await page.keyboard.press("ArrowLeft")
    await expect(control.getByRole("radio", { name: "Camel" })).toHaveAttribute("aria-checked", "true")
    await expect(control).not.toHaveAttribute("data-moving", "", { timeout: 1500 })
    expect(await bandOn(control)).toBe(true)
    const checkedLabel = control.getByRole("radio", { name: "Camel" })
    await expect(checkedLabel).toHaveCSS("color", "rgb(230, 217, 191)")
  })

  test("rapid changes leave no shuttle or thread behind", async ({ page }) => {
    await openGallery(page)
    const control = card(page, "Segmented Control").getByRole("radiogroup", { name: "Ground" })
    for (const name of ["Wool", "Camel", "Wool", "Goat hair", "Camel"]) await control.getByRole("radio", { name }).click({ delay: 5 })
    await expect(control).not.toHaveAttribute("data-moving", "", { timeout: 1500 })
    await expect(control.locator(".sadu-segmented__shuttle")).toHaveCSS("opacity", "0")
    await expect(control.locator(".sadu-segmented__thread")).toHaveCSS("visibility", "hidden")
    expect(await bandOn(control)).toBe(true)
  })
})

test.describe("Toolbar", () => {
  test("is a single tab stop with roving focus and a working motif select", async ({ page }) => {
    await openGallery(page)
    const toolbar = card(page, "Toolbar").getByRole("toolbar", { name: "Band editor" })
    await card(page, "Button").getByRole("button", { name: "Send to loom" }).focus()
    await page.keyboard.press("Tab")
    await expect(toolbar.getByRole("button", { name: "Undo" })).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await expect(toolbar.getByRole("button", { name: "Redo" })).toBeFocused()
    await page.keyboard.press("End")
    await expect(toolbar.getByRole("button", { name: "Zoom in" })).toBeFocused()
    await page.keyboard.press("Tab")
    expect(await toolbar.evaluate((node) => node.contains(document.activeElement))).toBe(false)
    const select = toolbar.getByRole("combobox", { name: "Motif" })
    await select.click()
    const listbox = page.locator(".sadu-loom-toolbar__popup")
    await expect(listbox).toBeVisible()
    await listbox.getByRole("option", { name: /Hubub/ }).click()
    await expect(select).toContainText("Hubub")
    await expect(listbox).toBeHidden()
  })
})

test.describe("Menu", () => {
  test("opens by click, enters the submenu by hover and keys, Escape closes one level, choosing closes all", async ({ page }) => {
    const problems = await openGallery(page)
    const trigger = card(page, "Menu").getByRole("button", { name: "Band actions" })
    await trigger.click()
    const menu = page.getByRole("menu").first()
    await expect(menu).toBeVisible()
    await page.getByRole("menuitem", { name: "Dye" }).hover()
    await expect(page.getByRole("menu")).toHaveCount(2)
    await page.keyboard.press("ArrowRight")
    await expect(page.getByRole("menuitemradio", { name: "Madder" })).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("menu")).toHaveCount(1)
    await expect(page.getByRole("menuitem", { name: "Dye" })).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")
    await expect(page.getByRole("menuitemradio", { name: "Saffron" })).toHaveAttribute("aria-checked", "true")
    await page.keyboard.press("ArrowLeft")
    await expect(page.getByRole("menu")).toHaveCount(1)
    await page.getByRole("menuitem", { name: /Duplicate band/ }).click()
    await expect(page.getByRole("menu")).toHaveCount(0)
    await expect(trigger).toBeFocused()
    expect(problems.list).toEqual([])
  })

  test("the submenu opens to the left and with ArrowLeft in right to left", async ({ page }) => {
    await openGallery(page)
    await setDirection(page, "rtl")
    const trigger = card(page, "Menu").getByRole("button", { name: "Band actions" })
    await trigger.focus()
    await page.keyboard.press("ArrowDown")
    for (let index = 0; index < 4; index++) await page.keyboard.press("ArrowDown")
    await expect(page.getByRole("menuitem", { name: "Dye" })).toBeFocused()
    await page.keyboard.press("ArrowLeft")
    const menus = page.getByRole("menu")
    await expect(menus).toHaveCount(2)
    const parent = await box(menus.nth(0))
    const child = await box(menus.nth(1))
    expect(child.x + child.width).toBeLessThanOrEqual(parent.x + 4)
    await page.keyboard.press("ArrowRight")
    await expect(menus).toHaveCount(1)
  })

  test("checkbox items keep the menu open and show an eye only when checked", async ({ page }) => {
    await openGallery(page)
    await card(page, "Menu").getByRole("button", { name: "Band actions" }).click()
    const rows = page.getByRole("menuitemcheckbox", { name: "Show row numbers" })
    await expect(rows.locator(".sadu-menu__eye")).toHaveCount(0)
    await rows.click()
    await expect(rows).toHaveAttribute("aria-checked", "true")
    await expect(rows.locator(".sadu-menu__eye")).toHaveAttribute("data-state", "on")
    await expect(page.getByRole("menu")).toBeVisible()
    await expect(rows.locator(".sadu-menu__text")).toHaveCSS("font-weight", "600")
    await expect(rows.locator('[data-slot="menu-shortcut"]')).toHaveCount(0)
    const duplicate = page.getByRole("menuitem", { name: /Duplicate band/ })
    await expect(duplicate.locator('[data-slot="menu-shortcut"]')).toHaveCount(1)
    await expect(duplicate.locator(".sadu-kbd__key")).toHaveCount(2)
  })

  test("typeahead moves to an item by its first letter", async ({ page }) => {
    await openGallery(page)
    await card(page, "Menu").getByRole("button", { name: "Band actions" }).focus()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("menu")).toBeVisible()
    await expect(page.getByRole("menu").getByRole("menuitem").first()).toBeFocused()
    await page.keyboard.press("r")
    await expect(page.getByRole("menuitem", { name: "Remove band" })).toBeFocused()
  })
})

test.describe("Menubar", () => {
  test("arrows move between menus, hover switches the open menu, Escape returns focus", async ({ page }) => {
    await openGallery(page)
    const bar = card(page, "Menubar").getByRole("menubar", { name: "Weaving studio" })
    await bar.getByRole("menuitem", { name: "Loom" }).click()
    await expect(page.getByRole("menuitem", { name: /New band/ })).toBeVisible()
    await bar.getByRole("menuitem", { name: "Band", exact: true }).hover()
    await expect(page.getByRole("menuitem", { name: /Insert row/ })).toBeVisible()
    await expect(page.getByRole("menuitem", { name: /New band/ })).toBeHidden()
    await page.keyboard.press("ArrowLeft")
    await expect(page.getByRole("menuitem", { name: /New band/ })).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(bar.getByRole("menuitem", { name: "Loom" })).toBeFocused()
    await expect(page.getByRole("menu")).toHaveCount(0)
  })

  test("rapid dye changes leave one settled layer per band and no beater", async ({ page }) => {
    await openGallery(page)
    const studio = card(page, "Menubar")
    const bar = studio.getByRole("menubar", { name: "Weaving studio" })
    for (const dye of ["Indigo", "Saffron", "Camel"]) {
      await bar.getByRole("menuitem", { name: "Wool" }).click()
      await page.getByRole("menuitemradio", { name: dye }).click()
      await page.keyboard.press("Escape")
    }
    await expect(studio.getByText("Ain in camel, even tension")).toBeVisible()
    await expect
      .poll(() => studio.locator(".sadu-reweave").evaluateAll((weaves) => weaves.every((weave) => weave.querySelectorAll(".sadu-reweave__layer").length === 1)), { timeout: 4000 })
      .toBe(true)
    await expect(studio.locator(".sadu-beater")).toHaveCount(0, { timeout: 4000 })
  })

  test("an open menu hangs flush from the rod", async ({ page }) => {
    await openGallery(page)
    const bar = card(page, "Menubar").getByRole("menubar", { name: "Weaving studio" })
    await bar.getByRole("menuitem", { name: "Wool" }).click()
    const rod = await box(bar)
    const menu = await box(page.getByRole("menu"))
    expect(Math.abs(menu.y - (rod.y + rod.height))).toBeLessThanOrEqual(1)
  })
})

test.describe("Navigation Menu", () => {
  test("opens, switches panels, Escape closes back to the trigger, and links are reachable", async ({ page }) => {
    await openGallery(page)
    const nav = card(page, "Navigation Menu").getByRole("navigation", { name: "Sadu House" })
    const motifs = nav.getByRole("button", { name: "Motifs" })
    await motifs.click()
    await expect(motifs).toHaveAttribute("aria-expanded", "true")
    await expect(page.getByRole("link", { name: /Uwairjan/ })).toHaveAttribute("aria-current", "page")
    await page.keyboard.press("Tab")
    await expect(page.getByRole("link", { name: /^Ain/ })).toBeFocused()
    await nav.getByRole("button", { name: "Pieces" }).click()
    await expect(page.getByRole("link", { name: /Tent divider/ })).toBeVisible()
    const pieces = await box(nav.getByRole("button", { name: "Pieces" }))
    await expect
      .poll(async () => {
        const eye = await box(page.locator(".sadu-nav__eye"))
        return Math.abs(eye.x + eye.width / 2 - (pieces.x + pieces.width / 2))
      })
      .toBeLessThanOrEqual(2)
    await nav.getByRole("button", { name: "Pieces" }).focus()
    await page.keyboard.press("Escape")
    await expect(nav.getByRole("button", { name: "Pieces" })).toHaveAttribute("aria-expanded", "false")
    await expect(nav.getByRole("button", { name: "Pieces" })).toBeFocused()
  })
})

test.describe("Command", () => {
  test("filters, stitches repeated letters, runs with Enter and shows the empty warp", async ({ page }) => {
    await openGallery(page)
    const command = card(page, "Command")
    const input = command.getByRole("combobox", { name: "Search the loom" })
    await input.fill("")
    await input.pressSequentially("madd")
    const madder = command.getByRole("option", { name: "Madder skeins" })
    const stitched = await madder.locator("mark.sadu-stitch").allTextContents()
    expect(stitched.join("")).toBe("Madd")
    await expect(madder.locator("mark.sadu-stitch").first()).toHaveCSS("text-decoration-style", "dashed")
    await input.pressSequentially("er sk")
    await expect(madder).toHaveAttribute("data-highlighted", "")
    await page.keyboard.press("Enter")
    await expect(command.getByText("Ran: Madder skeins")).toBeVisible()
    await input.fill("")
    await input.pressSequentially("zqx")
    await expect(command.getByText("Nothing woven under “zqx”.")).toBeVisible()
    await expect(command.getByRole("option")).toHaveCount(0)
  })

  test("the beater taps on each keystroke and settles", async ({ page }) => {
    await openGallery(page)
    const command = card(page, "Command")
    await command.getByRole("combobox", { name: "Search the loom" }).pressSequentially("or", { delay: 20 })
    await page.waitForTimeout(300)
    const animations = await command.locator(".sadu-command__beater").evaluate((node) => node.getAnimations().length)
    expect(animations).toBe(0)
  })
})

test.describe("Trigger Menu", () => {
  async function caretAtEnd(editor: Locator): Promise<void> {
    await editor.click()
    await editor.evaluate((node) => {
      const range = document.createRange()
      range.selectNodeContents(node)
      range.collapse(false)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    })
  }

  test("# suggests motifs at the caret, Enter weaves a chip in, Backspace takes it out", async ({ page }) => {
    const problems = await openGallery(page)
    const editor = card(page, "Trigger Menu").getByRole("textbox", { name: "Note for the weaver" })
    const chips = editor.locator('.sadu-note__token[data-kind="motif"]')
    await expect(chips).toHaveCount(1)
    await caretAtEnd(editor)
    await page.keyboard.type(" #dh")
    const list = page.locator(".sadu-note__popup")
    await expect(list).toBeVisible()
    await expect(list.getByRole("option")).toHaveCount(2)
    const caret = await page.evaluate(() => window.getSelection()?.getRangeAt(0).getBoundingClientRect().x ?? 0)
    const popup = await box(page.locator(".sadu-note__popup"))
    expect(Math.abs(popup.x - caret)).toBeLessThanOrEqual(60)
    await page.keyboard.press("Enter")
    await expect(chips).toHaveCount(2)
    await expect(chips.nth(1)).toContainText("Dhurus")
    await expect(list).toBeHidden()
    await page.keyboard.press("Backspace")
    await page.keyboard.press("Backspace")
    await expect(chips).toHaveCount(1)
    expect(problems.list).toEqual([])
  })

  test("@ suggests weavers and Escape closes without inserting", async ({ page }) => {
    await openGallery(page)
    const editor = card(page, "Trigger Menu").getByRole("textbox", { name: "Note for the weaver" })
    await caretAtEnd(editor)
    await page.keyboard.type(" @nou")
    const list = page.locator(".sadu-note__popup")
    await expect(list.getByRole("option", { name: /Noura/ })).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(list).toBeHidden()
    await expect(editor.locator('.sadu-note__token[data-kind="weaver"]')).toHaveCount(1)
    await expect(editor).toContainText("@nou")
    const marked = await page.evaluate(() => CSS.highlights.has("sadu-trigger-query"))
    expect(marked).toBe(false)
  })
})

test.describe("Pagination", () => {
  test("the madder eye and the woven cloth follow the current page; steps stop at the ends", async ({ page }) => {
    await openGallery(page)
    const nav = card(page, "Pagination").getByRole("navigation", { name: "Orders" })
    await nav.getByRole("button", { name: "5", exact: true }).click()
    await expect(nav.getByRole("button", { name: "5", exact: true })).toHaveAttribute("aria-current", "page")
    await page.waitForTimeout(400)
    const five = await box(nav.getByRole("button", { name: "5", exact: true }))
    await expect(nav.getByRole("button", { name: "5", exact: true }).locator(".sadu-lozenge")).toHaveAttribute("data-chosen", "true")
    const cloth = await box(nav.locator(".sadu-eye-pagination__cloth"))
    expect(cloth.x + cloth.width).toBeGreaterThan(five.x)
    expect(cloth.x + cloth.width).toBeLessThanOrEqual(five.x + five.width)
    await nav.getByRole("button", { name: "1", exact: true }).click()
    await expect(nav.getByRole("button", { name: "Previous page" })).toHaveAttribute("aria-disabled", "true")
    await nav.getByRole("button", { name: "12", exact: true }).click()
    await expect(nav.getByRole("button", { name: "Next page" })).toHaveAttribute("aria-disabled", "true")
    await nav.getByRole("button", { name: "Previous page" }).focus()
    await page.keyboard.press("Enter")
    await expect(nav.getByRole("button", { name: "11", exact: true })).toHaveAttribute("aria-current", "page")
  })
})

test.describe("Pagination thread", () => {
  async function geometry(nav: Locator): Promise<{ warp: { start: number; end: number }; cloth: number; first: number; last: number; current: number }> {
    return nav.evaluate((root) => {
      const rtl = getComputedStyle(root).direction === "rtl"
      const rect = (selector: string) => root.querySelector(selector)?.getBoundingClientRect() ?? new DOMRect()
      const warp = rect(".sadu-eye-pagination__warp")
      const cloth = rect(".sadu-eye-pagination__cloth")
      const pages = [...root.querySelectorAll(".sadu-eye-pagination__list > li")].slice(1, -1).map((item) => item.getBoundingClientRect())
      const centre = (box: DOMRect) => box.left + box.width / 2
      const current = root.querySelector('[aria-current="page"]')?.getBoundingClientRect() ?? new DOMRect()
      return {
        warp: rtl ? { start: warp.right, end: warp.left } : { start: warp.left, end: warp.right },
        cloth: cloth.width === 0 ? (rtl ? cloth.right : cloth.left) : rtl ? cloth.left : cloth.right,
        first: centre(pages[0] ?? new DOMRect()),
        last: centre(pages[pages.length - 1] ?? new DOMRect()),
        current: centre(current),
      }
    })
  }

  for (const dir of ["ltr", "rtl"] as const) {
    test(`the thread runs centre to centre and the band reaches the current page (${dir})`, async ({ page }) => {
      await openGallery(page)
      await setDirection(page, dir)
      const nav = card(page, "Pagination").getByRole("navigation", { name: "Orders" })
      await nav.getByRole("button", { name: "12", exact: true }).click()
      await expect(nav.locator(".sadu-eye-pagination__gap")).toHaveCount(1)
      await page.waitForTimeout(400)
      let shape = await geometry(nav)
      expect(Math.abs(shape.warp.start - shape.first)).toBeLessThanOrEqual(1)
      expect(Math.abs(shape.warp.end - shape.last)).toBeLessThanOrEqual(1)
      expect(Math.abs(shape.cloth - shape.warp.end)).toBeLessThanOrEqual(1)
      await nav.getByRole("button", { name: "1", exact: true }).click()
      await page.waitForTimeout(400)
      shape = await geometry(nav)
      expect(await nav.locator(".sadu-eye-pagination__cloth").evaluate((node) => node.getBoundingClientRect().width)).toBe(0)
      await nav.getByRole("button", { name: "2", exact: true }).click()
      await page.waitForTimeout(400)
      shape = await geometry(nav)
      expect(Math.abs(shape.cloth - shape.current)).toBeLessThanOrEqual(1)
    })
  }
})

test.describe("Motion and theme", () => {
  test("data-motion=reduced weaves state changes in at once", async ({ page }) => {
    await openGallery(page)
    await page.evaluate(() => document.documentElement.setAttribute("data-motion", "reduced"))
    const start = card(page, "Toggle").getByRole("button", { name: "Start" })
    await start.click()
    const face = await box(start)
    expect((await box(start.locator(".sadu-warp-toggle__cloth"))).width).toBeGreaterThanOrEqual(face.width - 1)
    const control = card(page, "Segmented Control").getByRole("radiogroup", { name: "Ground" })
    await control.getByRole("radio", { name: "Camel" }).click()
    await expect(control).not.toHaveAttribute("data-moving", "")
  })

  for (const theme of ["day", "tent"] as const) {
    test(`key states meet contrast in the ${theme} theme`, async ({ page }) => {
      await openGallery(page)
      await page.evaluate((value) => document.querySelector("main")?.setAttribute("data-theme", value), theme)
      await page.waitForTimeout(400)
      await card(page, "Menu").getByRole("button", { name: "Band actions" }).click()
      const report = await page.evaluate(() => {
        function parse(color: string): [number, number, number, number] {
          const values = color.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0]
          return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0, values[3] ?? 1]
        }
        function luminance([r, g, b]: number[]): number {
          const channel = (value: number) => {
            const v = value / 255
            return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
          }
          return 0.2126 * channel(r ?? 0) + 0.7152 * channel(g ?? 0) + 0.0722 * channel(b ?? 0)
        }
        function background(element: Element | null): number[] {
          let node = element
          while (node) {
            const color = parse(getComputedStyle(node).backgroundColor)
            if (color[3] > 0.5) return color
            node = node.parentElement
          }
          return [255, 255, 255]
        }
        function ratio(a: number[], b: number[]): number {
          const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
          return ((x ?? 0) + 0.05) / ((y ?? 0) + 0.05)
        }
        function text(selector: string): number {
          const element = document.querySelector(selector)
          if (!element) return -1
          return ratio(parse(getComputedStyle(element).color), background(element))
        }
        function edge(selector: string): number {
          const element = document.querySelector(selector)
          if (!element) return -1
          const shadow = getComputedStyle(element).boxShadow
          const color = parse(shadow.match(/rgba?\([^)]*\)/)?.[0] ?? "rgb(0,0,0)")
          return ratio(color, background(element.parentElement))
        }
        return {
          primary: text('.sadu-button[data-variant="primary"]'),
          destructive: text('.sadu-button[data-variant="destructive"]'),
          secondaryEdge: edge('.sadu-button[data-variant="secondary"]'),
          menuItem: text(".sadu-menu__item .sadu-menu__text"),
          menuLabel: text(".sadu-menu__content [data-slot=menu-shortcut]"),
          menubar: text(".sadu-menubar__trigger"),
          navTrigger: text(".sadu-nav__trigger"),
          segmentedEdge: edge(".sadu-segmented"),
          segmentedItem: text('.sadu-segmented__item:not([data-checked])'),
          page: text(".sadu-eye-pagination__page:not([data-current])"),
          commandItem: text(".sadu-command__item .sadu-command__text"),
          groupLabel: text(".sadu-command__label"),
          toolbarButton: text(".sadu-loom-toolbar__button"),
          toggle: text('.sadu-warp-toggle:not([data-pressed]):not([data-disabled])'),
        }
      })
      for (const [name, value] of Object.entries(report)) {
        const minimum = name.endsWith("Edge") ? 3 : 4.5
        expect(value, `${name} in ${theme}`).toBeGreaterThanOrEqual(minimum)
      }
    })
  }
})

test.describe("Design pass", () => {
  test("at 390px the toolbar stays inside its card and scrolls within the beam", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await openGallery(page)
    const toolbar = card(page, "Toolbar").getByRole("toolbar", { name: "Band editor" })
    const tool = await box(toolbar)
    const frame = await box(card(page, "Toolbar"))
    expect(tool.x).toBeGreaterThanOrEqual(frame.x)
    expect(tool.x + tool.width).toBeLessThanOrEqual(frame.x + frame.width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    const tools = toolbar.locator(".sadu-loom-toolbar__tools")
    expect(await tools.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true)
    await toolbar.getByRole("button", { name: "Undo" }).focus()
    await page.keyboard.press("End")
    await expect(toolbar.getByRole("button", { name: "Zoom in" })).toBeInViewport()
  })

  test("menubar triggers are 36px and the rod is wood", async ({ page }) => {
    await openGallery(page)
    const bar = card(page, "Menubar").getByRole("menubar", { name: "Weaving studio" })
    expect((await box(bar.getByRole("menuitem", { name: "Loom" }))).height).toBe(36)
    await expect(bar.locator(".sadu-menubar__rod")).toHaveCSS("height", "4px")
    await expect(bar.locator(".sadu-menubar__rod")).toHaveClass(/sadu-wood/)
  })

  test("the segmented thumb stays visible in the tent", async ({ page }) => {
    await openGallery(page)
    await page.evaluate(() => document.querySelector("main")?.setAttribute("data-theme", "tent"))
    await page.waitForTimeout(300)
    const control = card(page, "Segmented Control").getByRole("radiogroup", { name: "Ground" })
    const ground = await control.locator('[data-checked] .sadu-segmented__band path[style*="fill"]').first().evaluate((node) => getComputedStyle(node).fill)
    const surface = await control.evaluate((node) => getComputedStyle(node).backgroundColor)
    expect(ground).not.toBe(surface)
    await expect(control.getByRole("radio", { name: "Goat hair" })).toHaveCSS("color", "rgb(31, 24, 19)")
  })

  test("typing mad highlights Madder, the prefix match, over a scattered one", async ({ page }) => {
    await openGallery(page)
    const command = card(page, "Command")
    await command.getByRole("combobox", { name: "Search the loom" }).pressSequentially("mad")
    await expect(command.getByRole("option", { name: "Madder skeins" })).toHaveAttribute("data-highlighted", "")
  })

  test("toggle threads never run behind the label", async ({ page }) => {
    await openGallery(page)
    const warp = card(page, "Toggle").getByRole("button", { name: "Start" }).locator(".sadu-warp-toggle__warp")
    expect(await warp.evaluate((node) => getComputedStyle(node).maskImage)).toContain("linear-gradient")
  })
})

test.describe("Catalogue", () => {
  const PAGES: Record<string, string> = {
    "sadu-button": ".sadu-button",
    "warp-toggle": ".sadu-warp-toggle",
    "sadu-segmented-control": ".sadu-segmented",
    "sadu-menu": ".sadu-menu__trigger",
    "loom-toolbar": ".sadu-loom-toolbar",
    "eye-pagination": ".sadu-eye-pagination",
    "sadu-menubar": ".sadu-menubar",
    "sadu-command": ".sadu-command",
    "sadu-navigation-menu": ".sadu-nav",
    "sadu-trigger-menu": ".sadu-note__editor",
  }
  for (const [id, selector] of Object.entries(PAGES)) {
    test(`the ${id} detail page renders with no console errors`, async ({ page }) => {
      const problems = watch(page)
      await page.goto(`/#/c/${id}`)
      await expect(page.locator(`${selector}:visible`).first()).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(500)
      expect(problems.list).toEqual([])
    })
  }
})
