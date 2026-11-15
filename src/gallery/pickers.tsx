import type { ReactElement } from "react"
import { MOTIFS, type MotifId } from "../sadu/motifs"
import { WOOLS } from "../sadu/palette"
import { Rug } from "../sadu/rug"
import { SaduCalendar } from "../sadu/sadu-calendar"
import { SaduCarousel, SaduCarouselItem } from "../sadu/sadu-carousel"
import { SaduCheckbox, SaduCheckboxGroup } from "../sadu/sadu-checkbox"
import { SaduColorPicker } from "../sadu/sadu-color-picker"
import { SaduDatePicker, type DatePreset } from "../sadu/sadu-date-picker"
import { SaduFileInput } from "../sadu/sadu-file-input"
import { SaduImageCropper, wovenPhoto, type CropAspect } from "../sadu/sadu-image-cropper"
import { SaduListbox, SaduListboxItem, SaduListboxSwatch } from "../sadu/sadu-listbox"
import { SaduTree, SaduTreeItem } from "../sadu/sadu-tree"
import { arabicCount } from "../sadu/locale"
import { Card, GallerySection } from "./card"
import { useArabic, useT } from "./locale"

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

function deliveryPresets(arabic: boolean): DatePreset[] {
  return [
    { label: arabic ? "بعد أسبوعين" : "In two weeks", value: isoOf(TODAY + 14 * DAY_MS) },
    { label: arabic ? "قبل العيد" : "Before Eid", value: isoOf(nextEid(TODAY) - 2 * DAY_MS) },
    { label: arabic ? "نهاية الشهر" : "End of month", value: isoOf(Date.UTC(NOW.getFullYear(), NOW.getMonth() + 1, 0)) },
  ]
}

const BANDS: readonly { value: string; motif: MotifId; dye: string; border?: true }[] = [
  { value: "border-top", motif: "dhurs", dye: WOOLS.madder.hex, border: true },
  { value: "dhalla-top", motif: "dhalla", dye: WOOLS.saffron.hex },
  { value: "uwairjan-top", motif: "uwairjan", dye: WOOLS.madder.hex },
  { value: "shajarah", motif: "shajarah", dye: WOOLS.saffron.hex },
  { value: "uwairjan-bottom", motif: "uwairjan", dye: WOOLS.madder.hex },
  { value: "dhalla-bottom", motif: "dhalla", dye: WOOLS.saffron.hex },
  { value: "border-bottom", motif: "dhurs", dye: WOOLS.madder.hex, border: true },
]

function bandLabel(band: (typeof BANDS)[number], arabic: boolean): string {
  if (band.border) return arabic ? "الحاشية" : "Border"
  return arabic ? MOTIFS[band.motif].arabic : MOTIFS[band.motif].name
}

type Bilingual = { en: string; ar: string }

const FINISHING: readonly { value: string; label: Bilingual; detail: Bilingual }[] = [
  {
    value: "fringe",
    label: { en: "Fringe at both ends", ar: "أهداب عند الطرفين" },
    detail: { en: "Twisted from the cut warp", ar: "مفتولة من أطراف السدى المقصوصة" },
  },
  { value: "tassels", label: { en: "Tassels", ar: "شرّابات" }, detail: { en: "Four, in the border dye", ar: "أربع، بلون صبغة الحاشية" } },
  { value: "lining", label: { en: "Lining", ar: "بطانة" }, detail: { en: "Cotton backing for the majlis floor", ar: "ظهر قطني لأرضية المجلس" } },
]

const RUGS: readonly { motif: MotifId; dye: string; name: Bilingual; detail: Bilingual }[] = [
  { motif: "eyoun", dye: WOOLS.madder.hex, name: { en: "Tent divider", ar: "قاطع الخيمة" }, detail: { en: "Umm Saad, Jahra · 4.2 m", ar: "أم سعد، الجهراء · 4.2 م" } },
  { motif: "shajarah", dye: WOOLS.saffron.hex, name: { en: "Majlis runner", ar: "مفرش المجلس" }, detail: { en: "Hessa, Ahmadi · 3.1 m", ar: "حصة، الأحمدي · 3.1 م" } },
  { motif: "uwairjan", dye: WOOLS.camel.light, name: { en: "Camel bag", ar: "حقيبة الجمل" }, detail: { en: "Noura, Wafra · 1.4 m", ar: "نورة، الوفرة · 1.4 م" } },
  { motif: "dhalla", dye: WOOLS.madder.light, name: { en: "Floor cushion", ar: "مسند أرضي" }, detail: { en: "Mariam, Sulaibiya · 0.9 m", ar: "مريم، الصليبية · 0.9 م" } },
  { motif: "hubub", dye: WOOLS.saffron.dark, name: { en: "Saddle cloth", ar: "غطاء الشداد" }, detail: { en: "Umm Saad, Jahra · 1.2 m", ar: "أم سعد، الجهراء · 1.2 م" } },
]

const DRAFTS = [
  new File([new Uint8Array(240_000)], "uwairjan-border.pdf", { type: "application/pdf" }),
  new File([new Uint8Array(1_200_000)], "divider-draft-3.png", { type: "image/png" }),
]

const DRAFT_COUNT = { one: "مخطط واحد", two: "مخططين", few: "مخططات", many: "مخططًا", other: "مخطط" }

function aspects(arabic: boolean): CropAspect[] {
  return [
    { label: arabic ? "مربع" : "Square", value: 1 },
    { label: arabic ? "مسند 3:2" : "Cushion 3:2", value: 3 / 2 },
    { label: arabic ? "شريط 4:1" : "Band 4:1", value: 4 },
  ]
}

const WOVEN_PHOTO = wovenPhoto(720, 480)

function DatePickers(): ReactElement {
  const t = useT()
  const arabic = useArabic()
  const presets = deliveryPresets(arabic)
  return (
    <div style={{ display: "grid", gap: 24, width: "100%", justifyItems: "center" }}>
      <SaduDatePicker label={t("Delivery date", "موعد التسليم")} presets={presets} defaultValue={presets[0]?.value} />
      <SaduDatePicker label={t("Shearing week", "أسبوع الجزّ")} mode="range" defaultValue={["2026-11-23", "2026-11-27"]} />
    </div>
  )
}

function FileDrafts(): ReactElement {
  const t = useT()
  return (
    <SaduFileInput
      multiple
      accept=".pdf,.png"
      defaultValue={DRAFTS}
      prompt={t("Drop pattern drafts here or", "أفلت مخططات النقوش هنا أو")}
      hint={t("PDF or PNG, up to 10 MB", "ملفات PDF أو PNG، حتى 10 ميغابايت")}
      dropLabel={(count) => t(`Let go to add ${count} ${count === 1 ? "draft" : "drafts"}`, `أفلت لإضافة ${arabicCount(count, DRAFT_COUNT)}`)}
      rejectHint={t("Only PDF and PNG drafts", "تُقبل المخططات بصيغة PDF أو PNG فقط")}
      listLabel={t("Pattern drafts", "مخططات النقوش")}
      progressOf={(file) => (file.name === "divider-draft-3.png" ? 0.62 : undefined)}
    />
  )
}

function BandList(): ReactElement {
  const t = useT()
  const arabic = useArabic()
  const bands = BANDS.map((band) => ({ ...band, label: bandLabel(band, arabic) }))
  return (
    <SaduListbox label={t("Bands in this piece", "أشرطة هذه القطعة")} defaultValue={["dhalla-top", "uwairjan-top", "shajarah"]}>
      {bands.map((band) => (
        <SaduListboxItem key={band.value} value={band.value} label={band.label} swatch={<SaduListboxSwatch motif={band.motif} dye={band.dye} />}>
          {band.label}
        </SaduListboxItem>
      ))}
    </SaduListbox>
  )
}

function Cropper(): ReactElement {
  const t = useT()
  const shapes = aspects(useArabic())
  return (
    <SaduImageCropper
      src={WOVEN_PHOTO}
      alt={t("A tent divider woven with Ain, Shajarah and Uwairjan bands", "قاطع خيمة منسوج بأشرطة العين والشجرة وعويرجان")}
      aria-label={t("Listing photo", "صورة الإعلان")}
      aspects={shapes}
      defaultAspectRatio={4}
    />
  )
}

function OrderTree(): ReactElement {
  const t = useT()
  const arabicPage = useArabic()
  const motifLabels = (id: MotifId): { label: string; arabic?: string } =>
    arabicPage ? { label: MOTIFS[id].arabic } : { label: MOTIFS[id].name, arabic: MOTIFS[id].arabic }
  return (
    <SaduTree aria-label={t("Order 14", "الطلب 14")} defaultExpanded={["order", "divider", "centre", "shajarah"]} defaultValue="eye">
      <SaduTreeItem value="order" label={t("Order 14", "الطلب 14")} meta={t("Hessa", "حصة")}>
        <SaduTreeItem value="divider" label={t("Majlis divider", "قاطع المجلس")}>
          <SaduTreeItem value="border" label={t("Border", "الحاشية")}>
            <SaduTreeItem value="dhalla" {...motifLabels("dhalla")} />
            <SaduTreeItem value="hubub" {...motifLabels("hubub")} />
          </SaduTreeItem>
          <SaduTreeItem value="flank" label={t("Flank", "الجانب")}>
            <SaduTreeItem value="uwairjan" {...motifLabels("uwairjan")} />
          </SaduTreeItem>
          <SaduTreeItem value="centre" label={t("Centre", "الوسط")}>
            <SaduTreeItem value="shajarah" {...motifLabels("shajarah")}>
              <SaduTreeItem value="hourglass" label={t("Hourglass", "ساعة رملية")} />
              <SaduTreeItem value="eye" label={t("Eye", "عين")} />
              <SaduTreeItem value="earrings" label={t("Earrings", "أقراط")} />
              <SaduTreeItem value="comb" label={t("Comb", "مشط")} />
            </SaduTreeItem>
          </SaduTreeItem>
        </SaduTreeItem>
      </SaduTreeItem>
    </SaduTree>
  )
}

function Finishing(): ReactElement {
  const t = useT()
  const locale = useArabic() ? "ar" : "en"
  return (
    <SaduCheckboxGroup legend={t("Include in the piece", "إضافات القطعة")} defaultValue={["fringe"]} allValues={FINISHING.map((item) => item.value)}>
      <SaduCheckbox parent>{t("All finishing", "كل التشطيبات")}</SaduCheckbox>
      <div style={{ display: "grid", paddingInlineStart: 28 }}>
        {FINISHING.map((item) => (
          <SaduCheckbox key={item.value} value={item.value} description={item.detail[locale]}>
            {item.label[locale]}
          </SaduCheckbox>
        ))}
      </div>
    </SaduCheckboxGroup>
  )
}

function Workshop(): ReactElement {
  const t = useT()
  const locale = useArabic() ? "ar" : "en"
  const rugs = RUGS.map((rug) => ({ ...rug, id: rug.name.en, name: rug.name[locale], detail: rug.detail[locale] }))
  return (
    <SaduCarousel
      aria-label={t("Pieces from the workshop", "قطع من المشغل")}
      indicatorLabel={(page) => rugs[page - 1]?.name ?? t(`Piece ${page}`, `القطعة ${page}`)}
      indicatorsLabel={t("Choose a piece", "اختيار قطعة")}
    >
      {rugs.map((rug) => (
        <SaduCarouselItem key={rug.id} caption={rug.name} detail={rug.detail}>
          <Rug motif={rug.motif} dye={rug.dye} />
        </SaduCarouselItem>
      ))}
    </SaduCarousel>
  )
}

function PickersGallery(): ReactElement {
  const t = useT()
  return (
    <GallerySection
      title="Pickers and lists"
      lede="Dates, dyes, drafts and lists for planning a piece."
      arabicTitle="أدوات الاختيار والقوائم"
      arabicLede="تواريخ وصبغات ومخططات وقوائم لتخطيط القطعة."
    >
      <Card
        name="Calendar"
        idea="A range is a woven band, beaten in day by day and cut where weeks wrap."
        arabicIdea="الفترة شريط منسوج يُرصّ يومًا بعد يوم، ويُقصّ حيث ينتهي الأسبوع."
        wide
      >
        <SaduCalendar
          mode="range"
          months={2}
          defaultMonth="2026-11"
          defaultValue={["2026-12-12", "2026-12-20"]}
          unavailable={["2026-12-22", "2026-12-23"]}
          aria-label={t("Loom booked, 3 to 11 Rajab", "النول محجوز من 3 إلى 11 رجب")}
        />
      </Card>
      <Card name="Date Picker" idea="The calendar hangs from a woven selvedge." arabicIdea="التقويم معلّق بحافة منسوجة.">
        <DatePickers />
      </Card>
      <Card
        name="Color Picker"
        idea="Natural dyes as skeins; the mixer is dyed wool, judged as cloth."
        arabicIdea="صبغات طبيعية على هيئة شلل، ومساحة المزج صوف مصبوغ يظهر كما سيبدو في القماش."
      >
        <SaduColorPicker
          label={t("Border dye", "صبغة الحاشية")}
          defaultValue={WOOLS.madder.hex}
          saved={[{ id: "henna", name: t("Henna", "حنّاء"), hex: "#9b4a1f" }]}
        />
      </Card>
      <Card name="File Input" idea="An empty loom; each draft weaves in as a band." arabicIdea="نول فارغ، وكل مخطط يُنسج فيه شريطًا.">
        <FileDrafts />
      </Card>
      <Card name="Listbox" idea="Chosen bands join into one run, each marked with a woven eye." arabicIdea="الأشرطة المختارة تتصل في مسار واحد، ولكل منها عين منسوجة.">
        <BandList />
      </Card>
      <Card name="Image Cropper" idea="Pegged like a ground loom; thirds are wool threads." arabicIdea="مثبّت بالأوتاد كنول أرضي، وخطوط الأثلاث خيوط من صوف." wide>
        <Cropper />
      </Card>
      <Card name="Tree" idea="Children hang from warp threads, tied on with knots." arabicIdea="الفروع تتدلّى من خيوط السدى، مربوطة بعُقد.">
        <OrderTree />
      </Card>
      <Card name="Checkbox" idea="The check is woven float by float, stroke by stroke." arabicIdea="علامة الاختيار تُنسج غرزةً غرزة، خطًّا بعد خط.">
        <Finishing />
      </Card>
      <Card name="Carousel" idea="Rugs wound between two wooden beams." arabicIdea="بُسط ملفوفة بين عارضتين من الخشب." wide>
        <Workshop />
      </Card>
    </GallerySection>
  )
}

export { PickersGallery }
