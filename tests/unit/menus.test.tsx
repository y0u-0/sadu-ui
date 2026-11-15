import { act, cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState, type ReactElement } from "react"
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from "vitest"
import { EyePagination } from "../../src/sadu/eye-pagination"
import { LoomMotifSelect, LoomToolbar, LoomToolbarButton, LoomToolbarSeparator } from "../../src/sadu/loom-toolbar"
import { SaduButton } from "../../src/sadu/sadu-button"
import {
  SaduCommand,
  SaduCommandEmpty,
  SaduCommandGroup,
  SaduCommandGroupLabel,
  SaduCommandInput,
  SaduCommandItem,
  SaduCommandList,
} from "../../src/sadu/sadu-command"
import {
  SaduMenu,
  SaduMenuCheckboxItem,
  SaduMenuContent,
  SaduMenuItem,
  SaduMenuRadioGroup,
  SaduMenuRadioItem,
  SaduMenuSeparator,
  SaduMenuSpecimen,
  SaduMenuSub,
  SaduMenuSubContent,
  SaduMenuSubTrigger,
  SaduMenuTrigger,
} from "../../src/sadu/sadu-menu"
import { SaduMenubar, SaduMenubarTrigger } from "../../src/sadu/sadu-menubar"
import {
  SaduNavigationMenu,
  SaduNavigationMenuContent,
  SaduNavigationMenuItem,
  SaduNavigationMenuLink,
  SaduNavigationMenuList,
  SaduNavigationMenuSpecimen,
  SaduNavigationMenuSpecimenLink,
  SaduNavigationMenuTopLink,
  SaduNavigationMenuTrigger,
} from "../../src/sadu/sadu-navigation-menu"
import { SaduSegment, SaduSegmentedControl } from "../../src/sadu/sadu-segmented-control"
import { SaduNote, SaduNoteEditor, SaduTriggerMenu, SaduTriggerMenuContent, SaduTriggerMenuList } from "../../src/sadu/sadu-trigger-menu"
import { WarpToggle, WarpToggleGroup } from "../../src/sadu/warp-toggle"

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
  cleanup()
  const unexpected = [...reported(errors), ...reported(warnings)]
  vi.restoreAllMocks()
  expect(unexpected).toEqual([])
})

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve = () => {}
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe("SaduButton", () => {
  test("runs on click, Enter and Space", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<SaduButton onClick={onClick}>Save band</SaduButton>)
    const button = screen.getByRole("button", { name: "Save band" })
    await user.click(button)
    button.focus()
    await user.keyboard("{Enter}")
    await user.keyboard(" ")
    expect(onClick).toHaveBeenCalledTimes(3)
    expect(button).toHaveAttribute("type", "button")
  })

  test("stays pending while its promise runs and ignores a second press", async () => {
    const user = userEvent.setup()
    const work = deferred()
    const onClick = vi.fn(() => work.promise)
    render(<SaduButton onClick={onClick}>Send to loom</SaduButton>)
    const button = screen.getByRole("button", { name: "Send to loom" })
    await user.click(button)
    expect(button).toHaveAttribute("data-pending")
    expect(button).toHaveAttribute("aria-busy", "true")
    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
    await act(async () => work.resolve())
    expect(button).not.toHaveAttribute("data-pending")
    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  test("disabled is out of the tab order and cannot be pressed", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <>
        <SaduButton disabled onClick={onClick}>
          Remove band
        </SaduButton>
        <SaduButton variant="secondary">Cancel</SaduButton>
      </>,
    )
    await user.tab()
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus()
    await user.click(screen.getByRole("button", { name: "Remove band" }))
    expect(onClick).not.toHaveBeenCalled()
  })

  test("only the primary variant carries the hem and beater, and props pass through", () => {
    render(
      <>
        <SaduButton className="extra" data-testid="primary">
          Save band
        </SaduButton>
        <SaduButton variant="ghost" size="sm" data-testid="ghost">
          Preview
        </SaduButton>
        <SaduButton variant="secondary" size="icon" aria-label="Add band" data-testid="icon">
          +
        </SaduButton>
      </>,
    )
    const primary = screen.getByTestId("primary")
    expect(primary).toHaveClass("sadu-button", "extra")
    expect(primary).toHaveAttribute("data-variant", "primary")
    expect(primary.querySelector(".sadu-button__hem")).not.toBeNull()
    expect(primary.querySelector(".sadu-button__beater")).not.toBeNull()
    expect(screen.getByTestId("ghost").querySelector(".sadu-button__hem")).toBeNull()
    expect(screen.getByTestId("ghost")).toHaveAttribute("data-size", "sm")
    expect(screen.getByRole("button", { name: "Add band" })).toHaveAttribute("data-size", "icon")
  })
})

describe("WarpToggle", () => {
  test("a standalone toggle reports pressed, uncontrolled and controlled", async () => {
    const user = userEvent.setup()
    const onPressedChange = vi.fn()
    function Controlled(): ReactElement {
      const [pressed, setPressed] = useState(true)
      return (
        <WarpToggle pressed={pressed} onPressedChange={setPressed}>
          Lock band
        </WarpToggle>
      )
    }
    render(
      <>
        <WarpToggle onPressedChange={onPressedChange}>Mirror</WarpToggle>
        <Controlled />
      </>,
    )
    const mirror = screen.getByRole("button", { name: "Mirror" })
    expect(mirror).toHaveAttribute("aria-pressed", "false")
    await user.click(mirror)
    expect(mirror).toHaveAttribute("aria-pressed", "true")
    expect(onPressedChange).toHaveBeenLastCalledWith(true, expect.anything())
    const lock = screen.getByRole("button", { name: "Lock band" })
    expect(lock).toHaveAttribute("aria-pressed", "true")
    await user.click(lock)
    expect(lock).toHaveAttribute("aria-pressed", "false")
  })

  test("a single-choice group moves with arrow keys and reports one value", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <WarpToggleGroup aria-label="Band alignment" defaultValue={["centre"]} onValueChange={onValueChange}>
        <WarpToggle value="start">Start</WarpToggle>
        <WarpToggle value="centre">Centre</WarpToggle>
        <WarpToggle value="end">End</WarpToggle>
      </WarpToggleGroup>,
    )
    const group = screen.getByRole("group", { name: "Band alignment" })
    await user.tab()
    expect(within(group).getByRole("button", { name: "Centre" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    const end = within(group).getByRole("button", { name: "End" })
    expect(end).toHaveFocus()
    expect(end).toHaveAttribute("aria-pressed", "false")
    await user.keyboard(" ")
    expect(onValueChange).toHaveBeenLastCalledWith(["end"], expect.anything())
    expect(within(group).getByRole("button", { name: "Centre" })).toHaveAttribute("aria-pressed", "false")
    await user.tab()
    expect(group).not.toContainElement(document.activeElement as HTMLElement)
  })

  test("a multiple group keeps several pressed and skips nothing that is disabled", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <WarpToggleGroup aria-label="Weaving aids" multiple defaultValue={["guides"]} onValueChange={onValueChange}>
        <WarpToggle value="guides">Guide threads</WarpToggle>
        <WarpToggle value="mirror">Mirror</WarpToggle>
        <WarpToggle value="lock" disabled>
          Lock
        </WarpToggle>
      </WarpToggleGroup>,
    )
    await user.click(screen.getByRole("button", { name: "Mirror" }))
    expect(onValueChange).toHaveBeenLastCalledWith(["guides", "mirror"], expect.anything())
    const lock = screen.getByRole("button", { name: "Lock" })
    await user.click(lock)
    expect(lock).toHaveAttribute("aria-pressed", "false")
    expect(lock).toHaveAttribute("aria-disabled", "true")
  })
})

describe("SaduSegmentedControl", () => {
  function Ground(props: { onValueChange?: (value: string | null) => void; value?: string }): ReactElement {
    return (
      <SaduSegmentedControl aria-label="Ground" defaultValue={props.value ? undefined : "goat-hair"} value={props.value} onValueChange={props.onValueChange}>
        <SaduSegment value="wool">Wool</SaduSegment>
        <SaduSegment value="goat-hair">Goat hair</SaduSegment>
        <SaduSegment value="camel">Camel</SaduSegment>
      </SaduSegmentedControl>
    )
  }

  test("arrow keys and clicks check items and report values", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Ground onValueChange={onValueChange} />)
    await user.tab()
    expect(screen.getByRole("radio", { name: "Goat hair" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("radio", { name: "Camel" })).toHaveAttribute("aria-checked", "true")
    expect(onValueChange).toHaveBeenLastCalledWith("camel", expect.anything())
    await user.keyboard("{ArrowLeft}{ArrowLeft}")
    expect(onValueChange).toHaveBeenLastCalledWith("wool", expect.anything())
    expect(screen.getByRole("radio", { name: "Wool" })).toHaveFocus()
    await user.click(screen.getByRole("radio", { name: "Camel" }))
    expect(onValueChange).toHaveBeenLastCalledWith("camel", expect.anything())
  })

  test("a controlled control follows its value", async () => {
    const user = userEvent.setup()
    function Controlled(): ReactElement {
      const [value, setValue] = useState("wool")
      return (
        <>
          <Ground value={value} onValueChange={(next) => next && setValue(next)} />
          <output>{value}</output>
        </>
      )
    }
    render(<Controlled />)
    await user.click(screen.getByRole("radio", { name: "Camel" }))
    expect(screen.getByRole("status")).toHaveTextContent("camel")
    expect(screen.getByRole("radio", { name: "Camel" })).toHaveAttribute("data-checked")
  })

  test("only the checked item shows its woven band", async () => {
    const user = userEvent.setup()
    render(<Ground />)
    const checked = () => [...document.querySelectorAll(".sadu-segmented__item[data-checked]")]
    expect(checked()).toHaveLength(1)
    await user.click(screen.getByRole("radio", { name: "Camel" }))
    expect(checked()).toHaveLength(1)
    expect(checked()[0]).toHaveTextContent("Camel")
  })

  test("the shuttle takes the heading of the move and always lands", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<Ground />)
    await user.tab()
    await user.keyboard("{ArrowLeft}")
    const root = document.querySelector<HTMLElement>(".sadu-segmented")
    expect(root?.dataset.heading).toBe("left")
    expect(root).toHaveAttribute("data-moving")
    await user.click(screen.getByRole("radio", { name: "Camel" }))
    expect(root?.dataset.heading).toBe("right")
    act(() => vi.advanceTimersByTime(1000))
    expect(root).not.toHaveAttribute("data-moving")
    vi.useRealTimers()
  })

  test("reduced motion never starts the shuttle", async () => {
    const user = userEvent.setup()
    render(
      <div data-motion="reduced">
        <Ground />
      </div>,
    )
    await user.click(screen.getByRole("radio", { name: "Camel" }))
    const root = document.querySelector<HTMLElement>(".sadu-segmented")
    expect(root).not.toHaveAttribute("data-moving")
    expect(root).not.toHaveAttribute("data-heading")
  })
})

describe("EyePagination", () => {
  test("marks the current page, disables steps at the ends and pages with the keyboard", async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<EyePagination aria-label="Orders" pageCount={12} defaultPage={1} onPageChange={onPageChange} />)
    const nav = screen.getByRole("navigation", { name: "Orders" })
    expect(within(nav).getByRole("button", { name: "1" })).toHaveAttribute("aria-current", "page")
    const previous = within(nav).getByRole("button", { name: "Previous page" })
    expect(previous).toHaveAttribute("aria-disabled", "true")
    await user.click(previous)
    expect(onPageChange).not.toHaveBeenCalled()
    const next = within(nav).getByRole("button", { name: "Next page" })
    next.focus()
    await user.keyboard("{Enter}")
    expect(onPageChange).toHaveBeenLastCalledWith(2, expect.anything())
    await user.click(within(nav).getByRole("button", { name: "12" }))
    expect(within(nav).getByRole("button", { name: "12" })).toHaveAttribute("aria-current", "page")
    expect(within(nav).getByRole("button", { name: "Next page" })).toHaveAttribute("aria-disabled", "true")
  })

  test("is controlled by page and places the woven cloth up to it", async () => {
    const user = userEvent.setup()
    function Controlled(): ReactElement {
      const [page, setPage] = useState(4)
      return <EyePagination aria-label="Orders" pageCount={12} page={page} onPageChange={setPage} />
    }
    render(<Controlled />)
    const loom = document.querySelector<HTMLElement>(".sadu-eye-pagination__loom")
    expect(screen.getByRole("button", { name: "4" })).toHaveAttribute("aria-current", "page")
    const index = () => Number(loom?.style.getPropertyValue("--sadu-pagination-current"))
    const items = () => [...document.querySelectorAll(".sadu-eye-pagination__list > li")].slice(1, -1)
    expect(items()[index()]).toHaveTextContent("4")
    await user.click(screen.getByRole("button", { name: "Next page" }))
    expect(items()[index()]).toHaveTextContent("5")
    expect(screen.getByRole("button", { name: "5" }).querySelector(".sadu-lozenge")).toHaveAttribute("data-chosen")
  })
})

describe("LoomToolbar", () => {
  test("is one tab stop with roving focus, and the motif select opens and chooses", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <>
        <LoomToolbar aria-label="Band editor">
          <LoomToolbarButton aria-label="Undo">u</LoomToolbarButton>
          <LoomToolbarButton aria-label="Redo" disabled>
            r
          </LoomToolbarButton>
          <LoomToolbarSeparator />
          <WarpToggle aria-label="Mirror">m</WarpToggle>
          <LoomMotifSelect motifs={["eyoun", "uwairjan", "hubub"]} defaultValue="uwairjan" onValueChange={onValueChange} />
        </LoomToolbar>
        <button type="button">After</button>
      </>,
    )
    const toolbar = screen.getByRole("toolbar", { name: "Band editor" })
    await user.tab()
    expect(within(toolbar).getByRole("button", { name: "Undo" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(within(toolbar).getByRole("button", { name: "Redo" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(within(toolbar).getByRole("button", { name: "Mirror" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    const select = within(toolbar).getByRole("combobox", { name: "Motif" })
    expect(select).toHaveFocus()
    expect(select).toHaveTextContent("Uwairjan")
    await user.tab()
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus()
    await user.tab({ shift: true })
    expect(select).toHaveFocus()
    await user.keyboard("{Enter}")
    const listbox = await screen.findByRole("listbox")
    await user.click(within(listbox).getByRole("option", { name: /Hubub/ }))
    expect(onValueChange).toHaveBeenLastCalledWith("hubub")
    expect(select).toHaveTextContent("Hubub")
  })
})

function BandMenu(props: { onAction?: (value: string) => void; onDye?: (value: string) => void; onGuides?: (checked: boolean) => void }): ReactElement {
  return (
    <SaduMenu onAction={props.onAction}>
      <SaduMenuTrigger>Band actions</SaduMenuTrigger>
      <SaduMenuContent>
        <SaduMenuItem value="duplicate" shortcut="mod+d">
          Duplicate band
        </SaduMenuItem>
        <SaduMenuItem value="mirror">Mirror</SaduMenuItem>
        <SaduMenuSeparator />
        <SaduMenuCheckboxItem value="guides" defaultChecked onCheckedChange={props.onGuides}>
          Show guide threads
        </SaduMenuCheckboxItem>
        <SaduMenuSub>
          <SaduMenuSubTrigger>Dye</SaduMenuSubTrigger>
          <SaduMenuSubContent>
            <SaduMenuRadioGroup defaultValue="madder" onValueChange={props.onDye}>
              <SaduMenuRadioItem value="madder">Madder</SaduMenuRadioItem>
              <SaduMenuRadioItem value="indigo">Indigo</SaduMenuRadioItem>
            </SaduMenuRadioGroup>
          </SaduMenuSubContent>
        </SaduMenuSub>
        <SaduMenuItem value="remove" destructive>
          Remove band
        </SaduMenuItem>
      </SaduMenuContent>
    </SaduMenu>
  )
}

describe("SaduMenu", () => {
  test("opens from the keyboard, runs an action, closes and returns focus", async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(<BandMenu onAction={onAction} />)
    const trigger = screen.getByRole("button", { name: "Band actions" })
    trigger.focus()
    await user.keyboard("{ArrowDown}")
    const menu = await screen.findByRole("menu")
    expect(within(menu).getByRole("menuitem", { name: /Duplicate band/ })).toHaveFocus()
    await user.keyboard("{ArrowDown}{Enter}")
    expect(onAction).toHaveBeenCalledWith("mirror", expect.anything())
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  test("typeahead finds an item by name", async () => {
    const user = userEvent.setup()
    render(<BandMenu />)
    screen.getByRole("button", { name: "Band actions" }).focus()
    await user.keyboard("{ArrowDown}")
    await user.keyboard("r")
    expect(screen.getByRole("menuitem", { name: "Remove band" })).toHaveFocus()
  })

  test("the checkbox item toggles, reports and keeps the menu open, with an eye in each state", async () => {
    const user = userEvent.setup()
    const onGuides = vi.fn()
    render(<BandMenu onGuides={onGuides} />)
    await user.click(screen.getByRole("button", { name: "Band actions" }))
    const guides = screen.getByRole("menuitemcheckbox", { name: "Show guide threads" })
    expect(guides).toHaveAttribute("aria-checked", "true")
    expect(guides.querySelector('.sadu-menu__eye[data-state="on"]')).not.toBeNull()
    await user.click(guides)
    expect(onGuides).toHaveBeenLastCalledWith(false, expect.anything())
    expect(guides).toHaveAttribute("aria-checked", "false")
    expect(guides.querySelector(".sadu-menu__eye")).toBeNull()
    expect(screen.getByRole("menu")).toBeInTheDocument()
  })

  test("ArrowRight enters the submenu, a radio choice reports, Escape closes one level", async () => {
    const user = userEvent.setup()
    const onDye = vi.fn()
    render(<BandMenu onDye={onDye} />)
    screen.getByRole("button", { name: "Band actions" }).focus()
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}")
    const dye = screen.getByRole("menuitem", { name: "Dye" })
    expect(dye).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    const menus = await screen.findAllByRole("menu")
    expect(menus).toHaveLength(2)
    expect(screen.getByRole("menuitemradio", { name: "Madder" })).toHaveFocus()
    expect(screen.getByRole("menuitemradio", { name: "Madder" }).querySelector(".sadu-menu__eye")).not.toBeNull()
    expect(screen.getByRole("menuitemradio", { name: "Indigo" }).querySelector(".sadu-menu__eye")).toBeNull()
    await user.keyboard("{ArrowDown}{Enter}")
    expect(onDye).toHaveBeenLastCalledWith("indigo", expect.anything())
    expect(screen.getByRole("menuitemradio", { name: "Indigo" })).toHaveAttribute("aria-checked", "true")
    await user.keyboard("{Escape}")
    expect(screen.getAllByRole("menu")).toHaveLength(1)
    expect(dye).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    await user.keyboard("{ArrowLeft}")
    expect(screen.getAllByRole("menu")).toHaveLength(1)
    expect(dye).toHaveFocus()
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Band actions" })).toHaveFocus()
  })

  test("names the trigger and the items from their text, and shows the shortcut", async () => {
    const user = userEvent.setup()
    render(<BandMenu />)
    await user.click(screen.getByRole("button", { name: "Band actions" }))
    const duplicate = screen.getByRole("menuitem", { name: /Duplicate band/ })
    expect(duplicate).toHaveAttribute("aria-keyshortcuts")
    const shortcuts = duplicate.querySelectorAll('[data-slot="menu-shortcut"]')
    expect(shortcuts).toHaveLength(1)
    expect(shortcuts[0]?.textContent).toMatch(/D/)
    expect(screen.getByRole("separator")).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Remove band" })).toHaveAttribute("data-destructive")
  })
})

describe("SaduMenubar", () => {
  test("arrow keys move between menus and open the next one", async () => {
    const user = userEvent.setup()
    render(
      <SaduMenubar aria-label="Weaving studio">
        <SaduMenu>
          <SaduMenubarTrigger>Loom</SaduMenubarTrigger>
          <SaduMenuContent>
            <SaduMenuItem value="new">New band</SaduMenuItem>
          </SaduMenuContent>
        </SaduMenu>
        <SaduMenu>
          <SaduMenubarTrigger>Wool</SaduMenubarTrigger>
          <SaduMenuContent>
            <SaduMenuItem value="lot">Dye lot</SaduMenuItem>
          </SaduMenuContent>
        </SaduMenu>
      </SaduMenubar>,
    )
    const bar = screen.getByRole("menubar", { name: "Weaving studio" })
    await user.tab()
    const loom = within(bar).getByRole("menuitem", { name: "Loom" })
    expect(loom).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(within(bar).getByRole("menuitem", { name: "Wool" })).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(await screen.findByRole("menuitem", { name: "Dye lot" })).toHaveFocus()
    await user.keyboard("{ArrowLeft}")
    expect(await screen.findByRole("menuitem", { name: "New band" })).toHaveFocus()
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    expect(bar).toContainElement(document.activeElement as HTMLElement)
  })
})

describe("SaduNavigationMenu", () => {
  test("opens a panel, switches panels, and Escape returns to the trigger", async () => {
    const user = userEvent.setup()
    render(
      <SaduNavigationMenu aria-label="Sadu House">
        <SaduNavigationMenuList>
          <SaduNavigationMenuItem value="motifs">
            <SaduNavigationMenuTrigger>Motifs</SaduNavigationMenuTrigger>
            <SaduNavigationMenuContent>
              <SaduNavigationMenuLink href="#ain" title="Ain" description="The eye" current />
            </SaduNavigationMenuContent>
          </SaduNavigationMenuItem>
          <SaduNavigationMenuItem value="pieces">
            <SaduNavigationMenuTrigger>Pieces</SaduNavigationMenuTrigger>
            <SaduNavigationMenuContent>
              <SaduNavigationMenuLink href="#rug" title="Rug" />
            </SaduNavigationMenuContent>
          </SaduNavigationMenuItem>
          <SaduNavigationMenuItem>
            <SaduNavigationMenuTopLink href="#visit">Visit</SaduNavigationMenuTopLink>
          </SaduNavigationMenuItem>
        </SaduNavigationMenuList>
      </SaduNavigationMenu>,
    )
    const nav = screen.getByRole("navigation", { name: "Sadu House" })
    const motifs = within(nav).getByRole("button", { name: "Motifs" })
    await user.click(motifs)
    expect(motifs).toHaveAttribute("aria-expanded", "true")
    const ain = screen.getByRole("link", { name: /Ain/ })
    expect(ain).toHaveAttribute("aria-current", "page")
    await user.click(within(nav).getByRole("button", { name: "Pieces" }))
    expect(motifs).toHaveAttribute("aria-expanded", "false")
    expect(screen.getByRole("link", { name: /Rug/ })).toBeInTheDocument()
    within(nav).getByRole("button", { name: "Pieces" }).focus()
    await user.keyboard("{Escape}")
    expect(within(nav).getByRole("button", { name: "Pieces" })).toHaveAttribute("aria-expanded", "false")
    expect(within(nav).getByRole("link", { name: "Visit" })).toHaveAttribute("href", "#visit")
  })
})

describe("SaduCommand", () => {
  function Palette(props: { onAction?: (value: string) => void }): ReactElement {
    return (
      <SaduCommand onAction={props.onAction}>
        <SaduCommandInput aria-label="Search the loom" />
        <SaduCommandEmpty />
        <SaduCommandList>
          <SaduCommandGroup>
            <SaduCommandGroupLabel>Loom</SaduCommandGroupLabel>
            <SaduCommandItem value="new-band" label="New band" shortcut="mod+n" />
            <SaduCommandItem value="mirror" label="Mirror pattern" />
          </SaduCommandGroup>
          <SaduCommandGroup>
            <SaduCommandGroupLabel>Wool</SaduCommandGroupLabel>
            <SaduCommandItem value="madder" label="Madder skeins" />
          </SaduCommandGroup>
        </SaduCommandList>
      </SaduCommand>
    )
  }

  test("filters, highlights the best match and runs it with Enter", async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(<Palette onAction={onAction} />)
    const input = screen.getByRole("combobox", { name: "Search the loom" })
    await user.type(input, "mad")
    expect(screen.queryByRole("option", { name: /New band/ })).not.toBeInTheDocument()
    const madder = screen.getByRole("option", { name: /Madder skeins/ })
    expect(madder).toHaveAttribute("data-highlighted")
    await user.keyboard("{Enter}")
    expect(onAction).toHaveBeenCalledWith("madder", expect.anything())
  })

  test("stitches every matched letter, including repeated ones", async () => {
    const user = userEvent.setup()
    render(<Palette />)
    await user.type(screen.getByRole("combobox", { name: "Search the loom" }), "madd")
    const option = screen.getByRole("option", { name: /Madder skeins/ })
    const stitched = [...option.querySelectorAll("mark.sadu-stitch")].map((mark) => mark.textContent).join("")
    expect(stitched).toBe("Madd")
    expect(option.querySelector(".sadu-command__text")).toHaveTextContent("Madder skeins")
  })

  test("shows the empty warp with the query, and keycaps for shortcuts", async () => {
    const user = userEvent.setup()
    render(<Palette />)
    const keys = [...document.querySelectorAll(".sadu-kbd__key")].map((key) => key.textContent)
    expect(keys.length).toBeGreaterThanOrEqual(2)
    expect(keys.every((key) => key && key.trim() !== "")).toBe(true)
    await user.type(screen.getByRole("combobox", { name: "Search the loom" }), "zqx")
    expect(screen.getByText("Nothing woven under “zqx”.")).toBeVisible()
    expect(screen.queryAllByRole("option")).toHaveLength(0)
  })
})

describe("controlled popups", () => {
  test("a controlled menu opens and closes from its open prop", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    function Controlled(): ReactElement {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open from outside
          </button>
          <SaduMenu
            open={open}
            onOpenChange={(next) => {
              onOpenChange(next)
              setOpen(next)
            }}
          >
            <SaduMenuTrigger>Band actions</SaduMenuTrigger>
            <SaduMenuContent>
              <SaduMenuItem value="mirror">Mirror</SaduMenuItem>
            </SaduMenuContent>
          </SaduMenu>
        </>
      )
    }
    render(<Controlled />)
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Open from outside" }))
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    expect(screen.getByRole("menu").querySelector(".sadu-cord")).not.toBeNull()
    await user.keyboard("{Escape}")
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  test("a controlled command query filters and reports", async () => {
    const user = userEvent.setup()
    const onQueryChange = vi.fn()
    function Controlled(): ReactElement {
      const [query, setQuery] = useState("mir")
      return (
        <SaduCommand
          query={query}
          onQueryChange={(next) => {
            onQueryChange(next)
            setQuery(next)
          }}
        >
          <SaduCommandInput aria-label="Search the loom" />
          <SaduCommandList>
            <SaduCommandItem value="mirror" label="Mirror pattern" />
            <SaduCommandItem value="new" label="New band" />
          </SaduCommandList>
        </SaduCommand>
      )
    }
    render(<Controlled />)
    expect(screen.getAllByRole("option")).toHaveLength(1)
    await user.type(screen.getByRole("combobox", { name: "Search the loom" }), "x")
    expect(onQueryChange).toHaveBeenLastCalledWith("mirx")
  })
})

describe("SaduNote", () => {
  test("renders motif tokens as woven chips and weaver tokens with an avatar", () => {
    render(
      <SaduNote
        defaultValue={[
          "Ask ",
          { type: "weaver", value: "hessa", label: "Hessa" },
          " to warp the loom for ",
          { type: "motif", value: "uwairjan", label: "Uwairjan" },
          ".",
        ]}
      >
        <SaduNoteEditor aria-label="Note for the weaver" />
        <SaduTriggerMenu triggers={[{ char: "#", type: "motif", items: ["uwairjan"] }]}>
          <SaduTriggerMenuContent>
            <SaduTriggerMenuList />
          </SaduTriggerMenuContent>
        </SaduTriggerMenu>
      </SaduNote>,
    )
    const editor = screen.getByRole("textbox", { name: "Note for the weaver" })
    const motif = editor.querySelector('.sadu-note__token[data-kind="motif"] .sadu-chip')
    expect(motif).toHaveTextContent("Uwairjan")
    expect(motif?.querySelector('.sadu-swatch[data-size="sm"]')).not.toBeNull()
    const weaver = editor.querySelector('.sadu-note__token[data-kind="weaver"] .sadu-chip')
    expect(weaver).toHaveTextContent("Hessa")
    const avatar = weaver?.querySelector(".sadu-avatar")
    expect(avatar).toHaveAttribute("aria-hidden", "true")
  })
})

describe("specimens", () => {
  const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]"

  test("the menu specimen draws the open menu with no roles and nothing focusable", () => {
    const { container } = render(
      <SaduMenuSpecimen
        items={[
          { label: "Duplicate band", shortcut: "mod+d", highlighted: true },
          { label: "Show guide threads", checked: true },
          { label: "Show row numbers", checked: false },
          { label: "", separator: true },
          { label: "Remove band", destructive: true },
        ]}
      />,
    )
    const surface = container.querySelector(".sadu-popup.sadu-menu__content")
    expect(surface).not.toBeNull()
    expect(surface?.querySelector(".sadu-cord")).not.toBeNull()
    expect(container.querySelectorAll(".sadu-menu__item")).toHaveLength(4)
    expect(container.querySelector(".sadu-menu__item[data-highlighted]")).toHaveTextContent("Duplicate band")
    expect(container.querySelector(".sadu-menu__item[data-checked] .sadu-menu__eye")).not.toBeNull()
    expect(container.querySelector(".sadu-menu__item[data-destructive]")).toHaveTextContent("Remove band")
    expect(container.querySelectorAll(".sadu-kbd__key").length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByRole("menu")).toBeNull()
    expect(screen.queryAllByRole("menuitem")).toHaveLength(0)
    expect(container.querySelectorAll(FOCUSABLE)).toHaveLength(0)
  })

  test("the navigation specimen draws one open section with no links or buttons", () => {
    const { container } = render(
      <SaduNavigationMenuSpecimen sections={["Motifs", "Materials", "Pieces"]} open="Motifs">
        <SaduNavigationMenuSpecimenLink title="Ain" description="The eye" current />
        <SaduNavigationMenuSpecimenLink title="Uwairjan" description="Facing triangles" />
      </SaduNavigationMenuSpecimen>,
    )
    expect(container.querySelector(".sadu-nav__trigger[data-open]")).toHaveTextContent("Motifs")
    expect(container.querySelector(".sadu-popup .sadu-cord")).not.toBeNull()
    expect(container.querySelector(".sadu-nav__eye")).not.toBeNull()
    expect(container.querySelectorAll(".sadu-nav__link")).toHaveLength(2)
    expect(container.querySelector(".sadu-nav__link[data-current]")).toHaveTextContent("Ain")
    expect(screen.queryAllByRole("link")).toHaveLength(0)
    expect(screen.queryAllByRole("button")).toHaveLength(0)
    expect(container.querySelectorAll(FOCUSABLE)).toHaveLength(0)
  })
})

describe("design pass behaviour", () => {
  test("a prefix match outranks a scattered one and is the highlighted command", async () => {
    const user = userEvent.setup()
    render(
      <SaduCommand>
        <SaduCommandInput aria-label="Search the loom" />
        <SaduCommandList>
          <SaduCommandItem value="order-14" label="Order 14, majlis divider" />
          <SaduCommandItem value="madder" label="Madder skeins" />
        </SaduCommandList>
      </SaduCommand>,
    )
    await user.type(screen.getByRole("combobox", { name: "Search the loom" }), "mad")
    expect(screen.getByRole("option", { name: "Madder skeins" })).toHaveAttribute("data-highlighted")
    const scatteredMarks = [...screen.getByRole("option", { name: "Order 14, majlis divider" }).querySelectorAll("mark")]
    expect(scatteredMarks.map((mark) => mark.textContent).join("")).toBe("mad")
  })

  test("a weaving button shows the pending look and reports busy without an action", () => {
    render(<SaduButton weaving>Send to loom</SaduButton>)
    const button = screen.getByRole("button", { name: "Send to loom" })
    expect(button).toHaveAttribute("data-weaving")
    expect(button).toHaveAttribute("aria-busy", "true")
  })

  test("the menu trigger is a secondary SaduButton and shortcuts use Kbd", async () => {
    const user = userEvent.setup()
    render(<BandMenu />)
    const trigger = screen.getByRole("button", { name: "Band actions" })
    expect(trigger).toHaveClass("sadu-button", "sadu-menu__trigger")
    expect(trigger).toHaveAttribute("data-variant", "secondary")
    await user.click(trigger)
    const duplicate = screen.getByRole("menuitem", { name: /Duplicate band/ })
    expect(duplicate.querySelector(".sadu-kbd")).not.toBeNull()
    expect(duplicate).toHaveAttribute("aria-keyshortcuts")
  })
})
