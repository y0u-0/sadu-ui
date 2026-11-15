import { test as base, expect, type Locator, type Page } from "@playwright/test"

const GALLERY = "/?gallery=inputs"

function card(page: Page, name: string): Locator {
  return page.locator(".gallery-card").filter({ has: page.locator(".gallery-card__name", { hasText: new RegExp(`^${name}$`) }) })
}

async function wovenFloats(page: Page): Promise<number> {
  return page.locator(".sadu-counter__float[data-woven]").count()
}

async function runningAnimations(locator: Locator): Promise<number> {
  return locator.evaluate((element) => element.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length)
}

const test = base.extend<{ quiet: void }>({
  quiet: [
    async ({ page }, use) => {
      const noise: string[] = []
      page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") noise.push(`${message.type()}: ${message.text()}`)
      })
      page.on("pageerror", (error) => noise.push(`pageerror: ${error.message}`))
      await page.goto(GALLERY)
      await expect(card(page, "Input")).toBeVisible()
      await use()
      expect(noise).toEqual([])
    },
    { auto: true },
  ],
})

test.describe("Input", () => {
  test("typing with real keys, clearing, and the strip weaves in then out", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Client name" })
    const cloth = card(page, "Input").locator(".sadu-dhurs__cloth").first()
    await input.click()
    await page.keyboard.press("End")
    await page.keyboard.type(" of Jahra", { delay: 15 })
    await expect(input).toHaveValue("Umm Saad Al-Ajmi of Jahra")
    await expect.poll(() => cloth.evaluate((element) => getComputedStyle(element).clipPath)).toBe("inset(0px)")
    await expect.poll(() => runningAnimations(card(page, "Input"))).toBe(0)
    await page.getByRole("button", { name: "Clear client name" }).click()
    await expect(input).toHaveValue("")
    await expect(input).toBeFocused()
    await page.keyboard.press("Tab")
    await page.keyboard.press("Tab")
    await expect.poll(() => cloth.evaluate((element) => getComputedStyle(element).clipPath)).toBe("inset(0px 100% 0px 0px)")
  })

  test("an input method composes in a controlled field without losing text", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Panel length required" })
    await input.fill("")
    const session = await page.context().newCDPSession(page)
    await session.send("Input.imeSetComposition", { text: "١", selectionStart: 1, selectionEnd: 1 })
    await session.send("Input.imeSetComposition", { text: "١٠", selectionStart: 2, selectionEnd: 2 })
    await session.send("Input.insertText", { text: "١٠" })
    await expect(input).toHaveValue("١٠")
    await page.keyboard.type(" m")
    await expect(input).toHaveValue("١٠ m")
  })

  test("rapid focus changes settle with no stuck beaters", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Client name" })
    for (let round = 0; round < 6; round++) {
      await input.focus()
      await input.blur()
    }
    await input.focus()
    await page.keyboard.type("abcdefghij", { delay: 5 })
    await expect.poll(() => runningAnimations(page.locator(".gallery-section"))).toBe(0)
    const beaterOpacity = await card(page, "Input").locator(".sadu-dhurs__beater").first().evaluate((element) => getComputedStyle(element).opacity)
    expect(beaterOpacity).toBe("0")
  })

  test("the strip mirrors in right-to-left pages", async ({ page }) => {
    await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"))
    const cloth = card(page, "Input").locator(".sadu-dhurs__cloth").first()
    await expect.poll(() => cloth.evaluate((element) => getComputedStyle(element).clipPath)).toBe("inset(0px 0px 0px 100%)")
  })
})

test.describe("Field", () => {
  test("the error is linked, clears when fixed, and required is spoken", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Panel length required" })
    await expect(input).toHaveAttribute("aria-invalid", "true")
    await expect(input).toHaveAccessibleDescription(/A tent panel runs 2 to 12 metres\./)
    await input.fill("")
    await input.pressSequentially("9")
    await expect(input).not.toHaveAttribute("aria-invalid", "true")
    await expect(input).toHaveAccessibleDescription("Measured along the warp.")
    await expect(card(page, "Field").locator(".sadu-field__error")).toHaveCount(0)
  })

  test("disabled fields are skipped and dashed", async ({ page }) => {
    const workshop = page.getByRole("textbox", { name: "Workshop", exact: true })
    await expect(workshop).toBeDisabled()
    const box = card(page, "Field").locator(".sadu-input").nth(1)
    expect(await box.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("dashed")
  })
})

test.describe("Number Input", () => {
  test("arrows, pages, home and end step the odd grid and the tally always matches", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Rows per band" })
    await input.focus()
    for (const [key, value] of [
      ["ArrowUp", "13"],
      ["ArrowDown", "11"],
      ["ArrowDown", "9"],
      ["PageUp", "21"],
      ["PageDown", "3"],
      ["End", "21"],
      ["Home", "3"],
    ] as const) {
      await page.keyboard.press(key)
      await expect(input).toHaveValue(value)
      await expect.poll(() => wovenFloats(page)).toBe(Number(value))
    }
    await expect(page.getByRole("button", { name: "Fewer rows" })).toHaveAttribute("data-at-bound", "")
  })

  test("typing then leaving clamps and snaps, and the tally follows", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Rows per band" })
    await input.fill("")
    await input.pressSequentially("40")
    await page.keyboard.press("Tab")
    await expect(input).toHaveValue("21")
    await input.fill("")
    await input.pressSequentially("8")
    await page.keyboard.press("Enter")
    const value = Number(await input.inputValue())
    expect(value % 2).toBe(1)
    await expect.poll(() => wovenFloats(page)).toBe(value)
  })

  test("reaching a bound plucks the tally once", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Rows per band" })
    await input.focus()
    await page.keyboard.press("End")
    const tally = page.locator(".sadu-counter__loom")
    expect(await tally.evaluate((element) => element.getAnimations().length)).toBe(1)
    await expect.poll(() => tally.evaluate((element) => element.getAnimations().length)).toBe(0)
  })

  test("pegs press, hold-free clicks step, and the unit scrubs", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Rows per band" })
    await page.getByRole("button", { name: "More rows" }).click()
    await expect(input).toHaveValue("13")
    const unit = page.locator(".sadu-counter__unit").first()
    const box = (await unit.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2, { steps: 8 })
    await page.mouse.up()
    const scrubbed = Number(await input.inputValue())
    expect(scrubbed).toBeGreaterThan(13)
    expect(scrubbed % 2).toBe(1)
    await expect.poll(() => wovenFloats(page)).toBe(scrubbed)
  })

  test("arrow keys keep their meaning in right-to-left pages and the tally mirrors", async ({ page }) => {
    await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"))
    const input = page.getByRole("textbox", { name: "Rows per band" })
    await input.focus()
    await page.keyboard.press("ArrowUp")
    await expect(input).toHaveValue("13")
    const floats = page.locator(".sadu-counter__float")
    const first = (await floats.first().boundingBox())!
    const last = (await floats.last().boundingBox())!
    expect(first.x).toBeGreaterThan(last.x)
    const minus = (await page.getByRole("button", { name: "Fewer rows" }).boundingBox())!
    const plus = (await page.getByRole("button", { name: "More rows" }).boundingBox())!
    expect(minus.x).toBeGreaterThan(plus.x)
  })
})

test.describe("Textarea", () => {
  test("the counter, band and over-limit error follow typing", async ({ page }) => {
    const notes = page.getByRole("textbox", { name: "Notes for the weaver" })
    await notes.click()
    await page.keyboard.press("ControlOrMeta+End")
    await expect(notes).toHaveAccessibleDescription("105 / 240")
    await page.keyboard.type(" Use the second dye lot for the saffron; the first ran pale in the sun and the client saw it on the last panel we sent to her majlis in Jahra.", { delay: 2 })
    const root = card(page, "Textarea").locator(".sadu-textarea").first()
    await expect(root).toHaveAttribute("data-over")
    await expect(card(page, "Textarea").locator(".sadu-field__error").first()).toContainText("Keep it under 240 characters")
    await expect(notes).toHaveAttribute("aria-invalid", "true")
    for (let index = 0; index < 40; index++) await page.keyboard.press("Backspace")
    await expect(root).not.toHaveAttribute("data-over")
    await expect(card(page, "Textarea").locator(".sadu-field__error")).toHaveCount(1)
    await expect(card(page, "Textarea").locator(".sadu-textarea").nth(1)).toHaveAttribute("data-over")
  })
})

test.describe("Password Input", () => {
  test("the eye font masks, the toggle opens and closes, and autofill hints stay", async ({ page }) => {
    const input = page.getByLabel("Workshop passphrase")
    const toggle = page.getByRole("button", { name: "Show password" })
    expect(await input.evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Sadu Eye")
    expect(await page.evaluate(() => document.fonts.check('14px "Sadu Eye"', "•"))).toBe(true)
    await expect(input).toHaveAttribute("type", "password")
    await expect(input).toHaveAttribute("autocomplete", "current-password")
    await toggle.click()
    await expect(input).toHaveAttribute("type", "text")
    await expect(toggle).toHaveAttribute("aria-pressed", "true")
    await expect(input).toHaveValue("goathair-loom")
    await toggle.click()
    await expect(input).toHaveAttribute("type", "password")
    await expect(toggle).toHaveAttribute("aria-pressed", "false")
  })

  test("caps lock writes a line under the field and clears when it's off", async ({ page }) => {
    const input = page.getByLabel("Workshop passphrase")
    await input.focus()
    const line = card(page, "Password Input").locator(".sadu-password__caps")
    await input.evaluate((element) => element.dispatchEvent(new KeyboardEvent("keydown", { key: "A", bubbles: true, modifierCapsLock: true })))
    await expect(line).toHaveText("Caps Lock is on")
    await input.evaluate((element) => element.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true, modifierCapsLock: false })))
    await expect(line).toHaveText("")
  })
})

test.describe("OTP Input", () => {
  test("typing advances, Backspace goes back, paste fills, and a full code joins", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Code from the workshop" })
    const root = card(page, "OTP Input").locator(".sadu-otp").first()
    await input.click()
    await page.keyboard.press("End")
    await page.keyboard.type("91")
    await expect(input).toHaveValue("48291")
    await page.keyboard.press("Backspace")
    await expect(input).toHaveValue("4829")
    await input.evaluate((element) => {
      const data = new DataTransfer()
      data.setData("text/plain", "731-906")
      element.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }))
    })
    await expect(input).toHaveValue("731906")
    await expect(root).toHaveAttribute("data-complete", "")
    await expect(root.locator(".sadu-otp__slot[data-filled]")).toHaveCount(6)
  })

  test("the expired code is invalid and described", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Code from the dye shed" })
    await expect(input).toHaveAttribute("aria-invalid", "true")
    await expect(input).toHaveAccessibleDescription(/That code has expired/)
  })
})

test.describe("Token Input", () => {
  test("# and @ open menus, Enter inserts, and Backspace selects then removes", async ({ page }) => {
    const editor = page.getByRole("textbox", { name: "Brief" })
    const tokens = card(page, "Token Input").locator(".sadu-token-input__token")
    await expect(tokens).toHaveCount(4)
    await editor.click()
    await page.keyboard.press("ControlOrMeta+End")
    await page.keyboard.type(" #indi")
    await expect(page.getByRole("option", { name: /indigo/ })).toBeVisible()
    await page.keyboard.press("Enter")
    await expect(tokens).toHaveCount(5)
    await expect(tokens.last()).toContainText("indigo")
    await page.keyboard.type(" for @")
    await expect(page.getByRole("option", { name: /Hessa/ })).toBeVisible()
    await page.keyboard.type("hes")
    await page.keyboard.press("Enter")
    await expect(tokens).toHaveCount(6)
    await expect(tokens.last()).toContainText("Hessa")
    await page.keyboard.press("Backspace")
    await page.keyboard.press("Backspace")
    await expect(tokens.last()).toHaveAttribute("data-selected", "")
    await page.keyboard.press("Backspace")
    await expect(tokens).toHaveCount(5)
  })

  test("Escape closes the menu and keeps the typed text", async ({ page }) => {
    const editor = page.getByRole("textbox", { name: "Brief" })
    await editor.click()
    await page.keyboard.press("ControlOrMeta+End")
    await page.keyboard.type(" #zzz")
    await expect(page.getByText("Nothing woven under that name.")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(editor).toContainText("#zzz")
  })
})

test.describe("Autocomplete", () => {
  test("inline completion is accepted with ArrowRight and taken back with Escape", async ({ page }) => {
    const input = page.getByRole("combobox", { name: "Motif", exact: true })
    await input.click()
    await page.keyboard.type("dh")
    await expect(input).toHaveValue(/^dhalla$/i)
    expect(await input.evaluate((element: HTMLInputElement) => [element.selectionStart, element.selectionEnd])).toEqual([2, 6])
    await expect(page.getByRole("option", { name: /Dhalla/ })).toBeVisible()
    await page.keyboard.press("ArrowRight")
    await expect(input).toHaveValue(/^dhalla$/i)
    expect(await input.evaluate((element: HTMLInputElement) => element.selectionStart === element.value.length)).toBe(true)
    await input.fill("")
    await page.keyboard.type("hu")
    await expect(input).toHaveValue(/^hubub$/i)
    await page.keyboard.press("Escape")
    await expect(input).toHaveValue("hu")
  })

  test("free text is kept and repeated letters are stitched once per match", async ({ page }) => {
    const input = page.getByRole("combobox", { name: "Motif", exact: true })
    await input.click()
    await page.keyboard.type("ub")
    const hubub = page.getByRole("option", { name: /Hubub/ })
    await expect(hubub).toBeVisible()
    await expect(hubub.locator("mark")).toHaveText(["ub"])
    await page.keyboard.press("Escape")
    await input.fill("")
    await page.keyboard.type("Brocade")
    await page.keyboard.press("Tab")
    await expect(input).toHaveValue("Brocade")
  })
})

test.describe("Combobox", () => {
  test("opens, filters, selects several, and chips come off with the keyboard", async ({ page }) => {
    const input = page.getByRole("combobox", { name: "Dyes for the band" })
    const chips = card(page, "Combobox").locator(".sadu-combobox__chip")
    await expect(chips).toHaveCount(2)
    await input.click()
    await page.keyboard.type("saf")
    await expect(page.getByRole("option", { name: /Saffron/ })).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")
    await expect(chips).toHaveCount(3)
    await expect(chips.last()).toContainText("Saffron")
    await page.keyboard.press("Backspace")
    await expect(chips).toHaveCount(2)
    await page.keyboard.type("xyz")
    await expect(page.getByText("Nothing woven under “xyz”.")).toBeVisible()
  })
})

test.describe("Date and Time Input", () => {
  test("segments move with arrows, take digits, clamp impossible days, and update the Hijri line", async ({ page }) => {
    const group = page.getByRole("group", { name: "موعد التسليم" })
    const day = group.getByRole("spinbutton", { name: /day|يوم/ })
    const year = group.getByRole("spinbutton", { name: /year|سنة/ })
    const hijri = card(page, "Date Input").locator(".sadu-date__hijri")
    const before = await hijri.textContent()
    await day.click()
    await page.keyboard.press("ArrowUp")
    await expect(day).toHaveAttribute("aria-valuenow", "15")
    await expect(hijri).not.toHaveText(before ?? "")
    await expect(group).toHaveAccessibleDescription((await hijri.textContent()) ?? "")
    expect((await day.boundingBox())!.x).toBeGreaterThan((await year.boundingBox())!.x)

    const latin = page.getByRole("group", { name: "Due date" })
    const latinDay = latin.getByRole("spinbutton", { name: "day" })
    const latinMonth = latin.getByRole("spinbutton", { name: "month" })
    await latinMonth.click()
    await page.keyboard.type("01")
    await latinDay.click()
    await page.keyboard.type("31")
    await expect(latinDay).toHaveAttribute("aria-valuenow", "31")
    await expect(latinMonth).toBeFocused()
    await page.keyboard.type("02")
    await expect(latinDay).toHaveAttribute("aria-valuenow", "28")
    await latinDay.click()
    await page.keyboard.press("ArrowLeft")
    await expect(latinDay).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await expect(latin.getByRole("spinbutton", { name: "month" })).toBeFocused()
    const float = card(page, "Date Input").locator(".sadu-date-input__float").first()
    const month = (await latin.getByRole("spinbutton", { name: "month" }).boundingBox())!
    await expect.poll(async () => Math.round((await float.boundingBox())!.x)).toBe(Math.round(month.x))
  })

  test("the time's day band follows the hour", async ({ page }) => {
    const group = page.getByRole("group", { name: "Collection time" })
    const band = card(page, "Time Input").locator(".sadu-time__day")
    await expect(band).toHaveAttribute("style", /--sadu-hour: 16;/)
    await group.getByRole("spinbutton", { name: "hour" }).click()
    await page.keyboard.press("ArrowUp")
    await expect(band).toHaveAttribute("style", /--sadu-hour: 17;/)
  })
})

type Pair = { label: string; ratio: number; minimum: number }

async function contrastPairs(page: Page): Promise<Pair[]> {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!
    const rgb = (color: string): [number, number, number, number] => {
      canvas.clearRect(0, 0, 1, 1)
      canvas.fillStyle = "#000"
      canvas.fillStyle = color
      canvas.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = canvas.getImageData(0, 0, 1, 1).data
      return [r!, g!, b!, a! / 255]
    }
    const luminance = ([r, g, b]: [number, number, number, number]) => {
      const channel = (value: number) => {
        const unit = value / 255
        return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
    }
    const ratio = (a: string, b: string) => {
      const [high, low] = [luminance(rgb(a)), luminance(rgb(b))].sort((x, y) => y - x)
      return (high! + 0.05) / (low! + 0.05)
    }
    const style = (selector: string) => getComputedStyle(document.querySelector(selector)!)
    const surface = style(".sadu-input").backgroundColor
    const edgeShadow = style(".sadu-input").boxShadow.match(/rgba?\([^)]*\)|color\([^)]*\)|#[0-9a-f]+/i)?.[0] ?? ""
    const placeholder = getComputedStyle(document.querySelector('input[placeholder="Search motifs"]')!, "::placeholder").color
    return [
      { label: "control text", ratio: ratio(style(".sadu-input__control").color, surface), minimum: 4.5 },
      { label: "placeholder", ratio: ratio(placeholder, surface), minimum: 4.5 },
      { label: "label", ratio: ratio(style(".sadu-field__label").color, style(".gallery-card").backgroundColor), minimum: 4.5 },
      { label: "description", ratio: ratio(style(".sadu-field__description").color, style(".gallery-card").backgroundColor), minimum: 4.5 },
      { label: "error", ratio: ratio(style(".sadu-field__error").color, style(".gallery-card").backgroundColor), minimum: 4.5 },
      { label: "control edge", ratio: ratio(edgeShadow, style(".gallery-card").backgroundColor), minimum: 3 },
      { label: "counter", ratio: ratio(style(".sadu-textarea__count").color, style(".gallery-card").backgroundColor), minimum: 4.5 },
      { label: "otp edge", ratio: ratio(style(".sadu-otp__slot").boxShadow.match(/rgba?\([^)]*\)|color\([^)]*\)/)?.[0] ?? "", style(".gallery-card").backgroundColor), minimum: 3 },
    ]
  })
}

test.describe("Contrast and themes", () => {
  for (const theme of ["day", "tent"] as const) {
    test(`key states meet contrast in the ${theme} theme`, async ({ page }) => {
      await page.evaluate((value) => document.querySelector(".gallery-section")?.setAttribute("data-theme", value), theme)
      await page.waitForTimeout(400)
      const failures = (await contrastPairs(page)).filter((pair) => pair.ratio < pair.minimum)
      expect(failures).toEqual([])
    })
  }

  test("goat-hair cloth swaps to wool in the tent so the strip stays visible", async ({ page }) => {
    await page.evaluate(() => document.querySelector(".gallery-section")?.setAttribute("data-theme", "tent"))
    const fills = await card(page, "Input")
      .locator(".sadu-dhurs .sadu-weave")
      .first()
      .evaluate((element) => [...element.querySelectorAll("path[style]")].map((path) => getComputedStyle(path).fill))
    expect(fills).toContain("rgb(230, 217, 191)")
    expect(fills).toContain("rgb(31, 24, 19)")
  })

  test("reduced motion shows the strip at once and runs no beater", async ({ page }) => {
    await page.evaluate(() => document.querySelector(".gallery-section")?.setAttribute("data-motion", "reduced"))
    await page.getByRole("textbox", { name: "Client name" }).focus()
    const cloth = card(page, "Input").locator(".sadu-dhurs__cloth").first()
    expect(await cloth.evaluate((element) => getComputedStyle(element).clipPath)).toBe("inset(0px)")
    expect(await card(page, "Input").locator(".sadu-dhurs__beater").first().evaluate((element) => element.getAnimations().length)).toBe(0)
  })
})

const CATALOGUE_IDS = [
  "sadu-field",
  "sadu-input",
  "sadu-number-input",
  "sadu-password-input",
  "sadu-textarea",
  "sadu-otp-input",
  "sadu-autocomplete",
  "sadu-combobox",
  "sadu-token-input",
  "sadu-date-input",
  "sadu-time-input",
]

test.describe("Catalogue", () => {
  for (const id of CATALOGUE_IDS) {
    test(`the ${id} detail page renders its live demo`, async ({ page }) => {
      await page.goto(`/#/c/${id}`)
      const control = page.locator("main").locator("input, textarea, [contenteditable='true']").first()
      await expect(control).toBeVisible()
      await page.waitForTimeout(300)
    })
  }
})
