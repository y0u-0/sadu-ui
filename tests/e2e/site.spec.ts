import { expect, test, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test"

const ORIGIN = "http://localhost:5191"

const IDS = [
  "rug", "motif-select", "skein-radio", "loom-slider", "sadu-switch", "eye-rating",
  "sadu-tabs", "sadu-menubar", "sadu-button", "sadu-segmented-control", "warp-toggle", "loom-toolbar",
  "sadu-command", "sadu-menu", "sadu-trigger-menu", "eye-pagination", "sadu-navigation-menu", "sadu-dialog",
  "sadu-alert-dialog", "sadu-drawer", "sadu-popover", "sadu-hover-card", "sadu-tooltip", "sadu-accordion",
  "sadu-preferences", "sadu-toast", "sadu-collapsible", "sadu-textarea", "sadu-field", "sadu-number-input",
  "sadu-token-input", "sadu-otp-input", "sadu-input", "sadu-autocomplete", "sadu-combobox", "sadu-time-input",
  "sadu-password-input", "sadu-date-input", "sadu-calendar", "sadu-date-picker", "sadu-color-picker", "sadu-file-input",
  "sadu-listbox", "sadu-image-cropper", "sadu-checkbox", "sadu-tree", "sadu-carousel", "weaver-avatar",
  "thread-separator", "wool-meter", "wood-scroll-area", "beam-resizable", "code-block", "warp-timeline",
  "loom-progress", "dye-waterfall",
] as const

const REGISTRY_NAME: Partial<Record<(typeof IDS)[number], string>> = { rug: "sadu-core" }

const FILE_TYPES = new Set([
  "registry:lib", "registry:block", "registry:component", "registry:ui", "registry:hook",
  "registry:page", "registry:file", "registry:style", "registry:theme", "registry:item",
])

type RegistryFile = { path: string; type: string; target: string; content: string }
type RegistryItem = {
  $schema: string
  name: string
  type: string
  title: string
  description: string
  dependencies: string[]
  registryDependencies: string[]
  files: RegistryFile[]
}
type ZipEntry = { name: string; content: string; crcOk: boolean }

function watchConsole(page: Page): string[] {
  const problems: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") problems.push(`${message.type()}: ${message.text()}`)
  })
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`))
  return problems
}

async function instrument(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    const store: Blob[] = []
    const copied: string[] = []
    Object.defineProperty(window, "__saduBlobs", { value: store })
    Object.defineProperty(window, "__saduCopied", { value: copied })
    const original = URL.createObjectURL.bind(URL)
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) store.push(object)
      return original(object)
    }
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          copied.push(text)
        },
        readText: async () => copied[copied.length - 1] ?? "",
      },
    })
  })
}

async function readLastZip(page: Page): Promise<ZipEntry[]> {
  return page.evaluate(async () => {
    const blobs = (window as unknown as { __saduBlobs: Blob[] }).__saduBlobs
    const blob = blobs[blobs.length - 1]
    if (!blob) throw new Error("no zip was created")
    const bytes = new Uint8Array(await blob.arrayBuffer())
    const view = new DataView(bytes.buffer)
    const table = Array.from({ length: 256 }, (_, index) => {
      let value = index
      for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
      return value >>> 0
    })
    const crc = (data: Uint8Array): number => {
      let value = 0xffffffff
      for (const byte of data) value = table[(value ^ byte) & 0xff]! ^ (value >>> 8)
      return (value ^ 0xffffffff) >>> 0
    }
    const end = bytes.length - 22
    if (view.getUint32(end, true) !== 0x06054b50) throw new Error("missing end of central directory")
    const count = view.getUint16(end + 10, true)
    let offset = view.getUint32(end + 16, true)
    const decoder = new TextDecoder()
    const entries: { name: string; content: string; crcOk: boolean }[] = []
    for (let index = 0; index < count; index++) {
      if (view.getUint32(offset, true) !== 0x02014b50) throw new Error("bad central directory entry")
      const method = view.getUint16(offset + 10, true)
      const expected = view.getUint32(offset + 16, true)
      const size = view.getUint32(offset + 20, true)
      const nameLength = view.getUint16(offset + 28, true)
      const extra = view.getUint16(offset + 30, true)
      const comment = view.getUint16(offset + 32, true)
      const local = view.getUint32(offset + 42, true)
      const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength))
      if (method !== 0) throw new Error(`${name} is compressed`)
      if (view.getUint32(local, true) !== 0x04034b50) throw new Error(`${name} has no local header`)
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true)
      const data = bytes.subarray(start, start + size)
      entries.push({ name, content: decoder.decode(data), crcOk: crc(data) === expected })
      offset += 46 + nameLength + extra + comment
    }
    return entries
  })
}

async function fetchItem(request: APIRequestContext, name: string): Promise<RegistryItem> {
  const response = await request.get(`/r/${name}.json`)
  expect(response.ok(), `${name}.json`).toBe(true)
  return (await response.json()) as RegistryItem
}

async function closure(request: APIRequestContext, name: string): Promise<RegistryItem[]> {
  const seen = new Map<string, RegistryItem>()
  const visit = async (next: string): Promise<void> => {
    if (seen.has(next)) return
    const item = await fetchItem(request, next)
    seen.set(next, item)
    for (const url of item.registryDependencies) await visit(url.slice(url.lastIndexOf("/") + 1).replace(/\.json$/, ""))
  }
  await visit(name)
  return [...seen.values()]
}

function expectedEntries(items: readonly RegistryItem[]): Map<string, string> {
  const files = new Map<string, string>()
  for (const item of items) for (const file of item.files) files.set(`sadu/${file.target}`, file.content)
  return files
}

function expectZip(entries: readonly ZipEntry[], expected: Map<string, string>): void {
  expect(entries.map((entry) => entry.name).sort()).toEqual([...expected.keys()].sort())
  for (const entry of entries) {
    expect(entry.crcOk, `${entry.name} CRC`).toBe(true)
    expect(entry.content, entry.name).toBe(expected.get(entry.name))
  }
}

async function clipboard(page: Page): Promise<string> {
  return page.evaluate(() => {
    const copied = (window as unknown as { __saduCopied: string[] }).__saduCopied
    return copied[copied.length - 1] ?? ""
  })
}

let problems: string[] = []

test.beforeEach(async ({ page, context }) => {
  problems = watchConsole(page)
  await instrument(context)
})

test.afterEach(() => {
  expect(problems).toEqual([])
})

test.describe("routes", () => {
  test("the home catalogue lists every component in order, each linking to its page", async ({ page }) => {
    await page.goto("/")
    const links = page.locator("a.catalog-card__head")
    await expect(links).toHaveCount(IDS.length)
    const hrefs = await links.evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href")))
    expect(hrefs).toEqual(IDS.map((id) => `#/c/${id}`))
    const numbers = await page.locator(".catalog-card__number").allTextContents()
    expect(numbers).toEqual(IDS.map((_, index) => String(index + 1).padStart(2, "0")))
    await expect(page.locator(".catalog-card .sadu-empty")).toHaveCount(0)
  })

  test("the retired Loom, Workshop and Bench addresses land on the catalogue", async ({ page }) => {
    for (const path of ["/#/loom", "/#/workshop", "/#/bench"]) {
      await page.goto(path)
      await expect(page.locator(".catalog-card")).toHaveCount(IDS.length)
    }
    await expect(page.locator(".topbar__link")).toHaveCount(0)
  })

  test("deep links, back and forward move between pages", async ({ page }) => {
    await page.goto("/#/c/sadu-switch")
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Switch")
    await page.getByRole("link", { name: /Next.*Rating/ }).click()
    await expect(page).toHaveURL(/#\/c\/eye-rating$/)
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Rating")
    await page.goBack()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Switch")
    await page.goForward()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Rating")
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  test("a new page opens at the top and Back returns to where the reader was", async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => window.scrollTo(0, 3000))
    await page.waitForTimeout(200)
    const link = page.locator("a.catalog-card__head").nth(30)
    await link.scrollIntoViewIfNeeded()
    const before = await page.evaluate(() => window.scrollY)
    await link.click()
    await expect(page.locator(".detail__title")).toBeVisible()
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    await page.goBack()
    await expect(page.locator(".catalog-card")).toHaveCount(IDS.length)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before)
    await page.goForward()
    await expect(page.locator(".detail__title")).toBeVisible()
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  test("unknown ids and routes fail gracefully", async ({ page }) => {
    await page.goto("/#/c/not-a-component")
    await expect(page.getByText("Nothing woven by that name.")).toBeVisible()
    await page.getByRole("link", { name: "Back to the catalogue" }).click()
    await expect(page.locator(".catalog-card")).toHaveCount(IDS.length)
    await page.goto("/#/elsewhere")
    await expect(page.locator(".catalog-card")).toHaveCount(IDS.length)
  })

  test("an in-page hash link inside a demo keeps the current page", async ({ page }) => {
    await page.goto("/#/c/sadu-switch")
    await page.evaluate(() => {
      window.location.hash = "#motif-eyoun"
    })
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Switch")
  })
})

test.describe("every component page", () => {
  for (const id of IDS) {
    test(`${id}: playground, install, source, copy, zip and 390px`, async ({ page, request }) => {
      const registry = REGISTRY_NAME[id] ?? id
      await page.goto(`/#/c/${id}`)
      const stage = page.locator(".playground__stage")
      await expect(stage.locator(".playground__mount")).toBeVisible()
      await expect(stage.locator(".sadu-empty")).toHaveCount(0)
      expect((await stage.locator(".playground__mount").innerHTML()).length).toBeGreaterThan(40)

      const command = `npx shadcn@latest add ${ORIGIN}/r/${registry}.json`
      await expect(page.locator(".command-line__text")).toHaveText(command)
      await page.getByRole("button", { name: "Copy Install command" }).click()
      await expect.poll(() => clipboard(page)).toBe(command)

      const item = await fetchItem(request, registry)
      const code = page.locator(".detail-code .detail__code")
      await expect(code).toBeVisible()
      await expect(code.getByRole("tab")).toHaveCount(item.files.length === 1 ? 0 : item.files.length)
      const first = item.files.find((file) => file.path.endsWith(`/${id === "rug" ? "rug.tsx" : `${id}.tsx`}`)) ?? item.files[0]!
      await code.locator(".sadu-code__copy").first().click()
      await expect.poll(() => clipboard(page)).toBe(first.content.replace(/\n$/, ""))

      await page.getByRole("button", { name: "Download .zip" }).click()
      await expect.poll(() => page.evaluate(() => (window as unknown as { __saduBlobs: Blob[] }).__saduBlobs.length)).toBe(1)
      expectZip(await readLastZip(page), expectedEntries(await closure(request, registry)))

      await page.setViewportSize({ width: 390, height: 844 })
      await page.waitForTimeout(200)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    })
  }
})

test.describe("downloads and registry", () => {
  test("the library zip holds every registry file, unchanged", async ({ page, request }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Download the library" }).click()
    await expect.poll(() => page.evaluate(() => (window as unknown as { __saduBlobs: Blob[] }).__saduBlobs.length)).toBe(1)
    const index = (await (await request.get("/r/registry.json")).json()) as { items: { name: string }[] }
    const items = await Promise.all(index.items.map((item) => fetchItem(request, item.name)))
    expectZip(await readLastZip(page), expectedEntries(items))
  })

  test("every registry item has the shadcn item shape and resolvable dependencies", async ({ request }) => {
    const response = await request.get("/r/registry.json")
    expect(response.ok()).toBe(true)
    const index = (await response.json()) as { $schema: string; name: string; homepage: string; items: RegistryItem[] }
    expect(index.$schema).toBe("https://ui.shadcn.com/schema/registry.json")
    expect(index.name).toBe("sadu")
    const names = new Set(index.items.map((item) => item.name))
    for (const id of IDS) expect(names.has(REGISTRY_NAME[id] ?? id), id).toBe(true)
    for (const listed of index.items) {
      const item = await fetchItem(request, listed.name)
      expect(item.$schema).toBe("https://ui.shadcn.com/schema/registry-item.json")
      expect(item.name).toBe(listed.name)
      expect(item.name).toMatch(/^[a-z0-9-]+$/)
      expect(item.type).toBe("registry:ui")
      expect(item.title.length).toBeGreaterThan(0)
      expect(item.description.length).toBeGreaterThan(0)
      for (const dependency of item.dependencies) expect(dependency).toMatch(/^(@[a-z0-9-]+\/)?[a-z0-9-]+@\S+$/)
      expect(item.files.length).toBeGreaterThan(0)
      for (const file of item.files) {
        expect(FILE_TYPES.has(file.type), file.path).toBe(true)
        expect(file.target).toMatch(/^components\/sadu\//)
        expect(file.content.length).toBeGreaterThan(0)
        expect(listed.files.map((entry) => entry.path)).toContain(file.path)
      }
      if (item.name !== "sadu-core") expect(item.registryDependencies).toContain(`${ORIGIN}/r/sadu-core.json`)
      for (const url of item.registryDependencies) {
        expect(url).toMatch(new RegExp(`^${ORIGIN}/r/[a-z0-9-]+\\.json$`))
        const dependency = await request.get(url)
        expect(dependency.ok(), url).toBe(true)
      }
    }
  })
})

test.describe("top bar", () => {
  test("dye, theme, direction and motion apply everywhere and survive a reload", async ({ page }) => {
    await page.goto("/")
    const root = page.locator("html")
    const number = page.locator(".catalog-card__number").first()
    const madder = await number.evaluate((element) => getComputedStyle(element).color)
    await page.locator(".topbar__skeins").getByRole("radio", { name: "Indigo" }).click()
    await expect(root).toHaveAttribute("data-dye", "indigo")
    await expect(page.locator(".topbar__dye-name")).toHaveText("Indigo")
    expect(await number.evaluate((element) => getComputedStyle(element).color)).not.toBe(madder)
    await page.locator(".topbar__modes .topbar__theme").getByText("Tent").click()
    await expect(root).toHaveAttribute("data-theme", "tent")
    await page.locator(".topbar__modes").getByRole("button", { name: "RTL" }).click()
    await expect(root).toHaveAttribute("dir", "rtl")
    await expect(root).toHaveAttribute("lang", "ar")
    await expect(page.locator(".family__title").first()).toHaveText("القطع المميزة")
    await page.locator(".topbar__modes").getByRole("button", { name: "سكون" }).click()
    await expect(root).toHaveAttribute("data-motion", "reduced")

    await page.reload()
    await expect(root).toHaveAttribute("data-dye", "indigo")
    await expect(root).toHaveAttribute("data-theme", "tent")
    await expect(root).toHaveAttribute("data-motion", "reduced")
    await expect(root).toHaveAttribute("dir", "rtl")
    await expect(page.locator(".topbar__modes").getByRole("button", { name: "عربي" })).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator(".topbar__skeins").getByRole("radio", { name: "نيلي" })).toBeChecked()

    await page.goto("/#/c/sadu-switch")
    await expect(root).toHaveAttribute("data-dye", "indigo")
    await expect(page.locator(".playground__stage")).toHaveAttribute("data-theme", "tent")
    await expect(page.locator(".playground__panel").getByRole("radio", { name: "نيلي" })).toBeChecked()
    const cloth = page.locator(".playground__stage .sadu-switch__cloth").first()
    await expect(cloth.locator("rect").first()).toBeAttached()
    expect(await cloth.innerHTML()).toContain("42, 60, 99")
  })

  test("a component page preview follows the top bar until it is set by hand", async ({ page }) => {
    await page.goto("/#/c/sadu-tabs")
    const stage = page.locator(".playground__stage")
    await expect(stage).toHaveAttribute("data-theme", "day")
    await page.locator(".topbar__modes .topbar__theme").getByText("Tent").click()
    await expect(stage).toHaveAttribute("data-theme", "tent")
    await page.getByRole("radiogroup", { name: "Stage theme" }).getByText("Day").click()
    await expect(stage).toHaveAttribute("data-theme", "day")
    await expect(page.locator("html")).toHaveAttribute("data-theme", "tent")
    await page.locator(".topbar__modes").getByRole("button", { name: "RTL" }).click()
    await expect(stage).toHaveAttribute("dir", "rtl")
  })

  test("the skeins card drives the catalogue dye and copes with a dye it does not offer", async ({ page }) => {
    await page.goto("/#/c/skein-radio")
    const preview = page.locator(".playground__stage")
    await preview.getByRole("radio", { name: "Camel" }).click()
    await expect(page.locator("html")).toHaveAttribute("data-dye", "camel")
    await page.locator(".playground__panel").getByText("Dyed only").click()
    await expect(preview.getByRole("radio")).toHaveCount(3)
    await expect(preview.locator('[role="radio"][aria-checked="true"]')).toHaveCount(0)
    await preview.getByRole("radio", { name: "Indigo" }).click()
    await expect(page.locator("html")).toHaveAttribute("data-dye", "indigo")
    await expect(page.locator(".topbar__skeins").getByRole("radio", { name: "Indigo" })).toBeChecked()
  })

  test("the masthead band re-weaves in the chosen dye", async ({ page }) => {
    await page.goto("/")
    await page.locator(".topbar__skeins").getByRole("radio", { name: "Saffron" }).click()
    await expect(page.locator(".masthead__selvedge .sadu-reweave__layer")).toHaveCount(1, { timeout: 4000 })
    expect(await page.locator(".masthead__selvedge").innerHTML()).toContain("207, 122, 27")
  })
})

test.describe("installation prompt", () => {
  test("copies the exact agent instructions", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Installation prompt" }).click()
    const dialog = page.locator(".install-prompt")
    await expect(dialog).toBeVisible()
    const expected = [
      `Install components from the Sadu shadcn registry. ${ORIGIN}/r/registry.json lists every item.`,
      `Add one with \`npx shadcn@latest add ${ORIGIN}/r/<name>.json\`; each item brings sadu-core and the items it needs.`,
      "Import `components/sadu/sadu.css` once.",
      'Set data-theme="day" or "tent" on the root, and dir="rtl" on pages that read right to left.',
    ].join("\n")
    await expect(dialog.locator(".install-prompt__text")).toHaveText(expected)
    await dialog.getByRole("button", { name: "Copy" }).click()
    await expect.poll(() => clipboard(page)).toBe(expected)
    await dialog.getByRole("button", { name: "Close" }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole("button", { name: "Installation prompt" })).toBeFocused()
  })
})

test.describe("playground controls change the preview", () => {
  test("button variant, size, label and disabled", async ({ page }) => {
    await page.goto("/#/c/sadu-button")
    const preview = page.locator(".playground__stage .sadu-button").first()
    await expect(preview).toHaveAttribute("data-variant", "primary")
    await page.locator(".playground__panel").getByText("Destructive").click()
    await expect(preview).toHaveAttribute("data-variant", "destructive")
    await page.locator(".playground__panel").getByText("L", { exact: true }).click()
    await expect(preview).toHaveAttribute("data-size", "lg")
    await page.locator(".playground__panel").getByRole("textbox", { name: "Label" }).fill("Beat the row")
    await expect(preview).toHaveText("Beat the row")
    await page.locator(".playground__panel").getByRole("switch", { name: "Disabled" }).click()
    await expect(preview).toBeDisabled()
    await page.getByRole("button", { name: "Reset" }).click()
    await expect(preview).toHaveAttribute("data-variant", "primary")
  })

  test("the preview theme and direction switches are scoped to the preview", async ({ page }) => {
    await page.goto("/#/c/sadu-tabs")
    const stage = page.locator(".playground__stage")
    await page.getByRole("radiogroup", { name: "Stage theme" }).getByText("Tent").click()
    await expect(stage).toHaveAttribute("data-theme", "tent")
    await expect(page.locator("html")).toHaveAttribute("data-theme", "day")
    await page.getByRole("radiogroup", { name: "Stage direction" }).getByText("RTL").click()
    await expect(stage).toHaveAttribute("dir", "rtl")
    await expect.poll(() => stage.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(31, 24, 19)")
  })
})

const INERT_CHOICES = new Set(["sadu-popover:Side", "sadu-tooltip:Side", "sadu-drawer:Side", "sadu-toast:Kind", "sadu-alert-dialog:Tone"])

test.describe("every toggle and choice changes its preview", () => {
  for (const id of IDS) {
    test(`${id} controls`, async ({ page }) => {
      await page.goto(`/#/c/${id}`)
      const stage = page.locator(".playground__mount")
      await expect(stage).toBeVisible()
      const panel = page.locator(".playground__panel")
      for (const toggle of await panel.locator(".knob--toggle").all()) {
        const label = (await toggle.textContent())?.trim() ?? ""
        const before = await stage.innerHTML()
        await toggle.getByRole("switch").click()
        await expect.poll(() => stage.innerHTML(), { message: `${id}: ${label}`, timeout: 2000 }).not.toBe(before)
      }
      for (const choice of await panel.locator(".knob--choice").all()) {
        const label = (await choice.locator(".sadu-label").textContent())?.trim() ?? ""
        if (INERT_CHOICES.has(`${id}:${label}`)) continue
        const before = await stage.innerHTML()
        const options = await choice.locator('[data-slot="segmented-control-item"]:not([data-checked])').all()
        let changed = false
        for (const option of options) {
          await option.click()
          await page.waitForTimeout(150)
          if ((await stage.innerHTML()) !== before) {
            changed = true
            break
          }
        }
        expect(changed, `${id}: ${label}`).toBe(true)
      }
    })
  }
})

type PopupCase = {
  id: string
  trigger: (page: Page) => ReturnType<Page["locator"]>
  open: "click" | "hover"
  popup: (page: Page) => ReturnType<Page["locator"]>
  modal?: boolean
  escape?: boolean
}

const card = (page: Page, id: string): ReturnType<Page["locator"]> => page.locator(`.catalog-card[data-id="${id}"]`)

const POPUP_CARDS: readonly PopupCase[] = [
  { id: "sadu-dialog", open: "click", modal: true, escape: true, trigger: (page) => card(page, "sadu-dialog").getByRole("button", { name: "Edit main band" }), popup: (page) => page.getByRole("dialog") },
  { id: "sadu-alert-dialog", open: "click", modal: true, escape: true, trigger: (page) => card(page, "sadu-alert-dialog").getByRole("button", { name: "Unravel band" }), popup: (page) => page.getByRole("alertdialog") },
  { id: "sadu-drawer", open: "click", modal: true, escape: true, trigger: (page) => card(page, "sadu-drawer").getByRole("button", { name: "Open order 14" }), popup: (page) => page.getByRole("dialog") },
  { id: "sadu-popover", open: "click", escape: true, trigger: (page) => card(page, "sadu-popover").getByRole("button", { name: "Band width" }), popup: (page) => page.locator(".sadu-popover[data-open]") },
  { id: "sadu-menu", open: "click", escape: true, trigger: (page) => card(page, "sadu-menu").getByRole("button", { name: /Band actions/ }), popup: (page) => page.getByRole("menu") },
  { id: "sadu-navigation-menu", open: "click", escape: true, trigger: (page) => card(page, "sadu-navigation-menu").getByRole("button", { name: "Motifs" }), popup: (page) => page.locator(".sadu-nav__viewport").first() },
  { id: "sadu-hover-card", open: "hover", trigger: (page) => card(page, "sadu-hover-card").getByRole("link", { name: "Uwairjan" }), popup: (page) => page.locator(".sadu-hover-card[data-open]") },
  { id: "sadu-tooltip", open: "hover", trigger: (page) => card(page, "sadu-tooltip").getByRole("button").first(), popup: (page) => page.getByRole("tooltip") },
]

test.describe("popup cards open the real component", () => {
  test("no frozen specimen is rendered inside a home card", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator(".catalog-card").first()).toBeVisible()
    await expect(page.locator(".catalog-card [data-specimen], .catalog-card .specimen__view")).toHaveCount(0)
    await expect(page.locator(".catalog-card .menus-specimen:visible")).toHaveCount(0)
  })

  for (const item of POPUP_CARDS) {
    test(`${item.id}: the trigger opens the real popup in the top layer`, async ({ page }) => {
      await page.goto("/")
      const trigger = item.trigger(page)
      await trigger.scrollIntoViewIfNeeded()
      if (item.open === "hover") await trigger.hover()
      else await trigger.click()
      const popup = item.popup(page)
      await expect(popup).toBeVisible()
      expect(await popup.evaluate((element) => !element.closest("[data-specimen]"))).toBe(true)
      const layered = await popup.evaluate((element) => {
        for (let node: Element | null = element; node; node = node.parentElement) {
          if (node.matches(":popover-open, :modal")) return true
        }
        return false
      })
      expect(layered, `${item.id} is in the top layer`).toBe(true)
      if (item.modal) await expect.poll(() => popup.evaluate((element) => element.contains(document.activeElement))).toBe(true)
      if (item.escape) {
        await page.keyboard.press("Escape")
        await expect(popup).toBeHidden()
        await expect(trigger).toBeFocused()
      }
    })
  }

  test("sadu-toast: the trigger fires a real toast", async ({ page }) => {
    await page.goto("/")
    const trigger = card(page, "sadu-toast").getByRole("button", { name: "Record dye lot" })
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()
    const toast = page.locator(".sadu-toast:not([data-specimen])", { hasText: "Dye lot recorded" })
    await expect(toast).toBeVisible()
    expect(await toast.evaluate((element) => !element.closest(".catalog-card"))).toBe(true)
  })
})

test.describe("layout and keyboard", () => {
  for (const path of ["/"]) {
    test(`${path} has no horizontal scroll at 390px`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(path)
      await page.waitForTimeout(600)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    })
  }

  test("Tab reaches every control on the home page once, each with a name", async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto("/")
    await page.waitForTimeout(400)
    const expected = await page.evaluate(() => {
      const selector = "a[href], button, input, select, textarea, [tabindex]"
      return [...document.querySelectorAll<HTMLElement>(selector)].filter((element) => {
        if (element.tabIndex < 0 || element.closest("[inert], [hidden]") || element.matches(":disabled")) return false
        if (element instanceof HTMLInputElement && element.type === "hidden") return false
        const style = getComputedStyle(element)
        if (style.visibility === "hidden" || style.display === "none") return false
        return element.getClientRects().length > 0 && element.offsetParent !== null
      }).length
    })
    const visited = new Set<string>()
    const unnamed: string[] = []
    const invisible: string[] = []
    for (let step = 0; step < expected + 40; step++) {
      await page.keyboard.press("Tab")
      const focus = await page.evaluate(() => {
        const element = document.activeElement
        if (!element || element === document.body) return null
        const path: string[] = []
        for (let node: Element | null = element; node; node = node.parentElement) {
          path.unshift(`${node.tagName}:${[...(node.parentElement?.children ?? [])].indexOf(node)}`)
        }
        const labelled = element.getAttribute("aria-labelledby")
        const byIds = labelled ? labelled.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ") : ""
        const label = element.id ? (document.querySelector(`label[for="${element.id}"]`)?.textContent ?? "") : ""
        const name = [element.getAttribute("aria-label"), byIds, label, element.closest("label")?.textContent, element.textContent, element.getAttribute("title")]
          .map((value) => value?.trim() ?? "")
          .find((value) => value.length > 0) ?? ""
        return { key: path.join("/"), name, visible: element.getClientRects().length > 0 }
      })
      if (!focus) continue
      if (visited.has(focus.key)) break
      visited.add(focus.key)
      if (!focus.name) unnamed.push(focus.key)
      if (!focus.visible) invisible.push(focus.key)
    }
    expect(invisible).toEqual([])
    expect(unnamed).toEqual([])
    expect(visited.size).toBeGreaterThanOrEqual(expected - 2)
  })

  test("focus and scroll never move on their own", async ({ page }) => {
    test.setTimeout(60_000)
    for (const path of ["/", "/#/c/rug"]) {
      await page.goto(path)
      await page.waitForTimeout(9000)
      expect(await page.evaluate(() => document.activeElement === document.body), path).toBe(true)
      expect(await page.evaluate(() => window.scrollY), path).toBe(0)
    }
    await page.evaluate(() => window.scrollTo(0, 300))
    const scrolled = await page.evaluate(() => window.scrollY)
    expect(scrolled).toBeGreaterThan(0)
    await page.waitForTimeout(8000)
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolled)
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true)
  })

})
