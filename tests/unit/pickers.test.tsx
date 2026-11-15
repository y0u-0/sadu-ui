import { act, cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState, type ReactElement } from "react"
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from "vitest"
import { SaduCalendar } from "../../src/sadu/sadu-calendar"
import { SaduCarousel, SaduCarouselItem } from "../../src/sadu/sadu-carousel"
import { SaduCheckbox, SaduCheckboxGroup } from "../../src/sadu/sadu-checkbox"
import { SaduColorPicker } from "../../src/sadu/sadu-color-picker"
import { SaduDatePicker } from "../../src/sadu/sadu-date-picker"
import { SaduFileInput } from "../../src/sadu/sadu-file-input"
import { SaduImageCropper } from "../../src/sadu/sadu-image-cropper"
import { SaduListbox, SaduListboxItem } from "../../src/sadu/sadu-listbox"
import { SaduTree, SaduTreeItem } from "../../src/sadu/sadu-tree"

let errors: MockInstance
let warnings: MockInstance

beforeEach(() => {
  errors = vi.spyOn(console, "error")
  warnings = vi.spyOn(console, "warn")
})

const JSDOM_LAYER_NOISE = "Could not parse CSS stylesheet"

afterEach(() => {
  cleanup()
  const reported = [...errors.mock.calls, ...warnings.mock.calls].filter((call) => !String(call[0]).includes(JSDOM_LAYER_NOISE))
  vi.restoreAllMocks()
  expect(reported).toEqual([])
})

function day(date: string, scope: ParentNode = document): HTMLElement {
  const cell = scope.querySelector<HTMLElement>(`td[data-value="${date}"]`)
  if (!cell) throw new Error(`No day ${date}`)
  return cell
}

function banded(scope: ParentNode = document): string[] {
  return [...scope.querySelectorAll<HTMLElement>("td[data-value]")]
    .filter((cell) => cell.querySelector(".sadu-calendar__band"))
    .map((cell) => cell.dataset.value ?? "")
}

function range(from: string, to: string): string[] {
  const days: string[] = []
  for (let time = Date.parse(from); time <= Date.parse(to); time += 86_400_000) days.push(new Date(time).toISOString().slice(0, 10))
  return days
}

describe("calendar", () => {
  test("arrow, Page and Home/End keys move focus between days and months", async () => {
    const user = userEvent.setup()
    render(<SaduCalendar aria-label="Loom booking" defaultValue="2026-11-18" today="2026-11-14" />)
    act(() => day("2026-11-18").focus())
    await user.keyboard("{ArrowRight}")
    expect(day("2026-11-19")).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(day("2026-11-26")).toHaveFocus()
    await user.keyboard("{Home}")
    expect(day("2026-11-22")).toHaveFocus()
    await user.keyboard("{End}")
    expect(day("2026-11-28")).toHaveFocus()
    await user.keyboard("{PageDown}")
    expect(day("2026-12-28")).toHaveFocus()
    expect(screen.getByText("December 2026", { selector: "caption" })).toBeInTheDocument()
    await user.keyboard("{PageUp}{PageUp}")
    expect(day("2026-10-28")).toHaveFocus()
  })

  test("Previous and Next turn the month and record which way", async () => {
    const user = userEvent.setup()
    const { container } = render(<SaduCalendar aria-label="Loom booking" defaultMonth="2026-11" />)
    await user.click(screen.getByRole("button", { name: "Next month" }))
    expect(screen.getByText("December 2026", { selector: "caption" })).toBeInTheDocument()
    expect(container.querySelector(".sadu-calendar__months")).toHaveAttribute("data-turn", "next")
    await user.click(screen.getByRole("button", { name: "Previous month" }))
    await user.click(screen.getByRole("button", { name: "Previous month" }))
    expect(screen.getByText("October 2026", { selector: "caption" })).toBeInTheDocument()
    expect(container.querySelector(".sadu-calendar__months")).toHaveAttribute("data-turn", "previous")
  })

  test("single selection by click and by keyboard shows one eye", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<SaduCalendar aria-label="Delivery day" defaultMonth="2026-11" onValueChange={onValueChange} />)
    await user.click(day("2026-11-10"))
    expect(onValueChange).toHaveBeenLastCalledWith("2026-11-10", expect.anything())
    expect(day("2026-11-10")).toHaveAttribute("data-selected")
    await user.keyboard("{ArrowRight}{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith("2026-11-11", expect.anything())
    expect(document.querySelectorAll("td[data-selected]")).toHaveLength(1)
    expect(banded()).toEqual([])
  })

  test("the woven band always covers exactly the selected range, across months and re-picks", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<SaduCalendar aria-label="Loom booking" mode="range" months={2} defaultMonth="2026-11" onValueChange={onValueChange} />)
    await user.click(day("2026-11-25"))
    await user.click(day("2026-12-03"))
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-11-25", "2026-12-03"], expect.anything())
    expect(banded()).toEqual(range("2026-11-25", "2026-12-03"))
    await user.click(day("2026-11-10"))
    await user.click(day("2026-11-12"))
    expect(banded()).toEqual(range("2026-11-10", "2026-11-12"))
    await user.click(day("2026-12-20"))
    await user.click(day("2026-12-08"))
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-12-08", "2026-12-20"], expect.anything())
    expect(banded()).toEqual(range("2026-12-08", "2026-12-20"))
    await user.click(day("2026-11-30"))
    expect(banded()).toEqual([])
    await user.click(day("2026-12-01"))
    expect(banded()).toEqual(range("2026-11-30", "2026-12-01"))
    expect(document.querySelectorAll("td[data-preview]")).toHaveLength(0)
  })

  test("a range picked with the keyboard weaves the same band, and Escape drops an unfinished one", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<SaduCalendar aria-label="Loom booking" mode="range" defaultMonth="2026-11" defaultValue={["2026-11-02", "2026-11-03"]} onValueChange={onValueChange} />)
    act(() => day("2026-11-02").focus())
    await user.keyboard("{ArrowDown}{Enter}{ArrowRight}{ArrowRight}{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-11-09", "2026-11-11"], expect.anything())
    expect(banded()).toEqual(range("2026-11-09", "2026-11-11"))
    await user.keyboard("{ArrowDown}{Enter}{ArrowRight}{Escape}")
    expect(banded()).toEqual(range("2026-11-09", "2026-11-11"))
    expect(document.querySelectorAll("td[data-preview]")).toHaveLength(0)
  })

  test("a controlled range moves its band when the value changes", () => {
    const { rerender } = render(<SaduCalendar aria-label="Loom booking" mode="range" months={2} value={["2026-11-28", "2026-12-02"]} />)
    expect(banded()).toEqual(range("2026-11-28", "2026-12-02"))
    rerender(<SaduCalendar aria-label="Loom booking" mode="range" months={2} value={["2026-11-05", "2026-11-06"]} />)
    expect(banded()).toEqual(range("2026-11-05", "2026-11-06"))
  })

  test("unavailable days cannot be picked and only today carries the eye", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<SaduCalendar aria-label="Delivery day" defaultMonth="2026-11" today="2026-11-14" unavailable={["2026-11-20"]} onValueChange={onValueChange} />)
    await user.click(day("2026-11-20"))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(day("2026-11-20")).toHaveAttribute("data-unavailable")
    const marks = document.querySelectorAll(".sadu-calendar__today")
    expect(marks).toHaveLength(1)
    expect(day("2026-11-14")).toContainElement(marks[0] as HTMLElement)
  })

  test("the root keeps its accessible name", () => {
    render(<SaduCalendar aria-label="Loom booking" defaultMonth="2026-11" />)
    expect(screen.getByRole("grid", { name: /November 2026/ })).toBeInTheDocument()
    expect(document.querySelector('[data-slot="calendar"]')).toHaveAttribute("aria-label", "Loom booking")
  })
})

describe("date picker", () => {
  test("opens from its button, picks a day, closes and returns focus", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<SaduDatePicker label="Delivery date" defaultValue="2026-11-21" today="2026-11-14" onValueChange={onValueChange} />)
    const trigger = screen.getByRole("button", { name: /Choose date/ })
    await user.click(trigger)
    const dialog = screen.getByRole("dialog")
    await user.click(day("2026-11-24", dialog))
    expect(onValueChange).toHaveBeenLastCalledWith("2026-11-24", expect.anything())
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(screen.getByRole("textbox", { name: "Delivery date" })).toHaveValue("11/24/2026")
    expect(document.querySelector(".sadu-date-picker__field")).toHaveAttribute("data-landing", "odd")
  })

  test("opens with Alt+ArrowDown and closes with Escape", async () => {
    const user = userEvent.setup()
    render(<SaduDatePicker label="Delivery date" defaultValue="2026-11-21" />)
    await user.click(screen.getByRole("textbox", { name: "Delivery date" }))
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  test("a typed date updates the calendar, and an invalid one marks the field", async () => {
    const user = userEvent.setup()
    render(<SaduDatePicker label="Delivery date" defaultValue="2026-11-21" />)
    const input = screen.getByRole("textbox", { name: "Delivery date" })
    await user.clear(input)
    await user.type(input, "12/05/2026{Enter}")
    await user.click(screen.getByRole("button", { name: /Choose date/ }))
    expect(day("2026-12-05", screen.getByRole("dialog"))).toHaveAttribute("data-selected")
    await user.keyboard("{Escape}")
    await user.clear(input)
    await user.type(input, "not a day{Enter}")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(document.querySelector(".sadu-date-picker__root")).toHaveAttribute("data-invalid")
  })

  test("presets, Clear and Today set the value", async () => {
    const user = userEvent.setup()
    render(
      <SaduDatePicker
        label="Delivery date"
        today="2026-11-14"
        defaultValue="2026-11-21"
        presets={[{ label: "Before Eid", value: "2027-03-07" }]}
      />,
    )
    const input = screen.getByRole("textbox", { name: "Delivery date" })
    await user.click(screen.getByRole("button", { name: /Choose date/ }))
    await user.click(screen.getByRole("button", { name: "Before Eid" }))
    expect(input).toHaveValue("03/07/2027")
    await user.click(screen.getByRole("button", { name: /Choose date/ }))
    await user.click(screen.getByRole("button", { name: "Clear" }))
    expect(input).toHaveValue("")
    await user.click(screen.getByRole("button", { name: /Choose date/ }))
    await user.click(screen.getByRole("button", { name: "Today" }))
    expect(input).toHaveValue("11/14/2026")
  })

  test("the range picker fills both inputs and weaves the band in its popup", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<SaduDatePicker label="Shearing week" mode="range" defaultMonth="2026-11" onValueChange={onValueChange} />)
    await user.click(screen.getByRole("button", { name: /Choose date/ }))
    const dialog = screen.getByRole("dialog")
    await user.click(day("2026-11-23", dialog))
    await user.click(day("2026-11-27", dialog))
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-11-23", "2026-11-27"], expect.anything())
    const inputs = screen.getAllByRole("textbox")
    expect(inputs[0]).toHaveValue("11/23/2026")
    expect(inputs[1]).toHaveValue("11/27/2026")
    await user.click(screen.getByRole("button", { name: /Choose date/ }))
    expect(banded(screen.getByRole("dialog"))).toEqual(range("2026-11-23", "2026-11-27"))
  })

  test("every input of a range picker is named after its field", () => {
    render(<SaduDatePicker label="Shearing week" mode="range" defaultValue={["2026-11-23", "2026-11-27"]} />)
    const inputs = screen.getAllByRole("textbox")
    expect(inputs).toHaveLength(2)
    expect(inputs[0]).toHaveAccessibleName("Shearing week start")
    expect(inputs[1]).toHaveAccessibleName("Shearing week end")
    expect(screen.getByRole("textbox", { name: "Shearing week start" })).toHaveValue("11/23/2026")
  })

  test("a single picker keeps the field label as its name", () => {
    render(<SaduDatePicker label="Delivery date" defaultValue="2026-11-21" />)
    for (const input of screen.getAllByRole("textbox")) expect(input).toHaveAccessibleName("Delivery date")
  })

  test("a controlled picker shows what the app passes", () => {
    function Controlled(): ReactElement {
      const [value, setValue] = useState<string | null>("2026-11-21")
      return (
        <>
          <SaduDatePicker label="Delivery date" value={value} onValueChange={(next) => setValue(next as string | null)} />
          <button type="button" onClick={() => setValue("2026-12-01")}>
            Move
          </button>
        </>
      )
    }
    render(<Controlled />)
    act(() => screen.getByRole("button", { name: "Move" }).click())
    expect(screen.getByRole("textbox", { name: "Delivery date" })).toHaveValue("12/01/2026")
  })
})

describe("color picker", () => {
  test("skeins pick a dye and name it; the band is re-dyed", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<SaduColorPicker label="Border dye" defaultValue="#a3231b" onValueChange={onValueChange} />)
    expect(screen.getByText("Madder")).toBeInTheDocument()
    await user.click(screen.getByRole("option", { name: "Indigo" }))
    expect(onValueChange).toHaveBeenLastCalledWith("#2a3c63", expect.anything())
    expect(screen.getByRole("option", { name: "Indigo" })).toHaveAttribute("aria-selected", "true")
    await user.unhover(screen.getByRole("option", { name: "Indigo" }))
    act(() => (document.activeElement as HTMLElement | null)?.blur())
    expect(document.querySelector(".sadu-color__name")).toHaveTextContent("Indigo")
    expect(document.querySelector(".sadu-color__band")?.innerHTML).toContain("#2a3c63")
  })

  test("the hex input reads a color on Enter and puts an invalid one back", async () => {
    const user = userEvent.setup()
    render(<SaduColorPicker label="Border dye" defaultValue="#a3231b" />)
    const input = screen.getByRole("textbox", { name: "Hex" })
    await user.clear(input)
    await user.type(input, "#cf7a1b{Enter}")
    expect(input).toHaveValue("#cf7a1b")
    expect(document.querySelector(".sadu-color__name")).toHaveTextContent("Saffron")
    await user.clear(input)
    await user.type(input, "#zzzzzz{Enter}")
    expect(input).toHaveValue("#cf7a1b")
  })

  test("a custom color names the closest natural dye", async () => {
    const user = userEvent.setup()
    render(<SaduColorPicker label="Border dye" defaultValue="#a3231b" />)
    const input = screen.getByRole("textbox", { name: "Hex" })
    await user.clear(input)
    await user.type(input, "#b02a20{Enter}")
    expect(document.querySelector(".sadu-color__name")).toHaveTextContent("Custom dye")
    expect(screen.getByText("Closest to madder")).toBeInTheDocument()
  })

  test("arrow keys move the area and hue thumbs", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<SaduColorPicker label="Border dye" defaultValue="#a3231b" onValueChange={onValueChange} />)
    const thumbs = screen.getAllByRole("slider")
    act(() => thumbs[0]?.focus())
    await user.keyboard("{ArrowUp}")
    const afterArea = onValueChange.mock.lastCall?.[0]
    expect(afterArea).not.toBe("#a3231b")
    act(() => thumbs[1]?.focus())
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}")
    expect(onValueChange.mock.lastCall?.[0]).not.toBe(afterArea)
  })

  test("the eyedropper is marked unsupported where the browser can't pick", () => {
    render(<SaduColorPicker label="Border dye" defaultValue="#a3231b" />)
    expect(document.querySelector(".sadu-color__dropper")).toHaveAttribute("data-unsupported")
  })
})

describe("file input", () => {
  const pdf = (name: string, size = 1000) => new File([new Uint8Array(size)], name, { type: "application/pdf" })

  test("browsed files join the list, rejected ones don't", async () => {
    const user = userEvent.setup({ applyAccept: false, pointerEventsCheck: 0 })
    const onReject = vi.fn()
    render(<SaduFileInput multiple accept=".pdf" maxSize={5000} listLabel="Pattern drafts" onReject={onReject} />)
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error("No file input")
    await user.upload(input, [pdf("dhalla.pdf"), pdf("huge.pdf", 9000), new File(["x"], "notes.txt", { type: "text/plain" })])
    const list = screen.getByRole("list", { name: "Pattern drafts" })
    expect(within(list).getAllByRole("listitem")).toHaveLength(1)
    expect(within(list).getByText("dhalla.pdf")).toBeInTheDocument()
    expect(onReject).toHaveBeenCalledTimes(1)
    expect(onReject.mock.lastCall?.[0]).toHaveLength(2)
  })

  test("Delete removes the focused file", async () => {
    const user = userEvent.setup()
    render(<SaduFileInput multiple defaultValue={[pdf("a.pdf"), pdf("b.pdf")]} listLabel="Pattern drafts" />)
    const rows = screen.getAllByRole("listitem")
    act(() => rows[0]?.focus())
    await user.keyboard("{Delete}")
    expect(screen.getAllByRole("listitem")).toHaveLength(1)
    expect(screen.getByRole("listitem")).toHaveFocus()
    expect(screen.getByText("b.pdf")).toBeInTheDocument()
  })

  test("each row shows its upload state: weaving, done or failed with retry", async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const files = [pdf("weaving.pdf"), pdf("done.pdf"), pdf("failed.pdf")]
    render(
      <SaduFileInput
        multiple
        defaultValue={files}
        progressOf={(file) => (file.name === "weaving.pdf" ? 0.62 : undefined)}
        errorOf={(file) => (file.name === "failed.pdf" ? "Upload failed" : undefined)}
        onRetry={onRetry}
      />,
    )
    const states = [...document.querySelectorAll(".sadu-file__band")].map((band) => band.getAttribute("data-state"))
    expect(states).toEqual(["weaving", "done", "failed"])
    expect(screen.getByText("62%")).toBeInTheDocument()
    expect(screen.getByText("Upload failed")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Retry" }))
    expect(onRetry).toHaveBeenCalledWith(files[2])
  })

  test("only files added after mount weave in", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<SaduFileInput multiple defaultValue={[pdf("first.pdf")]} />)
    expect(document.querySelector(".sadu-file__band")).not.toHaveAttribute("data-fresh")
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error("No file input")
    await user.upload(input, pdf("second.pdf"))
    const bands = document.querySelectorAll(".sadu-file__band")
    expect(bands[1]).toHaveAttribute("data-fresh")
  })

  test("a file that finishes uploading does not weave in a second time", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const file = pdf("late.pdf")
    function Upload({ progress }: { progress: number | undefined }): ReactElement {
      return <SaduFileInput multiple progressOf={() => progress} />
    }
    const { rerender } = render(<Upload progress={0.4} />)
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error("No file input")
    await user.upload(input, file)
    expect(document.querySelector(".sadu-file__band")).toHaveAttribute("data-state", "weaving")
    rerender(<Upload progress={undefined} />)
    expect(document.querySelector(".sadu-file__band")).toHaveAttribute("data-state", "done")
    expect(document.querySelector(".sadu-file__band")).not.toHaveAttribute("data-fresh")
  })

  test("the trigger is named and the drop zone is not a tab stop", () => {
    render(<SaduFileInput prompt="Drop drafts here or" browseLabel="browse" />)
    expect(screen.getByRole("button", { name: /browse/ })).toBeInTheDocument()
    expect(document.querySelector(".sadu-file__loom")).not.toHaveAttribute("tabindex")
  })
})

describe("listbox", () => {
  function Bands({ onValueChange }: { onValueChange?: (value: string[]) => void }): ReactElement {
    return (
      <SaduListbox label="Bands in this piece" defaultValue={["dhalla"]} onValueChange={(value) => onValueChange?.(value as string[])}>
        {["Border", "Dhalla", "Uwairjan", "Shajarah", "Hubub"].map((name) => (
          <SaduListboxItem key={name} value={name.toLowerCase()} label={name}>
            {name}
          </SaduListboxItem>
        ))}
      </SaduListbox>
    )
  }

  test("click toggles, Space toggles, Shift with arrows extends, typing jumps", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Bands onValueChange={onValueChange} />)
    expect(screen.getByRole("listbox", { name: "Bands in this piece" })).toHaveAttribute("aria-multiselectable", "true")
    const latest = () => [...(onValueChange.mock.lastCall?.[0] ?? [])].sort()
    await user.click(screen.getByRole("option", { name: "Border" }))
    expect(latest()).toEqual(["border", "dhalla"])
    await user.click(screen.getByRole("option", { name: "Dhalla" }))
    expect(latest()).toEqual(["border"])
    await user.keyboard("{ArrowDown} ")
    expect(latest()).toEqual(["border", "uwairjan"])
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}")
    expect(onValueChange.mock.lastCall?.[0]).toEqual(expect.arrayContaining(["uwairjan", "shajarah"]))
    await user.keyboard("h")
    expect(screen.getByRole("option", { name: "Hubub" })).toHaveFocus()
    const selected = screen.getAllByRole("option").filter((option) => option.getAttribute("aria-selected") === "true")
    expect(selected.map((option) => option.textContent)).toEqual(expect.arrayContaining(["Border", "Uwairjan", "Shajarah"]))
  })

  test("the eye mark follows selection", async () => {
    const user = userEvent.setup()
    render(<Bands />)
    const mark = (name: string) => screen.getByRole("option", { name }).querySelector(".sadu-eye-mark")
    expect(mark("Dhalla")).toHaveAttribute("data-state", "on")
    expect(mark("Border")).toHaveAttribute("data-state", "off")
    await user.click(screen.getByRole("option", { name: "Border" }))
    expect(mark("Border")).toHaveAttribute("data-state", "on")
  })
})

describe("tree", () => {
  function Order(): ReactElement {
    return (
      <SaduTree aria-label="Order 14" defaultExpanded={["order"]}>
        <SaduTreeItem value="order" label="Order 14">
          <SaduTreeItem value="border" label="Border">
            <SaduTreeItem value="dhalla" label="Dhalla" />
          </SaduTreeItem>
          <SaduTreeItem value="centre" label="Centre" />
        </SaduTreeItem>
      </SaduTree>
    )
  }

  test("arrows expand and collapse, Enter selects, typing jumps", async () => {
    const user = userEvent.setup()
    render(<Order />)
    const border = screen.getByRole("treeitem", { name: "Border" })
    act(() => border.focus())
    expect(border).toHaveAttribute("aria-expanded", "false")
    await user.keyboard("{ArrowRight}")
    expect(border).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("treeitem", { name: "Dhalla" })).toBeInTheDocument()
    await user.keyboard("{ArrowLeft}")
    expect(border).toHaveAttribute("aria-expanded", "false")
    await user.keyboard("c")
    expect(screen.getByRole("treeitem", { name: "Centre" })).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(screen.getByRole("treeitem", { name: "Centre" })).toHaveAttribute("aria-selected", "true")
  })

  test("the eye opens with its branch", async () => {
    const user = userEvent.setup()
    render(<Order />)
    const eye = () => screen.getByRole("treeitem", { name: "Border" }).querySelector(".sadu-tree__eye")
    expect(eye()).not.toHaveAttribute("data-expanded")
    await user.click(eye() as HTMLElement)
    expect(eye()).toHaveAttribute("data-expanded")
  })
})

describe("checkbox", () => {
  function Finishing(): ReactElement {
    return (
      <form data-testid="form">
        <SaduCheckboxGroup legend="Include in the piece" name="finishing" defaultValue={["fringe"]} allValues={["fringe", "tassels"]}>
          <SaduCheckbox parent>All finishing</SaduCheckbox>
          <SaduCheckbox value="fringe">Fringe</SaduCheckbox>
          <SaduCheckbox value="tassels">Tassels</SaduCheckbox>
        </SaduCheckboxGroup>
      </form>
    )
  }

  test("Space toggles and the parent follows its children both ways", async () => {
    const user = userEvent.setup()
    render(<Finishing />)
    expect(screen.getByRole("group", { name: "Include in the piece" })).toBeInTheDocument()
    const parent = screen.getByRole("checkbox", { name: "All finishing" })
    const tassels = screen.getByRole("checkbox", { name: "Tassels" })
    expect(parent).toHaveAttribute("aria-checked", "mixed")
    act(() => tassels.focus())
    await user.keyboard(" ")
    expect(parent).toHaveAttribute("aria-checked", "true")
    await user.click(parent)
    expect(screen.getByRole("checkbox", { name: "Fringe" })).toHaveAttribute("aria-checked", "false")
    expect(tassels).toHaveAttribute("aria-checked", "false")
    await user.click(screen.getByText("Fringe"))
    expect(parent).toHaveAttribute("aria-checked", "mixed")
    const data = new FormData(screen.getByTestId("form") as HTMLFormElement)
    expect(data.getAll("finishing")).toEqual(["fringe"])
  })

  test("the indicator draws the check or the bar for its state", async () => {
    const user = userEvent.setup()
    render(<SaduCheckbox defaultChecked="indeterminate">Lining</SaduCheckbox>)
    const indicator = () => document.querySelector(".sadu-checkbox__indicator")
    expect(indicator()).toHaveAttribute("data-indeterminate")
    await user.click(screen.getByRole("checkbox", { name: "Lining" }))
    expect(indicator()).toHaveAttribute("data-checked")
    expect(indicator()?.querySelectorAll(".sadu-checkbox__check .sadu-checkbox__float")).toHaveLength(5)
  })
})

describe("carousel", () => {
  test("one tooth per slide, ignoring empty children, and Previous starts disabled", () => {
    const show = false
    render(
      <SaduCarousel aria-label="Pieces" indicatorLabel={(page) => `Piece ${page}`}>
        <SaduCarouselItem caption="Tent divider">A</SaduCarouselItem>
        {show && <SaduCarouselItem caption="Hidden">B</SaduCarouselItem>}
        <SaduCarouselItem caption="Majlis runner">C</SaduCarouselItem>
      </SaduCarousel>,
    )
    expect(screen.getAllByRole("tab")).toHaveLength(2)
    expect(screen.getByRole("tab", { name: "Piece 1" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("button", { name: "Previous" })).toHaveAttribute("data-disabled")
  })
})

describe("image cropper", () => {
  test("aspect presets are radios that report the chosen ratio", async () => {
    const user = userEvent.setup()
    const onAspectRatioChange = vi.fn()
    render(
      <SaduImageCropper
        src="data:image/png;base64,iVBORw0KGgo="
        alt="A tent divider"
        aria-label="Listing photo"
        aspects={[
          { label: "Square", value: 1 },
          { label: "Band 4:1", value: 4 },
        ]}
        defaultAspectRatio={4}
        onAspectRatioChange={onAspectRatioChange}
      />,
    )
    expect(screen.getByRole("radio", { name: "Band 4:1" })).toHaveAttribute("aria-checked", "true")
    await user.click(screen.getByRole("radio", { name: "Square" }))
    expect(onAspectRatioChange).toHaveBeenCalledWith(1)
    expect(screen.getByRole("radio", { name: "Square" })).toHaveAttribute("aria-checked", "true")
    expect(screen.getByRole("button", { name: "Rotate a quarter turn" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Flip" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "A tent divider" })).toBeInTheDocument()
  })
})

describe("controlled values", () => {
  test("color picker and listbox follow the value they are given", () => {
    const { rerender } = render(
      <>
        <SaduColorPicker label="Border dye" value="#a3231b" />
        <SaduListbox label="Bands" value={["dhalla"]}>
          <SaduListboxItem value="dhalla">Dhalla</SaduListboxItem>
          <SaduListboxItem value="hubub">Hubub</SaduListboxItem>
        </SaduListbox>
      </>,
    )
    rerender(
      <>
        <SaduColorPicker label="Border dye" value="#cf7a1b" />
        <SaduListbox label="Bands" value={["hubub"]}>
          <SaduListboxItem value="dhalla">Dhalla</SaduListboxItem>
          <SaduListboxItem value="hubub">Hubub</SaduListboxItem>
        </SaduListbox>
      </>,
    )
    expect(screen.getByRole("textbox", { name: "Hex" })).toHaveValue("#cf7a1b")
    expect(screen.getByRole("option", { name: "Saffron" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("option", { name: "Hubub" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("option", { name: "Dhalla" })).toHaveAttribute("aria-selected", "false")
  })
})

describe("themes and motion", () => {
  test("components render inside the tent theme and reduced motion without errors", () => {
    render(
      <div data-theme="tent" data-motion="reduced">
        <SaduCalendar aria-label="Loom booking" mode="range" defaultValue={["2026-11-02", "2026-11-04"]} />
        <SaduCheckbox defaultChecked>Fringe</SaduCheckbox>
      </div>,
    )
    expect(banded()).toEqual(range("2026-11-02", "2026-11-04"))
  })
})
