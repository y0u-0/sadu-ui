import type { ReactElement } from "react"
import { MOTIFS, type MotifId } from "../../sadu/motifs"
import { WOOLS, type WoolId } from "../../sadu/palette"
import { Rug } from "../../sadu/rug"
import { SaduCalendar } from "../../sadu/sadu-calendar"
import { SaduCarousel, SaduCarouselItem } from "../../sadu/sadu-carousel"
import { SaduCheckbox, SaduCheckboxGroup } from "../../sadu/sadu-checkbox"
import { SaduColorPicker } from "../../sadu/sadu-color-picker"
import { SaduDatePicker, type DatePreset } from "../../sadu/sadu-date-picker"
import { SaduFileInput } from "../../sadu/sadu-file-input"
import { SaduImageCropper, wovenPhoto, type CropAspect } from "../../sadu/sadu-image-cropper"
import { SaduListbox, SaduListboxItem, SaduListboxSwatch } from "../../sadu/sadu-listbox"
import { SaduTree, SaduTreeItem } from "../../sadu/sadu-tree"
import { knob } from "../knobs"
import { playground, type EntryDefinition } from "./define"

const DAY_MS = 86_400_000

function isoOf(time: number): string {
  return new Date(time).toISOString().slice(0, 10)
}

function nextEid(from: number): number {
  const hijri = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { month: "numeric", day: "numeric", timeZone: "UTC" })
  for (let time = from; time < from + 400 * DAY_MS; time += DAY_MS) {
    const parts = hijri.formatToParts(new Date(time))
    if (parts.find((part) => part.type === "month")?.value === "10" && parts.find((part) => part.type === "day")?.value === "1") return time
  }
  return from
}

const NOW = new Date()
const TODAY = Date.UTC(NOW.getFullYear(), NOW.getMonth(), NOW.getDate())
const MONTH = isoOf(TODAY).slice(0, 7)
const DELIVERY_PRESETS: readonly DatePreset[] = [
  { label: "In two weeks", value: isoOf(TODAY + 14 * DAY_MS) },
  { label: "Before Eid", value: isoOf(nextEid(TODAY) - 2 * DAY_MS) },
  { label: "End of month", value: isoOf(Date.UTC(NOW.getFullYear(), NOW.getMonth() + 1, 0)) },
]

function CalendarDemo({ months, mode }: { months: number; mode: "single" | "range" }): ReactElement {
  const booked = [isoOf(TODAY + 8 * DAY_MS), isoOf(TODAY + 16 * DAY_MS)] as const
  const blocked = [isoOf(TODAY + 18 * DAY_MS), isoOf(TODAY + 19 * DAY_MS)]
  return mode === "range" ? (
    <SaduCalendar mode="range" months={months} defaultMonth={MONTH} defaultValue={[...booked]} unavailable={blocked} aria-label="Loom booked for order 14" />
  ) : (
    <SaduCalendar months={months} defaultMonth={MONTH} defaultValue={booked[0]} unavailable={blocked} aria-label="Delivery day for order 14" />
  )
}

function DatePickerDemo({ presets }: { presets: boolean }): ReactElement {
  return (
    <div className="demo-narrow">
      <SaduDatePicker label="Delivery date" presets={presets ? DELIVERY_PRESETS : undefined} defaultValue={DELIVERY_PRESETS[0]?.value} />
    </div>
  )
}

function ColorPickerDemo({ dye }: { dye: WoolId }): ReactElement {
  return (
    <div className="demo-narrow">
      <SaduColorPicker label="Border dye" defaultValue={WOOLS[dye].hex} saved={[{ id: "henna", name: "Henna", hex: "#9b4a1f" }]} />
    </div>
  )
}

const DRAFTS = [
  new File([new Uint8Array(240_000)], "uwairjan-border.pdf", { type: "application/pdf" }),
  new File([new Uint8Array(1_200_000)], "divider-draft-3.png", { type: "image/png" }),
]

function FileInputDemo({ multiple, disabled }: { multiple: boolean; disabled: boolean }): ReactElement {
  return (
    <SaduFileInput
      multiple={multiple}
      disabled={disabled}
      accept=".pdf,.png"
      defaultValue={multiple ? DRAFTS : DRAFTS.slice(0, 1)}
      prompt={multiple ? "Drop pattern drafts here or" : "Drop the pattern draft here or"}
      hint="PDF or PNG, up to 10 MB"
      dropLabel={(count) => `Let go to add ${count} ${count === 1 ? "draft" : "drafts"}`}
      rejectHint="Only PDF and PNG drafts"
      listLabel="Pattern drafts"
      progressOf={(file) => (file.name === "divider-draft-3.png" ? 0.62 : undefined)}
    />
  )
}

const BANDS: readonly { value: string; label: string; motif: MotifId; wool: WoolId }[] = [
  { value: "border-top", label: "Border", motif: "dhurs", wool: "madder" },
  { value: "dhalla-top", label: "Dhalla", motif: "dhalla", wool: "saffron" },
  { value: "uwairjan-top", label: "Uwairjan", motif: "uwairjan", wool: "madder" },
  { value: "shajarah", label: "Shajarah", motif: "shajarah", wool: "saffron" },
  { value: "uwairjan-bottom", label: "Uwairjan", motif: "uwairjan", wool: "madder" },
  { value: "border-bottom", label: "Border", motif: "dhurs", wool: "madder" },
]

function ListboxDemo({ dye }: { dye: WoolId }): ReactElement {
  return (
    <SaduListbox label="Bands in this piece" defaultValue={["dhalla-top", "uwairjan-top", "shajarah"]}>
      {BANDS.map((band) => (
        <SaduListboxItem
          key={band.value}
          value={band.value}
          label={band.label}
          swatch={<SaduListboxSwatch motif={band.motif} dye={band.wool === "madder" ? WOOLS[dye].hex : WOOLS[band.wool].hex} />}
        >
          {band.label}
        </SaduListboxItem>
      ))}
    </SaduListbox>
  )
}

const ASPECTS: readonly CropAspect[] = [
  { label: "Square", value: 1 },
  { label: "Cushion 3:2", value: 3 / 2 },
  { label: "Band 4:1", value: 4 },
]

const WOVEN_PHOTO = wovenPhoto(720, 480)

function CropperDemo({ aspect }: { aspect: "1" | "1.5" | "4" }): ReactElement {
  return (
    <SaduImageCropper
      src={WOVEN_PHOTO}
      alt="A tent divider woven with eye, tree and zigzag bands"
      aria-label="Listing photo"
      aspects={ASPECTS}
      defaultAspectRatio={Number(aspect)}
    />
  )
}

const FINISHING = [
  { value: "fringe", label: "Fringe at both ends" },
  { value: "binding", label: "Goat-hair binding" },
  { value: "lining", label: "Lining" },
] as const

function CheckboxDemo({ disabled }: { disabled: boolean }): ReactElement {
  return (
    <SaduCheckboxGroup legend="Include in the piece" defaultValue={["fringe"]} allValues={FINISHING.map((item) => item.value)} disabled={disabled}>
      <SaduCheckbox parent>All finishing</SaduCheckbox>
      <div className="demo-indent">
        {FINISHING.map((item) => (
          <SaduCheckbox key={item.value} value={item.value}>
            {item.label}
          </SaduCheckbox>
        ))}
      </div>
    </SaduCheckboxGroup>
  )
}

function TreeDemo(): ReactElement {
  return (
    <SaduTree aria-label="Order 14" defaultExpanded={["order", "divider", "centre"]} defaultValue="shajarah">
      <SaduTreeItem value="order" label="Order 14" meta="Hessa">
        <SaduTreeItem value="divider" label="Majlis divider">
          <SaduTreeItem value="border" label="Border">
            <SaduTreeItem value="dhalla" label={MOTIFS.dhalla.name} arabic={MOTIFS.dhalla.arabic} />
            <SaduTreeItem value="hubub" label={MOTIFS.hubub.name} arabic={MOTIFS.hubub.arabic} />
          </SaduTreeItem>
          <SaduTreeItem value="flank" label="Flank">
            <SaduTreeItem value="uwairjan" label={MOTIFS.uwairjan.name} arabic={MOTIFS.uwairjan.arabic} />
          </SaduTreeItem>
          <SaduTreeItem value="centre" label="Centre">
            <SaduTreeItem value="shajarah" label={MOTIFS.shajarah.name} arabic={MOTIFS.shajarah.arabic}>
              <SaduTreeItem value="eye" label="Eye" />
              <SaduTreeItem value="comb" label="Comb" />
            </SaduTreeItem>
          </SaduTreeItem>
        </SaduTreeItem>
      </SaduTreeItem>
    </SaduTree>
  )
}

const RUGS: readonly { motif: MotifId; wool: WoolId | null; name: string; detail: string }[] = [
  { motif: "eyoun", wool: null, name: "Tent divider", detail: "Umm Saad, Jahra · 4.2 m" },
  { motif: "shajarah", wool: "saffron", name: "Majlis runner", detail: "Hessa, Ahmadi · 3.1 m" },
  { motif: "uwairjan", wool: "camel", name: "Camel bag", detail: "Noura, Wafra · 1.4 m" },
  { motif: "dhalla", wool: "indigo", name: "Floor cushion", detail: "Mariam, Sulaibiya · 0.9 m" },
]

function CarouselDemo({ dye }: { dye: WoolId }): ReactElement {
  return (
    <SaduCarousel
      aria-label="Pieces from the workshop"
      indicatorLabel={(page) => RUGS[page - 1]?.name ?? `Piece ${page}`}
      indicatorsLabel="Choose a piece"
    >
      {RUGS.map((rug) => (
        <SaduCarouselItem key={rug.name} caption={rug.name} detail={rug.detail}>
          <Rug motif={rug.motif} dye={WOOLS[rug.wool ?? dye].hex} />
        </SaduCarouselItem>
      ))}
    </SaduCarousel>
  )
}

const PICKERS: readonly EntryDefinition[] = [
  {
    id: "sadu-calendar",
    name: "Calendar",
    base: "Calendar",
    playground: playground(
      {
        mode: knob.choice("Mode", ["range", "single"], "range", { remount: true }),
        months: knob.choice("Months", ["1", "2"], "2", { remount: true }),
      },
      (values) => <CalendarDemo mode={values.mode} months={Number(values.months)} />,
    ),
  },
  {
    id: "sadu-date-picker",
    name: "Date Picker",
    base: "Date Picker",
    playground: playground({ presets: knob.toggle("Presets", true, { remount: true }) }, (values) => <DatePickerDemo {...values} />),
  },
  {
    id: "sadu-color-picker",
    name: "Color Picker",
    base: "Color Picker",
    playground: playground({ dye: knob.dye("Starting dye") }, (values) => <ColorPickerDemo key={values.dye} {...values} />),
  },
  {
    id: "sadu-file-input",
    name: "File Input",
    base: "File Input",
    playground: playground(
      { multiple: knob.toggle("Several drafts", true, { remount: true }), disabled: knob.toggle("Disabled") },
      (values) => <FileInputDemo {...values} />,
    ),
  },
  {
    id: "sadu-listbox",
    name: "Listbox",
    base: "Listbox",
    playground: playground({ dye: knob.dye() }, (values) => <ListboxDemo {...values} />),
  },
  {
    id: "sadu-image-cropper",
    name: "Image Cropper",
    base: "Image Cropper",
    playground: playground(
      { aspect: knob.choice("Aspect", ["4", "1.5", "1"], "4", { labels: { "4": "Band 4:1", "1.5": "Cushion 3:2", "1": "Square" }, remount: true }) },
      (values) => <CropperDemo {...values} />,
    ),
  },
  {
    id: "sadu-checkbox",
    name: "Checkbox",
    base: "Checkbox",
    playground: playground({ disabled: knob.toggle("Disabled") }, (values) => <CheckboxDemo {...values} />),
  },
  {
    id: "sadu-tree",
    name: "Tree",
    base: "Tree",
    playground: playground({}, () => <TreeDemo />),
  },
  {
    id: "sadu-carousel",
    name: "Carousel",
    base: "Carousel",
    playground: playground({ dye: knob.dye() }, (values) => <CarouselDemo {...values} />),
  },
]

export { PICKERS }
