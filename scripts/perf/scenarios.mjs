/*
 * Every interaction a person does with each catalogue card, run on the live home page
 * (all 56 cards mounted, the heaviest context a component lives in), plus the page-level flows.
 *
 * kind: "interact" scores input latency, "drag" and "animation" also score frames.
 */

const POPUP = "[role=dialog], [role=alertdialog], [role=menu], [role=listbox][data-open], [data-slot=popover-popup], [role=tooltip]"

const card = (h, id) => h.page.locator(`article[data-id="${id}"] .catalog-card__stage`)

async function openClose(h, trigger, inside) {
  await h.click(trigger)
  if (inside) await inside()
  await h.escape()
}

const component = (id, kind, run, extra = {}) => ({ name: id, group: "component", card: id, kind, run, ...extra })

const COMPONENTS = [
  component("rug", "animation", async (h) => {
    const c = card(h, "rug")
    await h.click(c.getByRole("combobox"))
    await h.click(h.page.getByRole("option", { name: /^Ain/ }))
    await h.wait(1200)
    for (const level of ["Thread", "Stitch", "Cloth"]) {
      await h.click(c.getByRole("radio", { name: level }))
      await h.wait(400)
    }
    await h.click(c.getByRole("button", { name: /Weave another/ }))
    await h.wait(1200)
  }),
  component("motif-select", "animation", async (h) => {
    const c = card(h, "motif-select")
    await h.click(c.getByRole("combobox"))
    await h.press("ArrowDown")
    await h.press("ArrowDown")
    await h.press("Enter")
    await h.wait(1000)
    await openClose(h, c.getByRole("combobox"))
  }),
  component("skein-radio", "animation", async (h) => {
    const c = card(h, "skein-radio")
    for (const name of ["Saffron", "Indigo", "Camel", "Goat hair", "Madder"]) {
      await h.click(c.getByRole("radio", { name }))
      await h.wait(250)
    }
  }),
  component("loom-slider", "drag", async (h) => {
    const c = card(h, "loom-slider")
    await h.focus(c.locator("input[type=range]"))
    await h.press("ArrowRight", 8)
    await h.press("ArrowLeft", 8)
    const track = c.locator(".sadu-loom__control")
    await h.drag(track, { from: 0.2, dx: 0.6, steps: 40 })
    await h.drag(track, { from: 0.8, dx: -0.6, steps: 40 })
  }),
  component("sadu-switch", "interact", async (h) => {
    const switches = card(h, "sadu-switch").getByRole("switch")
    for (let pass = 0; pass < 2; pass++) for (let index = 0; index < 3; index++) await h.click(switches.nth(index))
  }),
  component("eye-rating", "interact", async (h) => {
    const c = card(h, "eye-rating")
    for (let star = 1; star <= 5; star++) await h.hover(c.getByRole("radio").nth(star - 1))
    await h.click(c.getByRole("radio").nth(2))
    await h.click(c.getByRole("radio").nth(4))
    await h.click(c.getByRole("radio").nth(3))
  }),
  component("sadu-tabs", "interact", async (h) => {
    const c = card(h, "sadu-tabs")
    for (const name of ["Wool", "Loom", "Motifs"]) await h.click(c.getByRole("tab", { name }))
    await h.press("ArrowRight", 3)
  }),
  component("sadu-menubar", "interact", async (h) => {
    const c = card(h, "sadu-menubar")
    await h.click(c.getByRole("menuitem", { name: "Loom" }))
    await h.press("ArrowRight", 4)
    await h.press("ArrowDown", 2)
    await h.escape()
    await h.escape()
    await openClose(h, c.getByRole("menuitem", { name: "View" }))
  }),
  component("sadu-button", "interact", async (h) => {
    const buttons = card(h, "sadu-button").getByRole("button")
    const count = await buttons.count()
    for (let index = 0; index < count; index++) await h.click(buttons.nth(index))
  }),
  component("sadu-segmented-control", "interact", async (h) => {
    const c = card(h, "sadu-segmented-control")
    for (const name of ["Goat hair", "Camel", "Wool"]) await h.click(c.getByRole("radio", { name }))
  }),
  component("warp-toggle", "interact", async (h) => {
    const buttons = card(h, "warp-toggle").getByRole("button")
    const count = await buttons.count()
    for (let index = 0; index < count; index++) await h.click(buttons.nth(index))
    for (let index = 0; index < count; index++) await h.click(buttons.nth(index))
  }),
  component("loom-toolbar", "interact", async (h) => {
    const c = card(h, "loom-toolbar")
    for (const name of ["Undo", "Redo", "Guide threads", "Mirror", "Lock band", "Lock band", "Zoom in", "Zoom out"]) {
      await h.click(c.getByRole("button", { name, exact: true }))
    }
    await openClose(h, c.getByRole("combobox"), () => h.press("ArrowDown", 2))
  }),
  component("sadu-command", "interact", async (h) => {
    const input = card(h, "sadu-command").getByRole("combobox")
    await h.type(input, "dye lot")
    await h.press("Backspace", 7)
    await h.press("ArrowDown", 4)
  }),
  component("sadu-menu", "interact", async (h) => {
    const trigger = card(h, "sadu-menu").getByRole("button", { name: "Band actions" })
    await openClose(h, trigger, () => h.press("ArrowDown", 4))
    await openClose(h, trigger)
  }),
  component("sadu-trigger-menu", "interact", async (h) => {
    const box = card(h, "sadu-trigger-menu").getByRole("textbox")
    await h.click(box)
    await h.press("End")
    await h.typeKeys(" @He")
    await h.press("ArrowDown")
    await h.escape()
    await h.typeKeys(" ties the warp")
  }),
  component("eye-pagination", "interact", async (h) => {
    const c = card(h, "eye-pagination")
    for (let step = 0; step < 3; step++) await h.click(c.getByRole("button", { name: "Next page" }))
    await h.click(c.getByRole("button", { name: "1", exact: true }))
    await h.click(c.getByRole("button", { name: "Next page" }))
    await h.click(c.getByRole("button", { name: "Previous page" }))
  }),
  component("sadu-navigation-menu", "interact", async (h) => {
    const c = card(h, "sadu-navigation-menu")
    for (const name of ["Motifs", "Materials", "Pieces"]) {
      await h.hover(c.getByRole("button", { name }))
      await h.wait(350)
    }
    await h.click(c.getByRole("button", { name: "Motifs" }))
    await h.escape()
    await h.leave()
  }),
  component("sadu-dialog", "interact", async (h) => {
    await openClose(h, card(h, "sadu-dialog").getByRole("button", { name: "Edit main band" }), () => h.wait(300))
  }),
  component("sadu-alert-dialog", "interact", async (h) => {
    await openClose(h, card(h, "sadu-alert-dialog").getByRole("button", { name: "Unravel band" }).first(), () => h.wait(300))
  }),
  component("sadu-drawer", "interact", async (h) => {
    await openClose(h, card(h, "sadu-drawer").getByRole("button", { name: "Open order 14" }), () => h.wait(400))
  }),
  component("sadu-popover", "interact", async (h) => {
    await openClose(h, card(h, "sadu-popover").getByRole("button", { name: "Band width" }), () => h.wait(200))
  }),
  component("sadu-hover-card", "interact", async (h) => {
    const c = card(h, "sadu-hover-card")
    for (const name of ["Uwairjan", "Dhurus al-khail"]) {
      await h.hover(c.getByRole("link", { name }))
      await h.wait(900)
      await h.leave()
      await h.wait(400)
    }
  }),
  component("sadu-tooltip", "interact", async (h) => {
    const buttons = card(h, "sadu-tooltip").getByRole("button")
    for (let index = 0; index < 3; index++) {
      await h.hover(buttons.nth(index))
      await h.wait(700)
    }
    await h.leave()
  }),
  component("sadu-toast", "animation", async (h) => {
    const c = card(h, "sadu-toast")
    for (let index = 0; index < 3; index++) await h.click(c.getByRole("button", { name: "Record dye lot" }))
    for (let index = 0; index < 2; index++) await h.click(c.getByRole("button", { name: "Send pattern" }))
    await h.wait(800)
  }),
  component("sadu-collapsible", "animation", async (h) => {
    const buttons = card(h, "sadu-collapsible").getByRole("button")
    for (let pass = 0; pass < 2; pass++) {
      for (let index = 0; index < 2; index++) {
        await h.click(buttons.nth(index))
        await h.wait(300)
      }
    }
  }),
  component("sadu-accordion", "animation", async (h) => {
    const c = card(h, "sadu-accordion")
    for (const name of ["Shearing and spinning", "Warping the loom", "Weaving", "Cutting and finishing", "Dyeing"]) {
      await h.click(c.getByRole("button", { name: new RegExp(`^${name}`) }))
      await h.wait(350)
    }
  }),
  component("sadu-preferences", "animation", async (h) => {
    const c = card(h, "sadu-preferences")
    const radios = ["Tent", "Day", "Saffron", "Indigo", "Madder", "Reduced", "Full", "More", "Standard", "Right to left", "Left to right"]
    for (const name of radios) {
      await h.click(c.getByRole("radio", { name, exact: true }))
      await h.wait(200)
    }
    await h.click(c.getByRole("button", { name: "Reset" }))
    await h.wait(600)
  }),
  component("sadu-textarea", "interact", async (h) => {
    await h.type(card(h, "sadu-textarea").locator("textarea").first(), " Add a second ain band near the fringe.")
  }),
  component("sadu-field", "interact", async (h) => {
    const inputs = card(h, "sadu-field").locator("input")
    await h.type(inputs.nth(0), " Hessa")
    await h.type(inputs.nth(1), "x")
    await h.press("Backspace")
  }),
  component("sadu-number-input", "interact", async (h) => {
    const c = card(h, "sadu-number-input")
    for (let step = 0; step < 5; step++) await h.click(c.getByRole("button", { name: "More rows" }))
    for (let step = 0; step < 3; step++) await h.click(c.getByRole("button", { name: "Fewer rows" }))
    await h.click(c.locator("input[type=text]").first())
    await h.press("ArrowUp", 6)
    await h.press("ArrowDown", 6)
    await h.typeKeys("2")
    await h.press("Tab")
  }),
  component("sadu-token-input", "interact", async (h) => {
    const box = card(h, "sadu-token-input").getByRole("textbox")
    await h.click(box)
    await h.press("End")
    await h.typeKeys(" indigo")
    await h.press("Backspace", 7)
  }),
  component("sadu-otp-input", "interact", async (h) => {
    await h.type(card(h, "sadu-otp-input").locator("input").first(), "481516")
    await h.press("Backspace", 6)
  }),
  component("sadu-input", "interact", async (h) => {
    const c = card(h, "sadu-input")
    await h.type(c.locator("input").first(), " Saad")
    await h.click(c.getByRole("button", { name: /^Clear/ }))
  }),
  component("sadu-autocomplete", "interact", async (h) => {
    const input = card(h, "sadu-autocomplete").getByRole("combobox")
    await h.type(input, "dh")
    await h.press("ArrowDown", 2)
    await h.escape()
    await h.press("Backspace", 2)
    await h.escape()
  }),
  component("sadu-combobox", "interact", async (h) => {
    const c = card(h, "sadu-combobox")
    await openClose(h, c.getByRole("button", { name: "Show border motifs" }), () => h.press("ArrowDown", 2))
    await h.type(c.getByRole("combobox", { name: /dye/i }).or(c.getByPlaceholder("Add a dye")).first(), "sa")
    await h.press("ArrowDown")
    await h.escape()
    await h.press("Backspace", 2)
  }),
  component("sadu-time-input", "interact", async (h) => {
    const c = card(h, "sadu-time-input")
    await h.click(c.getByRole("spinbutton").first())
    await h.typeKeys("1030")
    await h.press("ArrowUp", 3)
    await h.press("ArrowDown", 3)
  }),
  component("sadu-password-input", "interact", async (h) => {
    const c = card(h, "sadu-password-input")
    await h.type(c.locator("input").first(), "sadu2026")
    await h.click(c.getByRole("button", { name: /password/i }))
    await h.click(c.getByRole("button", { name: /password/i }))
  }),
  component("sadu-date-input", "interact", async (h) => {
    const c = card(h, "sadu-date-input")
    await h.click(c.getByRole("spinbutton").first())
    await h.typeKeys("12052026")
    await h.press("ArrowUp", 3)
  }),
  component("sadu-calendar", "drag", async (h) => {
    const c = card(h, "sadu-calendar")
    for (const name of ["Next month", "Next month", "Previous month", "Previous month"]) await h.click(c.getByRole("button", { name }))
    const cells = c.getByRole("gridcell")
    await h.click(cells.nth(9))
    await h.click(cells.nth(15))
    await h.dragBetween(cells.nth(17), cells.nth(26), 24)
    await h.press("ArrowRight", 4)
  }),
  component("sadu-date-picker", "interact", async (h) => {
    const c = card(h, "sadu-date-picker")
    await openClose(h, c.getByRole("button", { name: /^Choose date,/ }), () => h.press("ArrowRight", 3))
    await openClose(h, c.getByRole("button", { name: /^Choose dates/ }), () => h.press("ArrowRight", 3))
  }),
  component("sadu-color-picker", "drag", async (h) => {
    const c = card(h, "sadu-color-picker")
    for (const name of ["Saffron", "Indigo", "Henna", "Madder"]) await h.click(c.getByRole("option", { name }))
    await h.drag(c.getByRole("slider", { name: /Saturation/ }), { from: [0.2, 0.2], dx: 0.6, dy: 0.6, steps: 40 })
    await h.drag(c.getByRole("slider", { name: "Hue" }), { from: 0.1, dx: 0.8, steps: 40 })
    await h.type(c.getByRole("textbox", { name: "Hex" }), "")
  }),
  component("sadu-file-input", "interact", async (h) => {
    const c = card(h, "sadu-file-input")
    await h.hover(c.getByRole("button", { name: "browse" }))
    await h.click(c.getByRole("button", { name: /^Remove divider/ }))
  }),
  component("sadu-listbox", "interact", async (h) => {
    const options = card(h, "sadu-listbox").getByRole("option")
    await h.click(options.nth(1))
    await h.click(options.nth(2))
    await h.press("ArrowDown", 4)
    await h.press(" ")
  }),
  component("sadu-image-cropper", "drag", async (h) => {
    const c = card(h, "sadu-image-cropper")
    for (const name of ["Cushion 3:2", "Band 4:1", "Square"]) await h.click(c.getByRole("radio", { name }))
    await h.drag(c.getByRole("slider", { name: "Crop" }), { from: [0.5, 0.5], dxPx: 40, dyPx: 30, steps: 40 })
    await h.drag(c.getByRole("slider", { name: "Bottom right corner" }), { from: [0.5, 0.5], dxPx: -40, dyPx: -30, steps: 30 })
    await h.drag(c.getByRole("slider", { name: "Zoom" }), { from: 0.1, dx: 0.6, steps: 30 })
    await h.click(c.getByRole("button", { name: /^Rotate/ }))
    await h.click(c.getByRole("button", { name: "Flip" }))
  }),
  component("sadu-checkbox", "interact", async (h) => {
    const boxes = card(h, "sadu-checkbox").getByRole("checkbox")
    for (let index = 0; index < 4; index++) await h.click(boxes.nth(index))
    await h.click(boxes.nth(0))
  }),
  component("sadu-tree", "interact", async (h) => {
    const items = card(h, "sadu-tree").getByRole("treeitem")
    await h.click(items.nth(0))
    await h.press("ArrowDown", 6)
    await h.press("ArrowLeft", 2)
    await h.press("ArrowRight", 2)
  }),
  component("sadu-carousel", "animation", async (h) => {
    const c = card(h, "sadu-carousel")
    for (let step = 0; step < 4; step++) {
      await h.click(c.getByRole("button", { name: "Next" }))
      await h.wait(350)
    }
    await h.click(c.getByRole("tab", { name: "Tent divider" }))
    await h.wait(500)
  }),
  component("weaver-avatar", "interact", async (h) => {
    await h.hover(card(h, "weaver-avatar").getByRole("group"))
    await h.leave()
  }),
  component("thread-separator", "interact", async (h) => {
    await h.hover(card(h, "thread-separator").getByRole("separator").first())
    await h.leave()
  }),
  component("wool-meter", "interact", async (h) => {
    await h.hover(card(h, "wool-meter").getByRole("meter").first())
    await h.leave()
  }),
  component("wood-scroll-area", "drag", async (h) => {
    const region = card(h, "wood-scroll-area").getByRole("region")
    await h.wheel(region, 60, 12)
    await h.wheel(region, -60, 12)
    const thumb = card(h, "wood-scroll-area").locator("[class*=thumb]").first()
    await h.drag(thumb, { from: [0.5, 0.5], dyPx: 120, steps: 30 })
    await h.drag(thumb, { from: [0.5, 0.5], dyPx: -120, steps: 30 })
  }),
  component("beam-resizable", "drag", async (h) => {
    const handle = card(h, "beam-resizable").getByRole("separator")
    await h.drag(handle, { from: [0.5, 0.5], dxPx: -120, steps: 40 })
    await h.drag(handle, { from: [0.5, 0.5], dxPx: 120, steps: 40 })
    await h.click(handle)
    await h.press("ArrowLeft", 4)
    await h.press("ArrowRight", 4)
  }),
  component("code-block", "interact", async (h) => {
    const c = card(h, "code-block")
    await h.click(c.getByRole("tab", { name: "CSS" }))
    await h.click(c.getByRole("tab", { name: "React" }))
    await h.click(c.getByRole("button", { name: /^Copy/ }))
    await h.wheel(c.getByRole("region"), 60, 6)
  }),
  component("warp-timeline", "animation", async (h) => {
    const c = card(h, "warp-timeline")
    for (let step = 0; step < 3; step++) {
      await h.click(c.getByRole("button", { name: "Finish this step" }))
      await h.wait(250)
    }
    await h.click(c.getByRole("button", { name: "Reset" }))
  }),
  component("loom-progress", "animation", async (h) => {
    const c = card(h, "loom-progress")
    for (let step = 0; step < 3; step++) {
      await h.click(c.getByRole("button", { name: /^Beat in/ }))
      await h.wait(300)
    }
    await h.click(c.getByRole("button", { name: "Reset" }))
    await h.wait(400)
  }),
  component("dye-waterfall", "interact", async (h) => {
    const c = card(h, "dye-waterfall")
    await h.click(c.getByRole("rowheader").first())
    await h.press("ArrowDown", 4)
    await h.press("ArrowRight", 2)
    await h.hover(c.getByRole("row").nth(3))
  }),
]

const SETTINGS = [
  {
    name: "top-bar dye switch (re-weave all)",
    group: "page",
    kind: "animation",
    run: async (h) => {
      const skeins = h.page.locator(".topbar__skeins").getByRole("radio")
      for (const index of [1, 2, 3, 4, 0]) {
        await h.click(skeins.nth(index))
        await h.wait(1100)
      }
    },
  },
  {
    name: "top-bar theme day/tent",
    group: "page",
    kind: "interact",
    run: async (h) => {
      const control = h.page.locator(".topbar__modes .topbar__theme")
      for (let pass = 0; pass < 2; pass++) {
        await h.click(control.getByRole("radio").nth(1))
        await h.click(control.getByRole("radio").nth(0))
      }
    },
  },
  {
    name: "top-bar RTL toggle",
    group: "page",
    kind: "interact",
    run: async (h) => {
      const toggle = h.page.locator(".topbar__modes").getByRole("button").first()
      for (let pass = 0; pass < 2; pass++) {
        await h.click(toggle)
        await h.wait(300)
        await h.click(toggle)
        await h.wait(300)
      }
      await h.leave()
    },
  },
  {
    name: "top-bar motion toggle",
    group: "page",
    kind: "interact",
    run: async (h) => {
      const toggle = h.page.locator(".topbar__modes").getByRole("button").nth(1)
      await h.click(toggle)
      await h.click(toggle)
      await h.leave()
    },
  },
]

const POPUP_CYCLES = [
  ["sadu-dialog", (h) => card(h, "sadu-dialog").getByRole("button", { name: "Edit main band" })],
  ["sadu-alert-dialog", (h) => card(h, "sadu-alert-dialog").getByRole("button", { name: "Unravel band" }).first()],
  ["sadu-drawer", (h) => card(h, "sadu-drawer").getByRole("button", { name: "Open order 14" })],
  ["sadu-popover", (h) => card(h, "sadu-popover").getByRole("button", { name: "Band width" })],
  ["sadu-menu", (h) => card(h, "sadu-menu").getByRole("button", { name: "Band actions" })],
  ["sadu-menubar", (h) => card(h, "sadu-menubar").getByRole("menuitem", { name: "Loom" })],
  ["motif-select", (h) => card(h, "motif-select").getByRole("combobox")],
  ["sadu-date-picker", (h) => card(h, "sadu-date-picker").getByRole("button", { name: /^Choose date,/ })],
  ["sadu-combobox", (h) => card(h, "sadu-combobox").getByRole("button", { name: "Show border motifs" })],
  ["loom-toolbar", (h) => card(h, "loom-toolbar").getByRole("combobox")],
]

/*
 * Resizable, phase by phase, wherever it lives: the home card, its detail page and the display gallery.
 * Hover and drag are paced one pointer move per frame, like a real mouse.
 */
const RESIZABLE_PLACES = [
  { place: "home card", path: "/", scope: 'article[data-id="beam-resizable"]' },
  { place: "detail page", path: "/#/c/beam-resizable", scope: ".playground" },
  { place: "gallery", path: "/?gallery=display", scope: "main" },
]

async function handleCentre(h, scope) {
  const handle = h.page.locator(`${scope} [data-slot="resizable-handle"]`).first()
  await handle.scrollIntoViewIfNeeded({ timeout: 5000 })
  const box = await handle.boundingBox({ timeout: 5000 })
  if (!box) throw new Error("resizable handle has no box")
  return { handle, x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

const RESIZABLE_PHASES = [
  {
    phase: "hover in/out",
    kind: "drag",
    run: async (h, scope) => {
      const { x, y } = await handleCentre(h, scope)
      await h.glide({ x: x - 160, y }, { x, y }, 16)
      await h.wait(300)
      await h.glide({ x, y }, { x: x - 160, y }, 16)
      await h.wait(300)
    },
  },
  {
    phase: "drag 600px both ways",
    kind: "drag",
    run: async (h, scope) => {
      const { x, y } = await handleCentre(h, scope)
      await h.glide({ x: x - 160, y }, { x, y }, 10)
      await h.page.mouse.down()
      h.interactions++
      await h.glide({ x, y }, { x: x - 600, y }, 60, false)
      await h.glide({ x: x - 600, y }, { x: x + 600, y }, 120, false)
      await h.glide({ x: x + 600, y }, { x, y }, 60, false)
      await h.page.mouse.up()
      await h.settle()
      await h.glide({ x, y }, { x: x - 160, y }, 10)
      await h.wait(300)
    },
  },
  {
    phase: "keyboard resize",
    kind: "interact",
    run: async (h, scope) => {
      const { handle } = await handleCentre(h, scope)
      await h.focus(handle)
      await h.press("ArrowLeft", 8)
      await h.press("ArrowRight", 16)
      await h.press("ArrowLeft", 8)
      await h.press("Home")
      await h.press("End")
    },
  },
]

const RESIZABLE = RESIZABLE_PLACES.flatMap(({ place, path, scope }) =>
  RESIZABLE_PHASES.map(({ phase, kind, run }) => ({
    name: `resizable ${place}: ${phase}`,
    group: "resizable",
    kind,
    path,
    prepare: (h) => handleCentre(h, scope),
    run: (h) => run(h, scope),
  })),
)

export { COMPONENTS, POPUP, POPUP_CYCLES, RESIZABLE, SETTINGS, card }
