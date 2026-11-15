import { act, cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState, type ReactElement, type ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { SaduAutocomplete } from "../../src/sadu/sadu-autocomplete"
import { SaduCombobox, type ComboboxOption } from "../../src/sadu/sadu-combobox"
import { SaduDateInput } from "../../src/sadu/sadu-date-input"
import { SaduField, SaduFieldDescription, SaduFieldError, SaduFieldLabel } from "../../src/sadu/sadu-field"
import { SaduInput } from "../../src/sadu/sadu-input"
import { SaduNumberInput } from "../../src/sadu/sadu-number-input"
import { SaduOTPInput } from "../../src/sadu/sadu-otp-input"
import { SaduPasswordInput } from "../../src/sadu/sadu-password-input"
import { SaduTextarea } from "../../src/sadu/sadu-textarea"
import { SaduTimeInput } from "../../src/sadu/sadu-time-input"
import { SaduTokenInput, type TokenTrigger } from "../../src/sadu/sadu-token-input"

const noise: string[] = []
const JSDOM_CSS_LIMIT = "Could not parse CSS stylesheet"

if (typeof CSS === "undefined" || typeof CSS.supports !== "function") {
  Object.assign(globalThis, { CSS: { ...(globalThis.CSS ?? {}), supports: () => false } })
}

beforeEach(() => {
  noise.length = 0
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const text = args.map(String).join(" ")
    if (!text.includes(JSDOM_CSS_LIMIT)) noise.push(`error: ${text}`)
  })
  vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => void noise.push(`warn: ${args.map(String).join(" ")}`))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  expect(noise.join("\n")).toBe("")
})

function formValues(form: HTMLFormElement): Record<string, FormDataEntryValue[]> {
  const values: Record<string, FormDataEntryValue[]> = {}
  for (const [key, value] of new FormData(form)) (values[key] ??= []).push(value)
  return values
}

function InForm({ children }: { children: ReactNode }): ReactElement {
  return <form aria-label="Order">{children}</form>
}

function tallyOf(container: HTMLElement): number {
  return container.querySelectorAll(".sadu-counter__float[data-woven]").length
}

describe("Field", () => {
  test("label names the control, description and error describe it", async () => {
    render(
      <SaduField invalid>
        <SaduFieldLabel>Panel length</SaduFieldLabel>
        <SaduInput defaultValue="14" required />
        <SaduFieldDescription>Measured along the warp.</SaduFieldDescription>
        <SaduFieldError match>A tent panel runs 2 to 12 metres.</SaduFieldError>
      </SaduField>,
    )
    const input = screen.getByRole("textbox", { name: /Panel length/ })
    await vi.waitFor(() => expect(input).toHaveAccessibleDescription(/A tent panel runs 2 to 12 metres\./))
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).toBeRequired()
    expect(screen.getByText("required")).toHaveClass("sadu-field__hidden")
  })

  test("the error disappears when the field becomes valid", async () => {
    function Length(): ReactElement {
      const [value, setValue] = useState("14")
      const invalid = Number(value) > 12
      return (
        <SaduField invalid={invalid}>
          <SaduFieldLabel>Panel length</SaduFieldLabel>
          <SaduInput value={value} onValueChange={(next) => setValue(next)} />
          {invalid && <SaduFieldError match>Too long.</SaduFieldError>}
        </SaduField>
      )
    }
    const user = userEvent.setup()
    render(<Length />)
    const input = screen.getByRole("textbox", { name: "Panel length" })
    expect(screen.getByText("Too long.")).toBeInTheDocument()
    await user.clear(input)
    await user.type(input, "9")
    expect(screen.queryByText("Too long.")).not.toBeInTheDocument()
    expect(input).not.toHaveAttribute("aria-invalid", "true")
  })
})

describe("Input", () => {
  test("typing, clearing and form values", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <InForm>
        <SaduField name="client">
          <SaduFieldLabel>Client name</SaduFieldLabel>
          <SaduInput defaultValue="Umm Saad" clearLabel="Clear client name" />
        </SaduField>
      </InForm>,
    )
    const input = screen.getByRole("textbox", { name: "Client name" })
    await user.type(input, " Al-Ajmi")
    expect(input).toHaveValue("Umm Saad Al-Ajmi")
    expect(formValues(container.querySelector("form")!)).toEqual({ client: ["Umm Saad Al-Ajmi"] })
    await user.click(screen.getByRole("button", { name: "Clear client name" }))
    expect(input).toHaveValue("")
    expect(input).toHaveFocus()
    await user.type(input, "Hessa")
    act(() => container.querySelector("form")!.reset())
    expect(input).toHaveValue("Umm Saad")
  })

  test("controlled value follows state and reports changes", async () => {
    const changes: string[] = []
    function Controlled(): ReactElement {
      const [value, setValue] = useState("Noura")
      return (
        <SaduInput
          aria-label="Weaver"
          value={value}
          onValueChange={(next) => {
            changes.push(next)
            setValue(next.toUpperCase())
          }}
        />
      )
    }
    const user = userEvent.setup()
    render(<Controlled />)
    const input = screen.getByRole("textbox", { name: "Weaver" })
    await user.type(input, "h")
    expect(input).toHaveValue("NOURAH")
    expect(changes).toEqual(["Nourah"])
  })

  test("a dhurs strip is drawn in every field box", () => {
    const { container } = render(<SaduInput aria-label="Weaver" />)
    expect(container.querySelector(".sadu-input .sadu-dhurs .sadu-weave")).not.toBeNull()
  })
})

describe("Textarea", () => {
  test("counter and band follow the text, and over the limit it turns to teeth", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <SaduField>
        <SaduFieldLabel>Notes for the weaver</SaduFieldLabel>
        <SaduTextarea defaultValue="Ten chars." limit={20} />
      </SaduField>,
    )
    const textarea = screen.getByRole("textbox", { name: "Notes for the weaver" })
    expect(textarea).toHaveAccessibleDescription("10 / 20")
    const cloth = container.querySelector<HTMLElement>(".sadu-textarea__cloth")!
    expect(cloth.style.getPropertyValue("--sadu-fill")).toBe("0.5")
    await user.type(textarea, " Eighteen")
    expect(textarea).toHaveAccessibleDescription("19 / 20")
    expect(container.querySelector(".sadu-textarea")).toHaveAttribute("data-near")
    await user.type(textarea, " over")
    expect(container.querySelector(".sadu-textarea")).toHaveAttribute("data-over")
    expect(screen.getByText("24 / 20")).toBeInTheDocument()
    expect(cloth.style.getPropertyValue("--sadu-fill")).toBe("1")
  })

  test("controlled text drives the counter, and the hard limit is native", async () => {
    function Notes(): ReactElement {
      const [notes, setNotes] = useState("abc")
      return <SaduTextarea aria-label="Notes" value={notes} onValueChange={(next) => setNotes(next)} maxLength={5} />
    }
    const user = userEvent.setup()
    render(<Notes />)
    const textarea = screen.getByRole("textbox", { name: "Notes" })
    await user.type(textarea, "defg")
    expect(textarea).toHaveValue("abcde")
    expect(screen.getByText("5 / 5")).toBeInTheDocument()
  })

  test("without a limit the textarea takes the dhurs strip instead of the band", () => {
    const { container } = render(<SaduTextarea aria-label="Notes" />)
    expect(container.querySelector(".sadu-textarea__band")).toBeNull()
    expect(container.querySelector(".sadu-dhurs")).not.toBeNull()
  })
})

describe("Number Input", () => {
  function Rows(props: { onValueChange?: (value: number | null) => void; disabled?: boolean }): ReactElement {
    return (
      <InForm>
        <SaduField>
          <SaduFieldLabel>Rows per band</SaduFieldLabel>
          <SaduNumberInput name="rows" defaultValue={11} min={3} max={21} step={2} unit="rows" incrementLabel="More rows" decrementLabel="Fewer rows" {...props} />
        </SaduField>
      </InForm>
    )
  }

  test("keyboard steps on the odd grid, clamps at the bounds, and the tally always matches", async () => {
    const user = userEvent.setup()
    const { container } = render(<Rows />)
    const input = screen.getByRole("textbox", { name: "Rows per band" })
    input.focus()
    await user.keyboard("{ArrowUp}")
    expect(input).toHaveValue("13")
    expect(tallyOf(container)).toBe(13)
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}")
    expect(input).toHaveValue("7")
    expect(tallyOf(container)).toBe(7)
    await user.keyboard("{PageUp}")
    expect(input).toHaveValue("21")
    expect(tallyOf(container)).toBe(21)
    await user.keyboard("{Home}")
    expect(input).toHaveValue("3")
    expect(tallyOf(container)).toBe(3)
    await user.keyboard("{End}")
    expect(input).toHaveValue("21")
    expect(screen.getByRole("button", { name: "More rows" })).toHaveAttribute("data-at-bound")
    expect(formValues(container.querySelector("form")!)).toEqual({ rows: ["21"] })
  })

  test("typed values snap to the step and clamp on blur, then the tally follows", async () => {
    const user = userEvent.setup()
    const { container } = render(<Rows />)
    const input = screen.getByRole("textbox", { name: "Rows per band" })
    await user.clear(input)
    await user.type(input, "40")
    await user.tab()
    expect(input).toHaveValue("21")
    expect(tallyOf(container)).toBe(21)
    await user.clear(input)
    await user.type(input, "8")
    await user.tab()
    expect(Number((input as HTMLInputElement).value) % 2).toBe(1)
    expect(tallyOf(container)).toBe(Number((input as HTMLInputElement).value))
  })

  test("pegs step and are named, and the field resets", async () => {
    const user = userEvent.setup()
    const changes: (number | null)[] = []
    const { container } = render(<Rows onValueChange={(value) => changes.push(value)} />)
    await user.click(screen.getByRole("button", { name: "More rows" }))
    await user.click(screen.getByRole("button", { name: "More rows" }))
    await user.click(screen.getByRole("button", { name: "Fewer rows" }))
    expect(changes).toEqual([13, 15, 13])
    expect(tallyOf(container)).toBe(13)
    act(() => container.querySelector("form")!.reset())
    await vi.waitFor(() => expect(screen.getByRole("textbox", { name: "Rows per band" })).toHaveValue("11"))
    expect(tallyOf(container)).toBe(11)
  })

  test("controlled value drives the tally", () => {
    function Controlled({ value }: { value: number }): ReactElement {
      return <SaduNumberInput aria-label="Rows" value={value} min={3} max={21} />
    }
    const { container, rerender } = render(<Controlled value={5} />)
    expect(tallyOf(container)).toBe(5)
    rerender(<Controlled value={17} />)
    expect(tallyOf(container)).toBe(17)
  })

  test("disabled leaves the value out of the form and locks the pegs", () => {
    const { container } = render(<Rows disabled />)
    expect(screen.getByRole("textbox", { name: "Rows per band" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "More rows" })).toHaveAttribute("data-disabled")
    expect(formValues(container.querySelector("form")!)).toEqual({})
  })

  test("the unit is a scrub handle and large maximums drop the tally", () => {
    const { container } = render(<SaduNumberInput aria-label="Warp threads" defaultValue={96} max={240} unit="ends" />)
    expect(container.querySelector('[data-slot="number-input-scrub-area"]')).toHaveTextContent("ends")
    expect(container.querySelector(".sadu-counter__tally")).toBeNull()
  })
})

describe("Password Input", () => {
  test("toggle shows and hides with its pressed state, and autofill hints stay", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <InForm>
        <SaduField>
          <SaduFieldLabel>Workshop passphrase</SaduFieldLabel>
          <SaduPasswordInput name="passphrase" defaultValue="goathair-loom" autoComplete="current-password" />
        </SaduField>
      </InForm>,
    )
    const input = screen.getByLabelText("Workshop passphrase")
    const toggle = screen.getByRole("button", { name: "Show password" })
    expect(input).toHaveAttribute("type", "password")
    expect(input).toHaveAttribute("autocomplete", "current-password")
    expect(input).toHaveClass("sadu-password__control")
    expect(toggle).toHaveAttribute("aria-pressed", "false")
    await user.click(toggle)
    expect(input).toHaveAttribute("type", "text")
    expect(toggle).toHaveAttribute("aria-pressed", "true")
    expect(toggle.querySelector(".sadu-eye-mark")).toHaveAttribute("data-state", "on")
    await user.click(toggle)
    expect(input).toHaveAttribute("type", "password")
    expect(toggle.querySelector(".sadu-eye-mark")).toHaveAttribute("data-state", "closed")
    expect(formValues(container.querySelector("form")!)).toEqual({ passphrase: ["goathair-loom"] })
  })

  test("controlled visibility follows its prop", () => {
    const { rerender } = render(<SaduPasswordInput visible={false} defaultValue="loom" inputProps={{ "aria-label": "Passphrase" }} />)
    expect(screen.getByLabelText("Passphrase")).toHaveAttribute("type", "password")
    rerender(<SaduPasswordInput visible defaultValue="loom" inputProps={{ "aria-label": "Passphrase" }} />)
    expect(screen.getByLabelText("Passphrase")).toHaveAttribute("type", "text")
    expect(screen.getByRole("button", { name: "Show password" })).toHaveAttribute("aria-pressed", "true")
  })

  test("the caps lock line is a polite live region that starts empty", () => {
    const { container } = render(<SaduPasswordInput inputProps={{ "aria-label": "Passphrase" }} />)
    const line = container.querySelector(".sadu-password__caps")!
    expect(line).toHaveAttribute("aria-live", "polite")
    expect(line).toBeEmptyDOMElement()
  })
})

describe("OTP Input", () => {
  test("typing fills slots, Backspace steps back, and a full code commits once", async () => {
    const user = userEvent.setup()
    const commits: string[] = []
    const { container } = render(
      <InForm>
        <SaduField>
          <SaduFieldLabel>Code from the workshop</SaduFieldLabel>
          <SaduOTPInput name="code" onValueCommit={(value) => commits.push(value)} />
        </SaduField>
      </InForm>,
    )
    const input = screen.getByRole("textbox", { name: "Code from the workshop" })
    await user.click(input)
    await user.keyboard("48")
    let slots = container.querySelectorAll(".sadu-otp__slot")
    expect(slots[0]).toHaveAttribute("data-filled")
    expect(slots[1]).toHaveAttribute("data-filled")
    expect(slots[2]).not.toHaveAttribute("data-filled")
    await user.keyboard("{Backspace}")
    expect(input).toHaveValue("4")
    await user.keyboard("82915")
    expect(input).toHaveValue("482915")
    expect(commits).toEqual(["482915"])
    slots = container.querySelectorAll(".sadu-otp__slot")
    expect([...slots].every((slot) => slot.hasAttribute("data-filled"))).toBe(true)
    expect(formValues(container.querySelector("form")!)).toEqual({ code: ["482915"] })
  })

  test("the field's invalid state reaches the code", async () => {
    render(
      <SaduField invalid>
        <SaduFieldLabel>Code from the dye shed</SaduFieldLabel>
        <SaduOTPInput defaultValue="731906" />
        <SaduFieldError match>That code has expired.</SaduFieldError>
      </SaduField>,
    )
    const input = screen.getByRole("textbox", { name: "Code from the dye shed" })
    expect(input).toHaveAttribute("aria-invalid", "true")
    await vi.waitFor(() => expect(input).toHaveAccessibleDescription(/That code has expired\./))
  })

  test("groups set the length and place one eye between them", () => {
    const { container } = render(<SaduOTPInput aria-label="Code" groups={[2, 2, 2]} />)
    expect(screen.getByRole("textbox", { name: "Code" })).toHaveAttribute("maxlength", "6")
    expect(container.querySelectorAll(".sadu-otp__separator")).toHaveLength(2)
  })
})

describe("Date and Time Input", () => {
  test("date segments type, step, submit ISO and keep the Hijri line in step", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <InForm>
        <SaduField>
          <SaduFieldLabel>Due date</SaduFieldLabel>
          <SaduDateInput name="due" defaultValue="2027-02-14" locale="en-GB" hijri />
        </SaduField>
      </InForm>,
    )
    const group = screen.getByRole("group", { name: "Due date" })
    const day = within(group).getByRole("spinbutton", { name: "day" })
    expect(group).toHaveAccessibleDescription("7 رمضان 1448 هـ")
    day.focus()
    await user.keyboard("{ArrowUp}")
    expect(day).toHaveAttribute("aria-valuenow", "15")
    expect(group).toHaveAccessibleDescription("8 رمضان 1448 هـ")
    await user.keyboard("{ArrowRight}")
    expect(within(group).getByRole("spinbutton", { name: "month" })).toHaveFocus()
    expect(formValues(container.querySelector("form")!)).toEqual({ due: ["2027-02-15"] })
    expect(container.querySelector(".sadu-date-input")).toHaveAttribute("data-float")
  })

  test("a controlled date drives the Hijri line, and partial dates hide it", () => {
    const { rerender, container } = render(<SaduDateInput aria-label="Due" value="2027-02-14" locale="en-GB" hijri />)
    expect(container.querySelector(".sadu-date__hijri")).toHaveTextContent("7 رمضان 1448 هـ")
    rerender(<SaduDateInput aria-label="Due" value="2027-03-20" locale="en-GB" hijri />)
    expect(container.querySelector(".sadu-date__hijri")).toHaveTextContent("12 شوال 1448 هـ")
    rerender(<SaduDateInput aria-label="Due" value={null} locale="en-GB" hijri />)
    expect(container.querySelector(".sadu-date__hijri")).toBeEmptyDOMElement()
  })

  test("a controlled time drives the day band, and no time hides the hour", () => {
    const { rerender, container } = render(<SaduTimeInput aria-label="Time" value="06:00" hourCycle={24} locale="en-GB" />)
    const band = () => container.querySelector<HTMLElement>(".sadu-time__day")!
    expect(band().style.getPropertyValue("--sadu-hour")).toBe("6")
    rerender(<SaduTimeInput aria-label="Time" value="21:15" hourCycle={24} locale="en-GB" />)
    expect(band().style.getPropertyValue("--sadu-hour")).toBe("21")
    expect(band().style.getPropertyValue("--sadu-hour-duration")).toBe("1800ms")
    rerender(<SaduTimeInput aria-label="Time" value={null} hourCycle={24} locale="en-GB" />)
    expect(band()).toHaveAttribute("data-empty")
  })

  test("literal separators become eye marks but spaces stay text", () => {
    const { container } = render(<SaduTimeInput aria-label="Collection time" defaultValue="16:30" hourCycle={12} locale="en-US" />)
    const literals = container.querySelectorAll(".sadu-date-input__literal")
    expect(literals[0]?.querySelector(".sadu-eye-mark")).not.toBeNull()
    expect([...literals].some((literal) => literal.querySelector("svg") === null)).toBe(true)
  })

  test("the day band follows the hour and steps with it", async () => {
    const user = userEvent.setup()
    const { container } = render(<SaduTimeInput aria-label="Collection time" defaultValue="16:30" hourCycle={24} locale="en-GB" name="time" />)
    const band = container.querySelector<HTMLElement>(".sadu-time__day")!
    expect(band.style.getPropertyValue("--sadu-hour")).toBe("16")
    within(screen.getByRole("group", { name: "Collection time" })).getByRole("spinbutton", { name: "hour" }).focus()
    await user.keyboard("{ArrowUp}{ArrowUp}")
    expect(band.style.getPropertyValue("--sadu-hour")).toBe("18")
    expect(band.style.getPropertyValue("--sadu-hour-duration")).toBe("120ms")
  })
})

const DYES: readonly ComboboxOption[] = [
  { value: "madder", label: "Madder", arabic: "أحمر" },
  { value: "saffron", label: "Saffron", arabic: "زعفراني" },
  { value: "indigo", label: "Indigo", arabic: "نيلي" },
]

describe("Combobox", () => {
  test("multiple dyes become chips that can be removed, and submit their values", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <InForm>
        <SaduField>
          <SaduFieldLabel>Dyes for the band</SaduFieldLabel>
          <SaduCombobox multiple name="dyes" options={DYES} defaultValue={["madder", "indigo"]} placeholder="Add a dye" />
        </SaduField>
      </InForm>,
    )
    expect(container.querySelectorAll(".sadu-combobox__chip")).toHaveLength(2)
    await user.click(screen.getByRole("button", { name: "Remove Indigo" }))
    expect(container.querySelectorAll(".sadu-combobox__chip")).toHaveLength(1)
    expect(formValues(container.querySelector("form")!).dyes).toEqual(["madder"])
  })

  test("single selection shows the label and an eye on the chosen row", async () => {
    const user = userEvent.setup()
    render(<SaduCombobox options={DYES} defaultValue="saffron" inputProps={{ "aria-label": "Dye" }} />)
    const input = screen.getByRole("combobox", { name: "Dye" })
    expect(input).toHaveValue("Saffron")
    await user.click(screen.getByRole("button", { name: "Show options" }))
    const option = screen.getByRole("option", { name: /Saffron/ })
    expect(option).toHaveAttribute("aria-selected", "true")
    expect(option.querySelector(".sadu-eye-mark")).not.toBeNull()
  })

  test("a search with no match shows bare warp", async () => {
    const user = userEvent.setup()
    render(<SaduCombobox options={DYES} inputProps={{ "aria-label": "Dye" }} />)
    await user.type(screen.getByRole("combobox", { name: "Dye" }), "xyz")
    expect(screen.getByText("Nothing woven under “xyz”.")).toBeInTheDocument()
  })
})

describe("Autocomplete", () => {
  test("free text is kept and matches are stitched, including repeated letters", async () => {
    const user = userEvent.setup()
    render(
      <SaduAutocomplete
        suggestions={[{ value: "Dhalla" }, { value: "Hubub" }, { value: "Ain" }]}
        inlineComplete={false}
        inputProps={{ "aria-label": "Motif" }}
      />,
    )
    const input = screen.getByRole("combobox", { name: "Motif" })
    await user.type(input, "ll")
    const option = await vi.waitFor(() => {
      const match = screen.getAllByRole("option").find((candidate) => candidate.textContent === "Dhalla")
      if (!match) throw new Error("Dhalla is not offered")
      return match
    })
    expect([...option.querySelectorAll("mark")].map((mark) => mark.textContent)).toEqual(["ll"])
    await user.type(input, "zz")
    expect(input).toHaveValue("llzz")
  })
})

const TRIGGERS: readonly TokenTrigger[] = [
  { char: "@", items: [{ type: "person", value: "hessa", label: "Hessa" }] },
  { char: "#", items: [{ type: "dye", value: "madder", label: "madder", arabic: "أحمر" }] },
]

describe("Token Input", () => {
  test("tokens render with their sample and remove label, and report a structured value", () => {
    const { container } = render(
      <SaduTokenInput
        editorProps={{ "aria-label": "Brief" }}
        triggers={TRIGGERS}
        renderSample={(type) => <span data-sample={type} />}
        defaultValue={["Divider for ", { type: "person", value: "hessa", label: "Hessa" }, " in ", { type: "dye", value: "madder", label: "madder" }]}
      />,
    )
    const tokens = container.querySelectorAll(".sadu-token-input__token")
    expect(tokens).toHaveLength(2)
    expect(tokens[0]?.querySelector('[data-sample="person"]')).not.toBeNull()
    expect(tokens[1]?.querySelector('[data-sample="dye"]')).not.toBeNull()
    expect(container.querySelector(".sadu-token-input__remove")).toHaveAttribute("aria-label", "Remove Hessa")
  })
})
