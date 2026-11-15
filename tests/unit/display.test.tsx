import { act, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { visibleWaterfallRows, type WaterfallData } from "@ui-sdk/react/waterfall"
import { useState, type ReactElement } from "react"
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from "vitest"
import { BeamResizable, BeamResizableHandle, BeamResizablePanel } from "../../src/sadu/beam-resizable"
import { CodeBlock, type CodeSnippet } from "../../src/sadu/code-block"
import {
  DyeWaterfall,
  DyeWaterfallAxis,
  DyeWaterfallBar,
  DyeWaterfallCell,
  DyeWaterfallColumnHeader,
  DyeWaterfallHeaderRow,
  DyeWaterfallIndicator,
  DyeWaterfallMark,
  DyeWaterfallRow,
  DyeWaterfallRowHeader,
} from "../../src/sadu/dye-waterfall"
import { LoomProgress } from "../../src/sadu/loom-progress"
import { ThreadSeparator } from "../../src/sadu/thread-separator"
import {
  WarpTimeline,
  WarpTimelineConnector,
  WarpTimelineDescription,
  WarpTimelineItem,
  WarpTimelineMarker,
  WarpTimelineTime,
  WarpTimelineTitle,
} from "../../src/sadu/warp-timeline"
import { WeaverAvatar, WeaverAvatarGroup } from "../../src/sadu/weaver-avatar"
import { WoodScrollArea } from "../../src/sadu/wood-scroll-area"
import { WoolMeter } from "../../src/sadu/wool-meter"

const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock("@ui-sdk/react/toast", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ui-sdk/react/toast")>()
  return { ...actual, toast: Object.assign(vi.fn(), toasts) }
})

let consoleError: MockInstance
let consoleWarn: MockInstance

beforeEach(() => {
  consoleError = vi.spyOn(console, "error")
  consoleWarn = vi.spyOn(console, "warn")
  toasts.success.mockClear()
  toasts.error.mockClear()
})

const JSDOM_CSS_LIMIT = "Could not parse CSS stylesheet"

afterEach(() => {
  const errors = consoleError.mock.calls.filter((call) => !String(call[0]).includes(JSDOM_CSS_LIMIT))
  expect(errors).toEqual([])
  expect(consoleWarn).not.toHaveBeenCalled()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe("WeaverAvatar", () => {
  test("without a photo it shows the woven mark and keeps the name for screen readers", () => {
    const { container } = render(<WeaverAvatar name="Noura" />)
    expect(container.querySelector(".sadu-avatar__wasm")).toBeInTheDocument()
    expect(screen.getByText("Noura")).toHaveClass("sadu-avatar__name")
    expect(container.querySelector(".sadu-avatar")).toHaveAttribute("title", "Noura")
  })

  test("the same name always weaves the same mark", () => {
    const first = render(<WeaverAvatar name="Mariam" />).container.querySelector(".sadu-avatar__wasm")?.innerHTML
    const second = render(<WeaverAvatar name="Mariam" />).container.querySelector(".sadu-avatar__wasm")?.innerHTML
    expect(first).toBeTruthy()
    expect(second).toBe(first)
  })

  test("a loading photo shows bare threads, a loaded one replaces them", () => {
    const { container } = render(<WeaverAvatar name="Umm Saad" src="/umm-saad.jpg" />)
    const image = container.querySelector("img")!
    Object.defineProperty(image, "complete", { configurable: true, get: () => false })
    fireEvent.error(image)
    expect(container.querySelector(".sadu-avatar__wasm")).toBeInTheDocument()
    Object.defineProperty(image, "naturalWidth", { configurable: true, get: () => 160 })
    fireEvent.load(image)
    expect(image).toHaveAttribute("data-loading-status", "loaded")
    expect(screen.getByRole("img", { name: "Umm Saad" })).toBe(image)
    expect(container.querySelector(".sadu-avatar__fallback")).not.toBeInTheDocument()
  })

  test("only a photo that arrives after mount is revealed, and the caller still hears the status", () => {
    const onLoadingStatusChange = vi.fn()
    const { container } = render(<WeaverAvatar name="Umm Saad" src="/umm-saad.jpg" onLoadingStatusChange={onLoadingStatusChange} />)
    const image = container.querySelector("img")!
    Object.defineProperty(image, "naturalWidth", { configurable: true, get: () => 160 })
    fireEvent.load(image)
    expect(container.querySelector(".sadu-avatar")).toHaveAttribute("data-revealing")
    expect(onLoadingStatusChange).toHaveBeenLastCalledWith("loaded", expect.objectContaining({ reason: "image-load" }))
  })

  test("a photo that fails to load falls back to the woven mark", () => {
    const { container } = render(<WeaverAvatar name="Hessa" src="/missing.jpg" />)
    fireEvent.error(container.querySelector("img")!)
    expect(container.querySelector(".sadu-avatar__wasm")).toBeInTheDocument()
    expect(container.querySelector(".sadu-avatar")).toHaveAttribute("data-loading-status", "error")
  })

  test("status is announced as text, not only as an eye", () => {
    render(<WeaverAvatar name="Hessa" status="away" />)
    expect(screen.getByText("Away")).toBeInTheDocument()
  })

  test("a caller's title wins over the default", () => {
    const { container } = render(<WeaverAvatar name="Hessa" title="Hessa, weaver" />)
    expect(container.querySelector(".sadu-avatar")).toHaveAttribute("title", "Hessa, weaver")
  })

  test.each([
    [undefined, 6, null],
    [4, 4, "+2"],
    [6, 6, null],
    [10, 6, null],
    [0, 0, "+6"],
    [-3, 0, "+6"],
  ])("a group with max %s shows %s weavers and %s", (max, shown, more) => {
    const { container } = render(
      <WeaverAvatarGroup label="Weavers on order 14" max={max}>
        {["Hessa", "Noura", "Mariam", "Umm Saad", "Lulwa", "Dalal"].map((name) => (
          <WeaverAvatar key={name} name={name} />
        ))}
      </WeaverAvatarGroup>,
    )
    const group = screen.getByRole("group", { name: "Weavers on order 14" })
    expect(group.querySelectorAll(".sadu-avatar")).toHaveLength(shown)
    const chip = container.querySelector(".sadu-avatar-group__more")
    if (more === null) expect(chip).toBeNull()
    else {
      expect(chip).toHaveTextContent(`${more}and ${6 - shown} more`)
      expect(chip!.firstElementChild).toHaveAttribute("dir", "ltr")
    }
  })
})

describe("ThreadSeparator", () => {
  test("a semantic separator is announced with its orientation", () => {
    render(<ThreadSeparator orientation="vertical" />)
    const separator = screen.getByRole("separator")
    expect(separator).toHaveAttribute("aria-orientation", "vertical")
    expect(separator).toHaveAttribute("data-variant", "thread")
  })

  test("a decorative separator is hidden from assistive technology", () => {
    const { container } = render(<ThreadSeparator decorative label="or" />)
    expect(screen.queryByRole("separator")).toBeNull()
    expect(container.querySelector(".sadu-separator")).toHaveAttribute("role", "none")
    expect(screen.getByText("or")).toBeInTheDocument()
  })

  test("a labelled separator ties a knot either side of its word", () => {
    const { container } = render(<ThreadSeparator label="or" />)
    const knots = container.querySelectorAll(".sadu-separator__knot")
    expect(knots).toHaveLength(2)
    expect(knots[0]).toHaveAttribute("data-tone", "separator")
  })

  test("the cord variant draws the shared cord, horizontal only", () => {
    const { container, rerender } = render(<ThreadSeparator variant="cord" />)
    expect(container.querySelector(".sadu-cord")).toBeInTheDocument()
    rerender(<ThreadSeparator variant="cord" orientation="vertical" />)
    expect(container.querySelector(".sadu-cord")).toBeNull()
  })
})

describe("LoomProgress", () => {
  const rows = (value: number): string => `${value} of 96 rows`

  test("names the bar and reads its value", () => {
    render(<LoomProgress label="Weaving order 14" value={46} max={96} format={rows} />)
    const bar = screen.getByRole("progressbar", { name: "Weaving order 14" })
    expect(bar).toHaveAttribute("aria-valuenow", "46")
    expect(bar).toHaveAttribute("aria-valuemax", "96")
    expect(bar).toHaveAttribute("aria-valuetext", "46 of 96 rows")
    expect(screen.getByText("46 of 96 rows")).toBeInTheDocument()
    expect(bar).toHaveAttribute("data-progressing")
  })

  test("the readout sets the number large and the unit small, and says it whole to screen readers", () => {
    const { container } = render(
      <LoomProgress label="Weaving order 14" value={46} max={96} format={String} unit="of 96 rows" getValueLabel={(value) => `${value} of 96 rows`} />,
    )
    const value = container.querySelector(".sadu-progress__value")!
    expect(value).toHaveTextContent("46of 96 rows")
    expect(value.querySelector(".sadu-progress__unit")).toHaveTextContent("of 96 rows")
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "46 of 96 rows")
  })

  test("follows the value up to completion and back down", () => {
    const { rerender } = render(<LoomProgress label="Weaving" value={90} max={96} format={rows} />)
    const bar = screen.getByRole("progressbar")
    rerender(<LoomProgress label="Weaving" value={96} max={96} format={rows} />)
    expect(bar).toHaveAttribute("data-complete")
    expect(bar.querySelector(".sadu-progress__indicator")).toHaveAttribute("data-complete")
    rerender(<LoomProgress label="Weaving" value={40} max={96} format={rows} />)
    expect(bar).not.toHaveAttribute("data-complete")
    expect(bar).toHaveAttribute("aria-valuenow", "40")
    expect(parseFloat(bar.querySelector<HTMLElement>(".sadu-progress__indicator")!.style.width)).toBeCloseTo((40 / 96) * 100, 3)
  })

  test("only a value that reaches the end taps the beater; mounting complete stays still", () => {
    const { container, rerender } = render(<LoomProgress label="Weaving" value={96} max={96} />)
    expect(container.querySelector(".sadu-progress__beater[data-tap]")).toBeNull()
    rerender(<LoomProgress label="Weaving" value={50} max={96} />)
    expect(container.querySelector(".sadu-progress__beater[data-tap]")).toBeNull()
    rerender(<LoomProgress label="Weaving" value={96} max={96} />)
    expect(container.querySelector(".sadu-progress__beater[data-tap]")).toBeInTheDocument()
  })

  test("indeterminate has no value and shows the travelling window", () => {
    render(<LoomProgress label="Checking dye lot" value={null} />)
    const bar = screen.getByRole("progressbar", { name: "Checking dye lot" })
    expect(bar).not.toHaveAttribute("aria-valuenow")
    expect(bar).toHaveAttribute("data-indeterminate")
    expect(bar.querySelector(".sadu-progress__track")).toHaveAttribute("data-indeterminate")
  })

  test("an unlabelled bar takes aria-label and the small size", () => {
    render(<LoomProgress aria-label="Spinning goat hair" size="sm" value={62} />)
    expect(screen.getByRole("progressbar", { name: "Spinning goat hair" })).toHaveAttribute("data-size", "sm")
  })
})

describe("WoolMeter", () => {
  const skeins = (value: number): string => `${value} of 20 skeins`
  const zones = { low: "low", optimum: "enough", high: "overstocked" }

  test.each([
    [0, "low", 0],
    [4, "low", 4],
    [5, "optimum", 5],
    [17, "optimum", 17],
    [18, "high", 18],
    [20, "high", 20],
  ])("%s skeins reads as %s and fills %s floats", (value, zone, filled) => {
    const { container } = render(<WoolMeter label="Madder" value={value} max={20} low={5} high={17} format={skeins} zoneLabels={zones} />)
    const meter = screen.getByRole("meter", { name: "Madder" })
    const meaning = zones[zone as keyof typeof zones]
    expect(meter).toHaveAttribute("data-zone", zone)
    expect(meter).toHaveAttribute("aria-valuetext", `${value} of 20 skeins, ${meaning}`)
    expect(screen.getByText(`${value} of 20 skeins, ${meaning}`)).toBeInTheDocument()
    expect(container.querySelectorAll(".sadu-meter__float")).toHaveLength(20)
    expect(container.querySelectorAll(".sadu-meter__float[data-filled]")).toHaveLength(filled)
  })

  test("a reading past the maximum fills every float and says so", () => {
    const { container } = render(<WoolMeter label="Goat hair" value={25} max={20} format={skeins} />)
    expect(container.querySelectorAll(".sadu-meter__float[data-filled]")).toHaveLength(20)
    expect(screen.getByRole("meter")).toHaveAttribute("data-zone", "high")
  })

  test("floats lie on two rows of the half-drop and fill along the length", () => {
    const { container } = render(<WoolMeter label="Spun wool" value={5} max={20} />)
    const floats = [...container.querySelectorAll<HTMLElement>(".sadu-meter__float")]
    expect(floats.slice(0, 4).map((float) => [float.style.gridRow, float.style.gridColumn])).toEqual([
      ["1", "1 / span 2"],
      ["2", "2 / span 2"],
      ["1", "3 / span 2"],
      ["2", "4 / span 2"],
    ])
    expect(floats.filter((float) => float.classList.contains("sadu-cloth-fill"))).toHaveLength(5)
  })

  test("the float count follows the floats prop", () => {
    const { container } = render(<WoolMeter label="Saffron" value={50} floats={10} />)
    expect(container.querySelectorAll(".sadu-meter__float")).toHaveLength(10)
    expect(container.querySelectorAll(".sadu-meter__float[data-filled]")).toHaveLength(5)
  })
})

describe("WoodScrollArea", () => {
  test("a labelled viewport is a named region with a wood thumb", () => {
    const { container } = render(
      <WoodScrollArea label="Orders this season" type="always">
        <p>Majlis divider</p>
      </WoodScrollArea>,
    )
    expect(screen.getByRole("region", { name: "Orders this season" })).toBeInTheDocument()
    expect(container.querySelector(".sadu-scroll__thumb .sadu-wood")).toBeInTheDocument()
    expect(container.querySelectorAll(".sadu-scroll__bar")).toHaveLength(1)
  })

  test("both axes render two scrollbars and the corner", () => {
    const { container } = render(
      <WoodScrollArea axis="both">
        <p>Majlis divider</p>
      </WoodScrollArea>,
    )
    expect(container.querySelectorAll(".sadu-scroll__bar")).toHaveLength(2)
    expect(screen.queryByRole("region")).toBeNull()
  })
})

function Panels(): ReactElement {
  return (
    <BeamResizable>
      <BeamResizablePanel defaultSize={40} minSize={25}>
        Pattern draft
      </BeamResizablePanel>
      <BeamResizableHandle aria-label="Resize pattern draft" />
      <BeamResizablePanel minSize={30}>Cloth</BeamResizablePanel>
    </BeamResizable>
  )
}

describe("BeamResizable", () => {
  test("the handle is a named, focusable separator carrying its thread, grip and beam", () => {
    render(<Panels />)
    const handle = screen.getByRole("separator", { name: "Resize pattern draft" })
    expect(handle.querySelector(".sadu-resizable__thread")).toBeInTheDocument()
    expect(handle.querySelector(".sadu-resizable__grip.sadu-wood")).toBeInTheDocument()
    expect(handle.querySelector(".sadu-resizable__beam.sadu-wood")).toBeInTheDocument()
    expect(screen.getByText("Pattern draft")).toHaveClass("sadu-resizable__panel")
  })

  test("a disabled group marks its handle disabled", () => {
    render(
      <BeamResizable disabled>
        <BeamResizablePanel>Pattern draft</BeamResizablePanel>
        <BeamResizableHandle aria-label="Resize pattern draft" />
        <BeamResizablePanel>Cloth</BeamResizablePanel>
      </BeamResizable>,
    )
    const handle = screen.getByRole("separator", { name: "Resize pattern draft" })
    expect(handle).toHaveAttribute("data-disabled")
  })
})

const STEPS = ["Wool sheared", "Spun", "Weaving", "Delivered"] as const

function Order({ current }: { current: number }): ReactElement {
  return (
    <WarpTimeline aria-label="Order 14 history">
      {STEPS.map((title, index) => (
        <WarpTimelineItem key={title} value={title} status={index < current ? "complete" : index === current ? "current" : "upcoming"}>
          <WarpTimelineMarker failed={title === "Delivered" && current === 99} />
          <WarpTimelineConnector />
          <WarpTimelineTitle>{title}</WarpTimelineTitle>
          <WarpTimelineTime dateTime="2026-10-01">1 Oct</WarpTimelineTime>
          <WarpTimelineDescription>{title} for order 14.</WarpTimelineDescription>
        </WarpTimelineItem>
      ))}
    </WarpTimeline>
  )
}

describe("WarpTimeline", () => {
  test("the current step is marked and arrow keys move between events", async () => {
    const user = userEvent.setup()
    render(<Order current={2} />)
    const list = screen.getByRole("list", { name: "Order 14 history" })
    const items = within(list).getAllByRole("listitem")
    expect(items[2]).toHaveAttribute("aria-current", "step")
    expect(items[0]).toHaveAttribute("data-complete")
    expect(items[3]).toHaveAttribute("data-upcoming")
    await user.tab()
    expect(items[2]).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(items[3]).toHaveFocus()
    await user.keyboard("{Home}")
    expect(items[0]).toHaveFocus()
  })

  test("the spine of a done step is spun, and the marker follows the status", () => {
    const { container, rerender } = render(<Order current={1} />)
    const connectors = container.querySelectorAll(".sadu-timeline__connector")
    expect(connectors[0]).toHaveAttribute("data-complete")
    expect(connectors[1]).toHaveAttribute("data-current")
    rerender(<Order current={4} />)
    expect(container.querySelectorAll(".sadu-timeline__connector[data-complete]")).toHaveLength(4)
    expect(container.querySelector("[aria-current]")).toBeNull()
  })

  test("a failed step shows madder teeth instead of an eye", () => {
    const { container } = render(<Order current={99} />)
    expect(container.querySelector(".sadu-timeline__marker[data-failed] .sadu-timeline__teeth")).toBeInTheDocument()
  })
})

const TRACE: WaterfallData = [
  { value: "spin", label: "Spin", start: 2, duration: 7 },
  {
    value: "dye",
    label: "Dye",
    start: 8,
    duration: 6,
    children: [
      { value: "madder", label: "Madder bath", start: 8, duration: 3 },
      { value: "saffron", label: "Saffron bath", start: 11, duration: 3 },
    ],
  },
  { value: "late", label: "Late", start: 40, duration: 2 },
]

function Trace({ controlled }: { controlled?: boolean }): ReactElement {
  const [expanded, setExpanded] = useState<string[]>([])
  const rows = visibleWaterfallRows(TRACE, controlled ? expanded : ["dye"])
  return (
    <DyeWaterfall
      aria-label="Order 14"
      items={TRACE}
      range={[0, 20]}
      {...(controlled ? { expanded, onExpandedChange: setExpanded } : { defaultExpanded: [] })}
      format={(value) => `Day ${value}`}
      getBarLabel={(item) => `Day ${item.start} to day ${item.start + item.duration}`}
    >
      <DyeWaterfallHeaderRow>
        <DyeWaterfallColumnHeader>Stage</DyeWaterfallColumnHeader>
        <DyeWaterfallColumnHeader>Days</DyeWaterfallColumnHeader>
        <DyeWaterfallColumnHeader aria-label="Timeline">
          <DyeWaterfallAxis maxTicks={4} />
          <DyeWaterfallMark time={15}>Eid</DyeWaterfallMark>
        </DyeWaterfallColumnHeader>
      </DyeWaterfallHeaderRow>
      {rows.map(({ item }) => (
        <DyeWaterfallRow key={item.value} value={item.value}>
          <DyeWaterfallRowHeader>
            {item.children && <DyeWaterfallIndicator />}
            {item.label}
          </DyeWaterfallRowHeader>
          <DyeWaterfallCell>{item.duration}</DyeWaterfallCell>
          <DyeWaterfallBar tone={item.value === "madder" ? "madder" : undefined} />
        </DyeWaterfallRow>
      ))}
    </DyeWaterfall>
  )
}

describe("DyeWaterfall", () => {
  test("places each bar from its start and duration and names it", () => {
    render(<Trace controlled />)
    const row = screen.getByRole("row", { name: /Spin/ })
    expect(row.style.getPropertyValue("--waterfall-start")).toBe("10%")
    expect(row.style.getPropertyValue("--waterfall-size")).toBe("35%")
    expect(within(row).getByRole("gridcell", { name: "Day 2 to day 9" })).toBeInTheDocument()
    const late = screen.getByRole("row", { name: /Late/ })
    expect(late.style.getPropertyValue("--waterfall-size")).toBe("0%")
    expect(late.querySelector(".sadu-waterfall__span")).toHaveAttribute("data-tone", "goat-hair")
  })

  test("the axis shows round days and the mark, an eye on a thread", () => {
    const { container } = render(<Trace controlled />)
    expect(container.querySelector(".sadu-waterfall__mark .sadu-waterfall__mark-eye")).toHaveAttribute("data-tone", "value")
    expect(container.querySelector(".sadu-waterfall__indicator .sadu-eye-mark")).toHaveAttribute("data-tone", "structure")
    expect(container.querySelector('.sadu-waterfall__span[data-tone="madder"]')).toBeNull()
    expect([...container.querySelectorAll(".sadu-waterfall__tick")].map((tick) => tick.textContent)).toEqual(["Day 0", "Day 5", "Day 10", "Day 15"])
    expect(container.querySelector(".sadu-waterfall__mark")).toHaveTextContent("Eid")
  })

  test("a span expands and collapses by keyboard and by its eye", async () => {
    const user = userEvent.setup()
    render(<Trace controlled />)
    const dye = screen.getByRole("row", { name: /Dye/ })
    expect(dye).toHaveAttribute("aria-expanded", "false")
    await user.click(dye.querySelector(".sadu-waterfall__indicator")!)
    expect(screen.getByRole("row", { name: /Dye/ })).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("row", { name: /Madder bath/ })).toBeInTheDocument()
    expect(screen.getByRole("row", { name: /Dye/ })).not.toHaveAttribute("aria-selected", "true")
    screen.getByRole("row", { name: /Dye/ }).focus()
    await user.keyboard("{ArrowLeft}")
    expect(screen.getByRole("row", { name: /Dye/ })).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("row", { name: /Madder bath/ })).toBeNull()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("row", { name: /Madder bath/ })).toBeInTheDocument()
    await user.keyboard("{ArrowDown}{Enter}")
    expect(screen.getByRole("row", { name: /Madder bath/ })).toHaveAttribute("aria-selected", "true")
  })

  test("the eye shows closed and open by the expanded state", async () => {
    const user = userEvent.setup()
    const { container } = render(<Trace controlled />)
    const indicator = container.querySelector(".sadu-waterfall__indicator")!
    expect(indicator).not.toHaveAttribute("data-expanded")
    expect(indicator.querySelector('[data-state="closed"]')).toBeInTheDocument()
    await user.click(indicator)
    expect(container.querySelector(".sadu-waterfall__indicator")).toHaveAttribute("data-expanded")
  })

  test("settles after mount so only later rows unroll", () => {
    const { container } = render(<Trace controlled />)
    expect(container.querySelector(".sadu-waterfall")).toHaveAttribute("data-settled")
  })
})

const SNIPPETS: readonly CodeSnippet[] = [
  { value: "react", label: "React", fileName: "order-band.tsx", code: 'import { Rug } from "./sadu"\n\n// Order 14\nexport const band = <Rug motif="dhalla" />', highlight: [4] },
  { value: "css", label: "CSS", fileName: "order-band.css", code: ".order-band {\n  gap: 12px;\n}" },
]

describe("CodeBlock", () => {
  test("copies the exact code, toasts, and swaps the icon back after 1.2s", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<CodeBlock snippets={SNIPPETS.slice(0, 1)} />)
    const copy = screen.getByRole("button", { name: "Copy order-band.tsx" })
    expect(copy).toHaveClass("sadu-icon-button")
    expect(copy).toHaveAttribute("data-size", "36")
    await user.click(copy)
    expect(await navigator.clipboard.readText()).toBe(SNIPPETS[0]!.code)
    expect(toasts.success).toHaveBeenCalledWith("Copied to the clipboard", { description: "order-band.tsx" })
    expect(copy).toHaveAttribute("data-copied")
    await act(async () => vi.advanceTimersByTime(800))
    await user.click(copy)
    await act(async () => vi.advanceTimersByTime(800))
    expect(copy).toHaveAttribute("data-copied")
    await act(async () => vi.advanceTimersByTime(450))
    expect(copy).not.toHaveAttribute("data-copied")
  })

  test("a failed copy says so and keeps the copy icon", async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"))
    render(<CodeBlock snippets={SNIPPETS.slice(0, 1)} />)
    const copy = screen.getByRole("button", { name: "Copy order-band.tsx" })
    await user.click(copy)
    expect(toasts.error).toHaveBeenCalledWith("Could not copy", expect.anything())
    expect(copy).not.toHaveAttribute("data-copied")
  })

  test("numbers every line, highlights the right ones and colours the syntax", () => {
    const { container } = render(<CodeBlock snippets={SNIPPETS.slice(0, 1)} />)
    const lines = container.querySelectorAll(".sadu-code__line")
    expect(lines).toHaveLength(4)
    expect([...container.querySelectorAll(".sadu-code__line[data-highlighted]")]).toEqual([lines[3]])
    expect(lines[3]!.querySelector(".sadu-float-highlight")).toHaveTextContent("4")
    expect(container.querySelector(".sadu-code__code")).toHaveTextContent('import { Rug } from "./sadu"', { normalizeWhitespace: false })
    expect(lines[0]!.querySelector('[data-kind="keyword"]')).toHaveTextContent("import")
    expect(lines[0]!.querySelector('[data-kind="string"]')).toHaveTextContent('"./sadu"')
    expect(lines[2]!.querySelector('[data-kind="comment"]')).toHaveTextContent("// Order 14")
    expect(screen.getByRole("region", { name: "order-band.tsx" })).toBeInTheDocument()
    expect(container.querySelector(".sadu-code__scroll")).toHaveAttribute("dir", "ltr")
    expect(screen.getByRole("figure")).toBeInTheDocument()
  })

  test("tabs switch files by keyboard and the header follows", async () => {
    const user = userEvent.setup()
    render(<CodeBlock snippets={SNIPPETS} />)
    const tabs = screen.getByRole("tablist", { name: "Language" })
    const [react, css] = within(tabs).getAllByRole("tab")
    expect(react).toHaveAttribute("aria-selected", "true")
    await user.click(react!)
    await user.keyboard("{ArrowRight}")
    expect(css).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("button", { name: "Copy order-band.css" })).toBeInTheDocument()
    expect(screen.getByRole("tabpanel")).toHaveTextContent(".order-band {")
  })

  test("controlled tabs follow their value", async () => {
    const user = userEvent.setup()
    function Controlled(): ReactElement {
      const [value, setValue] = useState("css")
      return <CodeBlock snippets={SNIPPETS} value={value} onValueChange={setValue} />
    }
    render(<Controlled />)
    expect(screen.getByRole("tab", { name: "CSS" })).toHaveAttribute("aria-selected", "true")
    await user.click(screen.getByRole("tab", { name: "React" }))
    expect(screen.getByRole("tab", { name: "React" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("button", { name: "Copy order-band.tsx" })).toBeInTheDocument()
  })

  test("nothing renders without snippets", () => {
    const { container } = render(<CodeBlock snippets={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
