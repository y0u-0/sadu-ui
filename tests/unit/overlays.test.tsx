import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createToaster } from "@ui-sdk/react/toast"
import { useState, type ReactElement } from "react"
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from "vitest"
import { SaduAccordion, SaduAccordionItem, SaduAccordionPanel, SaduAccordionTrigger } from "../../src/sadu/sadu-accordion"
import {
  SaduAlertDialog,
  SaduAlertDialogClose,
  SaduAlertDialogContent,
  SaduAlertDialogDescription,
  SaduAlertDialogFooter,
  SaduAlertDialogTitle,
  SaduAlertDialogSpecimen,
  SaduAlertDialogTrigger,
} from "../../src/sadu/sadu-alert-dialog"
import { SaduCollapsible, SaduCollapsiblePanel, SaduCollapsibleTrigger } from "../../src/sadu/sadu-collapsible"
import {
  SaduDialog,
  SaduDialogClose,
  SaduDialogContent,
  SaduDialogDescription,
  SaduDialogDismiss,
  SaduDialogFooter,
  SaduDialogHeader,
  SaduDialogSpecimen,
  SaduDialogTitle,
  SaduDialogTrigger,
} from "../../src/sadu/sadu-dialog"
import {
  SaduDrawer,
  SaduDrawerClose,
  SaduDrawerContent,
  SaduDrawerDescription,
  SaduDrawerDismiss,
  SaduDrawerHeader,
  SaduDrawerSpecimen,
  SaduDrawerTitle,
  SaduDrawerTrigger,
} from "../../src/sadu/sadu-drawer"
import {
  MotifPreview,
  SaduHoverCard,
  SaduHoverCardContent,
  SaduHoverCardSpecimen,
  SaduHoverCardTrigger,
} from "../../src/sadu/sadu-hover-card"
import {
  SaduPopover,
  SaduPopoverClose,
  SaduPopoverContent,
  SaduPopoverDescription,
  SaduPopoverSpecimen,
  SaduPopoverTitle,
  SaduPopoverTrigger,
} from "../../src/sadu/sadu-popover"
import { SaduPreferences, createSaduPreferences } from "../../src/sadu/sadu-preferences"
import { SaduToastRegion, SaduToastSpecimen } from "../../src/sadu/sadu-toast"
import { SaduTooltip, SaduTooltipContent, SaduTooltipShortcut, SaduTooltipSpecimen, SaduTooltipTrigger } from "../../src/sadu/sadu-tooltip"

if (typeof CSS.supports !== "function") {
  Object.defineProperty(CSS, "supports", { value: () => false })
}

if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    value: (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  })
}

let consoleError: MockInstance
let consoleWarn: MockInstance

beforeEach(() => {
  consoleError = vi.spyOn(console, "error")
  consoleWarn = vi.spyOn(console, "warn")
})

function realMessages(spy: MockInstance): unknown[][] {
  return spy.mock.calls.filter((call) => !String(call[0]).includes("Could not parse CSS stylesheet"))
}

afterEach(() => {
  expect(realMessages(consoleError)).toEqual([])
  expect(realMessages(consoleWarn)).toEqual([])
  vi.restoreAllMocks()
})

type DialogDemoProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: { returnValue?: unknown }) => void
  onSave?: () => void
}

function DialogDemo({ open, defaultOpen, onOpenChange, onSave }: DialogDemoProps): ReactElement {
  return (
    <SaduDialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <SaduDialogTrigger>Edit main band</SaduDialogTrigger>
      <SaduDialogContent motif="uwairjan">
        <SaduDialogHeader>
          <div>
            <SaduDialogTitle>Edit main band</SaduDialogTitle>
            <SaduDialogDescription>Order 14, the majlis divider.</SaduDialogDescription>
          </div>
          <SaduDialogDismiss />
        </SaduDialogHeader>
        <SaduDialogFooter>
          <SaduDialogClose>Cancel</SaduDialogClose>
          <SaduDialogClose variant="primary" value="save" action={onSave}>
            Save
          </SaduDialogClose>
        </SaduDialogFooter>
      </SaduDialogContent>
    </SaduDialog>
  )
}

describe("dialog", () => {
  test("opens from the trigger by mouse, names itself, and closes with Cancel", async () => {
    const user = userEvent.setup()
    render(<DialogDemo />)
    const trigger = screen.getByRole("button", { name: "Edit main band" })
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog")
    await user.click(trigger)
    const dialog = screen.getByRole("dialog", { name: "Edit main band" })
    expect(dialog).toHaveAccessibleDescription("Order 14, the majlis divider.")
    expect(dialog.querySelector(".sadu-dialog__flap")).toHaveAttribute("aria-hidden", "true")
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  test("opens with Enter, closes with Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup()
    render(<DialogDemo />)
    const trigger = screen.getByRole("button", { name: "Edit main band" })
    trigger.focus()
    await user.keyboard("{Enter}")
    const dialog = screen.getByRole("dialog")
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  test("opens with Space and the dismiss button closes it", async () => {
    const user = userEvent.setup()
    render(<DialogDemo />)
    screen.getByRole("button", { name: "Edit main band" }).focus()
    await user.keyboard(" ")
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  test("Save runs its action once and reports its return value when controlled", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onOpenChange = vi.fn()
    function Controlled(): ReactElement {
      const [open, setOpen] = useState(false)
      return (
        <DialogDemo
          open={open}
          onSave={onSave}
          onOpenChange={(next, details) => {
            onOpenChange(next, details.returnValue)
            setOpen(next)
          }}
        />
      )
    }
    render(<Controlled />)
    await user.click(screen.getByRole("button", { name: "Edit main band" }))
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenLastCalledWith(true, undefined)
    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(onSave).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(onOpenChange).toHaveBeenCalledTimes(2)
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "save")
  })

  test("starts open with defaultOpen", () => {
    render(<DialogDemo defaultOpen />)
    expect(screen.getByRole("dialog", { name: "Edit main band" })).toBeInTheDocument()
  })
})

function AlertDemo({
  onConfirm,
  onOpenChange,
}: {
  onConfirm?: () => void
  onOpenChange?: (open: boolean, value: unknown) => void
}): ReactElement {
  return (
    <SaduAlertDialog onOpenChange={(open, details) => onOpenChange?.(open, details.returnValue)}>
      <SaduAlertDialogTrigger>Unravel band</SaduAlertDialogTrigger>
      <SaduAlertDialogContent>
        <SaduAlertDialogTitle>Unravel this band?</SaduAlertDialogTitle>
        <SaduAlertDialogDescription>The weft cannot be saved.</SaduAlertDialogDescription>
        <SaduAlertDialogFooter>
          <SaduAlertDialogClose>Keep weaving</SaduAlertDialogClose>
          <SaduAlertDialogClose variant="primary" value="confirm" action={onConfirm}>
            Unravel band
          </SaduAlertDialogClose>
        </SaduAlertDialogFooter>
      </SaduAlertDialogContent>
    </SaduAlertDialog>
  )
}

describe("alert dialog", () => {
  test("starts on Cancel, names itself, and Cancel closes without confirming", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(<AlertDemo onConfirm={onConfirm} onOpenChange={onOpenChange} />)
    const trigger = screen.getByRole("button", { name: "Unravel band" })
    trigger.focus()
    await user.keyboard("{Enter}")
    const dialog = screen.getByRole("alertdialog", { name: "Unravel this band?" })
    expect(dialog).toHaveAccessibleDescription("The weft cannot be saved.")
    expect(dialog).toHaveAttribute("data-tone", "danger")
    expect(within(dialog).getByRole("button", { name: "Keep weaving" })).toHaveFocus()
    await user.keyboard("{Enter}")
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenLastCalledWith(false, undefined)
    expect(trigger).toHaveFocus()
  })

  test("confirming runs the action once and reports confirm", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(<AlertDemo onConfirm={onConfirm} onOpenChange={onOpenChange} />)
    await user.click(screen.getByRole("button", { name: "Unravel band" }))
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Unravel band" }))
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "confirm")
  })

  test("Tab stays inside the question", async () => {
    const user = userEvent.setup()
    render(<AlertDemo />)
    await user.click(screen.getByRole("button", { name: "Unravel band" }))
    const dialog = screen.getByRole("alertdialog")
    await user.tab()
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    await user.tab()
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    await user.tab({ shift: true })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
  })
})

function DrawerDemo({ onOpenChange }: { onOpenChange?: (open: boolean) => void }): ReactElement {
  return (
    <SaduDrawer onOpenChange={onOpenChange}>
      <SaduDrawerTrigger>Open order 14</SaduDrawerTrigger>
      <SaduDrawerContent>
        <SaduDrawerHeader>
          <div>
            <SaduDrawerTitle>Order 14</SaduDrawerTitle>
            <SaduDrawerDescription>Majlis divider for Noura Al-Sabah.</SaduDrawerDescription>
          </div>
          <SaduDrawerDismiss />
        </SaduDrawerHeader>
        <SaduDrawerClose>Close order</SaduDrawerClose>
      </SaduDrawerContent>
    </SaduDrawer>
  )
}

describe("drawer", () => {
  test("opens, names itself, hides its decoration, and closes from each close part", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<DrawerDemo onOpenChange={onOpenChange} />)
    const trigger = screen.getByRole("button", { name: "Open order 14" })
    await user.click(trigger)
    const drawer = screen.getByRole("dialog", { name: "Order 14" })
    expect(drawer).toHaveAccessibleDescription("Majlis divider for Noura Al-Sabah.")
    expect(drawer.querySelector(".sadu-drawer__roll")).toHaveAttribute("aria-hidden", "true")
    expect(drawer.querySelector(".sadu-drawer__grip")).toHaveAttribute("aria-hidden", "true")
    expect(drawer).toHaveAttribute("data-edge", "band")
    await user.click(within(drawer).getByRole("button", { name: "Close" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(onOpenChange.mock.calls).toEqual([
      [true, expect.anything()],
      [false, expect.anything()],
    ])
    await user.click(trigger)
    await user.click(screen.getByRole("button", { name: "Close order" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  test("Escape closes it and focus returns", async () => {
    const user = userEvent.setup()
    render(<DrawerDemo />)
    const trigger = screen.getByRole("button", { name: "Open order 14" })
    trigger.focus()
    await user.keyboard("{Enter}")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  test("comes from the end edge by default", async () => {
    const user = userEvent.setup()
    render(<DrawerDemo />)
    await user.click(screen.getByRole("button", { name: "Open order 14" }))
    expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "right")
  })
})

function PopoverDemo({ open, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void }): ReactElement {
  return (
    <SaduPopover open={open} onOpenChange={onOpenChange}>
      <SaduPopoverTrigger>Band width</SaduPopoverTrigger>
      <SaduPopoverContent>
        <SaduPopoverTitle>Band width</SaduPopoverTitle>
        <SaduPopoverDescription>Rows across the main band.</SaduPopoverDescription>
        <SaduPopoverClose>Done</SaduPopoverClose>
      </SaduPopoverContent>
    </SaduPopover>
  )
}

describe("popover", () => {
  test("opens by click and keyboard, carries its arrow and cord, closes with Done and Escape", async () => {
    const user = userEvent.setup()
    render(<PopoverDemo />)
    const trigger = screen.getByRole("button", { name: "Band width" })
    await user.click(trigger)
    const popover = screen.getByRole("dialog", { name: "Band width" })
    expect(popover).toHaveAccessibleDescription("Rows across the main band.")
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(popover.querySelector("[data-slot='popover-arrow'].sadu-popup__arrow .sadu-popup__arrow-cloth")).toBeInTheDocument()
    expect(popover).toHaveAttribute("data-edge", "cord")
    expect(popover.querySelector(".sadu-cord")).toHaveAttribute("aria-hidden", "true")
    await user.click(within(popover).getByRole("button", { name: "Done" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  test("follows a controlled open prop and reports each change once", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { rerender } = render(<PopoverDemo open={false} onOpenChange={onOpenChange} />)
    await user.click(screen.getByRole("button", { name: "Band width" }))
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenLastCalledWith(true, expect.anything())
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    rerender(<PopoverDemo open onOpenChange={onOpenChange} />)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})

describe("hover card", () => {
  test("the trigger stays a link and the preview names the motif in both scripts", () => {
    render(
      <SaduHoverCard defaultOpen>
        <SaduHoverCardTrigger href="#motif-uwairjan">Uwairjan</SaduHoverCardTrigger>
        <SaduHoverCardContent>
          <MotifPreview motif="uwairjan" meaning="Facing triangles." />
        </SaduHoverCardContent>
      </SaduHoverCard>,
    )
    expect(screen.getByRole("link", { name: "Uwairjan" })).toHaveAttribute("href", "#motif-uwairjan")
    const arabic = screen.getByText("عويرجان")
    expect(arabic).toHaveAttribute("lang", "ar")
    expect(arabic).toHaveAttribute("dir", "rtl")
    expect(screen.getByText("Facing triangles.")).toBeInTheDocument()
    expect(document.querySelector(".sadu-hover-card__strip")).toHaveAttribute("aria-hidden", "true")
  })

  test("its content is phrasing, so a card can live inside a paragraph", () => {
    render(
      <p>
        Hessa frames the band with{" "}
        <SaduHoverCard defaultOpen>
          <SaduHoverCardTrigger href="#motif-uwairjan">Uwairjan</SaduHoverCardTrigger>
          <SaduHoverCardContent>
            <MotifPreview motif="uwairjan" meaning="Facing triangles." />
          </SaduHoverCardContent>
        </SaduHoverCard>
        .
      </p>,
    )
    const card = document.querySelector("[data-slot='hover-card-content']")
    expect(card?.tagName).toBe("SPAN")
    expect(card?.querySelectorAll("div, p")).toHaveLength(0)
  })

  test("opens on keyboard focus after its delay and closes with Escape", async () => {
    const user = userEvent.setup()
    render(
      <SaduHoverCard delay={0}>
        <SaduHoverCardTrigger href="#motif-dhurs">Dhurus al-khail</SaduHoverCardTrigger>
        <SaduHoverCardContent>
          <MotifPreview motif="dhurs" meaning="Horse teeth." />
        </SaduHoverCardContent>
      </SaduHoverCard>,
    )
    await user.tab()
    expect(screen.getByRole("link", { name: "Dhurus al-khail" })).toHaveFocus()
    await waitFor(() => expect(screen.getByText("Horse teeth.")).toBeInTheDocument())
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByText("Horse teeth.")).not.toBeInTheDocument())
  })
})

describe("tooltip", () => {
  test("names an icon-only trigger, shows its shortcut, and opens on focus", async () => {
    const user = userEvent.setup()
    render(
      <SaduTooltip shortcut="mod+z">
        <SaduTooltipTrigger variant="ghost" size="icon">
          <svg aria-hidden="true" />
        </SaduTooltipTrigger>
        <SaduTooltipContent>
          Undo last pick
          <SaduTooltipShortcut />
        </SaduTooltipContent>
      </SaduTooltip>,
    )
    const trigger = await screen.findByRole("button", { name: "Undo last pick" })
    expect(trigger).toHaveAttribute("aria-keyshortcuts")
    await user.tab()
    expect(trigger).toHaveFocus()
    const tip = await screen.findByRole("tooltip")
    expect(tip).toHaveAttribute("data-open")
    expect(tip.querySelector(".sadu-tooltip__cord")).toBeInTheDocument()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.getByRole("tooltip", { hidden: true })).not.toHaveAttribute("data-open"))
    expect(trigger).toHaveFocus()
  })
})

describe("toast", () => {
  test("shows each kind with its mark and timer, and dismisses from the close button", async () => {
    const user = userEvent.setup()
    const toaster = createToaster()
    render(<SaduToastRegion toaster={toaster} />)
    act(() => {
      toaster.success("Dye lot recorded", { description: "Madder, 3 skeins.", duration: 60_000 })
    })
    const region = screen.getByRole("region", { name: "Notifications" })
    const success = within(region).getByText("Dye lot recorded").closest("[data-slot='toast']") as HTMLElement
    expect(success).toHaveAttribute("data-type", "success")
    expect(within(success).getByText("Madder, 3 skeins.")).toBeInTheDocument()
    expect(success.querySelector(".sadu-eye-mark")).toBeInTheDocument()
    const timer = success.querySelector(".sadu-toast__timer") as HTMLElement
    expect(timer).toHaveAttribute("data-timed")
    expect(timer.style.getPropertyValue("--sadu-toast-duration")).toBe("60000ms")
    expect(success.querySelector(".sadu-toast__beater")).toBeInTheDocument()

    act(() => {
      toaster.error("Loom not reached", { duration: Infinity })
    })
    const error = within(region).getByText("Loom not reached").closest("[data-slot='toast']") as HTMLElement
    expect(error).toHaveAttribute("data-type", "error")
    const errorTimer = error.querySelector(".sadu-toast__timer") as HTMLElement
    expect(errorTimer).toHaveAttribute("data-frayed")
    expect(errorTimer).not.toHaveAttribute("data-timed")
    expect(error.querySelector(".sadu-toast__frayed")).toBeInTheDocument()

    await user.click(within(error).getByRole("button", { name: "Dismiss" }))
    await waitFor(() => expect(within(region).queryByText("Loom not reached")).not.toBeInTheDocument())
    expect(within(region).getByText("Dye lot recorded")).toBeInTheDocument()
    act(() => {
      toaster.dismiss()
    })
  })

  test("runs an action once and restarts the timer when a toast is updated", async () => {
    const user = userEvent.setup()
    const toaster = createToaster()
    const onAction = vi.fn()
    render(<SaduToastRegion toaster={toaster} />)
    let id = ""
    act(() => {
      id = toaster("Dye lot recorded", { duration: 60_000, action: { label: "Undo", onAction } })
    })
    const before = document.querySelector(".sadu-toast__timer")
    act(() => {
      toaster.update(id, { description: "Madder, 4 skeins." })
    })
    expect(document.querySelector(".sadu-toast__timer")).not.toBe(before)
    await user.click(screen.getByRole("button", { name: "Undo" }))
    expect(onAction).toHaveBeenCalledTimes(1)
    act(() => {
      toaster.dismiss()
    })
  })

  test("marks the region away while the window is blurred", () => {
    const toaster = createToaster()
    render(<SaduToastRegion toaster={toaster} />)
    act(() => {
      toaster("Dye lot recorded", { duration: 60_000 })
    })
    const region = screen.getByRole("region", { name: "Notifications" })
    expect(region).not.toHaveAttribute("data-away")
    act(() => {
      window.dispatchEvent(new Event("blur"))
    })
    expect(region).toHaveAttribute("data-away")
    act(() => {
      window.dispatchEvent(new Event("focus"))
    })
    expect(region).not.toHaveAttribute("data-away")
    act(() => {
      toaster.dismiss()
    })
  })
})

describe("preferences", () => {
  test("each control writes its attribute, Reset restores them, and direction flips the panel", async () => {
    const user = userEvent.setup()
    const preferences = createSaduPreferences()
    render(<SaduPreferences preferences={preferences} title="Display" />)
    const panel = screen.getByRole("region", { name: "Display" })
    const host = panel.parentElement as HTMLElement
    expect(host).toHaveAttribute("data-theme", "system")
    expect(screen.getByRole("img", { name: /Sampler/ })).toBeInTheDocument()

    await user.click(screen.getByRole("radio", { name: "Tent" }))
    expect(host).toHaveAttribute("data-theme", "tent")
    await user.click(screen.getByRole("radio", { name: "Reduced" }))
    expect(host).toHaveAttribute("data-motion", "reduced")
    await user.click(screen.getByRole("radio", { name: "More" }))
    expect(host).toHaveAttribute("data-contrast", "more")
    await user.click(screen.getByRole("radio", { name: "Indigo" }))
    expect(host).toHaveAttribute("data-dye", "indigo")
    await user.click(screen.getByRole("radio", { name: "Right to left" }))
    expect(panel).toHaveAttribute("dir", "rtl")

    await user.click(screen.getByRole("button", { name: "Reset" }))
    expect(host).toHaveAttribute("data-theme", "system")
    expect(host).toHaveAttribute("data-motion", "full")
    expect(host).toHaveAttribute("data-contrast", "standard")
    expect(host).toHaveAttribute("data-dye", "madder")
    expect(panel).toHaveAttribute("dir", "ltr")
  })

  test("every segmented row is named by its label and described by its line", () => {
    render(<SaduPreferences preferences={createSaduPreferences()} />)
    for (const name of ["Theme", "Motion", "Contrast", "Direction"]) {
      expect(screen.getByRole("radiogroup", { name })).toHaveAccessibleDescription()
    }
    expect(screen.getByRole("radiogroup", { name: "Dye" })).toBeInTheDocument()
  })
})

describe("collapsible", () => {
  test("toggles by mouse and keyboard, swaps its eye, and reports each change once", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <SaduCollapsible onOpenChange={onOpenChange}>
        <SaduCollapsibleTrigger>Wedding tent divider</SaduCollapsibleTrigger>
        <SaduCollapsiblePanel motif="uwairjan">Spring 2024</SaduCollapsiblePanel>
      </SaduCollapsible>,
    )
    const trigger = screen.getByRole("button", { name: "Wedding tent divider" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(trigger.querySelector(".sadu-eye-mark")).toHaveAttribute("data-state", "closed")
    await user.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(trigger.querySelector(".sadu-eye-mark")).toHaveAttribute("data-state", "on")
    expect(screen.getByText("Spring 2024")).toBeVisible()
    expect(document.querySelector(".sadu-collapsible__band")).toHaveAttribute("aria-hidden", "true")
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenLastCalledWith(true, expect.anything())
    await user.keyboard("{Enter}")
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    await user.keyboard(" ")
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(onOpenChange).toHaveBeenCalledTimes(3)
  })

  test("a disabled collapsible stays focusable, does not open, and shows a dashed thread", async () => {
    const user = userEvent.setup()
    render(
      <SaduCollapsible disabled>
        <SaduCollapsibleTrigger>Finishing</SaduCollapsibleTrigger>
        <SaduCollapsiblePanel>Bind both edges.</SaduCollapsiblePanel>
      </SaduCollapsible>,
    )
    const trigger = screen.getByRole("button", { name: "Finishing" })
    await user.tab()
    expect(trigger).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(document.querySelector(".sadu-collapsible__thread")).toHaveAttribute("data-dashed")
    expect(document.querySelector(".sadu-collapsible__edge")).not.toBeInTheDocument()
  })

  test("follows a controlled open prop", () => {
    const { rerender } = render(
      <SaduCollapsible open={false}>
        <SaduCollapsibleTrigger>Dye notes</SaduCollapsibleTrigger>
        <SaduCollapsiblePanel>Madder root.</SaduCollapsiblePanel>
      </SaduCollapsible>,
    )
    expect(screen.queryByText("Madder root.")).not.toBeInTheDocument()
    rerender(
      <SaduCollapsible open>
        <SaduCollapsibleTrigger>Dye notes</SaduCollapsibleTrigger>
        <SaduCollapsiblePanel>Madder root.</SaduCollapsiblePanel>
      </SaduCollapsible>,
    )
    expect(screen.getByText("Madder root.")).toBeInTheDocument()
  })
})

function AccordionDemo({ multiple, onValueChange }: { multiple?: boolean; onValueChange?: (value: string[]) => void }): ReactElement {
  return (
    <SaduAccordion defaultValue={["dye"]} multiple={multiple} onValueChange={(value) => onValueChange?.(value)}>
      {[
        { value: "spin", motif: "hubub", title: "Shearing and spinning" },
        { value: "dye", motif: "eyoun", title: "Dyeing" },
        { value: "warp", motif: "dhalla", title: "Warping the loom" },
      ].map((stage) => (
        <SaduAccordionItem key={stage.value} value={stage.value}>
          <SaduAccordionTrigger motif={stage.motif as "hubub"}>{stage.title}</SaduAccordionTrigger>
          <SaduAccordionPanel>{`${stage.title} notes`}</SaduAccordionPanel>
        </SaduAccordionItem>
      ))}
    </SaduAccordion>
  )
}

describe("accordion", () => {
  test("opens one item at a time and reports the new value once", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<AccordionDemo onValueChange={onValueChange} />)
    const dyeing = screen.getByRole("button", { name: "Dyeing" })
    const warping = screen.getByRole("button", { name: "Warping the loom" })
    expect(dyeing).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("heading", { name: "Dyeing" })).toBeInTheDocument()
    await user.click(warping)
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenLastCalledWith(["warp"])
    expect(warping).toHaveAttribute("aria-expanded", "true")
    expect(dyeing).toHaveAttribute("aria-expanded", "false")
  })

  test("weaves only items the person opens, never the one open on mount", async () => {
    const user = userEvent.setup()
    render(<AccordionDemo />)
    const dyeing = screen.getByRole("button", { name: "Dyeing" })
    const spinning = screen.getByRole("button", { name: "Shearing and spinning" })
    expect(dyeing.querySelector(".sadu-accordion__swatch")).toHaveAttribute("data-still")
    expect(dyeing.querySelector(".sadu-accordion__fold")).toHaveAttribute("data-still")
    await user.click(spinning)
    expect(spinning.querySelector(".sadu-accordion__swatch")).not.toHaveAttribute("data-still")
    expect(dyeing.querySelector(".sadu-accordion__swatch")).not.toHaveAttribute("data-still")
    await user.click(dyeing)
    expect(dyeing.querySelector(".sadu-accordion__swatch")).not.toHaveAttribute("data-still")
  })

  test("Enter and Space toggle from the keyboard and several stay open with multiple", async () => {
    const user = userEvent.setup()
    render(<AccordionDemo multiple />)
    const spinning = screen.getByRole("button", { name: "Shearing and spinning" })
    spinning.focus()
    await user.keyboard("{Enter}")
    expect(spinning).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("button", { name: "Dyeing" })).toHaveAttribute("aria-expanded", "true")
    await user.keyboard(" ")
    expect(spinning).toHaveAttribute("aria-expanded", "false")
  })

  test("every eye and band is decoration", () => {
    render(<AccordionDemo />)
    for (const mark of document.querySelectorAll(".sadu-accordion__eye, .sadu-accordion__swatch, .sadu-accordion__fold")) {
      expect(mark).toHaveAttribute("aria-hidden", "true")
    }
  })
})

describe("specimens", () => {
  const ROLES = ["dialog", "alertdialog", "tooltip", "region"] as const

  function expectStatic(container: HTMLElement): void {
    for (const role of ROLES) expect(within(container).queryAllByRole(role, { hidden: true })).toHaveLength(0)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute("aria-hidden", "true")
    expect(root).toHaveAttribute("inert")
    expect(root).not.toHaveAttribute("popover")
    expect(root).toHaveAttribute("data-specimen")
  }

  test("dialog renders its flap and parts without a dialog", () => {
    const { container } = render(
      <SaduDialogSpecimen motif="eyoun">
        <SaduDialogHeader>
          <div>
            <SaduDialogTitle>Edit main band</SaduDialogTitle>
            <SaduDialogDescription>Order 14.</SaduDialogDescription>
          </div>
          <SaduDialogDismiss />
        </SaduDialogHeader>
        <SaduDialogFooter>
          <SaduDialogClose>Cancel</SaduDialogClose>
          <SaduDialogClose variant="primary">Save</SaduDialogClose>
        </SaduDialogFooter>
      </SaduDialogSpecimen>,
    )
    expectStatic(container)
    expect(container.querySelector(".sadu-dialog .sadu-dialog__flap")).toBeInTheDocument()
    expect(container.querySelector("h2.sadu-overlay-title")).toHaveTextContent("Edit main band")
    expect(container.querySelector("p.sadu-overlay-description")).toHaveTextContent("Order 14.")
    expect(container.querySelectorAll("button")).toHaveLength(3)
  })

  test("alert dialog renders its unravelled band with its tone", () => {
    const { container } = render(
      <SaduAlertDialogSpecimen tone="neutral">
        <SaduAlertDialogTitle>Unravel this band?</SaduAlertDialogTitle>
        <SaduAlertDialogDescription>The weft cannot be saved.</SaduAlertDialogDescription>
        <SaduAlertDialogFooter>
          <SaduAlertDialogClose>Keep weaving</SaduAlertDialogClose>
        </SaduAlertDialogFooter>
      </SaduAlertDialogSpecimen>,
    )
    expectStatic(container)
    expect(container.firstElementChild).toHaveAttribute("data-tone", "neutral")
    expect(container.querySelector(".sadu-alert-dialog__warp")).toBeInTheDocument()
    expect(container).toHaveTextContent("Unravel this band?")
  })

  test("drawer renders its band and grip on the side it is given", () => {
    const { container } = render(
      <SaduDrawerSpecimen side="bottom">
        <SaduDrawerTitle>Order 14</SaduDrawerTitle>
        <SaduDrawerClose>Close</SaduDrawerClose>
      </SaduDrawerSpecimen>,
    )
    expectStatic(container)
    const drawer = container.firstElementChild as HTMLElement
    expect(drawer).toHaveAttribute("data-side", "bottom")
    expect(drawer).toHaveAttribute("data-edge", "band")
    expect(drawer.querySelector(".sadu-drawer__peg.sadu-wood")).toBeInTheDocument()
    expect(drawer.querySelector(".sadu-drawer__roll")).not.toBeInTheDocument()
  })

  test("drawer resolves its end side to the right in left to right", () => {
    const { container } = render(<SaduDrawerSpecimen />)
    expect(container.firstElementChild).toHaveAttribute("data-side", "right")
  })

  test("popover renders its cord and arrow", () => {
    const { container } = render(
      <SaduPopoverSpecimen>
        <SaduPopoverTitle>Band width</SaduPopoverTitle>
        <SaduPopoverDescription>Rows across the main band.</SaduPopoverDescription>
        <SaduPopoverClose>Done</SaduPopoverClose>
      </SaduPopoverSpecimen>,
    )
    expectStatic(container)
    expect(container.querySelector(".sadu-popup[data-edge='cord'] .sadu-cord")).toBeInTheDocument()
    expect(container.querySelector(".sadu-popup__arrow")).toHaveAttribute("data-side", "bottom")
    expect(container).toHaveTextContent("Band width")
  })

  test("tooltip renders its cord and key caps", () => {
    const { container } = render(<SaduTooltipSpecimen shortcut="mod+z">Undo last pick</SaduTooltipSpecimen>)
    expectStatic(container)
    expect(container.querySelector(".sadu-tooltip__cord .sadu-cord")).toBeInTheDocument()
    expect(container.querySelectorAll(".sadu-kbd__key").length).toBeGreaterThan(0)
    expect(container).toHaveTextContent("Undo last pick")
  })

  test("toast freezes its timer at the given progress", () => {
    const { container } = render(
      <SaduToastSpecimen type="success" title="Dye lot recorded" description="Madder, 3 skeins." action="Undo" progress={0.25} />,
    )
    expectStatic(container)
    const timer = container.querySelector(".sadu-toast__timer") as HTMLElement
    expect(timer).toHaveAttribute("data-frozen")
    expect(timer).not.toHaveAttribute("data-timed")
    expect(timer.style.getPropertyValue("--sadu-toast-progress")).toBe("0.25")
    expect(container.querySelector(".sadu-toast__fringe .sadu-fringe")).toBeInTheDocument()
    expect(container.querySelector(".sadu-eye-mark")).toBeInTheDocument()
    expect(container).toHaveTextContent("Undo")
  })

  test("an error toast specimen frays", () => {
    const { container } = render(<SaduToastSpecimen type="error" title="Loom not reached" progress={1.4} />)
    const timer = container.querySelector(".sadu-toast__timer") as HTMLElement
    expect(timer).toHaveAttribute("data-frayed")
    expect(timer.style.getPropertyValue("--sadu-toast-progress")).toBe("1")
  })

  test("hover card renders a motif preview as phrasing content", () => {
    const { container } = render(
      <p>
        <SaduHoverCardSpecimen>
          <MotifPreview motif="uwairjan" meaning="Facing triangles." />
        </SaduHoverCardSpecimen>
      </p>,
    )
    const card = container.querySelector(".sadu-hover-card") as HTMLElement
    expect(card.tagName).toBe("SPAN")
    expect(card).toHaveAttribute("data-specimen")
    expect(card).toHaveTextContent("عويرجان")
  })
})
