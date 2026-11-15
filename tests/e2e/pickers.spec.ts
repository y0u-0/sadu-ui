import { expect, test, type Locator, type Page } from "@playwright/test"

const GALLERY = "/?gallery=pickers"

function watchConsole(page: Page): string[] {
  const problems: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") problems.push(`${message.type()}: ${message.text()}`)
  })
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`))
  return problems
}

function card(page: Page, name: string): Locator {
  return page.locator(".gallery-card", { has: page.locator(".gallery-card__name", { hasText: new RegExp(`^${name}$`) }) })
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))))
}

async function bandedDays(scope: Locator): Promise<string[]> {
  return scope.locator("td[data-value]:has(.sadu-calendar__band)").evaluateAll((cells) => cells.map((cell) => (cell as HTMLElement).dataset.value ?? ""))
}

function days(from: string, to: string): string[] {
  const list: string[] = []
  for (let time = Date.parse(from); time <= Date.parse(to); time += 86_400_000) list.push(new Date(time).toISOString().slice(0, 10))
  return list
}

test.describe("pickers gallery", () => {
  for (const variant of ["day", "tent", "rtl", "reduced"] as const) {
    test(`renders cleanly in ${variant}`, async ({ page }) => {
      const problems = watchConsole(page)
      if (variant === "reduced") await page.emulateMedia({ reducedMotion: "reduce" })
      await page.goto(GALLERY)
      await page.evaluate((mode) => {
        if (mode === "rtl") document.documentElement.dir = "rtl"
        if (mode === "tent") document.querySelectorAll(".gallery-card").forEach((element) => element.setAttribute("data-theme", "tent"))
        if (mode === "reduced") document.documentElement.setAttribute("data-motion", "reduced")
      }, variant)
      await expect(page.locator(".sadu-calendar").first()).toBeVisible()
      await page.waitForTimeout(600)
      expect(problems).toEqual([])
    })
  }
})

test.describe("calendar", () => {
  test("the band is cut with fringe where weeks wrap, and only there", async ({ page }) => {
    await page.goto(GALLERY)
    const calendar = card(page, "Calendar")
    const fringe = (date: string, side: "::before" | "::after") =>
      calendar.locator(`td[data-value="${date}"] .sadu-calendar__band`).evaluate((band, pseudo) => getComputedStyle(band, pseudo).content, side)
    expect(await fringe("2026-12-12", "::after")).not.toBe("none")
    expect(await fringe("2026-12-12", "::before")).toBe("none")
    expect(await fringe("2026-12-13", "::before")).not.toBe("none")
    expect(await fringe("2026-12-16", "::before")).toBe("none")
    expect(await fringe("2026-12-16", "::after")).toBe("none")
    expect(await fringe("2026-12-20", "::after")).toBe("none")
  })

  test("rapid re-picking ends with one woven band matching the value", async ({ page }) => {
    await page.goto(GALLERY)
    const calendar = card(page, "Calendar")
    for (const date of ["2026-11-03", "2026-11-05", "2026-11-17", "2026-12-02", "2026-11-09", "2026-11-26"]) {
      await calendar.locator(`td[data-value="${date}"]`).click()
    }
    await settle(page)
    expect(await bandedDays(calendar)).toEqual(days("2026-11-09", "2026-11-26"))
    const clips = await calendar.locator(".sadu-calendar__cloth").evaluateAll((cloths) => cloths.map((cloth) => getComputedStyle(cloth).clipPath))
    expect(clips.filter((clip) => clip !== "none" && !/^inset\((0(px|%)?\s*)+\)$/.test(clip))).toEqual([])
    expect(await calendar.locator("td[data-preview]").count()).toBe(0)
  })

  test("arrow keys follow the reading direction in RTL", async ({ page }) => {
    await page.goto(GALLERY)
    await page.evaluate(() => (document.documentElement.dir = "rtl"))
    const calendar = card(page, "Calendar")
    await calendar.locator('td[data-value="2026-11-10"]').click()
    await page.keyboard.press("ArrowLeft")
    await expect(calendar.locator('td[data-value="2026-11-11"]')).toBeFocused()
    await page.keyboard.press("Escape")
  })

  test("Next turns the month and keeps keyboard focus on a day", async ({ page }) => {
    await page.goto(GALLERY)
    const calendar = card(page, "Calendar")
    await calendar.locator('td[data-value="2026-11-30"]').focus()
    await page.keyboard.press("PageDown")
    await expect(calendar.locator('td[data-value="2026-12-30"]')).toBeFocused()
    await calendar.getByRole("button", { name: "Next month" }).click()
    await expect(calendar.locator("caption").first()).toHaveText("December 2026")
  })
})

test.describe("date picker", () => {
  test("picks from the popup, closes, returns focus and lands the value", async ({ page }) => {
    await page.goto(GALLERY)
    const picker = card(page, "Date Picker")
    const trigger = picker.locator(".sadu-date-picker__trigger").first()
    await trigger.click()
    const popup = page.locator(".sadu-date-picker__popup")
    await expect(popup).toBeVisible()
    await expect(popup.locator(".sadu-popup__edge svg")).toBeVisible()
    await popup.locator('td[data-value="2026-11-24"]').click()
    await expect(popup).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await expect(picker.locator(".sadu-date-picker__input").first()).toHaveValue("11/24/2026")
  })

  test("every date field is named", async ({ page }) => {
    await page.goto(GALLERY)
    const picker = card(page, "Date Picker")
    await expect(picker.getByRole("textbox", { name: "Delivery date" })).toBeVisible()
    await expect(picker.getByRole("textbox", { name: "Shearing week start" })).toHaveValue("11/23/2026")
    await expect(picker.getByRole("textbox", { name: "Shearing week end" })).toHaveValue("11/27/2026")
  })

  test("an outside press and Escape both close it", async ({ page }) => {
    await page.goto(GALLERY)
    const trigger = card(page, "Date Picker").locator(".sadu-date-picker__trigger").first()
    await trigger.click()
    await expect(page.locator(".sadu-date-picker__popup")).toBeVisible()
    await page.mouse.click(5, 5)
    await expect(page.locator(".sadu-date-picker__popup")).toHaveCount(0)
    await trigger.press("Enter")
    await expect(page.locator(".sadu-date-picker__popup")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.locator(".sadu-date-picker__popup")).toHaveCount(0)
  })

  test("the range picker weaves its band end to end", async ({ page }) => {
    await page.goto(GALLERY)
    const picker = card(page, "Date Picker")
    await picker.locator(".sadu-date-picker__trigger").nth(1).click()
    const popup = page.locator(".sadu-date-picker__popup")
    await popup.locator('td[data-value="2026-11-09"]').click()
    await popup.locator('td[data-value="2026-11-12"]').click()
    await expect(picker.locator(".sadu-date-picker__input").nth(1)).toHaveValue("11/09/2026")
    await expect(picker.locator(".sadu-date-picker__input").nth(2)).toHaveValue("11/12/2026")
    await picker.locator(".sadu-date-picker__trigger").nth(1).click()
    await settle(page)
    expect(await bandedDays(page.locator(".sadu-date-picker__popup"))).toEqual(days("2026-11-09", "2026-11-12"))
  })
})

test.describe("color picker", () => {
  test("dragging the area and hue changes the dye and re-dyes the band", async ({ page }) => {
    await page.goto(GALLERY)
    const picker = card(page, "Color Picker")
    const hex = picker.getByRole("textbox", { name: "Hex" })
    await expect(hex).toHaveValue("#a3231b")
    const area = await picker.locator(".sadu-color__area").boundingBox()
    if (!area) throw new Error("No area")
    await page.mouse.move(area.x + area.width * 0.2, area.y + area.height * 0.3)
    await page.mouse.down()
    await page.mouse.move(area.x + area.width * 0.6, area.y + area.height * 0.2, { steps: 5 })
    await page.mouse.up()
    const afterArea = await hex.inputValue()
    expect(afterArea).not.toBe("#a3231b")
    const rgb = (hex: string) => `rgb(${[1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16)).join(", ")})`
    expect(await picker.locator(".sadu-color__band").innerHTML()).toContain(rgb(afterArea))
    const hue = await picker.locator(".sadu-color__hue").boundingBox()
    if (!hue) throw new Error("No hue")
    await page.mouse.click(hue.x + hue.width * 0.6, hue.y + hue.height / 2)
    expect(await hex.inputValue()).not.toBe(afterArea)
    await expect(picker.locator(".sadu-color__closest")).toBeVisible()
    await settle(page)
    await expect(picker.locator(".sadu-color__beat")).toHaveCSS("opacity", "0")
  })

  test("hex round-trips, a bad hex is put back, skeins select", async ({ page }) => {
    await page.goto(GALLERY)
    const picker = card(page, "Color Picker")
    const hex = picker.getByRole("textbox", { name: "Hex" })
    await hex.fill("#2a3c63")
    await hex.press("Enter")
    await expect(picker.getByRole("option", { name: "Indigo" })).toHaveAttribute("aria-selected", "true")
    await hex.fill("not a dye")
    await hex.press("Enter")
    await expect(hex).toHaveValue("#2a3c63")
    await picker.getByRole("option", { name: "Saffron" }).click()
    await expect(hex).toHaveValue("#cf7a1b")
  })

  test("the eyedropper only shows where the browser supports it", async ({ page }) => {
    await page.goto(GALLERY)
    const dropper = card(page, "Color Picker").locator(".sadu-color__dropper")
    const supported = await page.evaluate(() => "EyeDropper" in window)
    if (supported) await expect(dropper).toBeVisible()
    else await expect(dropper).toBeHidden()
  })
})

test.describe("file input", () => {
  test("browsed drafts weave in, rejected types stay out", async ({ page }) => {
    await page.goto(GALLERY)
    const input = card(page, "File Input").locator('input[type="file"]')
    await input.evaluate((element: HTMLInputElement) => {
      const transfer = new DataTransfer()
      transfer.items.add(new File([new Uint8Array(236_000)], "dhalla-cushion.png", { type: "image/png" }))
      transfer.items.add(new File(["notes"], "notes.txt", { type: "text/plain" }))
      element.files = transfer.files
      element.dispatchEvent(new Event("change", { bubbles: true }))
    })
    const rows = card(page, "File Input").getByRole("listitem")
    await expect(rows).toHaveCount(3)
    await expect(rows.nth(2)).toContainText("dhalla-cushion.png")
    await expect(rows.nth(2).locator(".sadu-file__band")).toHaveAttribute("data-fresh")
    await settle(page)
    await expect(rows.nth(2).locator(".sadu-file__cloth")).toHaveCSS("width", await rows.nth(2).locator(".sadu-file__band").evaluate((band) => getComputedStyle(band).width))
  })

  test("drag states reset after a drop and after the drag leaves", async ({ page }) => {
    await page.goto(GALLERY)
    const zone = card(page, "File Input").locator(".sadu-file__loom")
    const drag = (type: string, names: string[]) =>
      zone.evaluate(
        (element, args) => {
          const transfer = new DataTransfer()
          for (const name of args.names) transfer.items.add(new File(["x"], name, { type: name.endsWith(".pdf") ? "application/pdf" : "text/plain" }))
          element.dispatchEvent(new DragEvent(args.type, { bubbles: true, cancelable: true, dataTransfer: transfer }))
        },
        { type, names },
      )
    await drag("dragenter", ["a.pdf", "b.pdf"])
    await drag("dragover", ["a.pdf", "b.pdf"])
    await expect(zone).toHaveAttribute("data-drag-accept", "")
    await expect(zone).toContainText("Let go to add 2 drafts")
    await drag("drop", ["a.pdf", "b.pdf"])
    await expect(zone).not.toHaveAttribute("data-dragging")
    await expect(card(page, "File Input").getByRole("listitem")).toHaveCount(4)
    await drag("dragenter", ["notes.txt"])
    await drag("dragover", ["notes.txt"])
    await expect(zone).toHaveAttribute("data-drag-reject", "")
    await expect(zone).toContainText("Only PDF and PNG drafts")
    await drag("dragleave", ["notes.txt"])
    await expect(zone).not.toHaveAttribute("data-dragging")
    await expect(zone).toContainText("Drop pattern drafts here or")
  })

  test("a focused draft is removed with Delete", async ({ page }) => {
    await page.goto(GALLERY)
    const rows = card(page, "File Input").getByRole("listitem")
    await rows.first().focus()
    await page.keyboard.press("Delete")
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText("divider-draft-3.png")
  })
})

test.describe("image cropper", () => {
  test("presets, drag, peg resize, keys, zoom, rotate and flip keep the readout true", async ({ page }) => {
    await page.goto(GALLERY)
    const cropper = card(page, "Image Cropper")
    const readout = cropper.locator(".sadu-cropper__readout")
    const selection = cropper.locator(".sadu-cropper__selection")
    await expect(readout).toHaveText("576 × 144 px")
    const size = async () => {
      const [width, height] = ((await readout.textContent()) ?? "").match(/\d+/g)?.map(Number) ?? []
      return { width: width ?? 0, height: height ?? 0 }
    }
    await cropper.getByRole("radio", { name: "Square" }).click()
    await settle(page)
    let current = await size()
    expect(current.width).toBe(current.height)
    const label = async () => (await selection.getAttribute("aria-valuetext")) ?? ""
    const before = await label()
    const box = await selection.boundingBox()
    if (!box) throw new Error("No selection")
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 10, { steps: 4 })
    await page.mouse.up()
    expect(await label()).not.toBe(before)
    const peg = await cropper.locator('.sadu-cropper__peg[data-position="se"]').boundingBox()
    if (!peg) throw new Error("No peg")
    await page.mouse.move(peg.x + peg.width / 2, peg.y + peg.height / 2)
    await page.mouse.down()
    await page.mouse.move(peg.x - 30, peg.y - 30, { steps: 4 })
    await page.mouse.up()
    const resized = await size()
    expect(resized.width).toBeLessThan(current.width)
    expect(resized.width).toBe(resized.height)
    await selection.focus()
    const beforeKeys = await label()
    await page.keyboard.press("ArrowLeft")
    expect(await label()).not.toBe(beforeKeys)
    await expect(cropper.locator(".sadu-cropper")).not.toHaveAttribute("data-reshaping")
    expect(await selection.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("0s")
    await cropper.locator(".sadu-cropper__range").fill("2")
    current = await size()
    expect(current.width).toBeLessThan(resized.width)
    await cropper.getByRole("radio", { name: "Band 4:1" }).click()
    await settle(page)
    current = await size()
    expect(Math.round(current.width / current.height)).toBe(4)
    await cropper.getByRole("button", { name: "Rotate a quarter turn" }).click()
    await settle(page)
    current = await size()
    expect(Math.round(current.width / current.height)).toBe(4)
    await cropper.getByRole("button", { name: "Flip" }).click()
    await expect(cropper.locator(".sadu-cropper__image")).toHaveAttribute("style", /scale|matrix|-1/)
  })
})

test.describe("carousel", () => {
  test("Previous and Next page through whole rugs and disable at the ends", async ({ page }) => {
    await page.goto(GALLERY)
    const carousel = card(page, "Carousel")
    const previous = carousel.getByRole("button", { name: "Previous" })
    const next = carousel.getByRole("button", { name: "Next" })
    const viewport = carousel.locator(".sadu-carousel__viewport")
    await expect(previous).toHaveAttribute("data-disabled", "")
    await next.click()
    await expect(carousel.getByRole("tab", { name: "Majlis runner" })).toHaveAttribute("aria-selected", "true")
    await settle(page)
    await page.waitForTimeout(600)
    const snapped = await viewport.evaluate((element) => {
      const slide = element.querySelector<HTMLElement>(".sadu-carousel__item")
      const step = (slide?.offsetWidth ?? 1) + 16
      return Math.abs(element.scrollLeft / step - Math.round(element.scrollLeft / step)) < 0.02
    })
    expect(snapped).toBe(true)
    await carousel.getByRole("tab", { name: "Saddle cloth" }).click()
    await expect(next).toHaveAttribute("data-disabled", "")
    await carousel.getByRole("tab", { name: "Saddle cloth" }).press("Home")
    await expect(carousel.getByRole("tab", { name: "Tent divider" })).toHaveAttribute("aria-selected", "true")
    await viewport.focus()
    await page.keyboard.press("ArrowRight")
    await expect(carousel.getByRole("tab", { name: "Majlis runner" })).toHaveAttribute("aria-selected", "true")
  })
})

test.describe("tree and listbox", () => {
  test("tree arrows follow the reading direction in RTL", async ({ page }) => {
    await page.goto(GALLERY)
    await page.evaluate(() => (document.documentElement.dir = "rtl"))
    const border = card(page, "Tree").getByRole("treeitem", { name: "Border" })
    await border.focus()
    await page.keyboard.press("ArrowLeft")
    await expect(border).toHaveAttribute("aria-expanded", "true")
    await page.keyboard.press("ArrowRight")
    await expect(border).toHaveAttribute("aria-expanded", "false")
  })

  test("listbox Shift-click selects a run", async ({ page }) => {
    await page.goto(GALLERY)
    const list = card(page, "Listbox")
    await list.getByRole("option", { name: "Border" }).first().click()
    await list.getByRole("option", { name: "Dhalla" }).last().click({ modifiers: ["Shift"] })
    const selected = await list.locator('[role="option"][aria-selected="true"]').count()
    expect(selected).toBeGreaterThanOrEqual(2)
  })
})

type Pair = { what: string; ratio: number; minimum: number }

async function contrastPairs(page: Page): Promise<Pair[]> {
  return page.evaluate(() => {
    const parse = (color: string): [number, number, number, number] => {
      const values = color.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 1]
      return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0, values[3] ?? 1]
    }
    const luminance = ([r, g, b]: number[]) => {
      const channel = (value: number) => {
        const v = value / 255
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * channel(r ?? 0) + 0.7152 * channel(g ?? 0) + 0.0722 * channel(b ?? 0)
    }
    const backdrop = (element: Element | null): number[] => {
      for (let node = element; node; node = node.parentElement) {
        const color = parse(getComputedStyle(node).backgroundColor)
        if (color[3] > 0.5) return color
      }
      return [234, 223, 203]
    }
    const ratio = (a: number[], b: number[]) => {
      const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
      return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05)
    }
    const text = (selector: string, what: string, from?: string | number[]) => {
      const element = document.querySelector(selector)
      if (!element) return { what: `${what} (missing)`, ratio: 0, minimum: 4.5 }
      const background = Array.isArray(from) ? from : from ? backdrop(document.querySelector(from)) : backdrop(element)
      return { what, ratio: ratio(parse(getComputedStyle(element).color), background), minimum: 4.5 }
    }
    const edge = (selector: string, what: string, property: "borderTopColor" | "boxShadow") => {
      const element = document.querySelector(selector)
      if (!element) return { what: `${what} (missing)`, ratio: 0, minimum: 3 }
      const style = getComputedStyle(element)
      const color = property === "boxShadow" ? (style.boxShadow.match(/rgba?\([^)]*\)/)?.[0] ?? "") : style.borderTopColor
      return { what, ratio: ratio(parse(color), backdrop(element.parentElement)), minimum: 3 }
    }
    return [
      text(".sadu-calendar__caption", "calendar month"),
      text(".sadu-calendar__weekday", "weekday"),
      text('.sadu-calendar td[data-outside] .sadu-calendar__lozenge', "outside day"),
      text('.sadu-calendar td[data-range-start] .sadu-calendar__lozenge', "range end on madder lozenge", [163, 35, 27]),
      text('.sadu-calendar td[data-range-middle] .sadu-calendar__lozenge', "day on woven band", [230, 217, 191]),
      text(".sadu-date-picker__hint", "date hint"),
      text(".sadu-date-picker__input", "date value"),
      edge(".sadu-date-picker__field", "date field edge", "boxShadow"),
      text(".sadu-color__name", "dye name"),
      edge(".sadu-color__field", "hex field edge", "boxShadow"),
      text(".sadu-file__hint", "file hint"),
      text(".sadu-file__size", "file size"),
      text(".sadu-file__browse", "browse link"),
      edge(".sadu-listbox__list", "listbox edge", "boxShadow"),
      text(".sadu-listbox__item[data-selected] .sadu-listbox__name", "selected band"),
      text(".sadu-tree__meta", "tree meta"),
      text(".sadu-tree__row[data-selected] .sadu-tree__label", "selected tree row"),
      edge(".sadu-checkbox__box:not([data-checked]):not([data-indeterminate])", "checkbox edge", "borderTopColor"),
      text(".sadu-checkbox__description", "checkbox description"),
      text(".sadu-cropper__readout", "crop readout"),
      text(".sadu-cropper__aspects [data-unchecked]", "other aspect"),
      text(".sadu-carousel__detail", "rug detail"),
    ]
  })
}

test.describe("contrast", () => {
  for (const theme of ["day", "tent"] as const) {
    test(`key states meet contrast in ${theme}`, async ({ page }) => {
      await page.goto(GALLERY)
      await expect(page.locator(".sadu-carousel__detail").first()).toBeVisible({ timeout: 20_000 })
      if (theme === "tent") await page.evaluate(() => document.querySelectorAll(".gallery-card").forEach((element) => element.setAttribute("data-theme", "tent")))
      await settle(page)
      const failures = (await contrastPairs(page)).filter((pair) => pair.ratio < pair.minimum).map((pair) => `${pair.what}: ${pair.ratio.toFixed(2)}`)
      expect(failures).toEqual([])
    })
  }
})

const DETAIL_PAGES: Record<string, string> = {
  "sadu-calendar": ".sadu-calendar",
  "sadu-date-picker": ".sadu-date-picker",
  "sadu-color-picker": ".sadu-color",
  "sadu-file-input": ".sadu-file",
  "sadu-listbox": ".sadu-listbox",
  "sadu-image-cropper": ".sadu-cropper",
  "sadu-checkbox": ".sadu-checkbox",
  "sadu-tree": ".sadu-tree",
  "sadu-carousel": ".sadu-carousel",
}

test.describe("catalogue pages", () => {
  for (const [id, selector] of Object.entries(DETAIL_PAGES)) {
    test(`${id} detail page renders without console errors`, async ({ page }) => {
      const problems = watchConsole(page)
      await page.goto(`/#/c/${id}`)
      await expect(page.locator(selector).first()).toBeVisible()
      await page.waitForTimeout(500)
      expect(problems).toEqual([])
    })
  }
})
