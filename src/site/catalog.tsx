import { cards as galleryCards } from "virtual:sadu-docs"
import { ACTIONS } from "./catalog/actions"
import type { EntryDefinition, Family, PlaygroundSpec, Span } from "./catalog/define"
import { DISPLAY } from "./catalog/display"
import { ENTRY } from "./catalog/entry"
import { OVERLAYS } from "./catalog/overlays"
import { PICKERS } from "./catalog/pickers"
import { SIGNATURE } from "./catalog/signature"

type CatalogEntry = {
  id: string
  number: number
  label: string
  name: string
  arabic: string
  family: Family
  base: string | null
  idea: string
  arabicIdea: string
  usage: string
  ownCard: boolean
  span: Span
  registry: string
  file: string
  playground: PlaygroundSpec
}

type FamilyInfo = { family: Family; title: string; arabic: string; entries: readonly CatalogEntry[] }

type Placement = readonly [id: string, span: Span, arabic: string]

const LAYOUT: readonly { family: Family; title: string; arabic: string; definitions: readonly EntryDefinition[]; cards: readonly Placement[] }[] = [
  {
    family: "signature",
    title: "Signature pieces",
    arabic: "القطع المميزة",
    definitions: SIGNATURE,
    cards: [
      ["rug", "feature", "البساط"],
      ["motif-select", "single", "اختيار النقشة"],
      ["skein-radio", "single", "الشلل"],
      ["loom-slider", "wide", "منزلق النول"],
      ["sadu-switch", "single", "مفتاح التبديل"],
      ["eye-rating", "single", "التقييم بالعيون"],
      ["sadu-tabs", "wide", "علامات التبويب"],
    ],
  },
  {
    family: "actions",
    title: "Actions and menus",
    arabic: "الأوامر والقوائم",
    definitions: ACTIONS,
    cards: [
      ["sadu-menubar", "feature", "شريط القوائم"],
      ["sadu-button", "tall", "الزر"],
      ["sadu-segmented-control", "tall", "الأزرار المجزأة"],
      ["warp-toggle", "wide", "زر التبديل"],
      ["loom-toolbar", "wide", "شريط الأدوات"],
      ["sadu-command", "feature", "لوحة الأوامر"],
      ["sadu-menu", "tall", "القائمة"],
      ["sadu-trigger-menu", "tall", "قائمة الإشارة"],
      ["eye-pagination", "wide", "ترقيم الصفحات"],
      ["sadu-navigation-menu", "wide", "قائمة التنقل"],
    ],
  },
  {
    family: "overlays",
    title: "Overlays and panels",
    arabic: "النوافذ واللوحات",
    definitions: OVERLAYS,
    cards: [
      ["sadu-dialog", "single", "نافذة الحوار"],
      ["sadu-alert-dialog", "single", "نافذة التنبيه"],
      ["sadu-drawer", "single", "اللوحة الجانبية"],
      ["sadu-popover", "single", "النافذة المنبثقة"],
      ["sadu-hover-card", "single", "بطاقة المعاينة"],
      ["sadu-tooltip", "single", "التلميح"],
      ["sadu-accordion", "tall", "الأقسام القابلة للطي"],
      ["sadu-preferences", "tall", "التفضيلات"],
      ["sadu-toast", "single", "الإشعار العابر"],
      ["sadu-collapsible", "single", "القسم القابل للطي"],
    ],
  },
  {
    family: "entry",
    title: "Text and number entry",
    arabic: "إدخال النصوص والأرقام",
    definitions: ENTRY,
    cards: [
      ["sadu-textarea", "feature", "مربع النص"],
      ["sadu-field", "tall", "الحقل"],
      ["sadu-number-input", "tall", "حقل الرقم"],
      ["sadu-token-input", "feature", "حقل الوسوم"],
      ["sadu-otp-input", "wide", "رمز التحقق"],
      ["sadu-input", "single", "حقل النص"],
      ["sadu-autocomplete", "tall", "الإكمال التلقائي"],
      ["sadu-combobox", "tall", "القائمة المنسدلة"],
      ["sadu-time-input", "tall", "حقل الوقت"],
      ["sadu-password-input", "single", "حقل كلمة المرور"],
      ["sadu-date-input", "wide", "حقل التاريخ"],
    ],
  },
  {
    family: "pickers",
    title: "Pickers and lists",
    arabic: "أدوات الاختيار والقوائم",
    definitions: PICKERS,
    cards: [
      ["sadu-calendar", "feature", "التقويم"],
      ["sadu-date-picker", "tall", "منتقي التاريخ"],
      ["sadu-color-picker", "tall", "منتقي اللون"],
      ["sadu-file-input", "tall", "رفع الملفات"],
      ["sadu-listbox", "tall", "قائمة الخيارات"],
      ["sadu-image-cropper", "feature", "قص الصورة"],
      ["sadu-checkbox", "tall", "مربع الاختيار"],
      ["sadu-tree", "tall", "العرض الشجري"],
      ["sadu-carousel", "feature", "العرض الدوار"],
    ],
  },
  {
    family: "display",
    title: "Layout and display",
    arabic: "التخطيط والعرض",
    definitions: DISPLAY,
    cards: [
      ["weaver-avatar", "tall", "الصورة الرمزية"],
      ["thread-separator", "tall", "الفاصل"],
      ["wool-meter", "tall", "المقياس"],
      ["wood-scroll-area", "tall", "منطقة التمرير"],
      ["beam-resizable", "feature", "اللوحات القابلة لتغيير الحجم"],
      ["code-block", "feature", "كتلة الشيفرة البرمجية"],
      ["warp-timeline", "tall", "الخط الزمني"],
      ["loom-progress", "tall", "شريط التقدم"],
      ["dye-waterfall", "feature", "مخطط المراحل"],
    ],
  },
]

function place(): FamilyInfo[] {
  let number = 0
  return LAYOUT.map(({ family, title, arabic, definitions, cards }) => {
    const byId = new Map(definitions.map((definition) => [definition.id, definition]))
    if (byId.size !== cards.length) throw new Error(`${family}: the layout lists ${cards.length} cards for ${byId.size} components`)
    const entries = cards.map(([id, span, arabicName]): CatalogEntry => {
      const definition = byId.get(id)
      if (!definition) throw new Error(`${family}: no component "${id}"`)
      number += 1
      return {
        ...definition,
        arabic: arabicName,
        idea: galleryCards[definition.name]?.idea || definition.idea || "",
        arabicIdea: galleryCards[definition.name]?.arabicIdea || definition.arabicIdea || "",
        usage: galleryCards[definition.name]?.usage || definition.usage || "",
        ownCard: definition.ownCard ?? false,
        family,
        number,
        label: String(number).padStart(2, "0"),
        span,
        registry: definition.registry ?? definition.id,
        file: definition.file ?? `${definition.id}.tsx`,
      }
    })
    return { family, title, arabic, entries }
  })
}

const FAMILIES: readonly FamilyInfo[] = place()
const CATALOG: readonly CatalogEntry[] = FAMILIES.flatMap((family) => family.entries)
const BY_ID = new Map(CATALOG.map((entry) => [entry.id, entry]))

function entryById(id: string): CatalogEntry | undefined {
  return BY_ID.get(id)
}

function familyOf(family: Family): FamilyInfo {
  const found = FAMILIES.find((candidate) => candidate.family === family)
  if (!found) throw new Error(`Unknown family ${family}`)
  return found
}

export { CATALOG, FAMILIES, entryById, familyOf }
export type { CatalogEntry, FamilyInfo }
