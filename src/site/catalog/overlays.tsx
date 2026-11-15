import { toast } from "@ui-sdk/react/toast"
import { Hammer, Redo2, Undo2 } from "lucide-react"
import { useMemo, useState, type ReactElement } from "react"
import { LoomSlider } from "../../sadu/loom-slider"
import { MotifSelect } from "../../sadu/motif-select"
import { MOTIFS, type MotifId } from "../../sadu/motifs"
import { OverlayDetails } from "../../sadu/overlay-kit"
import { WOOLS, type WoolId } from "../../sadu/palette"
import { mainColors } from "../../sadu/rug"
import { SaduAccordion, SaduAccordionItem, SaduAccordionPanel, SaduAccordionTrigger } from "../../sadu/sadu-accordion"
import {
  SaduAlertDialog,
  SaduAlertDialogClose,
  SaduAlertDialogContent,
  SaduAlertDialogDescription,
  SaduAlertDialogFooter,
  SaduAlertDialogTitle,
  SaduAlertDialogTrigger,
  type AlertTone,
} from "../../sadu/sadu-alert-dialog"
import { SaduButton } from "../../sadu/sadu-button"
import { SaduCollapsible, SaduCollapsiblePanel, SaduCollapsibleTrigger } from "../../sadu/sadu-collapsible"
import {
  SaduDialog,
  SaduDialogClose,
  SaduDialogContent,
  SaduDialogDescription,
  SaduDialogDismiss,
  SaduDialogFooter,
  SaduDialogHeader,
  SaduDialogTitle,
  SaduDialogTrigger,
} from "../../sadu/sadu-dialog"
import {
  SaduDrawer,
  SaduDrawerClose,
  SaduDrawerContent,
  SaduDrawerDescription,
  SaduDrawerDismiss,
  SaduDrawerFooter,
  SaduDrawerHeader,
  SaduDrawerTitle,
  SaduDrawerTrigger,
} from "../../sadu/sadu-drawer"
import { SaduField, SaduFieldLabel } from "../../sadu/sadu-field"
import { MotifPreview, SaduHoverCard, SaduHoverCardContent, SaduHoverCardTrigger } from "../../sadu/sadu-hover-card"
import { SaduNumberInput } from "../../sadu/sadu-number-input"
import {
  SaduPopover,
  SaduPopoverClose,
  SaduPopoverContent,
  SaduPopoverDescription,
  SaduPopoverTitle,
  SaduPopoverTrigger,
} from "../../sadu/sadu-popover"
import { SaduPreferences, createSaduPreferences } from "../../sadu/sadu-preferences"
import { SaduTooltip, SaduTooltipContent, SaduTooltipShortcut, SaduTooltipTrigger } from "../../sadu/sadu-tooltip"
import { SkeinRadio } from "../../sadu/skein-radio"
import { knob } from "../knobs"
import { useSettings } from "../settings"
import { playground, type EntryDefinition } from "./define"

type Side = "top" | "bottom" | "left" | "right"

const SIDES = ["bottom", "top", "left", "right"] as const

function DialogDemo({ dye: initialDye, motif: initialMotif }: { dye: WoolId; motif: MotifId }): ReactElement {
  const [motif, setMotif] = useState<MotifId>(initialMotif)
  const [wool, setWool] = useState<WoolId>(initialDye)
  return (
    <SaduDialog>
      <SaduDialogTrigger>Edit main band</SaduDialogTrigger>
      <SaduDialogContent motif={motif} dye={WOOLS[wool].hex}>
        <SaduDialogHeader>
          <div>
            <SaduDialogTitle>Edit main band</SaduDialogTitle>
            <SaduDialogDescription>Order 14, the majlis divider Umm Saad is weaving.</SaduDialogDescription>
          </div>
          <SaduDialogDismiss />
        </SaduDialogHeader>
        <div className="demo-dialog-fields">
          <MotifSelect label="Motif" dye={WOOLS[wool].hex} value={motif} onValueChange={setMotif} />
          <SkeinRadio label="Wool" value={wool} onValueChange={setWool} nameSlot={WOOLS[wool].name} />
        </div>
        <SaduDialogFooter>
          <SaduDialogClose variant="secondary">Cancel</SaduDialogClose>
          <SaduDialogClose
            variant="primary"
            value="save"
            action={() => toast.success("Main band saved", { description: `${MOTIFS[motif].name} in ${WOOLS[wool].name.toLowerCase()}.` })}
          >
            Save
          </SaduDialogClose>
        </SaduDialogFooter>
      </SaduDialogContent>
    </SaduDialog>
  )
}

function AlertDialogDemo({ tone, motif }: { tone: AlertTone; motif: MotifId }): ReactElement {
  return (
    <SaduAlertDialog>
      <SaduAlertDialogTrigger>Unravel band</SaduAlertDialogTrigger>
      <SaduAlertDialogContent tone={tone} motif={motif}>
        <SaduAlertDialogTitle>Unravel this band?</SaduAlertDialogTitle>
        <SaduAlertDialogDescription>
          The 46 rows of {MOTIFS[motif].name} on order 14 go back to bare warp. The weft cannot be saved.
        </SaduAlertDialogDescription>
        <SaduAlertDialogFooter>
          <SaduAlertDialogClose variant="secondary">Keep weaving</SaduAlertDialogClose>
          <SaduAlertDialogClose
            variant="primary"
            value="confirm"
            action={() => toast("Band unravelled", { description: "The warp is bare and ready to weave again." })}
          >
            Unravel band
          </SaduAlertDialogClose>
        </SaduAlertDialogFooter>
      </SaduAlertDialogContent>
    </SaduAlertDialog>
  )
}

function DrawerDemo({ side }: { side: "start" | "end" | "bottom" }): ReactElement {
  return (
    <SaduDrawer side={side}>
      <SaduDrawerTrigger>Open order 14</SaduDrawerTrigger>
      <SaduDrawerContent>
        <SaduDrawerHeader>
          <div>
            <SaduDrawerTitle>Order 14</SaduDrawerTitle>
            <SaduDrawerDescription>Majlis divider for Noura Al-Sabah.</SaduDrawerDescription>
          </div>
          <SaduDrawerDismiss />
        </SaduDrawerHeader>
        <OverlayDetails
          items={[
            { term: "Client", detail: "Noura Al-Sabah" },
            { term: "Weaver", detail: "Umm Saad" },
            { term: "Size", detail: "3.2 × 0.6 m" },
            { term: "Price", detail: "185 KD" },
            { term: "Due", detail: "12 Rajab" },
          ]}
        />
        <SaduDrawerFooter>
          <SaduDrawerClose variant="secondary">Close</SaduDrawerClose>
          <SaduButton variant="primary">Message Umm Saad</SaduButton>
        </SaduDrawerFooter>
      </SaduDrawerContent>
    </SaduDrawer>
  )
}

function PopoverDemo({ dye, side }: { dye: WoolId; side: Side }): ReactElement {
  const [rows, setRows] = useState(46)
  return (
    <SaduPopover>
      <SaduPopoverTrigger>Band width</SaduPopoverTrigger>
      <SaduPopoverContent side={side}>
        <SaduPopoverTitle>Band width</SaduPopoverTitle>
        <SaduPopoverDescription>Rows across the main band, before the border.</SaduPopoverDescription>
        <div className="demo-popover-fields">
          <SaduField>
            <SaduFieldLabel>Rows</SaduFieldLabel>
            <SaduNumberInput value={rows} min={11} max={80} onValueChange={(next: number | null) => next !== null && setRows(next)} />
          </SaduField>
          <LoomSlider
            label="Woven"
            grid={MOTIFS.uwairjan.grid}
            colors={mainColors(WOOLS[dye].hex)}
            min={11}
            max={80}
            value={rows}
            onValueChange={setRows}
          />
        </div>
        <div className="demo-popover-footer">
          <SaduPopoverClose>Done</SaduPopoverClose>
        </div>
      </SaduPopoverContent>
    </SaduPopover>
  )
}

function MotifLink({ motif, meaning, dye }: { motif: MotifId; meaning: string; dye: string }): ReactElement {
  return (
    <SaduHoverCard>
      <SaduHoverCardTrigger href="#/c/sadu-hover-card">{MOTIFS[motif].name}</SaduHoverCardTrigger>
      <SaduHoverCardContent>
        <MotifPreview motif={motif} dye={dye} meaning={meaning} />
      </SaduHoverCardContent>
    </SaduHoverCard>
  )
}

function HoverCardDemo({ dye }: { dye: WoolId }): ReactElement {
  const hex = WOOLS[dye].hex
  return (
    <p className="demo-prose">
      Hessa frames the centre band with <MotifLink motif="uwairjan" dye={hex} meaning="Facing triangles. Woven beside the Shajarah." /> on
      both sides, then closes the edges with <MotifLink motif="dhurs" dye={hex} meaning="Horse teeth. The border that binds a band." />.
    </p>
  )
}

const LOOM_TOOLS = [
  { label: "Beat row", icon: Hammer },
  { label: "Undo last pick", icon: Undo2, shortcut: "mod+z" },
  { label: "Redo pick", icon: Redo2, shortcut: "mod+shift+z" },
] as const

function TooltipDemo({ side, delay }: { side: Side; delay: number }): ReactElement {
  return (
    <div className="demo-row demo-tools" role="group" aria-label="Loom">
      {LOOM_TOOLS.map((tool) => (
        <SaduTooltip key={tool.label} delay={delay} shortcut={"shortcut" in tool ? tool.shortcut : undefined}>
          <SaduTooltipTrigger variant="ghost" size="icon">
            <tool.icon size={16} strokeWidth={2} aria-hidden="true" />
          </SaduTooltipTrigger>
          <SaduTooltipContent side={side}>
            {tool.label}
            {"shortcut" in tool && <SaduTooltipShortcut />}
          </SaduTooltipContent>
        </SaduTooltip>
      ))}
    </div>
  )
}

type ToastKind = "success" | "error" | "info" | "loading"

function showToast(kind: ToastKind, seconds: number): void {
  const duration = seconds === 0 ? Infinity : seconds * 1000
  if (kind === "success") {
    toast.success("Dye lot recorded", {
      description: "Madder, 3 skeins.",
      duration,
      action: { label: "Undo", onAction: () => toast("Dye lot removed") },
    })
    return
  }
  if (kind === "error") {
    toast.error("Loom not reached", {
      description: "Mariam's loom is offline.",
      duration,
      action: { label: "Retry", onAction: () => toast.success("Pattern sent to the loom") },
    })
    return
  }
  if (kind === "info") {
    toast.info("Hessa joined order 14", { description: "She will weave the Shajarah.", duration })
    return
  }
  toast.loading("Sending the pattern", { description: "To Mariam's loom in Wafra.", duration })
}

function ToastDemo({ kind, seconds }: { kind: ToastKind; seconds: number }): ReactElement {
  return (
    <div className="demo-stack demo-fit demo-center">
      <SaduButton variant="secondary" onClick={() => showToast(kind, seconds)}>
        {kind === "error" ? "Send pattern" : kind === "loading" ? "Send to the loom" : kind === "info" ? "Assign Hessa" : "Record dye lot"}
      </SaduButton>
      <span className="demo-caption">The strip unravels as its time runs out.</span>
    </div>
  )
}

const STAGES = [
  { value: "spin", motif: "hubub", title: "Shearing and spinning", body: "In spring Hessa shears the flock, then spins the wool and goat hair on a drop spindle as she walks." },
  { value: "dye", motif: "eyoun", title: "Dyeing", body: "Skeins simmer in a madder bath for most of a day. Undyed wool stays white, goat hair stays black." },
  { value: "warp", motif: "dhalla", title: "Warping the loom", body: "The warp is wound between two stakes in the ground, 14 ends to every centimetre, in the order of the bands." },
  { value: "weave", motif: "uwairjan", title: "Weaving", body: "Each pick is beaten tight with a gazelle horn so the warp hides the weft. A 3 m divider takes about six weeks." },
] as const satisfies readonly { value: string; motif: MotifId; title: string; body: string }[]

function AccordionDemo({ dye, multiple }: { dye: WoolId; multiple: boolean }): ReactElement {
  return (
    <SaduAccordion defaultValue={["dye"]} multiple={multiple} className="demo-accordion">
      {STAGES.map((stage) => (
        <SaduAccordionItem key={stage.value} value={stage.value}>
          <SaduAccordionTrigger dye={WOOLS[dye].hex} motif={stage.motif}>
            {stage.title}
          </SaduAccordionTrigger>
          <SaduAccordionPanel>
            <p>{stage.body}</p>
          </SaduAccordionPanel>
        </SaduAccordionItem>
      ))}
    </SaduAccordion>
  )
}

const CHEST = [
  {
    motif: "uwairjan",
    title: "Wedding tent divider",
    meta: "Folded, 3.6 m",
    details: [
      { term: "Woven", detail: "Spring 2024" },
      { term: "Wool", detail: "Camel and goat hair" },
    ],
  },
  {
    motif: "eyoun",
    title: "Majlis cushion cover",
    meta: "Folded, 1.2 m",
    details: [
      { term: "Woven", detail: "Winter 2023" },
      { term: "Wool", detail: "Madder and undyed sheep" },
    ],
  },
] as const satisfies readonly { motif: MotifId; title: string; meta: string; details: readonly { term: string; detail: string }[] }[]

function CollapsibleDemo({ open, disabled }: { open: boolean; disabled: boolean }): ReactElement {
  return (
    <div className="demo-stack demo-notes">
      {CHEST.map((piece, index) => (
        <SaduCollapsible key={piece.title} defaultOpen={open && index === 0} disabled={disabled && index > 0}>
          <SaduCollapsibleTrigger motif={piece.motif}>
            <span className="demo-piece">
              <span className="demo-strong">{piece.title}</span>
              <span className="demo-caption">{piece.meta}</span>
            </span>
          </SaduCollapsibleTrigger>
          <SaduCollapsiblePanel motif={piece.motif}>
            <OverlayDetails items={piece.details} />
          </SaduCollapsiblePanel>
        </SaduCollapsible>
      ))}
    </div>
  )
}

function PreferencesDemo({ title, variant = "card" }: { title?: string; variant?: "card" | "plain" }): ReactElement {
  const { direction } = useSettings()
  const preferences = useMemo(() => createSaduPreferences({ direction }), [direction])
  return <SaduPreferences preferences={preferences} title={title} variant={variant} />
}

const OVERLAYS: readonly EntryDefinition[] = [
  {
    id: "sadu-dialog",
    name: "Dialog",
    base: "Dialog",
    playground: playground(
      { dye: knob.dye("Starting wool"), motif: knob.motif("uwairjan", "Starting motif", { remount: true }) },
      (values) => <DialogDemo key={values.dye} {...values} />,
    ),
  },
  {
    id: "sadu-alert-dialog",
    name: "Alert Dialog",
    base: "Alert Dialog",
    playground: playground(
      { tone: knob.choice("Tone", ["danger", "neutral"], "danger"), motif: knob.motif("eyoun") },
      (values) => <AlertDialogDemo {...values} />,
    ),
  },
  {
    id: "sadu-drawer",
    name: "Drawer",
    base: "Drawer",
    playground: playground(
      { side: knob.choice("Side", ["end", "start", "bottom"], "end", { remount: true }) },
      (values) => <DrawerDemo {...values} />,
    ),
  },
  {
    id: "sadu-popover",
    name: "Popover",
    base: "Popover",
    playground: playground({ dye: knob.dye(), side: knob.choice("Side", SIDES, "bottom") }, (values) => <PopoverDemo {...values} />),
  },
  {
    id: "sadu-hover-card",
    name: "Hover Card",
    base: "Hover Card",
    playground: playground({ dye: knob.dye() }, (values) => <HoverCardDemo {...values} />),
  },
  {
    id: "sadu-tooltip",
    name: "Tooltip",
    base: "Tooltip",
    playground: playground(
      { side: knob.choice("Side", SIDES, "top"), delay: knob.number("Delay, ms", 500, { min: 0, max: 1500, step: 100 }) },
      (values) => <TooltipDemo {...values} />,
    ),
  },
  {
    id: "sadu-toast",
    name: "Toast",
    base: "Toast",
    playground: playground(
      {
        kind: knob.choice("Kind", ["success", "error", "info", "loading"], "success"),
        seconds: knob.number("Seconds, 0 stays", 6, { min: 0, max: 20 }),
      },
      (values) => <ToastDemo {...values} />,
    ),
  },
  {
    id: "sadu-collapsible",
    name: "Collapsible",
    base: "Collapsible",
    playground: playground(
      { open: knob.toggle("First piece open", true, { remount: true }), disabled: knob.toggle("Lock the others") },
      (values) => <CollapsibleDemo {...values} />,
    ),
  },
  {
    id: "sadu-accordion",
    name: "Accordion",
    base: "Accordion",
    playground: playground(
      { dye: knob.dye(), multiple: knob.toggle("Several open", false, { remount: true }) },
      (values) => <AccordionDemo {...values} />,
    ),
  },
  {
    id: "sadu-preferences",
    name: "Preferences",
    base: "Preferences",
    ownCard: true,
    playground: playground(
      { title: knob.text("Title", "Display") },
      (values) => <PreferencesDemo {...values} />,
      () => <PreferencesDemo variant="plain" />,
    ),
  },
]

export { OVERLAYS }
