import { visibleWaterfallRows, type WaterfallDataItem } from "@ui-sdk/react/waterfall"
import { useState, type CSSProperties, type ReactElement } from "react"
import { BeamResizable, BeamResizableHandle, BeamResizablePanel } from "../sadu/beam-resizable"
import { CodeBlock, type CodeSnippet } from "../sadu/code-block"
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
} from "../sadu/dye-waterfall"
import { LoomProgress } from "../sadu/loom-progress"
import { MOTIFS } from "../sadu/motifs"
import { INK, WOOLS } from "../sadu/palette"
import { SaduButton } from "../sadu/sadu-button"
import { ThreadSeparator } from "../sadu/thread-separator"
import {
  WarpTimeline,
  WarpTimelineConnector,
  WarpTimelineDescription,
  WarpTimelineItem,
  WarpTimelineMarker,
  WarpTimelineTime,
  WarpTimelineTitle,
} from "../sadu/warp-timeline"
import { Weave } from "../sadu/weave"
import { WeaverAvatar, WeaverAvatarGroup } from "../sadu/weaver-avatar"
import { WoodScrollArea } from "../sadu/wood-scroll-area"
import { WoolMeter } from "../sadu/wool-meter"
import saduHouse from "../assets/avatars/sadu-house.jpg"
import { arabicCount } from "../sadu/locale"
import { Card, GallerySection } from "./card"
import { useArabic, useT } from "./locale"

const STACK: CSSProperties = { display: "grid", gap: 20, width: "100%" }
const LABEL: CSSProperties = { font: "600 12px/16px var(--sadu-font)", letterSpacing: "0.01em", color: "var(--sadu-ink-2)" }
const BODY: CSSProperties = { font: "14px/20px var(--sadu-font)", color: "var(--sadu-ink)" }
const MUTED: CSSProperties = { font: "13px/18px var(--sadu-font)", color: "var(--sadu-ink-2)" }
const STRONG: CSSProperties = { font: "600 14px/20px var(--sadu-font)", color: "var(--sadu-ink)" }

function AvatarDemo(): ReactElement {
  const t = useT()
  return (
    <div style={{ ...STACK, gap: 24, maxWidth: 280 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <WeaverAvatar size={64} name={t("Umm Saad", "أم سعد")} status="present" />
        <div style={{ display: "grid" }}>
          <span style={STRONG}>{t("Umm Saad", "أم سعد")}</span>
          <span style={MUTED}>{t("Master weaver, at the loom", "نسّاجة ماهرة، على النول")}</span>
        </div>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        <span style={LABEL}>{t("Weaving order 14", "تنسج الطلب 14")}</span>
        <WeaverAvatarGroup label={t("Weavers on order 14", "النسّاجات في الطلب 14")} max={4}>
          <WeaverAvatar name={t("Hessa", "حصة")} />
          <WeaverAvatar name={t("Noura", "نورة")} />
          <WeaverAvatar name={t("Mariam", "مريم")} />
          <WeaverAvatar name={t("Badriya", "بدرية")} status="away" />
          <WeaverAvatar name={t("Lulwa", "لولوة")} />
          <WeaverAvatar name={t("Dalal", "دلال")} />
        </WeaverAvatarGroup>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <WeaverAvatar size={40} name={t("Sadu House", "بيت السدو")} src={saduHouse} />
        <div style={{ display: "grid" }}>
          <span style={STRONG}>{t("Sadu House", "بيت السدو")}</span>
          <span style={MUTED}>{t("The workshop, Kuwait City", "المشغل، مدينة الكويت")}</span>
        </div>
      </div>
    </div>
  )
}

function SeparatorDemo(): ReactElement {
  const t = useT()
  return (
    <div style={{ ...STACK, gap: 14, maxWidth: 280 }}>
      <div style={{ display: "grid", gap: 2 }}>
        <span style={LABEL}>{t("Client", "العميلة")}</span>
        <span style={BODY}>{t("Umm Saad, majlis in Al Jahra", "أم سعد، مجلس في الجهراء")}</span>
      </div>
      <ThreadSeparator />
      <div style={{ display: "grid", gap: 2 }}>
        <span style={LABEL}>{t("Band", "الشريط")}</span>
        <span style={BODY}>{t("Dhurus border, 3.2 metres", "حاشية ضروس الخيل، 3.2 متر")}</span>
      </div>
      <ThreadSeparator />
      <div style={{ display: "grid", gap: 2 }}>
        <span style={LABEL}>{t("Delivery", "التوصيل")}</span>
        <span style={BODY}>{t("To the majlis by Thursday", "إلى المجلس قبل الخميس")}</span>
      </div>
      <ThreadSeparator label={t("or", "أو")} decorative />
      <span style={BODY}>{t("Collect from Sadu House", "الاستلام من بيت السدو")}</span>
      <ThreadSeparator variant="cord" style={{ marginTop: 10 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, height: 20 }}>
        <span style={STRONG}>{t("145.000 KD", "145.000 د.ك")}</span>
        <ThreadSeparator orientation="vertical" />
        <span style={MUTED}>{t("Deposit paid", "دُفع العربون")}</span>
      </div>
    </div>
  )
}

function MeterDemo(): ReactElement {
  const t = useT()
  return (
    <div style={{ ...STACK, gap: 22, justifyItems: "center" }}>
      <span style={{ ...LABEL, maxWidth: 238, width: "100%" }}>{t("On the loom today", "على النول اليوم")}</span>
      <WoolMeter
        label={t("Warp tension", "شدّ السدى")}
        value={18}
        max={30}
        low={10}
        high={24}
        format={{ style: "unit", unit: "kilogram" }}
        zoneLabels={{ low: t("slack", "رخو"), optimum: t("even", "معتدل"), high: t("tight", "مشدود") }}
      />
      <WoolMeter
        label={t("Spun wool", "الصوف المغزول")}
        value={3}
        max={20}
        low={5}
        high={17}
        format={(value) => t(`${value} of 20 skeins`, `${value} من 20 شلة`)}
        zoneLabels={{ low: t("low", "قليل"), optimum: t("enough", "كافٍ"), high: t("overstocked", "فائض") }}
      />
      <WoolMeter
        label={t("Orders booked", "الطلبات المحجوزة")}
        value={19}
        max={20}
        low={4}
        high={16}
        format={(value) => t(`${value} of 20`, `${value} من 20`)}
        zoneLabels={{ low: t("quiet", "هادئ"), optimum: t("steady", "منتظم"), high: t("overbooked", "فوق الطاقة") }}
      />
    </div>
  )
}

const ROWS_IN_ORDER = 96
const ROWS_WOVEN = 46

function ProgressDemo(): ReactElement {
  const t = useT()
  const arabic = useArabic()
  const [rows, setRows] = useState(ROWS_WOVEN)
  const ofRows = arabic ? `من ${ROWS_IN_ORDER} صفًا` : `of ${ROWS_IN_ORDER} rows`
  return (
    <div style={{ ...STACK, gap: 24 }}>
      <div style={{ display: "grid", gap: 12 }}>
        <LoomProgress
          label={t("Weaving order 14", "نسج الطلب 14")}
          value={rows}
          max={ROWS_IN_ORDER}
          format={String}
          unit={ofRows}
          getValueLabel={(value) => `${value} ${ofRows}`}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <SaduButton variant="secondary" size="sm" onClick={() => setRows((current) => Math.min(ROWS_IN_ORDER, current + 10))}>
            {t("Beat in 10 rows", "رصّ 10 صفوف")}
          </SaduButton>
          <SaduButton variant="ghost" size="sm" onClick={() => setRows(ROWS_WOVEN)}>
            {t("Reset", "إعادة الضبط")}
          </SaduButton>
        </div>
      </div>
      <LoomProgress label={t("Checking dye lot", "فحص دفعة الصبغ")} value={null} />
      <LoomProgress label={t("Spinning goat hair", "غزل شعر الماعز")} size="sm" value={62} />
    </div>
  )
}

type Bilingual = { en: string; ar: string }

type Order = { id: number; title: Bilingual; client: Bilingual; status: Bilingual; delivered?: true }

const DELIVERED: Bilingual = { en: "Delivered", ar: "مُسلَّم" }

const ORDERS: readonly Order[] = [
  { id: 14, title: { en: "Majlis divider", ar: "قاطع مجلس" }, client: { en: "Umm Saad", ar: "أم سعد" }, status: { en: "On the loom", ar: "على النول" } },
  { id: 13, title: { en: "Camel saddle bag", ar: "خُرج جمل" }, client: { en: "Bu Nasser", ar: "بو ناصر" }, status: { en: "Dyeing", ar: "في الصبغ" } },
  { id: 12, title: { en: "Cushion covers, pair", ar: "غطاءا مسند" }, client: { en: "Dar Al Sadu", ar: "دار السدو" }, status: { en: "Warping", ar: "في التسدية" } },
  { id: 11, title: { en: "Floor rug, 3 m", ar: "بساط أرضي، 3 م" }, client: { en: "Umm Khalid", ar: "أم خالد" }, status: { en: "Spinning", ar: "في الغزل" } },
  {
    id: 10,
    title: { en: "Wedding tent wall", ar: "جدار خيمة العرس" },
    client: { en: "Al Fadhli family", ar: "عائلة الفضلي" },
    status: { en: "Finishing", ar: "في التشطيب" },
  },
  { id: 9, title: { en: "Prayer rug", ar: "سجادة صلاة" }, client: { en: "Hessa", ar: "حصة" }, status: DELIVERED, delivered: true },
  { id: 8, title: { en: "Camel neck band", ar: "قلادة ناقة" }, client: { en: "Ahmadi camel farm", ar: "عزبة الأحمدي" }, status: DELIVERED, delivered: true },
  { id: 7, title: { en: "Tent door flap", ar: "باب الخيمة" }, client: { en: "Al Rashidi camp", ar: "مخيم الرشيدي" }, status: DELIVERED, delivered: true },
  { id: 6, title: { en: "Majlis back rest", ar: "مسند ظهر للمجلس" }, client: { en: "Bu Fahad", ar: "بو فهد" }, status: DELIVERED, delivered: true },
  { id: 5, title: { en: "Gift band, 1 m", ar: "شريط هدية، 1 م" }, client: { en: "Sadu House shop", ar: "متجر بيت السدو" }, status: DELIVERED, delivered: true },
  { id: 4, title: { en: "Saddle cover", ar: "غطاء الشداد" }, client: { en: "Bin Jaber", ar: "بن جابر" }, status: DELIVERED, delivered: true },
  { id: 3, title: { en: "Divider repair", ar: "ترميم قاطع" }, client: { en: "Al Enezi family", ar: "عائلة العنزي" }, status: DELIVERED, delivered: true },
  { id: 2, title: { en: "Cradle band", ar: "شريط المهد" }, client: { en: "Noura", ar: "نورة" }, status: DELIVERED, delivered: true },
  { id: 1, title: { en: "Tent ridge band", ar: "شريط سقف الخيمة" }, client: { en: "Mariam", ar: "مريم" }, status: DELIVERED, delivered: true },
]

function ScrollAreaDemo(): ReactElement {
  const t = useT()
  const locale = useArabic() ? "ar" : "en"
  return (
    <div style={{ ...STACK, gap: 8, maxWidth: 300 }}>
      <span style={LABEL}>{t("Orders this season", "طلبات هذا الموسم")}</span>
      <WoodScrollArea
        label={t("Orders this season", "طلبات هذا الموسم")}
        type="auto"
        style={{ height: 220, borderRadius: 10, background: "var(--sadu-bone)", boxShadow: "inset 0 0 0 1px var(--sadu-line)" }}
      >
        <ul style={{ margin: 0, paddingBlock: 4, paddingInline: "4px 18px", listStyle: "none" }}>
          {ORDERS.map((order) => (
            <li
              key={order.id}
              style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", columnGap: 12, padding: "8px 10px" }}
            >
              <span style={{ display: "grid", flex: "1 1 160px", minWidth: 0 }}>
                <span style={BODY}>{order.title[locale]}</span>
                <span style={MUTED}>
                  {locale === "ar" ? `الطلب ${order.id}، ${order.client.ar}` : `Order ${order.id}, ${order.client.en}`}
                </span>
              </span>
              <span style={{ ...MUTED, fontSize: 12, color: order.delivered ? "var(--sadu-ink-2)" : "var(--sadu-ink)" }}>{order.status[locale]}</span>
            </li>
          ))}
        </ul>
      </WoodScrollArea>
    </div>
  )
}

const DRAFT_GLYPHS: Record<string, string> = { ".": "·", x: "■", k: "□", b: "●", w: "□" }
const PANEL: CSSProperties = { display: "grid", alignContent: "start", gap: 10, height: "100%", padding: 16, boxSizing: "border-box" }

function ResizableDemo(): ReactElement {
  const t = useT()
  const grid = MOTIFS.eyoun.grid
  return (
    <BeamResizable
      style={{ width: "100%", maxWidth: 640, height: 240, borderRadius: 10, background: "var(--sadu-bone)", boxShadow: "inset 0 0 0 1px var(--sadu-line)" }}
    >
      <BeamResizablePanel defaultSize={40} minSize={25}>
        <div style={PANEL}>
          <span style={LABEL}>{t("Pattern draft", "مخطط النقشة")}</span>
          <pre
            aria-label={t("Ain draft, 11 rows", "مخطط نقشة العين، 11 صفًا")}
            style={{ margin: 0, font: "11px/14px ui-monospace, 'SF Mono', Menlo, monospace", letterSpacing: "0.12em", color: "var(--sadu-ink-2)" }}
          >
            {grid.map((row) => [...row].map((char) => DRAFT_GLYPHS[char] ?? char).join("")).join("\n")}
          </pre>
        </div>
      </BeamResizablePanel>
      <BeamResizableHandle aria-label={t("Resize pattern draft", "تغيير حجم مخطط النقشة")} />
      <BeamResizablePanel minSize={30}>
        <div style={{ ...PANEL, gridTemplateRows: "auto 1fr" }}>
          <span style={LABEL}>{t("Cloth", "القماش")}</span>
          <Weave grid={grid} colors={{ ground: INK.black, dye: WOOLS.madder.hex, accent: INK.wool }} level="cloth" style={{ height: 165, boxShadow: "var(--sadu-cloth-ring)" }} />
        </div>
      </BeamResizablePanel>
    </BeamResizable>
  )
}

type Step = { value: string; dateTime: string; en: { title: string; time: string; description: string }; ar: { title: string; time: string; description: string } }

const STEPS: readonly Step[] = [
  {
    value: "sheared",
    dateTime: "2026-10-01",
    en: { title: "Wool sheared", time: "1 Oct", description: "Goat hair and sheep wool from the Jahra flock." },
    ar: { title: "جُزّ الصوف", time: "1 أكتوبر", description: "شعر ماعز وصوف غنم من قطيع الجهراء." },
  },
  {
    value: "spun",
    dateTime: "2026-10-06",
    en: { title: "Spun", time: "6 Oct", description: "On the drop spindle, Z twist." },
    ar: { title: "غُزل", time: "6 أكتوبر", description: "بالمغزل، بفتل على هيئة Z." },
  },
  {
    value: "dyed",
    dateTime: "2026-10-12",
    en: { title: "Dyed in the madder bath", time: "12 Oct", description: "Two lots, the second a shade darker." },
    ar: { title: "صُبغ بالفوّة", time: "12 أكتوبر", description: "دفعتان، الثانية أغمق بدرجة." },
  },
  {
    value: "warped",
    dateTime: "2026-10-16",
    en: { title: "Loom warped", time: "16 Oct", description: "Goat hair warp, 412 ends." },
    ar: { title: "سُدّي النول", time: "16 أكتوبر", description: "سدى من شعر الماعز، 412 خيطًا." },
  },
  {
    value: "weaving",
    dateTime: "2026-10-17",
    en: { title: "Weaving", time: "Since 17 Oct", description: "In progress: 46 of 96 rows." },
    ar: { title: "النسج", time: "منذ 17 أكتوبر", description: "جارٍ: 46 من 96 صفًا." },
  },
  {
    value: "cut",
    dateTime: "2026-11-18",
    en: { title: "Cut from the loom", time: "Est. 18 Nov", description: "Ends bound and the selvedge checked." },
    ar: { title: "قُصّ عن النول", time: "متوقع 18 نوفمبر", description: "تُربط الأطراف وتُفحص الحافة." },
  },
  {
    value: "delivered",
    dateTime: "2026-11-21",
    en: { title: "Delivered to the majlis", time: "Est. 21 Nov", description: "Hung as the divider in Umm Saad's tent." },
    ar: { title: "سُلّم إلى المجلس", time: "متوقع 21 نوفمبر", description: "يُعلَّق قاطعًا في خيمة أم سعد." },
  },
]

const FIRST_CURRENT = 4

function TimelineDemo(): ReactElement {
  const t = useT()
  const locale = useArabic() ? "ar" : "en"
  const [current, setCurrent] = useState(FIRST_CURRENT)
  const statusOf = (index: number): "complete" | "current" | "upcoming" =>
    index < current ? "complete" : index === current ? "current" : "upcoming"
  return (
    <div style={{ ...STACK, gap: 20, maxWidth: 320 }}>
      <WarpTimeline aria-label={t("Order 14 history", "سجل الطلب 14")}>
        {STEPS.map((step, index) => (
          <WarpTimelineItem key={step.value} value={step.value} status={statusOf(index)}>
            <WarpTimelineMarker />
            <WarpTimelineConnector />
            <WarpTimelineTitle>{step[locale].title}</WarpTimelineTitle>
            <WarpTimelineTime dateTime={step.dateTime}>{step[locale].time}</WarpTimelineTime>
            <WarpTimelineDescription>{step[locale].description}</WarpTimelineDescription>
          </WarpTimelineItem>
        ))}
      </WarpTimeline>
      <div style={{ display: "flex", gap: 8 }}>
        <SaduButton
          variant="secondary"
          size="sm"
          disabled={current >= STEPS.length}
          onClick={() => setCurrent((index) => Math.min(STEPS.length, index + 1))}
        >
          {t("Finish this step", "إنهاء هذه الخطوة")}
        </SaduButton>
        <SaduButton variant="ghost" size="sm" onClick={() => setCurrent(FIRST_CURRENT)}>
          {t("Reset", "إعادة الضبط")}
        </SaduButton>
      </div>
    </div>
  )
}

type Stage = WaterfallDataItem & { tone: DyeWaterfallTone; children?: Stage[] }

type StageSpec = Omit<Stage, "label" | "children"> & { label: Bilingual; children?: StageSpec[] }

const ORDER_14: readonly StageSpec[] = [
  { value: "shear", label: { en: "Shear and wash", ar: "الجزّ والغسل" }, start: 0, duration: 3, tone: "camel" },
  { value: "spin", label: { en: "Spin", ar: "الغزل" }, start: 2, duration: 7, tone: "camel" },
  {
    value: "dye",
    label: { en: "Dye", ar: "الصبغ" },
    start: 8,
    duration: 6,
    tone: "madder",
    children: [
      { value: "madder-bath", label: { en: "Madder bath", ar: "صبغ الأحمر" }, start: 8, duration: 3, tone: "madder" },
      { value: "saffron-bath", label: { en: "Saffron bath", ar: "صبغ الزعفراني" }, start: 11, duration: 3, tone: "saffron" },
    ],
  },
  { value: "approval", label: { en: "Umm Saad approves", ar: "موافقة أم سعد" }, start: 14, duration: 2, tone: "wool" },
  { value: "warp", label: { en: "Warp", ar: "التسدية" }, start: 16, duration: 2, tone: "goat-hair" },
  {
    value: "weave",
    label: { en: "Weave", ar: "النسج" },
    start: 18,
    duration: 11,
    tone: "goat-hair",
    children: [
      { value: "border-start", label: { en: "Border", ar: "الحاشية" }, start: 18, duration: 2, tone: "goat-hair" },
      { value: "flank-start", label: { en: "Flank", ar: "الجانب" }, start: 20, duration: 3, tone: "goat-hair" },
      { value: "centre", label: { en: "Centre", ar: "الوسط" }, start: 23, duration: 3, tone: "goat-hair" },
      { value: "flank-end", label: { en: "Flank", ar: "الجانب" }, start: 26, duration: 2, tone: "goat-hair" },
      { value: "border-end", label: { en: "Border", ar: "الحاشية" }, start: 28, duration: 1, tone: "goat-hair" },
    ],
  },
  { value: "finish", label: { en: "Finish", ar: "التشطيب" }, start: 29, duration: 2, tone: "goat-hair" },
]

function stagesIn(specs: readonly StageSpec[], locale: "en" | "ar"): Stage[] {
  return specs.map(({ label, children, ...stage }) => ({ ...stage, label: label[locale], children: children && stagesIn(children, locale) }))
}

const STAGES_BY_LOCALE = { en: stagesIn(ORDER_14, "en"), ar: stagesIn(ORDER_14, "ar") }

const TONES = new Map<string, DyeWaterfallTone>()
const collectTones = (stages: readonly StageSpec[]): void =>
  stages.forEach((stage) => {
    TONES.set(stage.value, stage.tone)
    if (stage.children) collectTones(stage.children)
  })
collectTones(ORDER_14)

const DAYS = { one: "يوم واحد", two: "يومان", few: "أيام", many: "يومًا", other: "يوم" }

function WaterfallDemo(): ReactElement {
  const t = useT()
  const arabic = useArabic()
  const stages = STAGES_BY_LOCALE[arabic ? "ar" : "en"]
  const [expanded, setExpanded] = useState<string[]>(["weave"])
  const [selected, setSelected] = useState<string | null>("centre")
  const rows = visibleWaterfallRows(stages, expanded)
  return (
    <DyeWaterfall
      aria-label={t("Order 14, 31 days", "الطلب 14، 31 يومًا")}
      items={stages}
      range={[0, 34]}
      expanded={expanded}
      onExpandedChange={setExpanded}
      value={selected}
      onValueChange={setSelected}
      format={(value) => t(`Day ${value}`, `اليوم ${value}`)}
      getBarLabel={(item) =>
        t(
          `Day ${item.start} to day ${item.start + item.duration}, ${item.duration} days`,
          `من اليوم ${item.start} إلى اليوم ${item.start + item.duration}، ${arabicCount(item.duration, DAYS)}`,
        )
      }
      style={{ width: "100%" }}
    >
      <DyeWaterfallHeaderRow>
        <DyeWaterfallColumnHeader>{t("Order 14", "الطلب 14")}</DyeWaterfallColumnHeader>
        <DyeWaterfallColumnHeader>{t("Days", "الأيام")}</DyeWaterfallColumnHeader>
        <DyeWaterfallColumnHeader aria-label={t("Timeline", "الخط الزمني")}>
          <DyeWaterfallAxis maxTicks={6} />
          <DyeWaterfallMark time={27}>{t("Eid", "العيد")}</DyeWaterfallMark>
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
    highlight: [9, 10, 11, 12, 13],
    code: `import type { ReactElement } from "react"
import { INK, MOTIFS, Rug, WOOLS, Weave } from "../sadu"

// The band for order 14: dhalla ribs in madder
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
  gap: 12px; /* six stitch rows */
  max-width: 480px;
}

.order-band figcaption {
  font: 600 12px/16px var(--sadu-font);
  color: var(--sadu-ink-2);
}`,
  },
]

function DisplayGallery(): ReactElement {
  return (
    <GallerySection
      title="Layout and display"
      lede="Portraits, dividers, meters and timelines for a weaver's day. Cloth marks a value; everything else is bare thread."
      arabicTitle="التخطيط والعرض"
      arabicLede="صور وفواصل ومقاييس وخطوط زمنية ليوم النسّاجة. القماش يدلّ على قيمة، وما عداه خيط عارٍ."
    >
      <Card
        name="Avatar"
        idea="With no photo, the name is woven into a wasm, the family's brand mark."
        arabicIdea="إن لم تتوفر صورة، يُنسج الاسم وسمًا، وهو علامة العائلة."
      >
        <AvatarDemo />
      </Card>
      <Card name="Separator" idea="A thread by default, a cord where two major sections part." arabicIdea="خيط في العادة، وحبل حيث ينفصل قسمان رئيسيان.">
        <SeparatorDemo />
      </Card>
      <Card
        name="Meter"
        idea="Counted floats: goat hair when there is enough, saffron when low, madder when over."
        arabicIdea="غرز معدودة: شعر ماعز حين يكفي، وزعفراني حين يقل، وأحمر حين يزيد."
      >
        <MeterDemo />
      </Card>
      <Card name="Progress" idea="Cloth being woven: bare warp ahead, a wood beater at the fell." arabicIdea="قماش يُنسج: أمامه سدى عارٍ، وعند حافة النسج عارضة خشبية.">
        <ProgressDemo />
      </Card>
      <Card wide name="Resizable" idea="A thread that becomes a wood beam when you reach for it." arabicIdea="خيط يصير عارضة خشبية حين تمدّ يدك إليه.">
        <ResizableDemo />
      </Card>
      <Card name="Timeline" idea="The order so far is cloth; what is to come is bare thread." arabicIdea="ما أُنجز من الطلب قماش، وما بقي خيط عارٍ.">
        <TimelineDemo />
      </Card>
      <Card
        wide
        name="Waterfall"
        idea="Idle time is thread and work is cloth, each span in the colour of its kind."
        arabicIdea="وقت الانتظار خيط ووقت العمل قماش، ولكل مدة لون نوعها."
      >
        <WaterfallDemo />
      </Card>
      <Card
        wide
        name="Code Block"
        idea="The pattern draft: line numbers ruled by a warp thread, the block hung from a cord."
        arabicIdea="مخطط النقشة: خيط سدى يفصل أرقام الأسطر، والكتلة معلّقة بحبل."
      >
        <CodeBlock snippets={SNIPPETS} maxHeight={300} />
      </Card>
      <Card name="Scroll Area" idea="A wood thumb riding a single thread." arabicIdea="مقبض خشبي ينزلق على خيط واحد.">
        <ScrollAreaDemo />
      </Card>
    </GallerySection>
  )
}

export { DisplayGallery }
