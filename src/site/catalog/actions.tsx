import { Field, FieldLabel } from "@ui-sdk/react/field"
import type { TokenInputValue } from "@ui-sdk/react/token-input"
import { ToggleGroup } from "@ui-sdk/react/toggle"
import type { TriggerDefinition, TriggerMenuDataItem } from "@ui-sdk/react/trigger-menu"
import {
  ChevronDown,
  Copy,
  Droplets,
  FileDown,
  FilePlus2,
  FlipHorizontal2,
  FolderOpen,
  Lock,
  PackageSearch,
  Plus,
  Redo2,
  Rows3,
  Save,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { useId, useState, type ReactElement } from "react"
import { EyePagination } from "../../sadu/eye-pagination"
import { LoomMotifSelect, LoomToolbar, LoomToolbarButton, LoomToolbarSeparator } from "../../sadu/loom-toolbar"
import { MOTIFS, PICKABLE, type MotifId } from "../../sadu/motifs"
import { INK, WOOLS, WOOL_ORDER, type Colors, type WoolId } from "../../sadu/palette"
import { Rug } from "../../sadu/rug"
import { SaduButton, type SaduButtonSize, type SaduButtonVariant } from "../../sadu/sadu-button"
import {
  SaduCommand,
  SaduCommandEmpty,
  SaduCommandGroup,
  SaduCommandGroupLabel,
  SaduCommandInput,
  SaduCommandItem,
  SaduCommandList,
} from "../../sadu/sadu-command"
import {
  SaduMenu,
  SaduMenuCheckboxItem,
  SaduMenuContent,
  SaduMenuGroupLabel,
  SaduMenuItem,
  SaduMenuRadioGroup,
  SaduMenuRadioItem,
  SaduMenuSeparator,
  SaduMenuSub,
  SaduMenuSubContent,
  SaduMenuSubTrigger,
  SaduMenuTrigger,
} from "../../sadu/sadu-menu"
import { SaduMenubar, SaduMenubarTrigger } from "../../sadu/sadu-menubar"
import {
  SaduNavigationMenu,
  SaduNavigationMenuContent,
  SaduNavigationMenuItem,
  SaduNavigationMenuLink,
  SaduNavigationMenuList,
  SaduNavigationMenuTopLink,
  SaduNavigationMenuTrigger,
} from "../../sadu/sadu-navigation-menu"
import { SaduSegment, SaduSegmentedControl } from "../../sadu/sadu-segmented-control"
import {
  SaduNote,
  SaduNoteEditor,
  SaduTriggerMenu,
  SaduTriggerMenuContent,
  SaduTriggerMenuEmpty,
  SaduTriggerMenuItem,
  SaduTriggerMenuList,
} from "../../sadu/sadu-trigger-menu"
import { WarpToggle, WarpToggleGroup } from "../../sadu/warp-toggle"
import { WeaverAvatar } from "../../sadu/weaver-avatar"
import { BandSwatch, SkeinDot } from "../../sadu/parts"
import { knob } from "../knobs"
import { playground, type EntryDefinition } from "./define"

const ICON = { size: 16, strokeWidth: 2 } as const

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

function isWool(value: string): value is WoolId {
  return value in WOOLS
}

function isMotif(value: string): value is MotifId {
  return value in MOTIFS
}

function cloth(dye: string): Colors {
  return { ground: INK.black, dye, accent: INK.wool }
}

function ButtonDemo({
  variant,
  size,
  disabled,
  weaving,
  label,
}: {
  variant: SaduButtonVariant
  size: SaduButtonSize
  disabled: boolean
  weaving: boolean
  label: string
}): ReactElement {
  return (
    <div className="demo-stack demo-fit demo-center">
      <SaduButton
        variant={variant}
        size={size}
        disabled={disabled}
        weaving={weaving}
        aria-label={size === "icon" ? label : undefined}
        onClick={() => wait(2400)}
        pendingAnnouncement="Sending to the loom"
      >
        {size === "icon" ? <Plus {...ICON} aria-hidden="true" /> : label}
      </SaduButton>
      <div className="demo-row">
        <SaduButton variant="secondary" size="sm" disabled={disabled}>
          Cancel
        </SaduButton>
        <SaduButton variant="ghost" size="sm" disabled={disabled}>
          Preview
        </SaduButton>
        <SaduButton variant="secondary" size="icon" aria-label="Add a band" disabled={disabled}>
          <Plus {...ICON} aria-hidden="true" />
        </SaduButton>
      </div>
    </div>
  )
}

function ToggleDemo({ dye, disabled }: { dye: WoolId; disabled: boolean }): ReactElement {
  const id = useId()
  const hex = WOOLS[dye].hex
  return (
    <div className="demo-stack demo-fit">
      <span className="sadu-label" id={`${id}-aids`}>
        Weaving aids
      </span>
      <WarpToggleGroup aria-labelledby={`${id}-aids`} multiple defaultValue={["guides", "mirror"]} disabled={disabled}>
        <WarpToggle value="guides" dye={hex}>
          Guides
        </WarpToggle>
        <WarpToggle value="mirror" dye={hex}>
          Mirror
        </WarpToggle>
        <WarpToggle value="lock" dye={hex} disabled>
          Lock
        </WarpToggle>
      </WarpToggleGroup>
      <span className="sadu-label" id={`${id}-align`}>
        Band alignment
      </span>
      <WarpToggleGroup aria-labelledby={`${id}-align`} defaultValue={["centre"]} deselectable={false} disabled={disabled}>
        <WarpToggle value="start" dye={hex}>
          Start
        </WarpToggle>
        <WarpToggle value="centre" dye={hex}>
          Centre
        </WarpToggle>
        <WarpToggle value="end" dye={hex}>
          End
        </WarpToggle>
      </WarpToggleGroup>
    </div>
  )
}

function SegmentedDemo({ orientation, disabled }: { orientation: "horizontal" | "vertical"; disabled: boolean }): ReactElement {
  const id = useId()
  return (
    <div className="demo-stack demo-fit">
      <span className="sadu-label" id={id}>
        Ground
      </span>
      <SaduSegmentedControl aria-labelledby={id} defaultValue="goat-hair" orientation={orientation} disabled={disabled}>
        <SaduSegment value="wool">Wool</SaduSegment>
        <SaduSegment value="goat-hair">Goat hair</SaduSegment>
        <SaduSegment value="camel">Camel</SaduSegment>
      </SaduSegmentedControl>
    </div>
  )
}

function ToolbarDemo({ dye, orientation }: { dye: WoolId; orientation: "horizontal" | "vertical" }): ReactElement {
  const [motif, setMotif] = useState<MotifId>("uwairjan")
  return (
    <LoomToolbar aria-label="Band editor" orientation={orientation}>
      <LoomToolbarButton aria-label="Undo">
        <Undo2 {...ICON} aria-hidden="true" />
      </LoomToolbarButton>
      <LoomToolbarButton aria-label="Redo" disabled>
        <Redo2 {...ICON} aria-hidden="true" />
      </LoomToolbarButton>
      <LoomToolbarSeparator />
      <ToggleGroup multiple aria-label="Band aids" defaultValue={["guides"]} className="demo-toolbar__toggles">
        <WarpToggle value="guides" aria-label="Guide threads" dye={WOOLS[dye].hex} icon={<Rows3 {...ICON} />} />
        <WarpToggle value="mirror" aria-label="Mirror" dye={WOOLS[dye].hex} icon={<FlipHorizontal2 {...ICON} />} />
        <WarpToggle value="lock" aria-label="Lock band" dye={WOOLS[dye].hex} icon={<Lock {...ICON} />} />
      </ToggleGroup>
      <LoomToolbarSeparator />
      <LoomMotifSelect motifs={PICKABLE} dye={WOOLS[dye].hex} value={motif} onValueChange={setMotif} />
      <LoomToolbarSeparator />
      <LoomToolbarButton aria-label="Zoom out">
        <ZoomOut {...ICON} aria-hidden="true" />
      </LoomToolbarButton>
      <LoomToolbarButton aria-label="Zoom in">
        <ZoomIn {...ICON} aria-hidden="true" />
      </LoomToolbarButton>
    </LoomToolbar>
  )
}

function MenuDemo({ dye: initial }: { dye: WoolId }): ReactElement {
  const [dye, setDye] = useState<WoolId>(initial)
  return (
    <div className="demo-stack demo-fit demo-center">
      <SaduMenu>
        <SaduMenuTrigger>
          Band actions
          <ChevronDown {...ICON} aria-hidden="true" />
        </SaduMenuTrigger>
        <SaduMenuContent>
          <SaduMenuItem value="duplicate" shortcut="mod+d" icon={<Copy {...ICON} />}>
            Duplicate band
          </SaduMenuItem>
          <SaduMenuItem value="mirror" shortcut="mod+m" icon={<FlipHorizontal2 {...ICON} />}>
            Mirror
          </SaduMenuItem>
          <SaduMenuSeparator />
          <SaduMenuCheckboxItem value="guides" defaultChecked>
            Show guide threads
          </SaduMenuCheckboxItem>
          <SaduMenuCheckboxItem value="rows">Show row numbers</SaduMenuCheckboxItem>
          <SaduMenuSub>
            <SaduMenuSubTrigger icon={<Droplets {...ICON} />}>Dye</SaduMenuSubTrigger>
            <SaduMenuSubContent>
              <SaduMenuRadioGroup value={dye} onValueChange={(next) => isWool(next) && setDye(next)}>
                {WOOL_ORDER.map((id) => (
                  <SaduMenuRadioItem key={id} value={id} trailing={<SkeinDot wool={id} />}>
                    {WOOLS[id].name}
                  </SaduMenuRadioItem>
                ))}
              </SaduMenuRadioGroup>
            </SaduMenuSubContent>
          </SaduMenuSub>
          <SaduMenuSeparator />
          <SaduMenuItem value="remove" destructive shortcut="mod+backspace" icon={<Trash2 {...ICON} />}>
            Remove band
          </SaduMenuItem>
        </SaduMenuContent>
      </SaduMenu>
      <span className="demo-caption">Border dyed in {WOOLS[dye].name.toLowerCase()}</span>
    </div>
  )
}

function MenubarDemo({ dye: initialDye }: { dye: WoolId }): ReactElement {
  const [dye, setDye] = useState<WoolId>(initialDye)
  const [motif, setMotif] = useState<MotifId>("eyoun")
  const [tension, setTension] = useState("even")
  return (
    <div className="demo-studio">
      <SaduMenubar aria-label="Weaving studio">
        <SaduMenu>
          <SaduMenubarTrigger>Loom</SaduMenubarTrigger>
          <SaduMenuContent>
            <SaduMenuItem value="new" shortcut="mod+n" icon={<FilePlus2 {...ICON} />}>
              New band
            </SaduMenuItem>
            <SaduMenuItem value="open" shortcut="mod+o" icon={<FolderOpen {...ICON} />}>
              Open draft…
            </SaduMenuItem>
            <SaduMenuSeparator />
            <SaduMenuItem value="save" shortcut="mod+s" icon={<Save {...ICON} />}>
              Save
            </SaduMenuItem>
            <SaduMenuItem value="export" shortcut="mod+shift+e" icon={<FileDown {...ICON} />}>
              Export draft as PDF
            </SaduMenuItem>
          </SaduMenuContent>
        </SaduMenu>
        <SaduMenu>
          <SaduMenubarTrigger>Band</SaduMenubarTrigger>
          <SaduMenuContent>
            <SaduMenuRadioGroup value={motif} onValueChange={(next) => isMotif(next) && setMotif(next)}>
              <SaduMenuGroupLabel>Motif</SaduMenuGroupLabel>
              {PICKABLE.map((id) => (
                <SaduMenuRadioItem key={id} value={id} trailing={<span lang="ar">{MOTIFS[id].arabic}</span>}>
                  {MOTIFS[id].name}
                </SaduMenuRadioItem>
              ))}
            </SaduMenuRadioGroup>
            <SaduMenuSeparator />
            <SaduMenuRadioGroup value={tension} onValueChange={setTension}>
              <SaduMenuGroupLabel>Warp tension</SaduMenuGroupLabel>
              <SaduMenuRadioItem value="slack">Slack</SaduMenuRadioItem>
              <SaduMenuRadioItem value="even">Even</SaduMenuRadioItem>
              <SaduMenuRadioItem value="taut">Taut</SaduMenuRadioItem>
            </SaduMenuRadioGroup>
          </SaduMenuContent>
        </SaduMenu>
        <SaduMenu>
          <SaduMenubarTrigger>Wool</SaduMenubarTrigger>
          <SaduMenuContent>
            <SaduMenuRadioGroup value={dye} onValueChange={(next) => isWool(next) && setDye(next)}>
              <SaduMenuGroupLabel>Dye lot</SaduMenuGroupLabel>
              {WOOL_ORDER.map((id) => (
                <SaduMenuRadioItem key={id} value={id} trailing={<SkeinDot wool={id} />}>
                  {WOOLS[id].name}
                </SaduMenuRadioItem>
              ))}
            </SaduMenuRadioGroup>
          </SaduMenuContent>
        </SaduMenu>
        <SaduMenu>
          <SaduMenubarTrigger>View</SaduMenubarTrigger>
          <SaduMenuContent>
            <SaduMenuCheckboxItem value="guides" defaultChecked>
              Guide threads
            </SaduMenuCheckboxItem>
            <SaduMenuCheckboxItem value="rows">Row numbers</SaduMenuCheckboxItem>
          </SaduMenuContent>
        </SaduMenu>
      </SaduMenubar>
      <Rug motif={motif} dye={WOOLS[dye].hex} level="stitch" className="demo-studio__cloth" />
      <p className="demo-caption">
        {MOTIFS[motif].name} in {WOOLS[dye].name.toLowerCase()}, {tension} tension
      </p>
    </div>
  )
}

const MATERIALS = [
  { id: "wool", title: "Wool", description: "Sheep's wool, spun on the drop spindle.", colors: { ground: INK.wool, dye: INK.black, accent: WOOLS.madder.hex } },
  { id: "goat-hair", title: "Goat hair", description: "Black and strong, the cloth of the tent.", colors: { ground: INK.black, dye: "#43372e", accent: INK.wool } },
  { id: "camel-hair", title: "Camel hair", description: "Soft and undyed, for borders and bags.", colors: { ground: WOOLS.camel.dark, dye: WOOLS.camel.light, accent: INK.wool } },
  { id: "dyes", title: "Dyes", description: "Madder, saffron and indigo, by the lot.", colors: { ground: INK.wool, dye: WOOLS.indigo.hex, accent: WOOLS.madder.hex } },
] as const

function NavigationDemo({ dye }: { dye: WoolId }): ReactElement {
  const colors = cloth(WOOLS[dye].hex)
  return (
    <SaduNavigationMenu aria-label="Sadu House">
      <SaduNavigationMenuList>
        <SaduNavigationMenuItem value="motifs">
          <SaduNavigationMenuTrigger>Motifs</SaduNavigationMenuTrigger>
          <SaduNavigationMenuContent>
            <ul className="demo-nav-grid">
              {PICKABLE.map((id) => (
                <li key={id}>
                  <SaduNavigationMenuLink
                    href="#/c/sadu-navigation-menu"
                    current={id === "uwairjan"}
                    title={MOTIFS[id].name}
                    description={`${MOTIFS[id].arabic}, ${MOTIFS[id].gloss}`}
                    thumbnail={<BandSwatch grid={MOTIFS[id].grid} colors={colors} center={MOTIFS[id].center} />}
                  />
                </li>
              ))}
            </ul>
          </SaduNavigationMenuContent>
        </SaduNavigationMenuItem>
        <SaduNavigationMenuItem value="materials">
          <SaduNavigationMenuTrigger>Materials</SaduNavigationMenuTrigger>
          <SaduNavigationMenuContent>
            <ul className="demo-nav-grid">
              {MATERIALS.map((material) => (
                <li key={material.id}>
                  <SaduNavigationMenuLink
                    href="#/c/sadu-navigation-menu"
                    title={material.title}
                    description={material.description}
                    thumbnail={<BandSwatch grid={MOTIFS.hubub.grid} colors={material.colors} center={MOTIFS.hubub.center} />}
                  />
                </li>
              ))}
            </ul>
          </SaduNavigationMenuContent>
        </SaduNavigationMenuItem>
        <SaduNavigationMenuItem>
          <SaduNavigationMenuTopLink href="#/c/sadu-navigation-menu">Visit</SaduNavigationMenuTopLink>
        </SaduNavigationMenuItem>
      </SaduNavigationMenuList>
    </SaduNavigationMenu>
  )
}

const ORDERS = [
  { value: "order-14", label: "Order 14, majlis divider", keywords: ["Hessa", "divider"], motif: "eyoun" },
  { value: "order-15", label: "Order 15, saddle bag", keywords: ["Noura", "bag"], motif: "dhalla" },
] as const

function CommandDemo({ dye, placeholder }: { dye: WoolId; placeholder: string }): ReactElement {
  const [ran, setRan] = useState<string | null>(null)
  return (
    <div className="demo-stack demo-command">
      <SaduCommand onAction={setRan}>
        <SaduCommandInput aria-label="Search the loom" placeholder={placeholder} />
        <SaduCommandEmpty />
        <SaduCommandList>
          <SaduCommandGroup>
            <SaduCommandGroupLabel>Orders</SaduCommandGroupLabel>
            <SaduCommandItem value="go-to-order" label="Go to order…" shortcut="mod+g" icon={<PackageSearch {...ICON} />} />
            {ORDERS.map((order) => (
              <SaduCommandItem
                key={order.value}
                value={order.value}
                label={order.label}
                keywords={[...order.keywords]}
                icon={<BandSwatch grid={MOTIFS[order.motif].grid} colors={cloth(WOOLS[dye].hex)} center={MOTIFS[order.motif].center} />}
              />
            ))}
          </SaduCommandGroup>
          <SaduCommandGroup>
            <SaduCommandGroupLabel>Wool</SaduCommandGroupLabel>
            {(["madder", "saffron", "indigo"] as const).map((id) => (
              <SaduCommandItem
                key={id}
                value={`wool-${id}`}
                label={`${WOOLS[id].name} skeins`}
                keywords={[WOOLS[id].arabic]}
                icon={<SkeinDot wool={id} />}
                trailing={<span lang="ar">{WOOLS[id].arabic}</span>}
              />
            ))}
          </SaduCommandGroup>
        </SaduCommandList>
      </SaduCommand>
      <p className="demo-caption" aria-live="polite">
        {ran ? `Ran ${ran.replaceAll("-", " ")}` : "Try “mad” or “order”."}
      </p>
    </div>
  )
}

function PaginationDemo({ dye, pageCount, siblings }: { dye: WoolId; pageCount: number; siblings: number }): ReactElement {
  const [page, setPage] = useState(4)
  const current = Math.min(page, pageCount)
  return (
    <div className="demo-stack demo-center">
      <EyePagination
        aria-label="Orders"
        dye={WOOLS[dye].hex}
        pageCount={pageCount}
        page={current}
        onPageChange={setPage}
        siblings={siblings}
        boundaries={1}
      />
      <p className="demo-caption">
        Orders, page {current} of {pageCount}
      </p>
    </div>
  )
}

const WEAVERS: readonly TriggerMenuDataItem[] = [
  { value: "hessa", label: "Hessa", keywords: ["Al-Mutairi", "Jahra"] },
  { value: "noura", label: "Noura", keywords: ["Al-Ajmi", "Ahmadi"] },
  { value: "mariam", label: "Mariam", keywords: ["Al-Rashidi", "Wafra"] },
  { value: "umm-saad", label: "Umm Saad", keywords: ["Sulaibikhat"] },
]

const WEAVER_TOWNS: Record<string, string> = { hessa: "Jahra", noura: "Ahmadi", mariam: "Wafra", "umm-saad": "Sulaibikhat" }

const NOTE_TRIGGERS: TriggerDefinition[] = [
  {
    char: "#",
    type: "motif",
    items: PICKABLE.map((id) => ({ value: id, label: MOTIFS[id].name, keywords: [MOTIFS[id].arabic, MOTIFS[id].gloss] })),
  },
  { char: "@", type: "weaver", spaces: 1, items: [...WEAVERS] },
]

const NOTE_DRAFT: TokenInputValue = [
  "Ask ",
  { type: "weaver", value: "hessa", label: "Hessa" },
  " to warp the loom for ",
  { type: "motif", value: "uwairjan", label: "Uwairjan" },
  ".",
]

function TriggerMenuDemo({ dye }: { dye: WoolId }): ReactElement {
  return (
    <Field className="demo-note">
      <FieldLabel className="sadu-label">Note for the weaver</FieldLabel>
      <SaduNote defaultValue={NOTE_DRAFT}>
        <SaduNoteEditor placeholder="Type # for a motif or @ for a weaver" />
        <SaduTriggerMenu triggers={NOTE_TRIGGERS}>
          <SaduTriggerMenuContent>
            <SaduTriggerMenuEmpty>No weaver by that name</SaduTriggerMenuEmpty>
            <SaduTriggerMenuList>
              {(state) =>
                (state.items as TriggerMenuDataItem[]).map((item) =>
                  state.trigger === "#" && isMotif(item.value) ? (
                    <SaduTriggerMenuItem
                      key={item.value}
                      value={item.value}
                      label={item.label}
                      icon={<BandSwatch grid={MOTIFS[item.value].grid} colors={cloth(WOOLS[dye].hex)} center={MOTIFS[item.value].center} />}
                    >
                      {item.label}
                    </SaduTriggerMenuItem>
                  ) : (
                    <SaduTriggerMenuItem
                      key={item.value}
                      value={item.value}
                      label={item.label}
                      icon={<WeaverAvatar name={item.label} size={20} aria-hidden="true" />}
                      hint={WEAVER_TOWNS[item.value]}
                    >
                      {item.label}
                    </SaduTriggerMenuItem>
                  ),
                )
              }
            </SaduTriggerMenuList>
          </SaduTriggerMenuContent>
        </SaduTriggerMenu>
      </SaduNote>
    </Field>
  )
}

const ORIENTATIONS = ["horizontal", "vertical"] as const

const ACTIONS: readonly EntryDefinition[] = [
  {
    id: "sadu-button",
    name: "Button",
    base: "Button",
    playground: playground(
      {
        variant: knob.choice("Variant", ["primary", "secondary", "ghost", "destructive"], "primary"),
        size: knob.choice("Size", ["sm", "md", "lg", "icon"], "md", { labels: { sm: "S", md: "M", lg: "L", icon: "Icon" } }),
        label: knob.text("Label", "Send to loom"),
        weaving: knob.toggle("Weaving"),
        disabled: knob.toggle("Disabled"),
      },
      (values) => <ButtonDemo {...values} />,
    ),
  },
  {
    id: "warp-toggle",
    name: "Toggle",
    base: "Toggle",
    playground: playground({ dye: knob.dye(), disabled: knob.toggle("Disabled") }, (values) => <ToggleDemo {...values} />),
  },
  {
    id: "sadu-segmented-control",
    name: "Segmented Control",
    base: "Segmented Control",
    playground: playground(
      { orientation: knob.choice("Orientation", ORIENTATIONS, "horizontal"), disabled: knob.toggle("Disabled") },
      (values) => <SegmentedDemo {...values} />,
    ),
  },
  {
    id: "sadu-menu",
    name: "Menu",
    base: "Menu",
    playground: playground({ dye: knob.dye("Starting dye") }, (values) => <MenuDemo key={values.dye} {...values} />),
  },
  {
    id: "loom-toolbar",
    name: "Toolbar",
    base: "Toolbar",
    playground: playground(
      { dye: knob.dye(), orientation: knob.choice("Orientation", ORIENTATIONS, "horizontal") },
      (values) => <ToolbarDemo {...values} />,
    ),
  },
  {
    id: "eye-pagination",
    name: "Pagination",
    base: "Pagination",
    playground: playground(
      { dye: knob.dye(), pageCount: knob.number("Pages", 12, { min: 1, max: 40 }), siblings: knob.number("Siblings", 1, { min: 0, max: 3 }) },
      (values) => <PaginationDemo {...values} />,
    ),
  },
  {
    id: "sadu-menubar",
    name: "Menubar",
    base: "Menubar",
    playground: playground({ dye: knob.dye("Starting dye") }, (values) => <MenubarDemo key={values.dye} {...values} />),
  },
  {
    id: "sadu-command",
    name: "Command",
    base: "Command",
    playground: playground(
      { dye: knob.dye(), placeholder: knob.text("Placeholder", "Search orders and wool…") },
      (values) => <CommandDemo {...values} />,
    ),
  },
  {
    id: "sadu-navigation-menu",
    name: "Navigation Menu",
    base: "Navigation Menu",
    playground: playground({ dye: knob.dye() }, (values) => <NavigationDemo {...values} />),
  },
  {
    id: "sadu-trigger-menu",
    name: "Trigger Menu",
    base: "Trigger Menu",
    playground: playground({ dye: knob.dye() }, (values) => <TriggerMenuDemo {...values} />),
  },
]

export { ACTIONS }
