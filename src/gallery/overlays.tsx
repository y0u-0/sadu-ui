import { createLocalStorage } from "@ui-sdk/core"
import { toast } from "@ui-sdk/react/toast"
import { Hammer, Redo2, Undo2 } from "lucide-react"
import { useState, type ReactElement } from "react"
import { LoomSlider, MOTIFS, MotifSelect, Rug, SkeinRadio, WOOLS, mainColors, type MotifId, type WoolId } from "../sadu"
import { OverlayDetails } from "../sadu/overlay-kit"
import { SaduAccordion, SaduAccordionItem, SaduAccordionPanel, SaduAccordionTrigger } from "../sadu/sadu-accordion"
import {
  SaduAlertDialog,
  SaduAlertDialogClose,
  SaduAlertDialogContent,
  SaduAlertDialogDescription,
  SaduAlertDialogFooter,
  SaduAlertDialogTitle,
  SaduAlertDialogTrigger,
} from "../sadu/sadu-alert-dialog"
import { SaduButton } from "../sadu/sadu-button"
import { SaduCollapsible, SaduCollapsiblePanel, SaduCollapsibleTrigger } from "../sadu/sadu-collapsible"
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
} from "../sadu/sadu-dialog"
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
} from "../sadu/sadu-drawer"
import { SaduField, SaduFieldLabel } from "../sadu/sadu-field"
import { MotifPreview, SaduHoverCard, SaduHoverCardContent, SaduHoverCardTrigger } from "../sadu/sadu-hover-card"
import { SaduNumberInput } from "../sadu/sadu-number-input"
import {
  SaduPopover,
  SaduPopoverClose,
  SaduPopoverContent,
  SaduPopoverDescription,
  SaduPopoverTitle,
  SaduPopoverTrigger,
} from "../sadu/sadu-popover"
import { SaduPreferences, createSaduPreferences } from "../sadu/sadu-preferences"
import { SaduToastRegion } from "../sadu/sadu-toast"
import { SaduTooltip, SaduTooltipContent, SaduTooltipShortcut, SaduTooltipTrigger } from "../sadu/sadu-tooltip"
import { Card, GallerySection } from "./card"
import { useArabic, useT } from "./locale"
import "./overlays.css"

const PREFERENCES = createSaduPreferences({ global: true, storage: createLocalStorage })

const LOOM_TOOLS = [
  { label: "Beat row", arabic: "رصّ الصف", icon: Hammer },
  { label: "Undo last pick", arabic: "التراجع عن آخر لحمة", icon: Undo2, shortcut: "mod+z" },
  { label: "Redo pick", arabic: "إعادة اللحمة", icon: Redo2, shortcut: "mod+shift+z" },
] as const

type StageCopy = { title: string; body: string }

const STAGES = [
  {
    value: "spin",
    motif: "hubub",
    en: {
      title: "Shearing and spinning",
      body: "In spring Hessa shears the flock, then spins the wool and goat hair on a drop spindle as she walks.",
    },
    ar: {
      title: "الجزّ والغزل",
      body: "في الربيع تجزّ حصة صوف القطيع، ثم تغزل الصوف وشعر الماعز بالمغزل وهي تمشي.",
    },
  },
  {
    value: "dye",
    motif: "eyoun",
    en: {
      title: "Dyeing",
      body: "Skeins simmer in a madder bath for most of a day. Undyed wool stays white, goat hair stays black.",
    },
    ar: {
      title: "الصبغ",
      body: "تُغلى الشلل على نار هادئة في صبغة الفوّة معظم النهار. يبقى الصوف غير المصبوغ أبيض، ويبقى شعر الماعز أسود.",
    },
  },
  {
    value: "warp",
    motif: "dhalla",
    en: {
      title: "Warping the loom",
      body: "The warp is wound between two stakes in the ground, 14 ends to every centimetre, in the order of the bands.",
    },
    ar: {
      title: "تسدية النول",
      body: "يُمدّ السدى بين وتدين مغروسين في الأرض، 14 خيطًا في كل سنتيمتر، بترتيب الأشرطة.",
    },
  },
  {
    value: "weave",
    motif: "uwairjan",
    en: {
      title: "Weaving",
      body: "Each pick is beaten tight with a gazelle horn so the warp hides the weft. A 3 m divider takes about six weeks.",
    },
    ar: {
      title: "النسج",
      body: "تُرصّ كل لحمة بقرن غزال حتى يغطي السدى اللحمة. ويستغرق نسج قاطع طوله 3 أمتار نحو ستة أسابيع.",
    },
  },
  {
    value: "finish",
    motif: "dhurs",
    en: {
      title: "Cutting and finishing",
      body: "The piece is cut from the loom, the warp ends are twisted into fringe, and the edges are bound.",
    },
    ar: {
      title: "القصّ والتشطيب",
      body: "تُقصّ القطعة عن النول، وتُفتل أطراف السدى أهدابًا، وتُحاك الحواف.",
    },
  },
] as const satisfies readonly { value: string; motif: MotifId; en: StageCopy; ar: StageCopy }[]

/** "in madder" as Arabic says it: with the article on the colour, except goat hair, which is already definite. */
function inWool(wool: WoolId): string {
  return wool === "charcoal" ? `ب${WOOLS[wool].arabic}` : `بال${WOOLS[wool].arabic}`
}

const DRAWER_BANDS = ["dhurs", "uwairjan", "shajarah", "uwairjan", "dhurs"] as const satisfies readonly MotifId[]

function DialogDemo(): ReactElement {
  const t = useT()
  const arabic = useArabic()
  const [motif, setMotif] = useState<MotifId>("uwairjan")
  const [wool, setWool] = useState<WoolId>("madder")
  const saved = arabic ? `${MOTIFS[motif].arabic} ${inWool(wool)}.` : `${MOTIFS[motif].name} in ${WOOLS[wool].name.toLowerCase()}.`
  return (
    <SaduDialog>
      <SaduDialogTrigger>{t("Edit main band", "تعديل الشريط الرئيسي")}</SaduDialogTrigger>
      <SaduDialogContent motif={motif} dye={WOOLS[wool].hex}>
        <SaduDialogHeader>
          <div>
            <SaduDialogTitle>{t("Edit main band", "تعديل الشريط الرئيسي")}</SaduDialogTitle>
            <SaduDialogDescription>{t("Order 14, the majlis divider Umm Saad is weaving.", "الطلب 14، قاطع المجلس الذي تنسجه أم سعد.")}</SaduDialogDescription>
          </div>
          <SaduDialogDismiss />
        </SaduDialogHeader>
        <div className="overlays-demo__fields">
          <MotifSelect label={t("Motif", "النقشة")} dye={WOOLS[wool].hex} value={motif} onValueChange={setMotif} />
          <SkeinRadio label={t("Wool", "الصوف")} value={wool} onValueChange={setWool} />
        </div>
        <SaduDialogFooter>
          <SaduDialogClose variant="secondary">{t("Cancel", "إلغاء")}</SaduDialogClose>
          <SaduDialogClose
            variant="primary"
            value="save"
            action={() => toast.success(t("Main band saved", "حُفظ الشريط الرئيسي"), { description: saved })}
          >
            {t("Save", "حفظ")}
          </SaduDialogClose>
        </SaduDialogFooter>
      </SaduDialogContent>
    </SaduDialog>
  )
}

function AlertDialogDemo(): ReactElement {
  const t = useT()
  return (
    <SaduAlertDialog>
      <SaduAlertDialogTrigger>{t("Unravel band", "نقض الشريط")}</SaduAlertDialogTrigger>
      <SaduAlertDialogContent motif="eyoun">
        <SaduAlertDialogTitle>{t("Unravel this band?", "نقض هذا الشريط؟")}</SaduAlertDialogTitle>
        <SaduAlertDialogDescription>
          {t(
            "The 46 rows of Ain on order 14 go back to bare warp. The weft cannot be saved.",
            "ستعود الصفوف الـ46 من نقشة العين في الطلب 14 سدى عاريًا. لا يمكن استرجاع اللحمة.",
          )}
        </SaduAlertDialogDescription>
        <SaduAlertDialogFooter>
          <SaduAlertDialogClose variant="secondary">{t("Keep weaving", "مواصلة النسج")}</SaduAlertDialogClose>
          <SaduAlertDialogClose
            variant="primary"
            value="confirm"
            action={() =>
              toast(t("Band unravelled", "نُقض الشريط"), { description: t("The warp is bare and ready to weave again.", "السدى عارٍ وجاهز للنسج من جديد.") })
            }
          >
            {t("Unravel band", "نقض الشريط")}
          </SaduAlertDialogClose>
        </SaduAlertDialogFooter>
      </SaduAlertDialogContent>
    </SaduAlertDialog>
  )
}

function DrawerDemo(): ReactElement {
  const t = useT()
  const arabic = useArabic()
  const bands = DRAWER_BANDS.map((motif, index) => ({
    key: `${motif}-${index}`,
    name: arabic ? MOTIFS[motif].arabic : MOTIFS[motif].name,
    otherName: arabic ? MOTIFS[motif].name : MOTIFS[motif].arabic,
    otherLang: arabic ? "en" : "ar",
  }))
  return (
    <SaduDrawer>
      <SaduDrawerTrigger>{t("Open order 14", "فتح الطلب 14")}</SaduDrawerTrigger>
      <SaduDrawerContent>
        <SaduDrawerHeader>
          <div>
            <SaduDrawerTitle>{t("Order 14", "الطلب 14")}</SaduDrawerTitle>
            <SaduDrawerDescription>{t("Majlis divider for Noura Al-Sabah.", "قاطع مجلس لنورة الصباح.")}</SaduDrawerDescription>
          </div>
          <SaduDrawerDismiss />
        </SaduDrawerHeader>
        <OverlayDetails
          className="overlays-demo__drawer-details"
          items={[
            { term: t("Client", "العميلة"), detail: t("Noura Al-Sabah", "نورة الصباح") },
            { term: t("Weaver", "النسّاجة"), detail: t("Umm Saad", "أم سعد") },
            { term: t("Size", "المقاس"), detail: t("3.2 × 0.6 m", "3.2 × 0.6 م") },
            { term: t("Price", "السعر"), detail: t("185.000 KD", "185.000 د.ك") },
            { term: t("Due", "التسليم"), detail: t("12 Rajab", "12 رجب") },
          ]}
        />
        <div className="overlays-demo__rug">
          <Rug motif="uwairjan" dye={WOOLS.madder.hex} level="cloth" />
        </div>
        <h3 className="overlays-demo__subhead">{t("Bands", "الأشرطة")}</h3>
        <ul className="overlays-demo__bands">
          {bands.map((band) => (
            <li key={band.key}>
              <span>{band.name}</span>
              <span lang={band.otherLang}>{band.otherName}</span>
            </li>
          ))}
        </ul>
        <SaduDrawerFooter className="overlays-demo__drawer-footer">
          <SaduDrawerClose variant="secondary">{t("Close", "إغلاق")}</SaduDrawerClose>
          <SaduButton variant="primary">{t("Message Umm Saad", "مراسلة أم سعد")}</SaduButton>
        </SaduDrawerFooter>
      </SaduDrawerContent>
    </SaduDrawer>
  )
}

function PopoverDemo(): ReactElement {
  const t = useT()
  const [rows, setRows] = useState(46)
  return (
    <SaduPopover>
      <SaduPopoverTrigger>{t("Band width", "عرض الشريط")}</SaduPopoverTrigger>
      <SaduPopoverContent>
        <SaduPopoverTitle>{t("Band width", "عرض الشريط")}</SaduPopoverTitle>
        <SaduPopoverDescription>{t("Rows across the main band, before the border.", "عدد الصفوف في عرض الشريط الرئيسي، من دون الحاشية.")}</SaduPopoverDescription>
        <div className="overlays-demo__popover-fields">
          <SaduField>
            <SaduFieldLabel>{t("Rows", "الصفوف")}</SaduFieldLabel>
            <SaduNumberInput value={rows} min={11} max={80} onValueChange={(next) => next !== null && setRows(next)} />
          </SaduField>
          <LoomSlider
            label={t("Woven", "المنسوج")}
            grid={MOTIFS.uwairjan.grid}
            colors={mainColors(WOOLS.madder.hex)}
            min={11}
            max={80}
            value={rows}
            onValueChange={setRows}
          />
        </div>
        <div className="overlays-demo__popover-footer">
          <SaduPopoverClose>{t("Done", "تم")}</SaduPopoverClose>
        </div>
      </SaduPopoverContent>
    </SaduPopover>
  )
}

function MotifLink({ motif, meaning }: { motif: MotifId; meaning: string }): ReactElement {
  const arabic = useArabic()
  return (
    <SaduHoverCard>
      <SaduHoverCardTrigger href={`#motif-${motif}`}>{arabic ? MOTIFS[motif].arabic : MOTIFS[motif].name}</SaduHoverCardTrigger>
      <SaduHoverCardContent>
        <MotifPreview motif={motif} dye={WOOLS.madder.hex} meaning={meaning} />
      </SaduHoverCardContent>
    </SaduHoverCard>
  )
}

function HoverCardDemo(): ReactElement {
  const t = useT()
  return (
    <div className="overlays-demo__prose">
      {t("Hessa frames the centre band with ", "تحيط حصة الشريط الأوسط بنقشة ")}
      <MotifLink motif="uwairjan" meaning={t("Facing triangles. Woven beside the Shajarah.", "مثلثات متقابلة، تُنسج بجوار الشجرة.")} />
      {t(" on both sides, then closes the edges with ", " من الجانبين، ثم تُغلق الحافتين بنقشة ")}
      <MotifLink motif="dhurs" meaning={t("Horse teeth. The border that binds a band.", "أسنان الخيل، الحاشية التي تحدّ الشريط.")} />.
    </div>
  )
}

function TooltipDemo(): ReactElement {
  const t = useT()
  const arabic = useArabic()
  const tools = LOOM_TOOLS.map((tool) => ({ ...tool, label: arabic ? tool.arabic : tool.label }))
  return (
    <div className="overlays-demo__toolbar" role="group" aria-label={t("Loom", "النول")}>
      {tools.map((tool) => (
        <SaduTooltip key={tool.label} shortcut={"shortcut" in tool ? tool.shortcut : undefined}>
          <SaduTooltipTrigger variant="ghost" size="icon">
            <tool.icon size={16} strokeWidth={2} aria-hidden="true" />
          </SaduTooltipTrigger>
          <SaduTooltipContent>
            {tool.label}
            {"shortcut" in tool && <SaduTooltipShortcut />}
          </SaduTooltipContent>
        </SaduTooltip>
      ))}
    </div>
  )
}

function ToastDemo(): ReactElement {
  const t = useT()
  return (
    <div className="overlays-demo__row">
      <SaduButton
        variant="secondary"
        onClick={() =>
          toast.success(t("Dye lot recorded", "سُجّلت دفعة الصبغ"), {
            description: t("Madder, 3 skeins.", "أحمر، 3 شلل."),
            action: { label: t("Undo", "تراجع"), onAction: () => toast(t("Dye lot removed", "حُذفت دفعة الصبغ")) },
          })
        }
      >
        {t("Record dye lot", "تسجيل دفعة الصبغ")}
      </SaduButton>
      <SaduButton
        variant="secondary"
        onClick={() =>
          toast.error(t("Loom not reached", "تعذّر الوصول إلى النول"), {
            description: t("Mariam's loom is offline.", "نول مريم غير متصل."),
            duration: Infinity,
            action: { label: t("Retry", "إعادة المحاولة"), onAction: () => toast.success(t("Pattern sent to the loom", "أُرسلت النقشة إلى النول")) },
          })
        }
      >
        {t("Send pattern", "إرسال النقشة")}
      </SaduButton>
    </div>
  )
}

type ChestPiece = { title: string; meta: string; details: readonly { term: string; detail: string }[] }

const CHEST = [
  {
    id: "wedding-divider",
    motif: "uwairjan",
    en: {
      title: "Wedding tent divider",
      meta: "Folded, 3.6 m",
      details: [
        { term: "Woven", detail: "Spring 2024" },
        { term: "Wool", detail: "Camel and goat hair" },
      ],
    },
    ar: {
      title: "قاطع خيمة العرس",
      meta: "مطوي، 3.6 م",
      details: [
        { term: "النسج", detail: "ربيع 2024" },
        { term: "الصوف", detail: "وبر وشعر ماعز" },
      ],
    },
  },
  {
    id: "majlis-cushion",
    motif: "eyoun",
    en: {
      title: "Majlis cushion cover",
      meta: "Folded, 1.2 m",
      details: [
        { term: "Woven", detail: "Winter 2023" },
        { term: "Wool", detail: "Madder and undyed sheep's wool" },
      ],
    },
    ar: {
      title: "غطاء مسند المجلس",
      meta: "مطوي، 1.2 م",
      details: [
        { term: "النسج", detail: "شتاء 2023" },
        { term: "الصوف", detail: "صوف أحمر وصوف غنم طبيعي" },
      ],
    },
  },
] as const satisfies readonly { id: string; motif: MotifId; en: ChestPiece; ar: ChestPiece }[]

function CollapsibleDemo(): ReactElement {
  const locale = useArabic() ? "ar" : "en"
  return (
    <div className="overlays-demo__chest">
      {CHEST.map((piece) => (
        <SaduCollapsible key={piece.id}>
          <SaduCollapsibleTrigger motif={piece.motif}>
            <span className="overlays-demo__piece">
              <span className="overlays-demo__piece-title">{piece[locale].title}</span>
              <span className="overlays-demo__piece-meta">{piece[locale].meta}</span>
            </span>
          </SaduCollapsibleTrigger>
          <SaduCollapsiblePanel motif={piece.motif}>
            <OverlayDetails items={piece[locale].details} />
          </SaduCollapsiblePanel>
        </SaduCollapsible>
      ))}
    </div>
  )
}

function AccordionDemo(): ReactElement {
  const locale = useArabic() ? "ar" : "en"
  return (
    <SaduAccordion defaultValue={["dye"]} className="overlays-demo__accordion">
      {STAGES.map((stage) => (
        <SaduAccordionItem key={stage.value} value={stage.value}>
          <SaduAccordionTrigger motif={stage.motif}>{stage[locale].title}</SaduAccordionTrigger>
          <SaduAccordionPanel>
            <p>{stage[locale].body}</p>
          </SaduAccordionPanel>
        </SaduAccordionItem>
      ))}
    </SaduAccordion>
  )
}

function OverlaysGallery(): ReactElement {
  return (
    <GallerySection
      title="Overlays"
      lede="Dialogs, drawers, popovers and toasts that sit above the page, and panels that fold open inside it."
      arabicTitle="النوافذ واللوحات"
      arabicLede="نوافذ حوار ولوحات جانبية وإشعارات تعلو الصفحة، وأقسام تنطوي وتنفتح داخلها."
    >
      <SaduToastRegion />
      <Card name="Dialog" idea="The tent flap: its woven header is beaten in as the dialog opens." arabicIdea="باب الخيمة: يُرصّ رأس النافذة المنسوج عند فتحها.">
        <DialogDemo />
      </Card>
      <Card name="Alert Dialog" idea="Bare warp and one madder thread, where cloth used to be." arabicIdea="سدى عارٍ وخيط أحمر واحد، حيث كان القماش.">
        <AlertDialogDemo />
      </Card>
      <Card name="Drawer" idea="A rug unrolling: its edge is a roll that flattens as it opens." arabicIdea="بساط يُفرد: حافته لفّة تنبسط مع الفتح.">
        <DrawerDemo />
      </Card>
      <Card name="Popover" idea="Hung from a cord, pointing with a stepped dhalla triangle." arabicIdea="معلّقة بحبل، وتشير بمثلث مدرّج من نقشة الضلعة.">
        <PopoverDemo />
      </Card>
      <Card name="Hover Card" idea="A swatch cut from a sample book, with its name in both scripts." arabicIdea="قصاصة من دفتر العيّنات، باسمها بالعربية واللاتينية.">
        <HoverCardDemo />
      </Card>
      <Card name="Tooltip" idea="A goat-hair tag with a red and white woven edge." arabicIdea="بطاقة من شعر الماعز بحافة منسوجة بالأحمر والأبيض.">
        <TooltipDemo />
      </Card>
      <Card name="Accordion" idea="Each stage carries its motif, bare until opened, then woven in." arabicIdea="لكل مرحلة نقشتها، تبقى سدى عاريًا حتى تُفتح، ثم تُنسج." wide>
        <AccordionDemo />
      </Card>
      <Card name="Toast" idea="The timer is a selvedge woven across its foot. Errors fray." arabicIdea="المؤقت حافة تُنسج على طرفه السفلي، والخطأ يتنسّل.">
        <ToastDemo />
      </Card>
      <Card name="Collapsible" idea="A folded rug: the edge shows, and the band unfolds from it." arabicIdea="بساط مطوي تظهر حافته، ومنها ينفرد الشريط.">
        <CollapsibleDemo />
      </Card>
      <Card name="Preferences" idea="A sampler still on the loom: each band is woven by one preference." arabicIdea="عيّنة ما زالت على النول، يُنسج كل شريط فيها حسب أحد التفضيلات." wide>
        <SaduPreferences preferences={PREFERENCES} />
      </Card>
    </GallerySection>
  )
}

export { OverlaysGallery }
