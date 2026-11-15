import type { TokenInputValue } from "@ui-sdk/react/token-input"
import { useState, type CSSProperties, type ReactElement, type ReactNode } from "react"
import { MOTIFS, type MotifId } from "../sadu/motifs"
import { GOAT_HAIR, WOOL_CLOTH } from "../sadu/weave"
import { WOOLS, WOOL_ORDER, type WoolId } from "../sadu/palette"
import { SaduAutocomplete, type Suggestion } from "../sadu/sadu-autocomplete"
import { SaduCombobox, type ComboboxOption } from "../sadu/sadu-combobox"
import { SaduDateInput } from "../sadu/sadu-date-input"
import { SaduField, SaduFieldDescription, SaduFieldError, SaduFieldLabel } from "../sadu/sadu-field"
import { SaduInput } from "../sadu/sadu-input"
import { SaduNumberInput } from "../sadu/sadu-number-input"
import { SaduOTPInput } from "../sadu/sadu-otp-input"
import { SaduPasswordInput } from "../sadu/sadu-password-input"
import { BandSwatch, SkeinDot } from "../sadu/parts"
import { WovenDot } from "../sadu/sadu-suggestions"
import { SaduTextarea } from "../sadu/sadu-textarea"
import { SaduTimeInput } from "../sadu/sadu-time-input"
import { SaduTokenInput, type TokenTrigger } from "../sadu/sadu-token-input"
import { arabicCount } from "../sadu/locale"
import { Card, GallerySection } from "./card"
import { useArabic, useT } from "./locale"

const COLUMN: CSSProperties = { display: "grid", gap: 24, width: "100%", maxWidth: 320 }
const PAIR: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 32, width: "100%", maxWidth: 640 }
const STACK: CSSProperties = { display: "grid", gap: 24 }
const WIDE: CSSProperties = { width: "100%", maxWidth: 560 }

const BORDER_IDS: readonly MotifId[] = ["eyoun", "uwairjan", "dhalla", "hubub", "dhurs"]
const BAND_COLORS = { ground: GOAT_HAIR, dye: WOOLS.madder.hex, accent: WOOL_CLOTH }
const UNDYED = { hex: WOOL_CLOTH, light: "#f6eedd", dark: "#c9b894" }

function band(id: MotifId, size: "sm" | "md" = "md"): ReactElement {
  return <BandSwatch grid={MOTIFS[id].grid} colors={BAND_COLORS} center={MOTIFS[id].center} size={size} />
}

function borderOptions(arabic: boolean): ComboboxOption[] {
  return BORDER_IDS.map((id) =>
    arabic
      ? { value: id, label: MOTIFS[id].arabic, keywords: [MOTIFS[id].name], sample: band(id) }
      : { value: id, label: MOTIFS[id].name, arabic: MOTIFS[id].arabic, sample: band(id) },
  )
}

const SUGGESTED_MOTIFS = ["eyoun", "shajarah", "uwairjan", "dhalla", "hubub", "dhurs"] as const

function motifSuggestions(arabic: boolean): Suggestion[] {
  return SUGGESTED_MOTIFS.map((id) =>
    arabic
      ? { value: MOTIFS[id].arabic, keywords: [MOTIFS[id].name, MOTIFS[id].arabicGloss], sample: band(id) }
      : { value: MOTIFS[id].name, arabic: MOTIFS[id].arabic, keywords: [MOTIFS[id].gloss], sample: band(id) },
  )
}

const UNDYED_NAME = { name: "Undyed wool", arabic: "صوف طبيعي" }

function dyeOptions(arabic: boolean): ComboboxOption[] {
  const undyed = <SkeinDot wool={UNDYED} size={20} />
  return arabic
    ? [
        ...WOOL_ORDER.map((id) => ({ value: id, label: WOOLS[id].arabic, keywords: [WOOLS[id].name], sample: <SkeinDot wool={id} size={20} /> })),
        { value: "undyed", label: UNDYED_NAME.arabic, keywords: [UNDYED_NAME.name], sample: undyed },
      ]
    : [
        ...WOOL_ORDER.map((id) => ({ value: id, label: WOOLS[id].name, arabic: WOOLS[id].arabic, sample: <SkeinDot wool={id} size={20} /> })),
        { value: "undyed", label: UNDYED_NAME.name, arabic: UNDYED_NAME.arabic, sample: undyed },
      ]
}

const WEAVERS: readonly { id: string; name: string; arabic: string; dye: WoolId }[] = [
  { id: "umm-saad", name: "Umm Saad", arabic: "أم سعد", dye: "indigo" },
  { id: "hessa", name: "Hessa", arabic: "حصة", dye: "madder" },
  { id: "noura", name: "Noura", arabic: "نورة", dye: "camel" },
  { id: "mariam", name: "Mariam", arabic: "مريم", dye: "saffron" },
]

const DYE_TOKENS: readonly WoolId[] = ["madder", "saffron", "indigo", "camel"]

function briefTriggers(arabic: boolean): TokenTrigger[] {
  return [
    { char: "@", items: WEAVERS.map((weaver) => ({ type: "person", value: weaver.id, label: arabic ? weaver.arabic : weaver.name })) },
    {
      char: "#",
      items: [
        ...BORDER_IDS.map((id) =>
          arabic
            ? { type: "motif", value: id, label: MOTIFS[id].arabic }
            : { type: "motif", value: id, label: MOTIFS[id].name.toLowerCase(), arabic: MOTIFS[id].arabic },
        ),
        ...DYE_TOKENS.map((id) =>
          arabic
            ? { type: "dye", value: id, label: WOOLS[id].arabic }
            : { type: "dye", value: id, label: WOOLS[id].name.toLowerCase(), arabic: WOOLS[id].arabic },
        ),
      ],
    },
  ]
}

const BRIEF_DRAFT: TokenInputValue = [
  "Divider for ",
  { type: "person", value: "umm-saad", label: "Umm Saad" },
  " in ",
  { type: "motif", value: "uwairjan", label: "uwairjan" },
  " with ",
  { type: "dye", value: "madder", label: "madder" },
  " and ",
  { type: "dye", value: "saffron", label: "saffron" },
  ", due before Eid.",
]

const ARABIC_BRIEF_DRAFT: TokenInputValue = [
  "قاطع لـ",
  { type: "person", value: "umm-saad", label: "أم سعد" },
  " بنقشة ",
  { type: "motif", value: "uwairjan", label: "عويرجان" },
  " باللونين ",
  { type: "dye", value: "madder", label: "أحمر" },
  " و",
  { type: "dye", value: "saffron", label: "زعفراني" },
  "، يُسلَّم قبل العيد.",
]

const ARABIC_TOKEN_KINDS: Readonly<Record<string, string>> = { person: "نسّاجة", motif: "نقشة", dye: "صبغة" }

function describeArabicToken(token: { type: string }): string {
  return ARABIC_TOKEN_KINDS[token.type] ?? token.type
}

function briefSampler(arabic: boolean): (type: string, value: string) => ReactNode {
  return (type, value) => {
    if (type === "person") {
      const weaver = WEAVERS.find((candidate) => candidate.id === value)
      return weaver ? <WovenDot name={arabic ? weaver.arabic : weaver.name} /> : null
    }
    if (type === "motif") return value in MOTIFS ? band(value as MotifId, "sm") : null
    return value in WOOLS ? <SkeinDot wool={value as WoolId} /> : null
  }
}

type LengthCheck = "missing" | "out-of-range" | null

function lengthCheck(raw: string): LengthCheck {
  const metres = Number(raw)
  if (raw.trim() === "" || Number.isNaN(metres)) return "missing"
  if (metres < 2 || metres > 12) return "out-of-range"
  return null
}

function PanelField(): ReactElement {
  const t = useT()
  const [length, setLength] = useState("14")
  const check = lengthCheck(length)
  return (
    <SaduField invalid={check !== null}>
      <SaduFieldLabel>{t("Panel length", "طول الشقّة")}</SaduFieldLabel>
      <SaduInput value={length} onValueChange={(value) => setLength(value)} inputMode="decimal" required end={t("metres", "متر")} />
      <SaduFieldDescription>{t("Measured along the warp.", "يُقاس على امتداد السدى.")}</SaduFieldDescription>
      {check === "missing" && <SaduFieldError match>{t("Enter the panel length in metres.", "أدخل طول الشقّة بالأمتار.")}</SaduFieldError>}
      {check === "out-of-range" && <SaduFieldError match>{t("A tent panel runs 2 to 12 metres.", "طول شقّة الخيمة بين 2 و12 مترًا.")}</SaduFieldError>}
    </SaduField>
  )
}

const NOTES_LIMIT = 240

const SLIP_LIMIT = 120

const CHARACTERS = { one: "حرف واحد", two: "حرفين", few: "أحرف", many: "حرفًا", other: "حرف" }

function NotesField({ label, initial, limit }: { label: string; initial: string; limit: number }): ReactElement {
  const arabic = useArabic()
  const [notes, setNotes] = useState(initial)
  const over = notes.length > limit
  return (
    <SaduField invalid={over}>
      <SaduFieldLabel>{label}</SaduFieldLabel>
      <SaduTextarea
        value={notes}
        onValueChange={(value) => setNotes(value)}
        limit={limit}
        placeholder={arabic ? "الشدّ، ودفعات الصبغ، وكل ما يلزم النسّاجة التالية" : "Tension, dye lots, anything the next weaver should know"}
      />
      {over && (
        <SaduFieldError match>
          {arabic
            ? `اختصرها إلى أقل من ${arabicCount(limit, CHARACTERS)} لتتسع لها ورقة الطلب.`
            : `Keep it under ${limit} characters so it fits the order slip.`}
        </SaduFieldError>
      )}
    </SaduField>
  )
}

function DueDates(): ReactElement {
  const arabic = useArabic()
  const latin = (
    <SaduField key="latin" lang={arabic ? "en" : undefined} dir={arabic ? "ltr" : undefined}>
      <SaduFieldLabel>Due date</SaduFieldLabel>
      <SaduDateInput defaultValue="2027-02-14" locale="en-GB" />
      <SaduFieldDescription>Day, month, year.</SaduFieldDescription>
    </SaduField>
  )
  const hijri = (
    <SaduField key="hijri" lang="ar" dir="rtl">
      <SaduFieldLabel>موعد التسليم</SaduFieldLabel>
      <SaduDateInput defaultValue="2027-02-14" locale="ar" hijri />
    </SaduField>
  )
  return <div style={PAIR}>{arabic ? [hijri, latin] : [latin, hijri]}</div>
}

function InputsGallery(): ReactElement {
  const t = useT()
  const arabic = useArabic()
  const motifs = motifSuggestions(arabic)
  const borders = borderOptions(arabic)
  const dyes = dyeOptions(arabic)
  const brief = arabic ? ARABIC_BRIEF_DRAFT : BRIEF_DRAFT
  const briefTokens = briefTriggers(arabic)
  const briefSample = briefSampler(arabic)
  const describeToken = arabic ? describeArabicToken : undefined
  return (
    <GallerySection
      title="Text and number entry"
      lede="Fields that weave as you work: a dhurs strip beats in on focus, notes sit on warp threads, counts are tallied in floats."
      arabicTitle="إدخال النصوص والأرقام"
      arabicLede="حقول تُنسج وأنت تعمل: شريط ضروس الخيل يُرصّ عند التركيز، والملاحظات تستقر على خيوط السدى، والأعداد تُحصى غرزةً غرزة."
    >
      <Card
        name="Input"
        idea="Focus beats a dhurs strip in along the bottom edge, from where you start reading."
        arabicIdea="عند التركيز يُرصّ شريط ضروس الخيل على الحافة السفلى، بدءًا من حيث تبدأ القراءة."
      >
        <div style={COLUMN}>
          <SaduField>
            <SaduFieldLabel>{t("Client name", "اسم العميل")}</SaduFieldLabel>
            <SaduInput defaultValue={t("Umm Saad Al-Ajmi", "أم سعد العجمي")} clearLabel={t("Clear client name", "مسح اسم العميل")} autoComplete="name" />
          </SaduField>
          <SaduField>
            <SaduFieldLabel>{t("Order", "رقم الطلب")}</SaduFieldLabel>
            <SaduInput defaultValue="KW-2026-0418" readOnly dir="ltr" />
          </SaduField>
        </div>
      </Card>

      <Card name="Field" idea="Required is a raised madder eye; an error is a frayed madder thread." arabicIdea="الحقل المطلوب عليه عين حمراء بارزة، والخطأ خيط أحمر منسول.">
        <div style={COLUMN}>
          <PanelField />
          <SaduField disabled>
            <SaduFieldLabel>{t("Workshop", "المشغل")}</SaduFieldLabel>
            <SaduInput defaultValue={t("Sadu House, Kuwait City", "بيت السدو، مدينة الكويت")} />
            <SaduFieldDescription>{t("Set by the Al Sadu Society.", "تحدّده جمعية السدو.")}</SaduFieldDescription>
          </SaduField>
        </div>
      </Card>

      <Card
        name="Number Input"
        idea="The warp counter: wood pegs either side, and a tally that weaves a float in for every row."
        arabicIdea="عدّاد السدى: وتدان من خشب على الجانبين، وعدّاد ينسج غرزة مع كل صف."
      >
        <div style={COLUMN}>
          <SaduField>
            <SaduFieldLabel>{t("Rows per band", "الصفوف في كل شريط")}</SaduFieldLabel>
            <SaduNumberInput
              defaultValue={11}
              min={3}
              max={21}
              step={2}
              unit={t("rows", "صف")}
              decrementLabel={t("Fewer rows", "صفوف أقل")}
              incrementLabel={t("More rows", "صفوف أكثر")}
            />
            <SaduFieldDescription>{t("Odd numbers keep the motif centred.", "العدد الفردي يُبقي النقشة في المنتصف.")}</SaduFieldDescription>
          </SaduField>
          <SaduField>
            <SaduFieldLabel>{t("Warp threads", "خيوط السدى")}</SaduFieldLabel>
            <SaduNumberInput
              variant="field"
              defaultValue={96}
              min={24}
              max={240}
              step={4}
              unit={t("ends", "خيط")}
              decrementLabel={t("Fewer ends", "خيوط أقل")}
              incrementLabel={t("More ends", "خيوط أكثر")}
            />
          </SaduField>
        </div>
      </Card>

      <Card
        name="Textarea"
        idea="Notes ruled with warp threads; a band weaves toward the limit, then turns to madder teeth."
        arabicIdea="ملاحظات مسطّرة بخيوط السدى، وشريط يُنسج كلما اقتربت من الحد، ثم يصير أسنانًا حمراء."
        wide
      >
        <div style={PAIR}>
          <NotesField
            label={t("Notes for the weaver", "ملاحظات للنسّاجة")}
            limit={NOTES_LIMIT}
            initial={t(
              "Client wants the centre band narrower than the last piece, and saffron in place of madder for the border.",
              "يريد العميل الشريط الأوسط أضيق من القطعة السابقة، والزعفراني بدل الأحمر في الحاشية.",
            )}
          />
          <NotesField
            label={t("Line for the order slip", "سطر لورقة الطلب")}
            limit={SLIP_LIMIT}
            initial={t(
              "Two ain bands in madder on goat hair, a dhurus border along both long edges, and a wool fringe left at the short ends, please.",
              "شريطان من نقشة العين بالأحمر على شعر الماعز، وحاشية ضروس الخيل على الحافتين الطويلتين، وأهداب من الصوف عند الطرفين القصيرين.",
            )}
          />
        </div>
      </Card>

      <Card name="Password Input" idea="Hidden characters are woven madder eyes; the toggle opens one." arabicIdea="الأحرف المخفية عيون حمراء منسوجة، وزر الإظهار يفتح إحداها.">
        <SaduField style={COLUMN}>
          <SaduFieldLabel>{t("Workshop passphrase", "عبارة مرور المشغل")}</SaduFieldLabel>
          <SaduPasswordInput defaultValue="goathair-loom" autoComplete="current-password" required />
          <SaduFieldDescription>{t("The one pinned up in the dye shed.", "المعلّقة على جدار المصبغة.")}</SaduFieldDescription>
        </SaduField>
      </Card>

      <Card name="OTP Input" idea="Each cell is a loom square of bare warp; a digit weaves a strip beneath it." arabicIdea="كل خانة مربع من سدى عارٍ، وكل رقم يُنسج تحته شريط." wide>
        <div style={STACK}>
          <SaduField>
            <SaduFieldLabel>{t("Code from the workshop", "رمز من المشغل")}</SaduFieldLabel>
            <SaduOTPInput defaultValue="482" />
            <SaduFieldDescription>{t("Sent by text to your phone.", "أُرسل في رسالة نصية إلى هاتفك.")}</SaduFieldDescription>
          </SaduField>
          <SaduField invalid>
            <SaduFieldLabel>{t("Code from the dye shed", "رمز من المصبغة")}</SaduFieldLabel>
            <SaduOTPInput defaultValue="731906" />
            <SaduFieldError match>{t("That code has expired. Ask for a new one.", "انتهت صلاحية الرمز. اطلب رمزًا جديدًا.")}</SaduFieldError>
          </SaduField>
        </div>
      </Card>

      <Card name="Autocomplete" idea="Motif suggestions, each with its band and Arabic name; the match is stitched." arabicIdea="اقتراحات للنقوش، لكل منها شريطها واسمها، والجزء المطابق مُطرّز.">
        <SaduField style={COLUMN}>
          <SaduFieldLabel>{t("Motif", "النقشة")}</SaduFieldLabel>
          <SaduAutocomplete
            suggestions={motifs}
            placeholder={t("Search motifs", "ابحث عن نقشة")}
            clearLabel={t("Clear motif", "مسح النقشة")}
          />
          <SaduFieldDescription>{t("Search in English or Arabic.", "ابحث بالعربية أو بالإنجليزية.")}</SaduFieldDescription>
        </SaduField>
      </Card>

      <Card name="Token Input" idea="Tokens carry a sample: a woven avatar, a strip of the band, a skein of the dye." arabicIdea="يحمل كل وسم عيّنة: صورة منسوجة، أو قطعة من الشريط، أو شلّة من الصبغة." wide>
        <SaduField style={WIDE}>
          <SaduFieldLabel>{t("Brief", "وصف الطلب")}</SaduFieldLabel>
          <SaduTokenInput
            defaultValue={brief}
            triggers={briefTokens}
            renderSample={briefSample}
            getTokenDescription={describeToken}
            placeholder={t("Describe the piece", "صِف القطعة")}
          />
          <SaduFieldDescription>
            {t(
              "Type @ for a weaver and # for a motif or dye. Backspace selects a token, then removes it.",
              "اكتب @ لاختيار نسّاجة، أو # لاختيار نقشة أو صبغة. زر الحذف يحدّد الوسم أولًا، ثم يزيله.",
            )}
          </SaduFieldDescription>
        </SaduField>
      </Card>

      <Card name="Combobox" idea="The chosen border shows its band in the field; chosen dyes wind in as skeins." arabicIdea="تظهر الحاشية المختارة بشريطها داخل الحقل، وتلتف الصبغات المختارة شللًا.">
        <div style={COLUMN}>
          <SaduField>
            <SaduFieldLabel>{t("Border motif", "نقشة الحاشية")}</SaduFieldLabel>
            <SaduCombobox
              options={borders}
              defaultValue="uwairjan"
              placeholder={t("Choose a border", "اختر حاشية")}
              triggerLabel={t("Show border motifs", "عرض نقوش الحاشية")}
            />
          </SaduField>
          <SaduField>
            <SaduFieldLabel>{t("Dyes for the band", "صبغات الشريط")}</SaduFieldLabel>
            <SaduCombobox
              multiple
              options={dyes}
              defaultValue={["madder", "indigo"]}
              placeholder={t("Add a dye", "أضف صبغة")}
              triggerLabel={t("Show dyes", "عرض الصبغات")}
            />
            <SaduFieldDescription>{t("Up to four colours per band.", "أربعة ألوان على الأكثر لكل شريط.")}</SaduFieldDescription>
          </SaduField>
        </div>
      </Card>

      <Card name="Date Input" idea="Segments parted by eyes; a goat-hair float slides to the one you edit." arabicIdea="أجزاء التاريخ تفصلها عيون، وغرزة من شعر الماعز تنتقل إلى الجزء الذي تعدّله." wide>
        <DueDates />
      </Card>

      <Card name="Time Input" idea="An eye between hour and minute, and the day as 24 floats with the hour in madder." arabicIdea="عين بين الساعة والدقيقة، واليوم 24 غرزة تظهر فيها الساعة بالأحمر.">
        <SaduField style={COLUMN}>
          <SaduFieldLabel>{t("Collection time", "موعد الاستلام")}</SaduFieldLabel>
          <SaduTimeInput defaultValue="16:30" hourCycle={12} locale={t("en-US", "ar")} />
        </SaduField>
      </Card>
    </GallerySection>
  )
}

export { InputsGallery }
