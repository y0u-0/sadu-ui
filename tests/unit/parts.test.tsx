import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { NumberInput, NumberInputControl, NumberInputGroup, NumberInputIncrement } from "@ui-sdk/react/number-input"
import { Popover, PopoverArrow, PopoverContent, PopoverTrigger } from "@ui-sdk/react/popover"
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from "vitest"
import { MotifSwatch } from "../../src/sadu/motif-select"
import { MOTIFS } from "../../src/sadu/motifs"
import { WOOLS } from "../../src/sadu/palette"
import {
  BandSwatch,
  Chip,
  ChipRemove,
  Eye,
  IconButton,
  Kbd,
  Lozenge,
  SkeinDot,
  WoodButton,
  keysOf,
  type EyeSize,
} from "../../src/sadu/parts"
import { PopupArrow, PopupSurface } from "../../src/sadu/popup-surface"
import { mainColors } from "../../src/sadu/rug"

const COLORS = mainColors(WOOLS.madder.hex)
const JSDOM_CSS_NOISE = "Could not parse CSS stylesheet"

let errors: MockInstance
let warnings: MockInstance

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

describe("Eye", () => {
  test.each<EyeSize>([10, 15, 20])("draws flat floats at size %i", (size) => {
    const { container } = render(<Eye size={size} />)
    const rects = [...container.querySelectorAll("rect")]
    expect(rects).toHaveLength(9)
    expect(new Set(rects.map((rect) => rect.getAttribute("rx")))).toEqual(new Set(["0.5"]))
  })

  test("closed is one row of three floats", () => {
    const { container } = render(<Eye size={10} state="closed" />)
    expect(container.querySelectorAll("rect")).toHaveLength(3)
  })

  test("is decorative unless labelled, and carries its tone", () => {
    const { container, rerender } = render(<Eye />)
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
    expect(container.querySelector("svg")).not.toHaveAttribute("data-tone")
    rerender(<Eye label="Required" tone="structure" />)
    expect(screen.getByRole("img", { name: "Required" })).toHaveAttribute("data-tone", "structure")
  })
})

describe("Lozenge", () => {
  test("marks only the chosen lozenge and keeps its label", () => {
    render(
      <>
        <Lozenge>3</Lozenge>
        <Lozenge chosen>4</Lozenge>
      </>,
    )
    expect(screen.getByText("3").parentElement).not.toHaveAttribute("data-chosen")
    expect(screen.getByText("4").parentElement).toHaveAttribute("data-chosen")
  })
})

describe("SkeinDot", () => {
  test("takes a wool id or a custom wool and sizes to 16 or 20", () => {
    const { container } = render(
      <>
        <SkeinDot wool="indigo" />
        <SkeinDot wool={{ hex: "#e6d9bf", light: "#f6eedd", dark: "#c9b894" }} size={20} />
      </>,
    )
    const [indigo, undyed] = [...container.querySelectorAll<HTMLElement>(".sadu-skein-dot")]
    expect(indigo).toHaveAttribute("data-size", "16")
    expect(indigo?.style.getPropertyValue("--wool")).toBe(WOOLS.indigo.hex)
    expect(indigo).toHaveAttribute("aria-hidden", "true")
    expect(undyed).toHaveAttribute("data-size", "20")
    expect(undyed?.style.getPropertyValue("--wool-dark")).toBe("#c9b894")
  })

  test("is an image when labelled", () => {
    render(<SkeinDot wool="madder" label="Madder" />)
    expect(screen.getByRole("img", { name: "Madder" })).toHaveClass("sadu-yarn")
  })
})

describe("BandSwatch", () => {
  function patternX(container: HTMLElement): string | null {
    return container.querySelector("pattern[id$='-cloth']")!.getAttribute("x")
  }

  test("defaults to the row size and centres the motif in the swatch", () => {
    const motif = MOTIFS.eyoun
    const { container } = render(<BandSwatch grid={motif.grid} colors={COLORS} center={motif.center} />)
    const swatch = container.querySelector<HTMLElement>(".sadu-swatch")!
    expect(swatch).toHaveAttribute("data-size", "md")
    expect(swatch).toHaveAttribute("aria-hidden", "true")
    expect(swatch.style.getPropertyValue("--sadu-swatch-band")).toBe("22px")
    expect(container.querySelector(".sadu-weave")).toHaveAttribute("data-level", "stitch")
    expect(patternX(container)).toBe(String(48 / 2 - motif.center * 6))
  })

  test.each([
    ["sm", 32],
    ["lg", 64],
  ] as const)("size %s centres on a %ipx box", (size, width) => {
    const { container } = render(<BandSwatch grid={MOTIFS.hubub.grid} colors={COLORS} center={MOTIFS.hubub.center} size={size} />)
    expect(container.querySelector(".sadu-swatch")).toHaveAttribute("data-size", size)
    expect(patternX(container)).toBe(String(width / 2 - MOTIFS.hubub.center * 6))
  })

  test("an explicit width sets the box and the centring", () => {
    const { container } = render(<BandSwatch grid={MOTIFS.dhurs.grid} colors={COLORS} width={120} />)
    expect(container.querySelector<HTMLElement>(".sadu-swatch")!.style.width).toBe("120px")
    expect(patternX(container)).toBe(String(60 - (MOTIFS.dhurs.grid[0]!.length / 2) * 6))
  })

  test("MotifSwatch is a band swatch of the motif rounded to whole floats", () => {
    const { container } = render(<MotifSwatch motif="dhalla" dye={WOOLS.saffron.hex} width={100} />)
    expect(container.querySelector<HTMLElement>(".sadu-swatch")!.style.width).toBe("102px")
  })
})

describe("Kbd", () => {
  test.each([
    ["⌘K", ["⌘", "K"]],
    ["⌘⇧P", ["⌘", "⇧", "P"]],
    ["Esc", ["Esc"]],
    ["Ctrl+K", ["Ctrl", "K"]],
    ["⌘+", ["⌘", "+"]],
    ["⁦⌘D⁩", ["⌘", "D"]],
  ])("splits %s into one cap per key", (shortcut, keys) => {
    expect(keysOf(shortcut)).toEqual(keys)
  })

  test("nests one key cap per key inside the shortcut", () => {
    const { container } = render(<Kbd>⌘K</Kbd>)
    const shortcut = container.querySelector("kbd.sadu-kbd")!
    expect([...shortcut.querySelectorAll("kbd.sadu-kbd__key")].map((key) => key.textContent)).toEqual(["⌘", "K"])
  })

  test("takes the keys as a list", () => {
    const { container } = render(<Kbd>{["Shift", "Tab"]}</Kbd>)
    expect(container.querySelectorAll(".sadu-kbd__key")).toHaveLength(2)
  })
})

describe("Chip", () => {
  test("lays out sample, label and remove, and the remove is a named button", async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const { container } = render(
      <Chip sample={<SkeinDot wool="camel" />} remove={<ChipRemove aria-label="Remove camel" onClick={onRemove} />}>
        Camel
      </Chip>,
    )
    const chip = container.querySelector(".sadu-chip")!
    expect([...chip.children].map((child) => child.className)).toEqual([
      "sadu-chip__sample",
      "sadu-chip__label",
      "sadu-chip__remove",
    ])
    expect(within(chip as HTMLElement).getByText("Camel")).toHaveClass("sadu-chip__label")
    await user.click(screen.getByRole("button", { name: "Remove camel" }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  test("needs neither sample nor remove", () => {
    const { container } = render(<Chip>Hessa</Chip>)
    expect(container.querySelector(".sadu-chip")!.children).toHaveLength(1)
  })
})

describe("IconButton", () => {
  test("is a named button at 36 or 28 in ghost or outline", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <>
        <IconButton aria-label="Next slide" onClick={onClick}>
          <svg />
        </IconButton>
        <IconButton aria-label="Clear" size={28} variant="outline">
          <svg />
        </IconButton>
      </>,
    )
    const next = screen.getByRole("button", { name: "Next slide" })
    expect(next).toHaveAttribute("type", "button")
    expect(next).toHaveAttribute("data-size", "36")
    expect(next).toHaveAttribute("data-variant", "ghost")
    expect(screen.getByRole("button", { name: "Clear" })).toHaveAttribute("data-size", "28")
    expect(screen.getByRole("button", { name: "Clear" })).toHaveAttribute("data-variant", "outline")
    await user.click(next)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test("ignores presses while disabled", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<IconButton aria-label="Copy" disabled onClick={onClick} />)
    await user.click(screen.getByRole("button", { name: "Copy" }))
    expect(onClick).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Copy" })).toHaveAttribute("data-disabled")
  })
})

describe("WoodButton", () => {
  test("is wood lying down by default and upright on request", () => {
    render(
      <>
        <WoodButton aria-label="Fewer rows" />
        <WoodButton aria-label="Next" upright />
      </>,
    )
    const lying = screen.getByRole("button", { name: "Fewer rows" })
    expect(lying).toHaveClass("sadu-wood-button", "sadu-wood")
    expect(lying).toHaveAttribute("data-lying")
    expect(screen.getByRole("button", { name: "Next" })).not.toHaveAttribute("data-lying")
  })

  test("renders a UI SDK part and keeps its behaviour", async () => {
    const user = userEvent.setup()
    render(
      <NumberInput defaultValue={4}>
        <NumberInputGroup>
          <NumberInputControl aria-label="Rows" />
          <NumberInputIncrement aria-label="More rows" render={<WoodButton />} />
        </NumberInputGroup>
      </NumberInput>,
    )
    const more = screen.getByRole("button", { name: "More rows" })
    expect(more).toHaveClass("sadu-wood-button", "sadu-wood")
    await user.click(more)
    expect(screen.getByRole("textbox", { name: "Rows" })).toHaveValue("5")
  })
})

describe("PopupSurface", () => {
  test("draws a cord, a band or nothing before its content", () => {
    const { container } = render(
      <>
        <PopupSurface data-testid="cord">Rows</PopupSurface>
        <PopupSurface data-testid="band" edge="band">
          Rows
        </PopupSurface>
        <PopupSurface data-testid="none" edge="none">
          Rows
        </PopupSurface>
      </>,
    )
    const [cord, band, none] = ["cord", "band", "none"].map((id) => screen.getByTestId(id))
    expect(cord).toHaveClass("sadu-popup")
    expect(cord).toHaveAttribute("data-edge", "cord")
    expect(cord?.firstElementChild).toHaveClass("sadu-cord", "sadu-popup__edge")
    expect(band).toHaveAttribute("data-edge", "band")
    expect(band?.querySelector(".sadu-popup__edge .sadu-weave")).toHaveAttribute("data-level", "stitch")
    expect(none?.querySelector(".sadu-popup__edge")).toBeNull()
    expect(container.querySelectorAll(".sadu-popup")).toHaveLength(3)
  })

  test("renders a UI SDK popup with its arrow and keeps its role, name and classes", async () => {
    const user = userEvent.setup()
    render(
      <Popover>
        <PopoverTrigger>Band width</PopoverTrigger>
        <PopoverContent
          aria-label="Band width"
          className="sadu-popover"
          render={<PopupSurface arrow={<PopoverArrow render={<PopupArrow />} />} />}
        >
          <p>Eleven rows</p>
        </PopoverContent>
      </Popover>,
    )
    await user.click(screen.getByRole("button", { name: "Band width" }))
    const dialog = await screen.findByRole("dialog", { name: "Band width" })
    expect(dialog).toHaveClass("sadu-popup", "sadu-popover")
    expect(dialog).toHaveAttribute("data-edge", "cord")
    expect(dialog.querySelector(".sadu-popup__arrow .sadu-popup__arrow-cloth")).not.toBeNull()
    expect(dialog.querySelector(".sadu-popup__edge")).not.toBeNull()
    expect(within(dialog).getByText("Eleven rows")).toBeInTheDocument()
  })
})
