import { act, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState, type ReactElement } from "react"
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from "vitest"
import { EyeRating } from "../../src/sadu/eye-rating"
import { LoomSlider } from "../../src/sadu/loom-slider"
import { MotifSelect } from "../../src/sadu/motif-select"
import { MOTIFS, shajarah, type MotifId } from "../../src/sadu/motifs"
import { INK, WOOLS, type WoolId } from "../../src/sadu/palette"
import { Rug, mainColors } from "../../src/sadu/rug"
import { SaduSwitch } from "../../src/sadu/sadu-switch"
import { SaduTabs } from "../../src/sadu/sadu-tabs"
import { SkeinRadio } from "../../src/sadu/skein-radio"
import { Reweave } from "../../src/sadu/weave"

let errors: MockInstance
let warnings: MockInstance

const JSDOM_CSS_NOISE = "Could not parse CSS stylesheet"

function reported(spy: MockInstance): unknown[][] {
  return spy.mock.calls.filter((call) => !String(call[0] instanceof Error ? call[0].message : call[0]).includes(JSDOM_CSS_NOISE))
}

beforeEach(() => {
  errors = vi.spyOn(console, "error")
  warnings = vi.spyOn(console, "warn")
})

afterEach(() => {
  const unexpected = [...reported(errors), ...reported(warnings)]
  vi.restoreAllMocks()
  expect(unexpected).toEqual([])
})

const COLORS = mainColors(WOOLS.madder.hex)

function layersOf(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(".sadu-reweave__layer")]
}

function animationEnd(target: Element, animationName: string): void {
  const event = new Event("animationend", { bubbles: true })
  Object.defineProperty(event, "animationName", { value: animationName })
  target.dispatchEvent(event)
}

function endWeave(layer: HTMLElement): void {
  animationEnd(layer, "sadu-beat-reveal")
}

describe("shajarah", () => {
  test("is deterministic for a seed", () => {
    expect(shajarah(42)).toEqual(shajarah(42))
    expect(shajarah(7)).toEqual(shajarah(7))
  })

  test("varies by seed and keeps an eleven-row band of even width", () => {
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => shajarah(seed).join("|"))
    expect(new Set(seeds).size).toBeGreaterThan(1)
    for (const seed of [1, 9, 1234]) {
      const grid = shajarah(seed)
      expect(grid).toHaveLength(11)
      expect(new Set(grid.map((row) => row.length)).size).toBe(1)
    }
  })
})

describe("Reweave", () => {
  test("weaves a change in on a second layer with a beater, then settles to one layer", () => {
    const { container, rerender } = render(<Reweave grid={MOTIFS.eyoun.grid} colors={COLORS} />)
    expect(layersOf(container)).toHaveLength(1)
    rerender(<Reweave grid={MOTIFS.dhalla.grid} colors={COLORS} />)
    const layers = layersOf(container)
    expect(layers).toHaveLength(2)
    expect(layers[1]).toHaveAttribute("data-weaving")
    expect(container.querySelectorAll(".sadu-beater")).toHaveLength(1)
    act(() => endWeave(layers[1]!))
    expect(layersOf(container)).toHaveLength(1)
    expect(layersOf(container)[0]).not.toHaveAttribute("data-weaving")
    expect(container.querySelectorAll(".sadu-beater")).toHaveLength(0)
  })

  test("a change mid-weave ends on the final grid with one layer", () => {
    const { container, rerender } = render(<Reweave grid={MOTIFS.eyoun.grid} colors={COLORS} />)
    rerender(<Reweave grid={MOTIFS.dhalla.grid} colors={COLORS} />)
    rerender(<Reweave grid={MOTIFS.hubub.grid} colors={COLORS} />)
    const layers = layersOf(container)
    expect(layers).toHaveLength(2)
    expect(container.querySelectorAll(".sadu-beater")).toHaveLength(1)
    act(() => endWeave(layers[1]!))
    expect(layersOf(container)).toHaveLength(1)
    expect(container.querySelectorAll(".sadu-beater")).toHaveLength(0)
    const rows = container.querySelectorAll(".sadu-reweave__layer pattern[id$='-cloth'] path")
    const expected = render(<Reweave grid={MOTIFS.hubub.grid} colors={COLORS} />).container
    expect(rows.length).toBe(expected.querySelectorAll("pattern[id$='-cloth'] path").length)
  })

  test("undo-style changes land back on the first grid", () => {
    const { container, rerender } = render(<Reweave grid={MOTIFS.eyoun.grid} colors={COLORS} />)
    const first = container.querySelector("pattern[id$='-cloth']")!.innerHTML
    rerender(<Reweave grid={MOTIFS.dhalla.grid} colors={COLORS} />)
    rerender(<Reweave grid={MOTIFS.eyoun.grid} colors={COLORS} />)
    act(() => endWeave(layersOf(container)[1]!))
    expect(layersOf(container)).toHaveLength(1)
    expect(container.querySelector("pattern[id$='-cloth']")!.innerHTML).toBe(first)
  })

  test("ignores animation ends bubbling from inside a layer", () => {
    const { container, rerender } = render(<Reweave grid={MOTIFS.eyoun.grid} colors={COLORS} />)
    rerender(<Reweave grid={MOTIFS.dhalla.grid} colors={COLORS} />)
    act(() => {
      animationEnd(layersOf(container)[1]!.querySelector("svg")!, "sadu-beat-reveal")
    })
    expect(layersOf(container)).toHaveLength(2)
  })

  test("a colour change re-weaves, an identical render does not", () => {
    const { container, rerender } = render(<Reweave grid={MOTIFS.eyoun.grid} colors={COLORS} />)
    rerender(<Reweave grid={MOTIFS.eyoun.grid} colors={{ ...COLORS }} />)
    expect(layersOf(container)).toHaveLength(1)
    rerender(<Reweave grid={MOTIFS.eyoun.grid} colors={mainColors(WOOLS.indigo.hex)} />)
    expect(layersOf(container)).toHaveLength(2)
  })
})

describe("Rug", () => {
  function beaters(container: HTMLElement): NodeListOf<Element> {
    return container.querySelectorAll(".sadu-rug__cloth > .sadu-beater")
  }

  test("is named for its motif and draws no beater at rest", () => {
    const { container } = render(<Rug motif="uwairjan" dye={WOOLS.madder.hex} />)
    expect(screen.getByRole("img", { name: "Rug with Uwairjan borders" })).toBeInTheDocument()
    expect(beaters(container)).toHaveLength(0)
  })

  test("one shared beater sweeps a change and leaves once it fades", () => {
    const { container, rerender } = render(<Rug motif="uwairjan" dye={WOOLS.madder.hex} />)
    rerender(<Rug motif="uwairjan" dye={WOOLS.saffron.hex} />)
    expect(beaters(container)).toHaveLength(1)
    act(() => {
      animationEnd(beaters(container)[0]!, "sadu-beat-travel")
    })
    expect(beaters(container)).toHaveLength(1)
    act(() => {
      animationEnd(beaters(container)[0]!, "sadu-beat-fade")
    })
    expect(beaters(container)).toHaveLength(0)
  })

  test("a new seed weaves a new Shajarah with the beater", () => {
    const { container, rerender } = render(<Rug motif="eyoun" dye={WOOLS.madder.hex} seed={3} />)
    rerender(<Rug motif="eyoun" dye={WOOLS.madder.hex} seed={4} />)
    expect(beaters(container)).toHaveLength(1)
  })

  test("rapid changes keep a single beater and every band settles to one layer", () => {
    const { container, rerender } = render(<Rug motif="eyoun" dye={WOOLS.madder.hex} />)
    rerender(<Rug motif="dhalla" dye={WOOLS.saffron.hex} />)
    rerender(<Rug motif="eyoun" dye={WOOLS.madder.hex} />)
    expect(beaters(container)).toHaveLength(1)
    act(() => {
      container.querySelectorAll<HTMLElement>(".sadu-reweave__layer[data-weaving]").forEach(endWeave)
      animationEnd(beaters(container)[0]!, "sadu-beat-fade")
    })
    for (const band of container.querySelectorAll(".sadu-rug__cloth > .sadu-reweave")) {
      expect(band.querySelectorAll(".sadu-reweave__layer")).toHaveLength(1)
    }
    expect(container.querySelectorAll(".sadu-beater")).toHaveLength(0)
  })

  test("on the loom it shows bare warp beside the cloth", () => {
    const { container } = render(<Rug motif="eyoun" dye={WOOLS.madder.hex} woven={120} />)
    expect(container.querySelector(".sadu-rug")).toHaveAttribute("data-on-loom")
    expect(container.querySelector(".sadu-rug__warp")).not.toBeNull()
  })
})

describe("LoomSlider", () => {
  test("shows value and unit and steps with the keyboard when uncontrolled", async () => {
    const user = userEvent.setup()
    render(<LoomSlider label="Rows woven" grid={MOTIFS.uwairjan.grid} colors={COLORS} defaultValue={20} unit="rows" />)
    const thumb = screen.getByRole("slider", { name: "Rows woven" })
    expect(thumb).toHaveValue("20")
    expect(screen.getByText("rows")).toBeInTheDocument()
    thumb.focus()
    await user.keyboard("{ArrowRight}")
    expect(thumb).toHaveValue("21")
    await user.keyboard("{End}")
    expect(thumb).toHaveValue("80")
    await user.keyboard("{Home}")
    expect(thumb).toHaveValue("0")
    await user.keyboard("{PageUp}")
    expect(Number((thumb as HTMLInputElement).value)).toBeGreaterThan(1)
  })

  test("follows its value when controlled and reports each change", async () => {
    const user = userEvent.setup()
    const changes: number[] = []
    function Controlled(): ReactElement {
      const [rows, setRows] = useState(40)
      return (
        <>
          <LoomSlider
            label="Rows"
            grid={MOTIFS.uwairjan.grid}
            colors={COLORS}
            value={rows}
            onValueChange={(next) => {
              changes.push(next)
              setRows(next)
            }}
          />
          <button type="button" onClick={() => setRows(72)}>
            Set 72
          </button>
        </>
      )
    }
    render(<Controlled />)
    const thumb = screen.getByRole("slider", { name: "Rows" })
    await user.click(screen.getByRole("button", { name: "Set 72" }))
    expect(thumb).toHaveValue("72")
    thumb.focus()
    await user.keyboard("{ArrowLeft}")
    expect(thumb).toHaveValue("71")
    expect(changes).toEqual([71])
  })

  test("submits its value under a name", () => {
    const { container } = render(<LoomSlider label="Rows" grid={MOTIFS.uwairjan.grid} colors={COLORS} defaultValue={33} name="rows" />)
    const input = container.querySelector<HTMLInputElement>("input[name='rows']")
    expect(input?.value).toBe("33")
  })
})

describe("MotifSelect", () => {
  function Picker({ onChange }: { onChange: (value: MotifId) => void }): ReactElement {
    const [motif, setMotif] = useState<MotifId>("eyoun")
    return (
      <MotifSelect
        label="Main band"
        dye={WOOLS.madder.hex}
        value={motif}
        onValueChange={(next) => {
          onChange(next)
          setMotif(next)
        }}
      />
    )
  }

  test("opens from the keyboard, marks only the chosen item, and reports one change", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker onChange={onChange} />)
    const trigger = screen.getByRole("combobox", { name: "Main band" })
    expect(trigger).toHaveTextContent("Ain")
    trigger.focus()
    await user.keyboard("{ArrowDown}")
    const listbox = await screen.findByRole("listbox")
    const options = within(listbox).getAllByRole("option")
    expect(options).toHaveLength(5)
    const selected = options.filter((option) => option.getAttribute("aria-selected") === "true")
    expect(selected).toHaveLength(1)
    expect(selected[0]).toHaveTextContent("Ain")
    expect(listbox.querySelectorAll(".sadu-motif__check svg")).toHaveLength(1)
    await user.click(within(listbox).getByRole("option", { name: /Dhalla/ }))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith("dhalla")
    expect(trigger).toHaveTextContent("Dhalla")
    expect(trigger).toHaveFocus()
  })

  test("opens with Enter and Space", async () => {
    const user = userEvent.setup()
    render(<Picker onChange={() => undefined} />)
    const trigger = screen.getByRole("combobox", { name: "Main band" })
    trigger.focus()
    await user.keyboard("{Enter}")
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    await user.keyboard("{Escape}")
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    await user.keyboard(" ")
    expect(trigger).toHaveAttribute("aria-expanded", "true")
  })
})

describe("SkeinRadio", () => {
  function nameText(): string {
    return document.querySelector(".sadu-skeins__name")?.textContent ?? ""
  }

  test("shows the selected wool's name, the pointed one while pointing, then falls back", () => {
    render(<SkeinRadio label="Wool" defaultValue="saffron" />)
    expect(nameText()).toBe("Saffron")
    fireEvent.pointerEnter(screen.getByRole("radio", { name: "Indigo" }))
    expect(nameText()).toBe("Indigo")
    fireEvent.pointerLeave(screen.getByRole("radiogroup"))
    expect(nameText()).toBe("Saffron")
  })

  test("moves the choice with arrows and keeps the name in step", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SkeinRadio label="Wool" defaultValue="saffron" onValueChange={onChange} />)
    screen.getByRole("radio", { name: "Saffron" }).focus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("radio", { name: "Indigo" })).toHaveAttribute("aria-checked", "true")
    expect(onChange).toHaveBeenCalledWith("indigo")
    act(() => (document.activeElement as HTMLElement).blur())
    expect(nameText()).toBe("Indigo")
  })

  test("prefers an explicit name slot and submits under a form name", () => {
    const { container } = render(
      <form>
        <SkeinRadio label="Wool" value={"camel" satisfies WoolId} nameSlot="Camel hair" name="wool" />
      </form>,
    )
    expect(nameText()).toBe("Camel hair")
    expect(new FormData(container.querySelector("form")!).get("wool")).toBe("camel")
  })
})

describe("SaduSwitch", () => {
  test("toggles with Space and with one click on its label text", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SaduSwitch onCheckedChange={onChange}>Dyed wool</SaduSwitch>)
    const control = screen.getByRole("switch", { name: "Dyed wool" })
    await user.click(screen.getByText("Dyed wool"))
    expect(control).toHaveAttribute("aria-checked", "true")
    expect(onChange).toHaveBeenCalledTimes(1)
    await user.click(control)
    expect(control).toHaveAttribute("aria-checked", "false")
    expect(onChange).toHaveBeenCalledTimes(2)
    control.focus()
    await user.keyboard(" ")
    expect(control).toHaveAttribute("aria-checked", "true")
  })

  test("ignores presses while disabled", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <SaduSwitch disabled onCheckedChange={onChange}>
        Goat-hair warp
      </SaduSwitch>,
    )
    await user.click(screen.getByText("Goat-hair warp"))
    expect(screen.getByRole("switch", { name: "Goat-hair warp" })).toHaveAttribute("aria-checked", "false")
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe("SaduTabs", () => {
  const tabs = [
    { value: "motifs", label: "Motifs", panel: <p>Motif panel</p> },
    { value: "wool", label: "Wool", panel: <p>Wool panel</p> },
    { value: "loom", label: "Loom", panel: <p>Loom panel</p> },
  ]

  test("arrows, Home and End move the selection and show its panel", async () => {
    const user = userEvent.setup()
    render(<SaduTabs label="Order 14" tabs={tabs} defaultValue="motifs" />)
    screen.getByRole("tab", { name: "Motifs" }).focus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "Wool" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Wool panel")
    await user.keyboard("{End}")
    expect(screen.getByRole("tab", { name: "Loom" })).toHaveAttribute("aria-selected", "true")
    await user.keyboard("{Home}")
    expect(screen.getByRole("tab", { name: "Motifs" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Motif panel")
  })

  test("names the list and reports changes when controlled", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SaduTabs label="Order 14" tabs={tabs} value="motifs" onValueChange={onChange} />)
    expect(screen.getByRole("tablist", { name: "Order 14" })).toBeInTheDocument()
    await user.click(screen.getByRole("tab", { name: "Loom" }))
    expect(onChange).toHaveBeenCalledWith("loom")
  })
})

describe("EyeRating", () => {
  test("click sets the score and arrows adjust it", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<EyeRating label="Tightness" defaultValue={2} onValueChange={onChange} />)
    const radios = screen.getAllByRole("radio")
    expect(radios).toHaveLength(5)
    await user.click(radios[3]!)
    expect(onChange).toHaveBeenLastCalledWith(4)
    expect(radios[3]).toHaveAttribute("aria-checked", "true")
    await user.keyboard("{ArrowLeft}")
    expect(radios[2]).toHaveAttribute("aria-checked", "true")
  })

  test("pressing the chosen eye keeps it by default and clears it when deselectable", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<EyeRating label="Kept" defaultValue={2} />)
    await user.click(screen.getAllByRole("radio")[1]!)
    expect(screen.getAllByRole("radio")[1]).toHaveAttribute("aria-checked", "true")
    unmount()
    render(<EyeRating label="Cleared" defaultValue={2} deselectable />)
    await user.click(screen.getAllByRole("radio")[1]!)
    expect(screen.getAllByRole("radio").filter((radio) => radio.getAttribute("aria-checked") === "true")).toHaveLength(0)
  })
})

test("palette constants stay in sync with the ink tokens", () => {
  expect(INK.black).toBe("#1f1813")
})
