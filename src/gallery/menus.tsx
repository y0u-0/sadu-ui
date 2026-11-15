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
import { useState, type ReactElement } from "react"
import { EyePagination } from "../sadu/eye-pagination"
import { LoomMotifSelect, LoomToolbar, LoomToolbarButton, LoomToolbarSeparator } from "../sadu/loom-toolbar"
import { MOTIFS, PICKABLE, type MotifId } from "../sadu/motifs"
import { INK, WOOL_ORDER, WOOLS, type WoolId } from "../sadu/palette"
import { Rug } from "../sadu/rug"
import { SaduButton } from "../sadu/sadu-button"
import {
  SaduCommand,
  SaduCommandEmpty,
  SaduCommandGroup,
  SaduCommandGroupLabel,
  SaduCommandInput,
  SaduCommandItem,
  SaduCommandList,
} from "../sadu/sadu-command"
import {
  SaduMenu,
  SaduMenuCheckboxItem,
  SaduMenuContent,
  SaduMenuGroupLabel,
  SaduMenuItem,
  SaduMenuRadioGroup,
  SaduMenuRadioItem,
  SaduMenuSeparator,
  SaduMenuSpecimen,
  SaduMenuSub,
  SaduMenuSubContent,
  SaduMenuSubTrigger,
  SaduMenuTrigger,
  SkeinDot,
} from "../sadu/sadu-menu"
import { SaduMenubar, SaduMenubarTrigger } from "../sadu/sadu-menubar"
import {
  BandSwatch,
  SaduNavigationMenu,
  SaduNavigationMenuContent,
  SaduNavigationMenuItem,
  SaduNavigationMenuLink,
  SaduNavigationMenuList,
  SaduNavigationMenuTopLink,
  SaduNavigationMenuTrigger,
} from "../sadu/sadu-navigation-menu"
import { SaduSegment, SaduSegmentedControl } from "../sadu/sadu-segmented-control"
import {
  SaduNote,
  SaduNoteEditor,
  SaduTriggerMenu,
  SaduTriggerMenuContent,
  SaduTriggerMenuEmpty,
  SaduTriggerMenuItem,
  SaduTriggerMenuList,
} from "../sadu/sadu-trigger-menu"
import { WarpToggle, WarpToggleGroup } from "../sadu/warp-toggle"
import { WeaverAvatar } from "../sadu/weaver-avatar"
import { Card, GallerySection } from "./card"
import { useArabic, useT } from "./locale"
import "./menus.css"

const ICON = { size: 16, strokeWidth: 2 } as const

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

function isWool(value: string): value is WoolId {
  return value in WOOLS
}

function isMotif(value: string): value is MotifId {
  return value in MOTIFS
}

function motifColors(dye: string = WOOLS.madder.hex): { ground: string; dye: string; accent: string } {
  return { ground: INK.black, dye, accent: INK.wool }
}

/** "in madder" as Arabic says it: with the article on the colour, except goat hair, which is already definite. */
function inWool(wool: WoolId): string {
  return wool === "charcoal" ? `ب${WOOLS[wool].arabic}` : `بال${WOOLS[wool].arabic}`
}

function ButtonDemo(): ReactElement {
  const t = useT()
  return (
    <div className="menus-demo">
      <div className="menus-demo__row">
        <SaduButton>{t("Save band", "حفظ الشريط")}</SaduButton>
        <SaduButton variant="secondary">{t("Cancel", "إلغاء")}</SaduButton>
      </div>
      <div className="menus-demo__row">
        <SaduButton variant="destructive">{t("Remove band", "إزالة الشريط")}</SaduButton>
        <SaduButton variant="ghost">{t("Preview", "معاينة")}</SaduButton>
        <SaduButton variant="secondary" size="icon" aria-label={t("Add band", "إضافة شريط")}>
          <Plus {...ICON} aria-hidden="true" />
        </SaduButton>
      </div>
      <SaduButton size="lg" onClick={() => wait(3000)} pendingAnnouncement={t("Sending to loom", "جارٍ الإرسال إلى النول")}>
        {t("Send to loom", "إرسال إلى النول")}
      </SaduButton>
    </div>
  )
}

function ToolbarDemo(): ReactElement {
  const t = useT()
  const [motif, setMotif] = useState<MotifId>("uwairjan")
  return (
    <div className="menus-demo">
      <LoomToolbar aria-label={t("Band editor", "محرّر الشريط")}>
        <LoomToolbarButton aria-label={t("Undo", "تراجع")}>
          <Undo2 {...ICON} aria-hidden="true" />
        </LoomToolbarButton>
        <LoomToolbarButton aria-label={t("Redo", "إعادة")} disabled>
          <Redo2 {...ICON} aria-hidden="true" />
        </LoomToolbarButton>
        <LoomToolbarSeparator />
        <ToggleGroup multiple aria-label={t("Weaving aids", "مساعدات النسج")} defaultValue={["guides"]} className="menus-toolbar__toggles">
          <WarpToggle value="guides" aria-label={t("Guide threads", "خيوط الإرشاد")} icon={<Rows3 {...ICON} />} />
          <WarpToggle value="mirror" aria-label={t("Mirror", "عكس")} icon={<FlipHorizontal2 {...ICON} />} />
          <WarpToggle value="lock" aria-label={t("Lock band", "قفل الشريط")} icon={<Lock {...ICON} />} />
        </ToggleGroup>
        <LoomToolbarSeparator />
        <LoomMotifSelect motifs={PICKABLE} value={motif} onValueChange={setMotif} />
        <LoomToolbarSeparator />
        <LoomToolbarButton aria-label={t("Zoom out", "تصغير")}>
          <ZoomOut {...ICON} aria-hidden="true" />
        </LoomToolbarButton>
        <LoomToolbarButton aria-label={t("Zoom in", "تكبير")}>
          <ZoomIn {...ICON} aria-hidden="true" />
        </LoomToolbarButton>
      </LoomToolbar>
    </div>
  )
}

function MenuDemo(): ReactElement {
  const t = useT()
  const arabic = useArabic()
  const [dye, setDye] = useState<WoolId>("madder")
  return (
    <div className="menus-demo">
      <div className="menus-specimen" inert aria-hidden="true">
        <SaduMenuSpecimen
          items={[
            { label: t("Duplicate band", "تكرار الشريط"), icon: <Copy {...ICON} />, shortcut: "mod+d", highlighted: true },
            { label: t("Mirror", "عكس"), icon: <FlipHorizontal2 {...ICON} />, shortcut: "mod+m" },
            { label: "", separator: true },
            { label: t("Show guide threads", "إظهار خيوط الإرشاد"), checked: true },
            { label: t("Show row numbers", "إظهار أرقام الصفوف"), checked: false },
          ]}
        />
      </div>
      <SaduMenu>
        <SaduMenuTrigger>
          {t("Band actions", "إجراءات الشريط")}
          <ChevronDown {...ICON} aria-hidden="true" />
        </SaduMenuTrigger>
        <SaduMenuContent>
          <SaduMenuItem value="duplicate" shortcut="mod+d" icon={<Copy {...ICON} />}>
            {t("Duplicate band", "تكرار الشريط")}
          </SaduMenuItem>
          <SaduMenuItem value="mirror" shortcut="mod+m" icon={<FlipHorizontal2 {...ICON} />}>
            {t("Mirror", "عكس")}
          </SaduMenuItem>
          <SaduMenuSeparator />
          <SaduMenuCheckboxItem value="guides" defaultChecked>
            {t("Show guide threads", "إظهار خيوط الإرشاد")}
          </SaduMenuCheckboxItem>
          <SaduMenuCheckboxItem value="rows">{t("Show row numbers", "إظهار أرقام الصفوف")}</SaduMenuCheckboxItem>
          <SaduMenuSub>
            <SaduMenuSubTrigger icon={<Droplets {...ICON} />}>{t("Dye", "الصبغة")}</SaduMenuSubTrigger>
            <SaduMenuSubContent>
              <SaduMenuRadioGroup value={dye} onValueChange={(next) => isWool(next) && setDye(next)}>
                {WOOL_ORDER.map((id) => (
                  <SaduMenuRadioItem key={id} value={id} trailing={<SkeinDot wool={id} />}>
                    {arabic ? WOOLS[id].arabic : WOOLS[id].name}
                  </SaduMenuRadioItem>
                ))}
              </SaduMenuRadioGroup>
            </SaduMenuSubContent>
          </SaduMenuSub>
          <SaduMenuSeparator />
          <SaduMenuItem value="remove" destructive shortcut="mod+backspace" icon={<Trash2 {...ICON} />}>
            {t("Remove band", "إزالة الشريط")}
          </SaduMenuItem>
        </SaduMenuContent>
      </SaduMenu>
    </div>
  )
}

const TENSIONS = {
  slack: { en: "slack", ar: "رخو" },
  even: { en: "even", ar: "معتدل" },
  taut: { en: "taut", ar: "مشدود" },
} as const

type Tension = keyof typeof TENSIONS

function isTension(value: string): value is Tension {
  return value in TENSIONS
}

function MenubarDemo(): ReactElement {
  const t = useT()
  const arabic = useArabic()
  const [dye, setDye] = useState<WoolId>("madder")
  const [motif, setMotif] = useState<MotifId>("eyoun")
  const [tension, setTension] = useState<Tension>("even")
  return (
    <div className="menus-studio">
      <SaduMenubar aria-label={t("Weaving studio", "مشغل النسج")}>
        <SaduMenu>
          <SaduMenubarTrigger>{t("Loom", "النول")}</SaduMenubarTrigger>
          <SaduMenuContent>
            <SaduMenuItem value="new" shortcut="mod+n" icon={<FilePlus2 {...ICON} />}>
              {t("New band", "شريط جديد")}
            </SaduMenuItem>
            <SaduMenuItem value="open" shortcut="mod+o" icon={<FolderOpen {...ICON} />}>
              {t("Open draft…", "فتح مخطط…")}
            </SaduMenuItem>
            <SaduMenuSub>
              <SaduMenuSubTrigger inset>{t("Open recent", "المخططات الأخيرة")}</SaduMenuSubTrigger>
              <SaduMenuSubContent>
                <SaduMenuItem value="recent-majlis">{t("Majlis cushion band", "شريط مسند المجلس")}</SaduMenuItem>
                <SaduMenuItem value="recent-tent">{t("Tent divider, north wall", "قاطع الخيمة، الجدار الشمالي")}</SaduMenuItem>
                <SaduMenuItem value="recent-saddle">{t("Saddle bag for Umm Saad", "خُرج لأم سعد")}</SaduMenuItem>
              </SaduMenuSubContent>
            </SaduMenuSub>
            <SaduMenuSeparator />
            <SaduMenuItem value="save" shortcut="mod+s" icon={<Save {...ICON} />}>
              {t("Save", "حفظ")}
            </SaduMenuItem>
            <SaduMenuItem value="export" shortcut="mod+shift+e" icon={<FileDown {...ICON} />}>
              {t("Export draft as PDF", "تصدير المخطط بصيغة PDF")}
            </SaduMenuItem>
          </SaduMenuContent>
        </SaduMenu>
        <SaduMenu>
          <SaduMenubarTrigger>{t("Band", "الشريط")}</SaduMenubarTrigger>
          <SaduMenuContent>
            <SaduMenuItem value="insert" shortcut="mod+enter" icon={<Rows3 {...ICON} />}>
              {t("Insert row", "إدراج صف")}
            </SaduMenuItem>
            <SaduMenuSub>
              <SaduMenuSubTrigger inset>{t("Motif", "النقشة")}</SaduMenuSubTrigger>
              <SaduMenuSubContent>
                <SaduMenuRadioGroup value={motif} onValueChange={(next) => isMotif(next) && setMotif(next)}>
                  {PICKABLE.map((id) => (
                    <SaduMenuRadioItem
                      key={id}
                      value={id}
                      trailing={arabic ? <span lang="en">{MOTIFS[id].name}</span> : <span lang="ar">{MOTIFS[id].arabic}</span>}
                    >
                      {arabic ? MOTIFS[id].arabic : MOTIFS[id].name}
                    </SaduMenuRadioItem>
                  ))}
                </SaduMenuRadioGroup>
              </SaduMenuSubContent>
            </SaduMenuSub>
            <SaduMenuSeparator />
            <SaduMenuRadioGroup value={tension} onValueChange={(next) => isTension(next) && setTension(next)}>
              <SaduMenuGroupLabel>{t("Warp tension", "شدّ السدى")}</SaduMenuGroupLabel>
              <SaduMenuRadioItem value="slack">{t("Slack", "رخو")}</SaduMenuRadioItem>
              <SaduMenuRadioItem value="even">{t("Even", "معتدل")}</SaduMenuRadioItem>
              <SaduMenuRadioItem value="taut">{t("Taut", "مشدود")}</SaduMenuRadioItem>
            </SaduMenuRadioGroup>
          </SaduMenuContent>
        </SaduMenu>
        <SaduMenu>
          <SaduMenubarTrigger>{t("Wool", "الصوف")}</SaduMenubarTrigger>
          <SaduMenuContent>
            <SaduMenuRadioGroup value={dye} onValueChange={(next) => isWool(next) && setDye(next)}>
              <SaduMenuGroupLabel>{t("Dye lot", "دفعة الصبغ")}</SaduMenuGroupLabel>
              {WOOL_ORDER.map((id) => (
                <SaduMenuRadioItem key={id} value={id} trailing={<SkeinDot wool={id} />}>
                  {arabic ? WOOLS[id].arabic : WOOLS[id].name}
                </SaduMenuRadioItem>
              ))}
            </SaduMenuRadioGroup>
          </SaduMenuContent>
        </SaduMenu>
        <SaduMenu>
          <SaduMenubarTrigger>{t("View", "عرض")}</SaduMenubarTrigger>
          <SaduMenuContent>
            <SaduMenuCheckboxItem value="guides" defaultChecked>
              {t("Guide threads", "خيوط الإرشاد")}
            </SaduMenuCheckboxItem>
            <SaduMenuCheckboxItem value="rows">{t("Row numbers", "أرقام الصفوف")}</SaduMenuCheckboxItem>
            <SaduMenuSeparator />
            <SaduMenuItem value="zoom-in" shortcut="mod+=" inset>
              {t("Zoom in", "تكبير")}
            </SaduMenuItem>
            <SaduMenuItem value="zoom-out" shortcut="mod+-" inset>
              {t("Zoom out", "تصغير")}
            </SaduMenuItem>
          </SaduMenuContent>
        </SaduMenu>
        <SaduMenu>
          <SaduMenubarTrigger>{t("Help", "مساعدة")}</SaduMenubarTrigger>
          <SaduMenuContent>
            <SaduMenuItem value="glossary">{t("Weaving glossary", "مسرد مصطلحات النسج")}</SaduMenuItem>
            <SaduMenuItem value="shortcuts" shortcut="mod+/">
              {t("Keyboard shortcuts", "اختصارات لوحة المفاتيح")}
            </SaduMenuItem>
          </SaduMenuContent>
        </SaduMenu>
      </SaduMenubar>
      <Rug motif={motif} dye={WOOLS[dye].hex} level="stitch" className="menus-studio__cloth" />
      <p className="menus-studio__caption">
        {arabic
          ? `${MOTIFS[motif].arabic} ${inWool(dye)}، شدّ ${TENSIONS[tension].ar}`
          : `${MOTIFS[motif].name} in ${WOOLS[dye].name.toLowerCase()}, ${TENSIONS[tension].en} tension`}
      </p>
    </div>
  )
}

function ToggleDemo(): ReactElement {
  const t = useT()
  return (
    <div className="menus-demo menus-demo--start">
      <div className="menus-demo__field">
        <span className="sadu-label" id="menus-alignment">
          {t("Band alignment", "محاذاة الشريط")}
        </span>
        <WarpToggleGroup aria-labelledby="menus-alignment" defaultValue={["centre"]} deselectable={false}>
          <WarpToggle value="start">{t("Start", "البداية")}</WarpToggle>
          <WarpToggle value="centre">{t("Centre", "الوسط")}</WarpToggle>
          <WarpToggle value="end">{t("End", "النهاية")}</WarpToggle>
        </WarpToggleGroup>
      </div>
      <div className="menus-demo__field">
        <span className="sadu-label" id="menus-aids">
          {t("Weaving aids", "مساعدات النسج")}
        </span>
        <WarpToggleGroup aria-labelledby="menus-aids" multiple defaultValue={["guides", "mirror"]}>
          <WarpToggle value="guides">{t("Guide threads", "خيوط الإرشاد")}</WarpToggle>
          <WarpToggle value="mirror">{t("Mirror", "عكس")}</WarpToggle>
          <WarpToggle value="lock" disabled>
            {t("Lock", "قفل")}
          </WarpToggle>
        </WarpToggleGroup>
      </div>
    </div>
  )
}

type Bilingual = { en: string; ar: string }

const ORDERS: readonly { value: string; label: Bilingual; keywords: { en: readonly string[]; ar: readonly string[] }; motif: MotifId }[] = [
  {
    value: "order-14",
    label: { en: "Order 14, majlis divider", ar: "الطلب 14، قاطع المجلس" },
    keywords: { en: ["Hessa", "divider"], ar: ["حصة", "قاطع"] },
    motif: "eyoun",
  },
  {
    value: "order-15",
    label: { en: "Order 15, saddle bag", ar: "الطلب 15، خُرج" },
    keywords: { en: ["Noura", "bag"], ar: ["نورة", "خرج"] },
    motif: "dhalla",
  },
]

const LOOM_COMMANDS: readonly { value: string; label: Bilingual; shortcut: string; icon: ReactElement }[] = [
  { value: "new-band", label: { en: "New band", ar: "شريط جديد" }, shortcut: "mod+n", icon: <FilePlus2 {...ICON} /> },
  { value: "mirror", label: { en: "Mirror pattern", ar: "عكس النقشة" }, shortcut: "mod+m", icon: <FlipHorizontal2 {...ICON} /> },
  { value: "export", label: { en: "Export draft as PDF", ar: "تصدير المخطط بصيغة PDF" }, shortcut: "mod+shift+e", icon: <FileDown {...ICON} /> },
]

const SKEINS = ["madder", "saffron", "indigo"] as const satisfies readonly WoolId[]

function skeinLabel(id: WoolId): Bilingual {
  return { en: `${WOOLS[id].name} skeins`, ar: `شلل الصوف ال${WOOLS[id].arabic}` }
}

const COMMAND_LABELS = new Map<string, Bilingual>([
  ["go-to-order", { en: "Go to order…", ar: "الانتقال إلى طلب…" }],
  ["dye-lot", { en: "Change dye lot", ar: "تغيير دفعة الصبغ" }],
  ...ORDERS.map((order) => [order.value, order.label] as const),
  ...LOOM_COMMANDS.map((command) => [command.value, command.label] as const),
  ...SKEINS.map((id) => [`wool-${id}`, skeinLabel(id)] as const),
])

function CommandDemo(): ReactElement {
  const t = useT()
  const locale = useArabic() ? "ar" : "en"
  const [ran, setRan] = useState<string | null>(null)
  const ranLabel = ran === null ? null : (COMMAND_LABELS.get(ran)?.[locale] ?? ran)
  const skeins = SKEINS.map((id) => ({
    id,
    label: skeinLabel(id)[locale],
    keyword: locale === "ar" ? WOOLS[id].name : WOOLS[id].arabic,
    trailing: locale === "ar" ? undefined : <span lang="ar">{WOOLS[id].arabic}</span>,
  }))
  const status = ranLabel ? t(`Ran: ${ranLabel}`, `نُفّذ: ${ranLabel}`) : t("Try “mad” or “order”.", "جرّب «أحمر» أو «طلب».")
  return (
    <div className="menus-demo menus-demo--stretch">
      <SaduCommand onAction={setRan}>
        <SaduCommandInput aria-label={t("Search the loom", "البحث في النول")} placeholder={t("Search orders, bands and wool…", "ابحث في الطلبات والأشرطة والصوف…")} />
        <SaduCommandEmpty />
        <SaduCommandList>
          <SaduCommandGroup>
            <SaduCommandGroupLabel>{t("Orders", "الطلبات")}</SaduCommandGroupLabel>
            <SaduCommandItem value="go-to-order" label={t("Go to order…", "الانتقال إلى طلب…")} shortcut="mod+g" icon={<PackageSearch {...ICON} />} />
            {ORDERS.map((order) => (
              <SaduCommandItem
                key={order.value}
                value={order.value}
                label={order.label[locale]}
                keywords={[...order.keywords[locale]]}
                icon={<BandSwatch grid={MOTIFS[order.motif].grid} colors={motifColors()} center={MOTIFS[order.motif].center} />}
              />
            ))}
          </SaduCommandGroup>
          <SaduCommandGroup>
            <SaduCommandGroupLabel>{t("Loom", "النول")}</SaduCommandGroupLabel>
            {LOOM_COMMANDS.map((command) => (
              <SaduCommandItem key={command.value} value={command.value} label={command.label[locale]} shortcut={command.shortcut} icon={command.icon} />
            ))}
          </SaduCommandGroup>
          <SaduCommandGroup>
            <SaduCommandGroupLabel>{t("Wool", "الصوف")}</SaduCommandGroupLabel>
            <SaduCommandItem value="dye-lot" label={t("Change dye lot", "تغيير دفعة الصبغ")} icon={<Droplets {...ICON} />} />
            {skeins.map((skein) => (
              <SaduCommandItem
                key={skein.id}
                value={`wool-${skein.id}`}
                label={skein.label}
                keywords={[skein.keyword]}
                icon={<SkeinDot wool={skein.id} />}
                trailing={skein.trailing}
              />
            ))}
          </SaduCommandGroup>
        </SaduCommandList>
      </SaduCommand>
      <p className="menus-demo__status" aria-live="polite">
        {status}
      </p>
    </div>
  )
}

type Material = { id: string; title: Bilingual; description: Bilingual; colors: { ground: string; dye: string; accent: string } }

const MATERIALS: readonly Material[] = [
  {
    id: "wool",
    title: { en: "Wool", ar: "الصوف" },
    description: { en: "Sheep's wool, spun on the drop spindle.", ar: "صوف الغنم، مغزول بالمغزل." },
    colors: { ground: INK.wool, dye: INK.black, accent: WOOLS.madder.hex },
  },
  {
    id: "goat-hair",
    title: { en: "Goat hair", ar: "شعر الماعز" },
    description: { en: "Black and strong, the cloth of the tent.", ar: "أسود متين، ومنه يُنسج بيت الشعر." },
    colors: { ground: INK.black, dye: "#43372e", accent: INK.wool },
  },
  {
    id: "camel-hair",
    title: { en: "Camel hair", ar: "وبر الإبل" },
    description: { en: "Soft and undyed, for borders and bags.", ar: "ناعم وغير مصبوغ، للحواشي والأكياس." },
    colors: { ground: WOOLS.camel.dark, dye: WOOLS.camel.light, accent: INK.wool },
  },
  {
    id: "dyes",
    title: { en: "Dyes", ar: "الصبغات" },
    description: { en: "Madder, saffron and indigo, by the lot.", ar: "الأحمر والزعفراني والنيلي، بالدفعة." },
    colors: { ground: INK.wool, dye: WOOLS.indigo.hex, accent: WOOLS.madder.hex },
  },
]

const PIECES: readonly { id: string; title: Bilingual; description: Bilingual; motif: MotifId }[] = [
  {
    id: "divider",
    title: { en: "Tent divider", ar: "قاطع الخيمة" },
    description: { en: "The qata that splits the tent in two.", ar: "القاطع الذي يقسم بيت الشعر قسمين." },
    motif: "eyoun",
  },
  { id: "cushion", title: { en: "Cushion", ar: "مسند" }, description: { en: "Bands for the majlis floor.", ar: "أشرطة لأرضية المجلس." }, motif: "uwairjan" },
  {
    id: "saddle-bag",
    title: { en: "Saddle bag", ar: "خُرج" },
    description: { en: "A pair of pockets for the camel.", ar: "جيبان متقابلان على ظهر الجمل." },
    motif: "dhalla",
  },
  { id: "rug", title: { en: "Rug", ar: "بساط" }, description: { en: "Several bands, sewn edge to edge.", ar: "عدة أشرطة مخيطة جنبًا إلى جنب." }, motif: "hubub" },
]

function NavigationDemo(): ReactElement {
  const t = useT()
  const locale = useArabic() ? "ar" : "en"
  const motifs = (Object.keys(MOTIFS) as MotifId[]).map((id) => ({
    id,
    title: locale === "ar" ? MOTIFS[id].arabic : MOTIFS[id].name,
    description: locale === "ar" ? MOTIFS[id].arabicGloss : `${MOTIFS[id].arabic}, ${MOTIFS[id].gloss}`,
  }))
  const materials = MATERIALS.map((material) => ({ ...material, title: material.title[locale], description: material.description[locale] }))
  const pieces = PIECES.map((piece) => ({ ...piece, title: piece.title[locale], description: piece.description[locale] }))
  return (
    <SaduNavigationMenu aria-label={t("Sadu House", "بيت السدو")}>
      <SaduNavigationMenuList>
        <SaduNavigationMenuItem value="motifs">
          <SaduNavigationMenuTrigger>{t("Motifs", "النقوش")}</SaduNavigationMenuTrigger>
          <SaduNavigationMenuContent>
            <ul className="menus-nav__grid">
              {motifs.map((motif) => (
                <li key={motif.id}>
                  <SaduNavigationMenuLink
                    href={`#motif-${motif.id}`}
                    current={motif.id === "uwairjan"}
                    title={motif.title}
                    description={motif.description}
                    thumbnail={<BandSwatch grid={MOTIFS[motif.id].grid} colors={motifColors()} center={MOTIFS[motif.id].center} />}
                  />
                </li>
              ))}
            </ul>
          </SaduNavigationMenuContent>
        </SaduNavigationMenuItem>
        <SaduNavigationMenuItem value="materials">
          <SaduNavigationMenuTrigger>{t("Materials", "الخامات")}</SaduNavigationMenuTrigger>
          <SaduNavigationMenuContent>
            <ul className="menus-nav__grid">
              {materials.map((material) => (
                <li key={material.id}>
                  <SaduNavigationMenuLink
                    href={`#${material.id}`}
                    title={material.title}
                    description={material.description}
                    thumbnail={<BandSwatch grid={MOTIFS.hubub.grid} colors={material.colors} center={MOTIFS.hubub.center} />}
                  />
                </li>
              ))}
            </ul>
          </SaduNavigationMenuContent>
        </SaduNavigationMenuItem>
        <SaduNavigationMenuItem value="pieces">
          <SaduNavigationMenuTrigger>{t("Pieces", "القطع")}</SaduNavigationMenuTrigger>
          <SaduNavigationMenuContent>
            <ul className="menus-nav__grid">
              {pieces.map((piece) => (
                <li key={piece.id}>
                  <SaduNavigationMenuLink
                    href={`#${piece.id}`}
                    title={piece.title}
                    description={piece.description}
                    thumbnail={<BandSwatch grid={MOTIFS[piece.motif].grid} colors={motifColors()} center={MOTIFS[piece.motif].center} />}
                  />
                </li>
              ))}
            </ul>
          </SaduNavigationMenuContent>
        </SaduNavigationMenuItem>
        <SaduNavigationMenuItem>
          <SaduNavigationMenuTopLink href="#visit">{t("Visit", "الزيارة")}</SaduNavigationMenuTopLink>
        </SaduNavigationMenuItem>
      </SaduNavigationMenuList>
    </SaduNavigationMenu>
  )
}

function SegmentedDemo(): ReactElement {
  const t = useT()
  return (
    <div className="menus-demo__field">
      <span className="sadu-label" id="menus-ground">
        {t("Ground", "الأرضية")}
      </span>
      <SaduSegmentedControl aria-labelledby="menus-ground" defaultValue="goat-hair">
        <SaduSegment value="wool">{t("Wool", "صوف")}</SaduSegment>
        <SaduSegment value="goat-hair">{t("Goat hair", "شعر ماعز")}</SaduSegment>
        <SaduSegment value="camel">{t("Camel", "وبر")}</SaduSegment>
      </SaduSegmentedControl>
    </div>
  )
}

function PaginationDemo(): ReactElement {
  const t = useT()
  const [page, setPage] = useState(4)
  return (
    <div className="menus-demo">
      <EyePagination
        aria-label={t("Orders", "الطلبات")}
        previousLabel={t("Previous page", "الصفحة السابقة")}
        nextLabel={t("Next page", "الصفحة التالية")}
        pageCount={12}
        page={page}
        onPageChange={setPage}
        siblings={1}
        boundaries={1}
      />
      <p className="menus-demo__status">{t(`Orders, page ${page} of 12`, `الطلبات، الصفحة ${page} من 12`)}</p>
    </div>
  )
}

type Weaver = { value: string; label: Bilingual; keywords: { en: string[]; ar: string[] }; town: Bilingual }

const WEAVERS: readonly Weaver[] = [
  {
    value: "hessa",
    label: { en: "Hessa", ar: "حصة" },
    keywords: { en: ["Al-Mutairi", "Jahra"], ar: ["المطيري", "الجهراء"] },
    town: { en: "Jahra", ar: "الجهراء" },
  },
  {
    value: "noura",
    label: { en: "Noura", ar: "نورة" },
    keywords: { en: ["Al-Ajmi", "Ahmadi"], ar: ["العجمي", "الأحمدي"] },
    town: { en: "Ahmadi", ar: "الأحمدي" },
  },
  {
    value: "mariam",
    label: { en: "Mariam", ar: "مريم" },
    keywords: { en: ["Al-Rashidi", "Wafra"], ar: ["الرشيدي", "الوفرة"] },
    town: { en: "Wafra", ar: "الوفرة" },
  },
  {
    value: "umm-saad",
    label: { en: "Umm Saad", ar: "أم سعد" },
    keywords: { en: ["Sulaibikhat"], ar: ["الصليبيخات"] },
    town: { en: "Sulaibikhat", ar: "الصليبيخات" },
  },
]

const WEAVER_TOWNS = new Map(WEAVERS.map((weaver) => [weaver.value, weaver.town]))

function noteTriggers(locale: "en" | "ar"): TriggerDefinition[] {
  const motifs: TriggerMenuDataItem[] = PICKABLE.map((id) =>
    locale === "ar"
      ? { value: id, label: MOTIFS[id].arabic, keywords: [MOTIFS[id].name, MOTIFS[id].arabicGloss] }
      : { value: id, label: MOTIFS[id].name, keywords: [MOTIFS[id].arabic, MOTIFS[id].gloss] },
  )
  const weavers: TriggerMenuDataItem[] = WEAVERS.map((weaver) => ({ value: weaver.value, label: weaver.label[locale], keywords: weaver.keywords[locale] }))
  return [
    { char: "#", type: "motif", items: motifs },
    { char: "@", type: "weaver", spaces: 1, items: weavers },
  ]
}

const NOTE_DRAFT: TokenInputValue = [
  "Ask ",
  { type: "weaver", value: "hessa", label: "Hessa" },
  " to warp the loom for ",
  { type: "motif", value: "uwairjan", label: "Uwairjan" },
  ".",
]

const ARABIC_NOTE_DRAFT: TokenInputValue = [
  "اطلب من ",
  { type: "weaver", value: "hessa", label: "حصة" },
  " تسدية النول لنقشة ",
  { type: "motif", value: "uwairjan", label: "عويرجان" },
  ".",
]

const ARABIC_NOTE_KINDS: Readonly<Record<string, string>> = { weaver: "نسّاجة", motif: "نقشة" }

function describeArabicNoteToken(token: { type: string }): string {
  return ARABIC_NOTE_KINDS[token.type] ?? token.type
}

function TriggerMenuDemo(): ReactElement {
  const t = useT()
  const locale = useArabic() ? "ar" : "en"
  const describeToken = locale === "ar" ? describeArabicNoteToken : undefined
  const draft = locale === "ar" ? ARABIC_NOTE_DRAFT : NOTE_DRAFT
  const triggers = noteTriggers(locale)
  const townOf = (weaver: string): string | undefined => WEAVER_TOWNS.get(weaver)?.[locale]
  return (
    <Field className="menus-note">
      <FieldLabel className="sadu-label">{t("Note for the weaver", "ملاحظة للنسّاجة")}</FieldLabel>
      <SaduNote defaultValue={draft} getTokenDescription={describeToken}>
        <SaduNoteEditor placeholder={t("Type # for a motif or @ for a weaver", "اكتب # لاختيار نقشة، أو @ لاختيار نسّاجة")} />
        <SaduTriggerMenu triggers={triggers}>
          <SaduTriggerMenuContent>
            <SaduTriggerMenuEmpty>{t("No weaver or motif by that name", "لا نسّاجة ولا نقشة بهذا الاسم")}</SaduTriggerMenuEmpty>
            <SaduTriggerMenuList>
              {(state) =>
                (state.items as TriggerMenuDataItem[]).map((item) =>
                  state.trigger === "#" && isMotif(item.value) ? (
                    <SaduTriggerMenuItem
                      key={item.value}
                      value={item.value}
                      label={item.label}
                      icon={<BandSwatch grid={MOTIFS[item.value].grid} colors={motifColors()} center={MOTIFS[item.value].center} />}
                    >
                      {item.label}
                    </SaduTriggerMenuItem>
                  ) : (
                    <SaduTriggerMenuItem
                      key={item.value}
                      value={item.value}
                      label={item.label}
                      icon={<WeaverAvatar name={item.label} size={20} aria-hidden="true" />}
                      hint={townOf(item.value)}
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

function MenusGallery(): ReactElement {
  return (
    <GallerySection
      title="Menus and commands"
      lede="Tools for a weaver's day. Popups hang from a cord, pressed things are woven in, a beater keeps time while work runs, and choices are marked with eyes."
      arabicTitle="الأوامر والقوائم"
      arabicLede="أدوات ليوم النسّاجة: النوافذ تتدلّى من حبل، وما يُضغط يُنسج، وإيقاع الرصّ يرافق العمل الجاري، والخيارات تُعلَّم بالعيون."
    >
      <Card name="Button" idea="A press is the beater's beat; while it works, a beater weaves the hem across." arabicIdea="الضغطة رصّة واحدة، وأثناء العمل تُنسج حاشية الزر من طرف إلى طرف.">
        <ButtonDemo />
      </Card>
      <Card
        name="Toolbar"
        idea="A wooden loom beam carries the tools, lashed at both ends, with one tab stop."
        arabicIdea="عارضة نول خشبية مربوطة من طرفيها تحمل الأدوات، ويُنتقل إليها بزر Tab مرة واحدة."
        wide
      >
        <ToolbarDemo />
      </Card>
      <Card name="Menubar" idea="Menus hang from a wooden rod, their cords flush against it." arabicIdea="القوائم تتدلّى من عصا خشبية، وحبالها ملاصقة لها." wide>
        <MenubarDemo />
      </Card>
      <Card name="Toggle" idea="Unpressed is bare warp; pressing weaves the dyed cloth in, float by float." arabicIdea="الزر غير المضغوط سدى عارٍ، والضغط ينسج القماش المصبوغ غرزةً غرزة.">
        <ToggleDemo />
      </Card>
      <Card
        name="Menu"
        idea="The menu hangs from a cord; checked choices are eyes and dividers are horse-teeth strips."
        arabicIdea="القائمة تتدلّى من حبل، والخيارات المحددة عيون، والفواصل شرائط من ضروس الخيل."
      >
        <MenuDemo />
      </Card>
      <Card name="Command" idea="A tiny beater taps at the caret as you type; matches are stitched in madder." arabicIdea="رصّة صغيرة عند المؤشر مع كل حرف تكتبه، والمطابقات مطرّزة بالأحمر." wide>
        <CommandDemo />
      </Card>
      <Card name="Navigation Menu" idea="An eye rides the cord under the open section." arabicIdea="عين تنزلق على الحبل تحت القسم المفتوح." wide>
        <NavigationDemo />
      </Card>
      <Card name="Segmented Control" idea="The thumb is a short woven band; it trails a madder thread as it moves." arabicIdea="المؤشر شريط منسوج قصير، يجرّ خلفه خيطًا أحمر وهو يتحرك.">
        <SegmentedDemo />
      </Card>
      <Card
        name="Pagination"
        idea="Pages are eye diamonds on a warp; the cloth is woven up to the madder eye you are on."
        arabicIdea="الصفحات عيون على السدى، والقماش منسوج حتى العين الحمراء التي أنت عندها."
        wide
      >
        <PaginationDemo />
      </Card>
      <Card name="Trigger Menu" idea="The list hangs by a thread from the caret; the query is stitched." arabicIdea="القائمة معلّقة بخيط من المؤشر، والنص المكتوب مطرّز.">
        <TriggerMenuDemo />
      </Card>
    </GallerySection>
  )
}

export { MenusGallery }
