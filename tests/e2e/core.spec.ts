import { expect, test, type Locator, type Page } from "@playwright/test"

const FIXTURE = "/?fixture=core"

function watchConsole(page: Page): string[] {
  const problems: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") problems.push(`${message.type()}: ${message.text()}`)
  })
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`))
  return problems
}

function fixture(page: Page, id: string): Locator {
  return page.locator(`[data-fixture="${id}"]`)
}

async function box(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  const rect = await locator.boundingBox()
  if (!rect) throw new Error("element has no box")
  return rect
}

test.describe("core components", () => {
  let problems: string[] = []

  test.beforeEach(async ({ page }) => {
    problems = watchConsole(page)
    await page.goto(FIXTURE)
    await expect(fixture(page, "rug")).toBeVisible()
  })

  test.afterEach(() => {
    expect(problems).toEqual([])
  })

  test.describe("Loom slider", () => {
    test("keys move the value: arrows, Page, Home, End", async ({ page }) => {
      const slider = fixture(page, "slider").locator('[data-case="uncontrolled"]')
      const thumb = slider.getByRole("slider", { name: "Uncontrolled" })
      const value = slider.locator(".sadu-loom__value")
      await expect(value).toHaveText("20rows")
      await thumb.focus()
      await page.keyboard.press("ArrowRight")
      await expect(thumb).toHaveValue("21")
      await page.keyboard.press("ArrowUp")
      await expect(thumb).toHaveValue("22")
      await page.keyboard.press("PageUp")
      const paged = Number(await thumb.inputValue())
      expect(paged).toBeGreaterThan(22)
      await page.keyboard.press("PageDown")
      await expect(thumb).toHaveValue("22")
      await page.keyboard.press("End")
      await expect(thumb).toHaveValue("80")
      await page.keyboard.press("Home")
      await expect(thumb).toHaveValue("0")
      await expect(value).toHaveText("0rows")
    })

    test("a press on the track and a drag of the beater both set the value", async ({ page }) => {
      const slider = fixture(page, "slider").locator('[data-case="uncontrolled"]')
      const thumb = slider.getByRole("slider", { name: "Uncontrolled" })
      const track = await box(slider.locator(".sadu-loom__track"))
      await page.mouse.click(track.x + track.width * 0.75, track.y + track.height / 2)
      expect(Math.abs(Number(await thumb.inputValue()) - 60)).toBeLessThanOrEqual(1)
      const handle = await box(slider.locator(".sadu-loom__thumb"))
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
      await page.mouse.down()
      await page.mouse.move(track.x + track.width * 0.25, track.y + track.height / 2, { steps: 8 })
      await page.mouse.up()
      expect(Math.abs(Number(await thumb.inputValue()) - 20)).toBeLessThanOrEqual(1)
    })

    test("right to left: ArrowLeft weaves on and the cloth starts at the right", async ({ page }) => {
      const slider = fixture(page, "slider").locator('[data-case="rtl"]')
      const thumb = slider.getByRole("slider", { name: "RTL" })
      await thumb.focus()
      await page.keyboard.press("ArrowLeft")
      await expect(thumb).toHaveValue("41")
      await page.keyboard.press("ArrowRight")
      await page.keyboard.press("ArrowRight")
      await expect(thumb).toHaveValue("39")
      const track = await box(slider.locator(".sadu-loom__track"))
      const cloth = await box(slider.locator(".sadu-loom__clip"))
      expect(Math.abs(cloth.x + cloth.width - (track.x + track.width))).toBeLessThanOrEqual(1)
    })

    test("the cloth snaps to whole columns at every value and the warp stays visible", async ({ page }) => {
      for (const [id, cell, max] of [
        ["uncontrolled", 8, 80],
        ["stitch", 6, 37],
      ] as const) {
        const slider = fixture(page, "slider").locator(`[data-case="${id}"]`)
        const thumb = slider.getByRole("slider")
        await thumb.focus()
        await page.keyboard.press("Home")
        const widths: number[] = []
        for (let value = 0; value <= max; value++) {
          widths.push(await slider.locator(".sadu-loom__clip").evaluate((element) => Number.parseFloat(getComputedStyle(element).width)))
          await page.keyboard.press("ArrowRight")
        }
        for (const width of widths) {
          expect(Math.abs(width / cell - Math.round(width / cell))).toBeLessThan(0.01)
        }
        expect(widths.at(-1)).toBeGreaterThan(widths[1] ?? 0)
        const warp = await box(slider.locator(".sadu-loom__warp"))
        expect(warp.width).toBeGreaterThan(100)
        await expect(slider.locator(".sadu-loom__warp rect").first()).toBeAttached()
      }
    })

    test("the beater takes a 44px press and carries the focus ring", async ({ page }) => {
      const slider = fixture(page, "slider").locator('[data-case="uncontrolled"]')
      const thumb = slider.locator(".sadu-loom__thumb")
      const hit = await thumb.evaluate((element) => Number.parseFloat(getComputedStyle(element, "::before").width))
      expect(hit).toBeGreaterThanOrEqual(44)
      await slider.getByRole("slider").focus()
      await page.keyboard.press("ArrowRight")
      const ring = await slider.locator(".sadu-loom__beater").evaluate((element) => {
        const style = getComputedStyle(element)
        return `${style.outlineStyle} ${style.outlineWidth} ${style.outlineOffset}`
      })
      expect(ring).toBe("solid 2px 2px")
    })

    test("a controlled slider follows its owner and reports changes", async ({ page }) => {
      const slider = fixture(page, "slider").locator('[data-case="controlled"]')
      const thumb = slider.getByRole("slider", { name: "Controlled" })
      await slider.getByRole("button", { name: "Set 72" }).click()
      await expect(thumb).toHaveValue("72")
      await expect(slider.locator(".sadu-loom__value")).toHaveText("72rows")
      await thumb.focus()
      await page.keyboard.press("ArrowRight")
      await expect(slider.getByTestId("controlled-rows")).toHaveText("73")
    })
  })

  test.describe("Motif select", () => {
    test("opens by click, Enter, Space and ArrowDown; marks only the chosen item", async ({ page }) => {
      const section = fixture(page, "motif")
      const trigger = section.getByRole("combobox", { name: "Main band" })
      for (const open of ["click", "Enter", " ", "ArrowDown"] as const) {
        if (open === "click") await trigger.click()
        else {
          await trigger.focus()
          await page.keyboard.press(open === " " ? "Space" : open)
        }
        const listbox = page.getByRole("listbox")
        await expect(listbox).toBeVisible()
        await expect(listbox.getByRole("option")).toHaveCount(5)
        await expect(listbox.locator('[aria-selected="true"]')).toHaveCount(1)
        await expect(listbox.locator('[aria-selected="true"]')).toContainText("Ain")
        await expect(listbox.locator(".sadu-motif__check svg")).toHaveCount(1)
        await expect(listbox.locator('[aria-selected="true"] .sadu-motif__check svg')).toHaveCount(1)
        await page.keyboard.press("Escape")
        await expect(listbox).toBeHidden()
        await expect(trigger).toBeFocused()
      }
    })

    test("the list hangs from a cord that faces the trigger, and a narrow row drops the Arabic name first", async ({ page }) => {
      const trigger = fixture(page, "motif").getByRole("combobox", { name: "Main band" })
      await trigger.click()
      const listbox = page.getByRole("listbox")
      await expect(listbox).toHaveAttribute("data-edge", "cord")
      const popup = await box(listbox)
      const cord = await box(listbox.locator(".sadu-popup__edge"))
      const anchor = await box(trigger)
      const above = popup.y + popup.height <= anchor.y
      expect(Math.abs((above ? popup.y + popup.height - (cord.y + cord.height) : cord.y - popup.y) - 6)).toBeLessThanOrEqual(1)
      const radius = await listbox.evaluate((element) => getComputedStyle(element).borderRadius)
      expect(radius).toBe(above ? "14px 14px 4px 4px" : "4px 4px 14px 14px")
      await listbox.evaluate((element) => {
        element.style.width = "240px"
      })
      const row = listbox.getByRole("option", { name: /Dhurus/ })
      const text = await box(row.locator(".sadu-motif__text"))
      const arabic = await box(row.locator(".sadu-motif__arabic"))
      expect(arabic.y).toBeGreaterThan(text.y + text.height / 2)
      await expect(row.locator(".sadu-motif__name")).toHaveText("Dhurus al-khail")
    })

    test("typeahead picks an item; choosing closes, returns focus and reports once", async ({ page }) => {
      const section = fixture(page, "motif")
      const trigger = section.getByRole("combobox", { name: "Main band" })
      await trigger.click()
      await expect(page.getByRole("listbox")).toBeVisible()
      await expect(page.locator('[role="option"]:focus, [role="listbox"]:focus')).toHaveCount(1)
      await page.keyboard.type("dha")
      await page.keyboard.press("Enter")
      await expect(page.getByRole("listbox")).toBeHidden()
      await expect(trigger).toBeFocused()
      await expect(section.getByTestId("motif-value")).toHaveText("dhalla")
      await expect(section.getByTestId("motif-calls")).toHaveText("1")
      await trigger.click()
      await page.getByRole("option", { name: /Hubub/ }).click()
      await expect(section.getByTestId("motif-value")).toHaveText("hubub")
      await expect(section.getByTestId("motif-calls")).toHaveText("2")
      await expect(trigger).toBeFocused()
    })
  })

  test.describe("Skeins", () => {
    test("arrows move the choice, the pointed name shows, then the chosen name returns", async ({ page }) => {
      const section = fixture(page, "skeins")
      const name = section.locator(".sadu-skeins__name")
      await expect(name).toHaveText("Saffron")
      await section.getByRole("radio", { name: "Saffron" }).focus()
      await page.keyboard.press("ArrowRight")
      await expect(section.getByRole("radio", { name: "Indigo" })).toBeChecked()
      await expect(name).toHaveText("Indigo")
      await section.getByRole("radio", { name: "Camel" }).hover()
      await expect(name).toHaveText("Camel")
      await page.mouse.move(0, 0)
      await page.locator("body").click({ position: { x: 2, y: 2 } })
      await expect(name).toHaveText("Indigo")
      await section.getByRole("button", { name: "Submit wool" }).click()
      await expect(section.getByTestId("skein-submitted")).toHaveText("indigo")
    })
  })

  test.describe("Switch", () => {
    test("Space and a click on the label each toggle once; disabled ignores both", async ({ page }) => {
      const section = fixture(page, "switch")
      const dyed = section.getByRole("switch", { name: "Dyed wool" })
      await section.getByText("Dyed wool").click()
      await expect(dyed).toBeChecked()
      await dyed.click()
      await expect(dyed).not.toBeChecked()
      await dyed.focus()
      await page.keyboard.press("Space")
      await expect(dyed).toBeChecked()
      const warp = section.getByRole("switch", { name: "Goat-hair warp" })
      await section.getByText("Goat-hair warp").click({ force: true })
      await expect(warp).not.toBeChecked()
      await expect(warp).toBeDisabled()
    })

    test("right to left: the thumb rests at the left when on and the cloth is fully shown", async ({ page }) => {
      const control = fixture(page, "switch").locator('[data-case="rtl"]').getByRole("switch", { name: "Fringe" })
      await expect(control).toBeChecked()
      await page.waitForTimeout(400)
      const track = await box(control)
      const thumb = await box(control.locator(".sadu-switch__thumb"))
      expect(thumb.x + thumb.width / 2).toBeLessThan(track.x + track.width / 2)
      const clip = await control.locator(".sadu-switch__cloth").evaluate((element) => getComputedStyle(element).clipPath)
      expect(clip).toMatch(/inset\(0(px)?\)|inset\(0px 0px 0px 0px\)/)
      await control.click()
      await page.waitForTimeout(400)
      const off = await box(control.locator(".sadu-switch__thumb"))
      expect(off.x + off.width / 2).toBeGreaterThan(track.x + track.width / 2)
    })
  })

  test.describe("Tabs", () => {
    async function expectIndicatorUnderSelected(page: Page): Promise<void> {
      const section = fixture(page, "tabs")
      await page.waitForTimeout(450)
      const indicator = await box(section.locator(".sadu-tabs__indicator"))
      const selected = await box(section.locator('[role="tab"][aria-selected="true"]'))
      const centre = indicator.x + indicator.width / 2
      expect(Math.abs(centre - (selected.x + selected.width / 2))).toBeLessThanOrEqual(1.5)
      expect(indicator.width).toBeGreaterThan(selected.width - 30)
      expect(indicator.width).toBeLessThanOrEqual(selected.width)
    }

    test("arrows, Home and End move the selection and the panel follows", async ({ page }) => {
      const section = fixture(page, "tabs")
      await section.getByRole("tab", { name: "Motifs" }).focus()
      await page.keyboard.press("ArrowRight")
      await expect(section.getByRole("tab", { name: "Wool and dye lots" })).toHaveAttribute("aria-selected", "true")
      await expect(section.locator('[role="tabpanel"]:not([inert])')).toHaveText("Wool panel")
      await page.keyboard.press("End")
      await expect(section.locator('[role="tabpanel"]:not([inert])')).toHaveText("Loom panel")
      await page.keyboard.press("Home")
      await expect(section.locator('[role="tabpanel"]:not([inert])')).toHaveText("Motif panel")
      await expectIndicatorUnderSelected(page)
    })

    test("the indicator lands under the selected tab after any sequence, a direction flip and a resize", async ({ page }) => {
      const section = fixture(page, "tabs")
      await expectIndicatorUnderSelected(page)
      await section.getByRole("tab", { name: "Loom" }).click()
      await expectIndicatorUnderSelected(page)
      await section.getByRole("button", { name: "Flip direction" }).click()
      await expectIndicatorUnderSelected(page)
      await section.getByRole("tab", { name: "Wool and dye lots" }).click()
      await expectIndicatorUnderSelected(page)
      await section.getByRole("button", { name: "Toggle width" }).click()
      await expectIndicatorUnderSelected(page)
      await page.setViewportSize({ width: 760, height: 900 })
      await expectIndicatorUnderSelected(page)
      await section.getByRole("button", { name: "Flip direction" }).click()
      await expectIndicatorUnderSelected(page)
    })
  })

  test.describe("Eye rating", () => {
    test("click and arrows commit; hover only previews", async ({ page }) => {
      const section = fixture(page, "rating")
      const rating = section.getByRole("radiogroup", { name: "Tightness" })
      const eyes = rating.locator(".sadu-rating__item")
      await eyes.nth(4).click()
      await expect(section.getByTestId("rating-value")).toHaveText("5")
      await page.keyboard.press("ArrowLeft")
      await expect(section.getByTestId("rating-value")).toHaveText("4")
      await eyes.nth(1).hover()
      await expect(rating.locator(".sadu-rating__item[data-highlighted]")).toHaveCount(2)
      await expect(section.getByTestId("rating-value")).toHaveText("4")
      await page.mouse.move(0, 0)
      await expect(rating.locator(".sadu-rating__item[data-highlighted]")).toHaveCount(0)
      await expect(rating.locator(".sadu-rating__item[data-filled]")).toHaveCount(4)
    })

    test("hover previews the new eyes at 45% and keeps the chosen ones solid", async ({ page }) => {
      const rating = fixture(page, "rating").getByRole("radiogroup", { name: "Tightness" })
      const eyes = rating.locator(".sadu-rating__item")
      await eyes.nth(1).click()
      await eyes.nth(3).hover()
      const opacity = (index: number) => eyes.nth(index).locator(".sadu-rating__eye").evaluate((element) => getComputedStyle(element).opacity)
      await expect.poll(() => opacity(3)).toBe("0.45")
      await expect.poll(() => opacity(2)).toBe("0.45")
      await expect.poll(() => opacity(1)).toBe("1")
      await expect.poll(() => opacity(4)).toBe("0")
    })

    test("pressing the chosen eye keeps it, unless deselectable", async ({ page }) => {
      const section = fixture(page, "rating")
      const kept = section.getByRole("radiogroup", { name: "Tightness" })
      await kept.locator(".sadu-rating__item").nth(2).click()
      await expect(section.getByTestId("rating-value")).toHaveText("3")
      const cleared = section.getByRole("radiogroup", { name: "Deselectable" })
      await cleared.locator(".sadu-rating__item").nth(1).click()
      await expect(cleared.locator(".sadu-rating__item[data-checked]")).toHaveCount(0)
    })

    test("the thread ends at the last eye", async ({ page }) => {
      const rating = fixture(page, "rating").getByRole("radiogroup", { name: "Tightness" })
      const whole = await box(rating)
      const last = await box(rating.locator(".sadu-rating__item").last())
      expect(whole.x + whole.width - (last.x + last.width)).toBeLessThanOrEqual(6)
    })
  })

  test.describe("Rug and Reweave", () => {
    async function settled(page: Page): Promise<void> {
      const section = fixture(page, "rug")
      await expect(section.locator(".sadu-reweave__layer[data-weaving]")).toHaveCount(0, { timeout: 4000 })
      await expect(section.locator(".sadu-beater")).toHaveCount(0, { timeout: 4000 })
      for (const band of await section.locator(".sadu-reweave").all()) {
        await expect(band.locator(".sadu-reweave__layer")).toHaveCount(1)
      }
    }

    async function stripColours(page: Page): Promise<string[]> {
      return fixture(page, "rug")
        .locator(".fixture__strip pattern[id$='-cloth'] path")
        .evaluateAll((rects) => [...new Set(rects.map((rect) => (rect as SVGElement).style.fill))].sort())
    }

    test("a change mid-weave ends on the final grid with one layer and no beater", async ({ page }) => {
      const section = fixture(page, "rug")
      const start = await stripColours(page)
      await section.getByRole("button", { name: "Next rug" }).click()
      await page.waitForTimeout(150)
      await section.getByRole("button", { name: "Next rug" }).click()
      await settled(page)
      await expect(section.getByTestId("rug-step")).toHaveText("dhalla:#2a3c63")
      expect(await stripColours(page)).not.toEqual(start)
      expect((await stripColours(page)).join()).toContain("42, 60, 99")
    })

    test("undo-style rapid changes land back on the first rug", async ({ page }) => {
      const section = fixture(page, "rug")
      const start = await stripColours(page)
      await section.getByRole("button", { name: "Next rug" }).click()
      await section.getByRole("button", { name: "Undo rug" }).click()
      await section.getByRole("button", { name: "Next rug" }).click()
      await section.getByRole("button", { name: "Undo rug" }).click()
      await settled(page)
      expect(await stripColours(page)).toEqual(start)
    })

    test("reduced motion shows the final state at once", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" })
      const section = fixture(page, "rug")
      await section.getByRole("button", { name: "Next rug" }).click()
      await page.waitForTimeout(250)
      await expect(section.locator(".sadu-reweave__layer[data-weaving]")).toHaveCount(0)
      await expect(section.locator(".sadu-beater")).toHaveCount(0)
    })
  })
})
