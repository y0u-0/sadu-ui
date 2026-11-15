import { visibleWaterfallRows, type WaterfallDataItem } from "@ui-sdk/react/waterfall"
import { useState, type ReactElement } from "react"
import { BeamResizable, BeamResizableHandle, BeamResizablePanel } from "../../sadu/beam-resizable"
import { CodeBlock, type CodeSnippet } from "../../sadu/code-block"
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
  type DyeWaterfallTone,
} from "../../sadu/dye-waterfall"
import { LoomProgress, type LoomProgressSize } from "../../sadu/loom-progress"
import { MOTIFS, type MotifId } from "../../sadu/motifs"
import { WOOLS, type WoolId } from "../../sadu/palette"
import { mainColors } from "../../sadu/rug"
import { SaduButton } from "../../sadu/sadu-button"
import { ThreadSeparator } from "../../sadu/thread-separator"
import {
  WarpTimeline,
  WarpTimelineConnector,
  WarpTimelineDescription,
  WarpTimelineItem,
  WarpTimelineMarker,
  WarpTimelineTime,
  WarpTimelineTitle,
} from "../../sadu/warp-timeline"
import { Weave } from "../../sadu/weave"
import { WeaverAvatar, WeaverAvatarGroup } from "../../sadu/weaver-avatar"
import { WoodScrollArea } from "../../sadu/wood-scroll-area"
import { WoolMeter } from "../../sadu/wool-meter"
import saduHouse from "../../assets/avatars/sadu-house.jpg"
import { knob } from "../knobs"
import { playground, type EntryDefinition } from "./define"

function AvatarDemo({ size, status }: { size: "40" | "64"; status: "present" | "away" | "none" }): ReactElement {
  return (
    <div className="demo-stack demo-narrow">
      <div className="demo-person">
        <WeaverAvatar size={size === "64" ? 64 : 40} name="Umm Saad" status={status === "none" ? undefined : status} />
        <div className="demo-person__text">
          <span className="demo-strong">Umm Saad</span>
          <span className="demo-caption">Master weaver, at the loom</span>
        </div>
      </div>
      <span className="sadu-label">Weaving order 14</span>
      <WeaverAvatarGroup label="Weavers on order 14" max={4}>
        <WeaverAvatar name="Hessa" />
        <WeaverAvatar name="Noura" />
        <WeaverAvatar name="Mariam" />
        <WeaverAvatar name="Badriya" status="away" />
        <WeaverAvatar name="Lulwa" />
        <WeaverAvatar name="Dalal" />
      </WeaverAvatarGroup>
      <div className="demo-person">
        <WeaverAvatar size={40} name="Sadu House" src={saduHouse} />
        <div className="demo-person__text">
          <span className="demo-strong">Sadu House</span>
          <span className="demo-caption">The workshop, Kuwait City</span>
        </div>
      </div>
    </div>
  )
}

function SeparatorDemo({ variant }: { variant: "thread" | "cord" }): ReactElement {
  return (
    <div className="demo-stack demo-narrow demo-stack--tight">
      <div className="demo-fact">
        <span className="sadu-label">Client</span>
        <span>Umm Saad, majlis in Al Jahra</span>
      </div>
      <ThreadSeparator variant={variant} />
      <div className="demo-fact">
        <span className="sadu-label">Band</span>
        <span>Dhurs border, 3.2 metres</span>
      </div>
      <ThreadSeparator label="or" decorative />
      <span>Collect from Sadu House</span>
      <div className="demo-row demo-row--center">
        <span className="demo-strong">145.000 KD</span>
        <ThreadSeparator orientation="vertical" />
        <span className="demo-caption">Deposit paid</span>
      </div>
    </div>
  )
}

function MeterDemo({ tension }: { tension: number }): ReactElement {
  return (
    <div className="demo-stack demo-narrow">
      <span className="sadu-label">On the loom today</span>
      <WoolMeter
        label="Warp tension"
        value={tension}
        max={30}
        low={10}
        high={24}
        format={{ style: "unit", unit: "kilogram" }}
        zoneLabels={{ low: "slack", optimum: "even", high: "tight" }}
      />
      <WoolMeter
        label="Spun wool"
        value={3}
        max={20}
        low={5}
        high={17}
        format={(value: number) => `${value} of 20 skeins`}
        zoneLabels={{ low: "low", optimum: "enough", high: "overstocked" }}
      />
      <WoolMeter
        label="Orders booked"
        value={19}
        max={20}
        low={4}
        high={16}
        format={(value: number) => `${value} of 20`}
        zoneLabels={{ low: "quiet", optimum: "steady", high: "overbooked" }}
      />
    </div>
  )
}

const ROWS_IN_ORDER = 96
const ROWS_WOVEN = 46

function ProgressDemo({ dye, motif, size, indeterminate }: { dye: WoolId; motif: MotifId; size: LoomProgressSize; indeterminate: boolean }): ReactElement {
  const [rows, setRows] = useState(ROWS_WOVEN)
  return (
    <div className="demo-stack">
      <LoomProgress
        label="Weaving order 14"
        value={indeterminate ? null : rows}
        max={ROWS_IN_ORDER}
        size={size}
        motif={motif}
        dye={WOOLS[dye].hex}
        format={String}
        unit={`of ${ROWS_IN_ORDER} rows`}
        getValueLabel={(value: number | null) => `${value ?? 0} of ${ROWS_IN_ORDER} rows`}
      />
      <div className="demo-row">
        <SaduButton variant="secondary" size="sm" disabled={indeterminate} onClick={() => setRows((current) => Math.min(ROWS_IN_ORDER, current + 10))}>
          Beat in 10 rows
        </SaduButton>
        <SaduButton variant="ghost" size="sm" onClick={() => setRows(ROWS_WOVEN)}>
          Reset
        </SaduButton>
      </div>
    </div>
  )
}

const ORDERS = [
  { id: 14, title: "Majlis divider", client: "Umm Saad", status: "On the loom" },
  { id: 13, title: "Camel saddle bag", client: "Bu Nasser", status: "Dyeing" },
  { id: 12, title: "Cushion covers, pair", client: "Dar Al Sadu", status: "Warping" },
  { id: 11, title: "Floor rug, 3 m", client: "Umm Khalid", status: "Spinning" },
  { id: 10, title: "Wedding tent wall", client: "Al Fadhli family", status: "Finishing" },
  { id: 9, title: "Prayer rug", client: "Hessa", status: "Delivered" },
  { id: 8, title: "Camel neck band", client: "Ahmadi stables", status: "Delivered" },
  { id: 7, title: "Tent door flap", client: "Al Rashidi camp", status: "Delivered" },
  { id: 6, title: "Majlis back rest", client: "Bu Fahad", status: "Delivered" },
  { id: 5, title: "Gift band, 1 m", client: "Sadu House shop", status: "Delivered" },
] as const

function ScrollAreaDemo({ type }: { type: "auto" | "always" | "hover" }): ReactElement {
  return (
    <div className="demo-stack demo-narrow demo-stack--tight">
      <span className="sadu-label">Orders this season</span>
      <WoodScrollArea label="Orders this season" type={type} className="demo-scroll">
        <ul className="demo-orders">
          {ORDERS.map((order) => (
            <li key={order.id}>
              <span className="demo-orders__main">
                <span>{order.title}</span>
                <span className="demo-caption">
                  Order {order.id}, {order.client}
                </span>
              </span>
              <span className="demo-orders__status" data-done={order.status === "Delivered" || undefined}>
                {order.status}
              </span>
            </li>
          ))}
        </ul>
      </WoodScrollArea>
    </div>
  )
}

const DRAFT_GLYPHS: Record<string, string> = { ".": "·", x: "■", k: "□", b: "●", w: "□" }

function ResizableDemo({ dye, orientation }: { dye: WoolId; orientation: "horizontal" | "vertical" }): ReactElement {
  const grid = MOTIFS.eyoun.grid
  return (
    <BeamResizable orientation={orientation} className="demo-resizable" data-orientation={orientation}>
      <BeamResizablePanel defaultSize={40} minSize={25}>
        <div className="demo-resizable__panel">
          <span className="sadu-label">Pattern draft</span>
          <pre className="demo-draft" aria-label="Eyoun draft, eleven rows">
            {grid.map((row) => [...row].map((char) => DRAFT_GLYPHS[char] ?? char).join("")).join("\n")}
          </pre>
        </div>
      </BeamResizablePanel>
      <BeamResizableHandle aria-label="Resize pattern draft" />
      <BeamResizablePanel minSize={30}>
        <div className="demo-resizable__panel demo-resizable__panel--cloth">
          <span className="sadu-label">Cloth</span>
          <Weave grid={grid} colors={mainColors(WOOLS[dye].hex)} level="cloth" className="demo-resizable__weave" />
        </div>
      </BeamResizablePanel>
    </BeamResizable>
  )
}

const STEPS = [
  { value: "sheared", title: "Wool sheared", dateTime: "2026-10-01", time: "1 Oct", description: "Goat hair and sheep wool from the Jahra flock." },
  { value: "dyed", title: "Dyed in the madder bath", dateTime: "2026-10-12", time: "12 Oct", description: "Two lots, the second a shade darker." },
  { value: "warped", title: "Loom warped", dateTime: "2026-10-16", time: "16 Oct", description: "Goat hair warp, 412 ends." },
  { value: "weaving", title: "Weaving", dateTime: "2026-10-17", time: "Since 17 Oct", description: "46 of 96 rows." },
  { value: "delivered", title: "Delivered to the majlis", dateTime: "2026-11-21", time: "Est. 21 Nov", description: "Hung as the divider in Umm Saad's tent." },
] as const

function TimelineDemo({ start }: { start: number }): ReactElement {
  const [current, setCurrent] = useState(start)
  const statusOf = (index: number): "complete" | "current" | "upcoming" =>
    index < current ? "complete" : index === current ? "current" : "upcoming"
  return (
    <div className="demo-stack demo-narrow">
      <WarpTimeline aria-label="Order 14 history">
        {STEPS.map((step, index) => (
          <WarpTimelineItem key={step.value} value={step.value} status={statusOf(index)}>
            <WarpTimelineMarker />
            <WarpTimelineConnector />
            <WarpTimelineTitle>{step.title}</WarpTimelineTitle>
            <WarpTimelineTime dateTime={step.dateTime}>{step.time}</WarpTimelineTime>
            <WarpTimelineDescription>{step.description}</WarpTimelineDescription>
          </WarpTimelineItem>
        ))}
      </WarpTimeline>
      <div className="demo-row">
        <SaduButton variant="secondary" size="sm" disabled={current >= STEPS.length} onClick={() => setCurrent((index) => Math.min(STEPS.length, index + 1))}>
          Finish this step
        </SaduButton>
        <SaduButton variant="ghost" size="sm" onClick={() => setCurrent(start)}>
          Reset
        </SaduButton>
      </div>
    </div>
  )
}

type Stage = WaterfallDataItem & { tone: DyeWaterfallTone; children?: Stage[] }

const ORDER_14: Stage[] = [
  { value: "shear", label: "Shear and wash", start: 0, duration: 3, tone: "camel" },
  { value: "spin", label: "Spin", start: 2, duration: 7, tone: "camel" },
  {
    value: "dye",
    label: "Dye",
    start: 8,
    duration: 6,
    tone: "madder",
    children: [
      { value: "madder-bath", label: "Madder bath", start: 8, duration: 3, tone: "madder" },
      { value: "saffron-bath", label: "Saffron bath", start: 11, duration: 3, tone: "saffron" },
    ],
  },
  { value: "approval", label: "Umm Saad approves", start: 14, duration: 2, tone: "wool" },
  { value: "warp", label: "Warp", start: 16, duration: 2, tone: "goat-hair" },
  {
    value: "weave",
    label: "Weave",
    start: 18,
    duration: 11,
    tone: "goat-hair",
    children: [
      { value: "border-start", label: "Border", start: 18, duration: 2, tone: "goat-hair" },
      { value: "flank-start", label: "Flank", start: 20, duration: 3, tone: "goat-hair" },
      { value: "centre", label: "Centre", start: 23, duration: 3, tone: "goat-hair" },
      { value: "flank-end", label: "Flank", start: 26, duration: 2, tone: "goat-hair" },
      { value: "border-end", label: "Border", start: 28, duration: 1, tone: "goat-hair" },
    ],
  },
  { value: "finish", label: "Finish", start: 29, duration: 2, tone: "goat-hair" },
]

const TONES = new Map<string, DyeWaterfallTone>()
const collectTones = (stages: readonly Stage[]): void =>
  stages.forEach((stage) => {
    TONES.set(stage.value, stage.tone)
    if (stage.children) collectTones(stage.children)
  })
collectTones(ORDER_14)

function WaterfallDemo({ ticks }: { ticks: number }): ReactElement {
  const [expanded, setExpanded] = useState<string[]>(["weave"])
  const [selected, setSelected] = useState<string | null>("centre")
  const rows = visibleWaterfallRows(ORDER_14, expanded)
  return (
    <DyeWaterfall
      aria-label="Order 14, 31 days"
      items={ORDER_14}
      range={[0, 34]}
      expanded={expanded}
      onExpandedChange={setExpanded}
      value={selected}
      onValueChange={setSelected}
      format={(value: number) => `Day ${value}`}
      getBarLabel={(item: WaterfallDataItem) => `Day ${item.start} to day ${item.start + item.duration}, ${item.duration} days`}
      className="demo-waterfall"
    >
      <DyeWaterfallHeaderRow>
        <DyeWaterfallColumnHeader>Order 14</DyeWaterfallColumnHeader>
        <DyeWaterfallColumnHeader>Days</DyeWaterfallColumnHeader>
        <DyeWaterfallColumnHeader aria-label="Timeline">
          <DyeWaterfallAxis maxTicks={ticks} />
          <DyeWaterfallMark time={27}>Eid</DyeWaterfallMark>
        </DyeWaterfallColumnHeader>
      </DyeWaterfallHeaderRow>
      {rows.map(({ item }) => (
        <DyeWaterfallRow key={item.value} value={item.value}>
          <DyeWaterfallRowHeader>
            {item.children && <DyeWaterfallIndicator />}
            {item.label}
          </DyeWaterfallRowHeader>
          <DyeWaterfallCell>{item.duration}</DyeWaterfallCell>
          <DyeWaterfallBar tone={TONES.get(item.value)} />
        </DyeWaterfallRow>
      ))}
    </DyeWaterfall>
  )
}

const SNIPPETS: readonly CodeSnippet[] = [
  {
    value: "react",
    label: "React",
    fileName: "order-band.tsx",
    highlight: [7, 8, 9, 10, 11],
    code: `import type { ReactElement } from "react"
import { INK, MOTIFS, Rug, WOOLS, Weave } from "./sadu"

export function OrderBand(): ReactElement {
  return (
    <figure className="order-band">
      <Rug motif="dhalla" dye={WOOLS.madder.hex} />
      <Weave
        grid={MOTIFS.dhurs.grid}
        colors={{ ground: INK.black, dye: WOOLS.saffron.hex, accent: INK.wool }}
        level="stitch"
      />
      <figcaption>Dhalla, ribs</figcaption>
    </figure>
  )
}`,
  },
  {
    value: "css",
    label: "CSS",
    fileName: "order-band.css",
    highlight: [3],
    code: `.order-band {
  display: grid;
  gap: 12px;
  max-width: 480px;
}

.order-band figcaption {
  font: 600 12px/16px var(--sadu-font);
  color: var(--sadu-ink-2);
}`,
  },
]

function CodeBlockDemo({ maxHeight }: { maxHeight: number }): ReactElement {
  return <CodeBlock className="demo-code" snippets={SNIPPETS} maxHeight={maxHeight} />
}

const ORIENTATIONS = ["horizontal", "vertical"] as const

const DISPLAY: readonly EntryDefinition[] = [
  {
    id: "weaver-avatar",
    name: "Avatar",
    base: "Avatar",
    playground: playground(
      {
        size: knob.choice("Size", ["64", "40"], "64", { labels: { "64": "64", "40": "40" } }),
        status: knob.choice("Status", ["present", "away", "none"], "present"),
      },
      (values) => <AvatarDemo {...values} />,
    ),
  },
  {
    id: "thread-separator",
    name: "Separator",
    base: "Separator",
    playground: playground({ variant: knob.choice("First rule", ["thread", "cord"], "cord") }, (values) => <SeparatorDemo {...values} />),
  },
  {
    id: "wool-meter",
    name: "Meter",
    base: "Meter",
    playground: playground({ tension: knob.number("Warp tension, kg", 18, { min: 0, max: 30 }) }, (values) => <MeterDemo {...values} />),
  },
  {
    id: "beam-resizable",
    name: "Resizable",
    base: "Resizable",
    playground: playground(
      { dye: knob.dye(), orientation: knob.choice("Orientation", ORIENTATIONS, "horizontal", { remount: true }) },
      (values) => <ResizableDemo {...values} />,
    ),
  },
  {
    id: "wood-scroll-area",
    name: "Scroll Area",
    base: "Scroll Area",
    playground: playground(
      { type: knob.choice("Scrollbar", ["auto", "always", "hover"], "auto", { remount: true }) },
      (values) => <ScrollAreaDemo {...values} />,
    ),
  },
  {
    id: "warp-timeline",
    name: "Timeline",
    base: "Timeline",
    playground: playground({ start: knob.number("Current step", 3, { min: 0, max: 5, remount: true }) }, (values) => <TimelineDemo {...values} />),
  },
  {
    id: "code-block",
    name: "Code Block",
    base: "Tabs",
    playground: playground({ maxHeight: knob.number("Max height", 300, { min: 160, max: 600, step: 20 }) }, (values) => <CodeBlockDemo {...values} />),
  },
  {
    id: "loom-progress",
    name: "Progress",
    base: "Progress",
    playground: playground(
      {
        dye: knob.dye(),
        motif: knob.motif("uwairjan"),
        size: knob.choice("Size", ["lg", "sm"], "lg", { labels: { lg: "Large", sm: "Small" } }),
        indeterminate: knob.toggle("Indeterminate"),
      },
      (values) => <ProgressDemo {...values} />,
    ),
  },
  {
    id: "dye-waterfall",
    name: "Waterfall",
    base: "Waterfall",
    playground: playground({ ticks: knob.number("Axis ticks", 6, { min: 2, max: 12 }) }, (values) => <WaterfallDemo {...values} />),
  },
]

export { DISPLAY }
