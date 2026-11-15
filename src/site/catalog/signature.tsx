import { Fragment, useId, useState, type ReactElement } from "react"
import { EyeRating } from "../../sadu/eye-rating"
import { LoomSlider } from "../../sadu/loom-slider"
import { MotifSelect, MotifSwatch } from "../../sadu/motif-select"
import { MOTIFS, PICKABLE, type MotifId } from "../../sadu/motifs"
import { WOOLS, type WoolId } from "../../sadu/palette"
import { Rug, mainColors } from "../../sadu/rug"
import { SaduButton } from "../../sadu/sadu-button"
import { SaduSegment, SaduSegmentedControl } from "../../sadu/sadu-segmented-control"
import { SaduSwitch } from "../../sadu/sadu-switch"
import { SaduTabs } from "../../sadu/sadu-tabs"
import { SkeinRadio } from "../../sadu/skein-radio"
import { Reweave, type Level } from "../../sadu/weave"
import { knob } from "../knobs"
import { useLocale, type Locale } from "../locale"
import { useSettings } from "../settings"
import { playground, type EntryDefinition } from "./define"

const SEED = 7

type Strings = { en: string; ar: string }

function pick(locale: Locale, text: Strings): string {
  return text[locale]
}

function RugDemo({ dye, motif, level, seed }: { dye: WoolId; motif: MotifId; level: Level; seed: number }): ReactElement {
  const locale = useLocale()
  return (
    <figure className="demo-rug">
      <Rug className="demo-rug__cloth" motif={motif} dye={WOOLS[dye].hex} level={level} seed={seed} />
      <figcaption className="demo-caption">
        {locale === "ar"
          ? `الطلب 14، قاطع المجلس. حاشية ${MOTIFS[motif].arabic}، وشجرة منسوجة من البذرة ${seed}.`
          : `Order 14, majlis divider. ${MOTIFS[motif].name} borders, a Shajarah woven from seed ${seed}.`}
      </figcaption>
    </figure>
  )
}

const LEVEL_OPTIONS: readonly { value: Level; en: string; ar: string }[] = [
  { value: "thread", en: "Thread", ar: "خيط" },
  { value: "cloth", en: "Cloth", ar: "قماش" },
  { value: "stitch", en: "Stitch", ar: "غرزة" },
]

function isLevel(value: unknown): value is Level {
  return LEVEL_OPTIONS.some((option) => option.value === value)
}

function RugCard({ dye, motif: initialMotif }: { dye: WoolId; motif: MotifId }): ReactElement {
  const locale = useLocale()
  const [motif, setMotif] = useState(initialMotif)
  const [seed, setSeed] = useState(SEED)
  const [level, setLevel] = useState<Level>("cloth")
  const levelId = useId()
  return (
    <div className="demo-loom">
      <div className="demo-loom__frame">
        <Rug className="demo-loom__rug" motif={motif} dye={WOOLS[dye].hex} seed={seed} level={level} />
      </div>
      <div className="demo-loom__controls">
        <MotifSelect label={pick(locale, { en: "Border", ar: "الحاشية" })} dye={WOOLS[dye].hex} value={motif} onValueChange={setMotif} />
        <div className="demo-loom__level">
          <span className="sadu-label" id={levelId}>
            {pick(locale, { en: "Level of detail", ar: "مستوى التفصيل" })}
          </span>
          <SaduSegmentedControl
            aria-labelledby={levelId}
            value={level}
            onValueChange={(next: unknown) => isLevel(next) && setLevel(next)}
          >
            {LEVEL_OPTIONS.map((option) => (
              <SaduSegment key={option.value} value={option.value}>
                {option[locale]}
              </SaduSegment>
            ))}
          </SaduSegmentedControl>
        </div>
        <SaduButton variant="secondary" onClick={() => setSeed((current) => current + 1)}>
          {pick(locale, { en: "Weave another Shajarah", ar: "نسج شجرة أخرى" })}
        </SaduButton>
      </div>
    </div>
  )
}

function SliderDemo({ dye, motif, level, max }: { dye: WoolId; motif: MotifId; level: Level; max: number }): ReactElement {
  const locale = useLocale()
  const [rows, setRows] = useState(Math.round(max * 0.58))
  const woven = Math.min(rows, max)
  return (
    <div className="demo-stack demo-stack--wide">
      <LoomSlider
        label={pick(locale, { en: "Rows woven on order 14", ar: "الصفوف المنسوجة في الطلب 14" })}
        unit={pick(locale, { en: "rows", ar: "صف" })}
        grid={MOTIFS[motif].grid}
        colors={mainColors(WOOLS[dye].hex)}
        level={level}
        value={woven}
        onValueChange={setRows}
        max={max}
      />
      <p className="demo-caption">
        {locale === "ar"
          ? `الصفوف الباقية قبل أن تقصّه أم سعد من النول: ${max - woven}`
          : `${max - woven} rows left before Umm Saad cuts it from the loom.`}
      </p>
    </div>
  )
}

function MotifSelectDemo({ dye, motif: initial }: { dye: WoolId; motif: MotifId }): ReactElement {
  const locale = useLocale()
  const [motif, setMotif] = useState(initial)
  return (
    <div className="demo-stack demo-narrow">
      <MotifSelect label={pick(locale, { en: "Main band", ar: "الشريط الرئيسي" })} dye={WOOLS[dye].hex} value={motif} onValueChange={setMotif} />
      <Reweave className="demo-strip" grid={MOTIFS[motif].grid} colors={mainColors(WOOLS[dye].hex)} level="stitch" />
    </div>
  )
}

function SkeinsDemo({ wools }: { wools: "all" | "dyed" }): ReactElement {
  const locale = useLocale()
  const { dye, update } = useSettings()
  const choices: readonly WoolId[] = wools === "dyed" ? ["madder", "saffron", "indigo"] : ["madder", "saffron", "indigo", "camel", "charcoal"]
  const nameOf = (id: WoolId): string => (locale === "ar" ? WOOLS[id].arabic : WOOLS[id].name)
  return (
    <div className="demo-stack demo-narrow">
      <SkeinRadio
        label={pick(locale, { en: "Dye for the whole catalogue", ar: "صبغة الدليل كلّه" })}
        wools={choices}
        value={choices.includes(dye) ? dye : null}
        onValueChange={(next) => update({ dye: next })}
        nameOf={nameOf}
        nameSlot={nameOf(dye)}
      />
      <p className="demo-caption">
        {locale === "ar" ? "في المصبغة ثلاث شلل من هذه الصبغة." : `Three skeins of ${WOOLS[dye].name.toLowerCase()} in the dye shed.`}
      </p>
    </div>
  )
}

function SwitchDemo({ dye, disabled, checked }: { dye: WoolId; disabled: boolean; checked: boolean }): ReactElement {
  const locale = useLocale()
  const hex = WOOLS[dye].hex
  return (
    <div className="demo-stack demo-fit">
      <SaduSwitch dye={hex} defaultChecked={checked} disabled={disabled}>
        {pick(locale, { en: "Dyed wool", ar: "صوف مصبوغ" })}
      </SaduSwitch>
      <SaduSwitch dye={hex} disabled={disabled}>
        {pick(locale, { en: "Fringe at both ends", ar: "أهداب عند الطرفين" })}
      </SaduSwitch>
      <SaduSwitch dye={hex} defaultChecked disabled>
        {pick(locale, { en: "Goat-hair warp", ar: "سدى من شعر الماعز" })}
      </SaduSwitch>
    </div>
  )
}

const TAB_COPY = {
  en: {
    label: "Order 14",
    motifs: "Motifs",
    wool: "Wool",
    loom: "Loom",
    stock: [
      ["Madder", "4 skeins"],
      ["Goat hair", "11 skeins"],
      ["Undyed wool", "6 skeins"],
    ],
    facts: [
      ["Warp", "412 ends"],
      ["Woven", "46 of 96 rows"],
      ["Weaver", "Umm Saad"],
    ],
  },
  ar: {
    label: "الطلب 14",
    motifs: "النقوش",
    wool: "الصوف",
    loom: "النول",
    stock: [
      ["الأحمر", "4 شلل"],
      ["شعر الماعز", "11 شلة"],
      ["صوف طبيعي", "6 شلل"],
    ],
    facts: [
      ["السدى", "412 خيطًا"],
      ["المنسوج", "46 من 96 صفًا"],
      ["النسّاجة", "أم سعد"],
    ],
  },
} as const

function Facts({ rows }: { rows: readonly (readonly [string, string])[] }): ReactElement {
  return (
    <dl className="demo-facts">
      {rows.map(([term, detail]) => (
        <Fragment key={term}>
          <dt>{term}</dt>
          <dd>{detail}</dd>
        </Fragment>
      ))}
    </dl>
  )
}

function TabsDemo({ dye }: { dye: WoolId }): ReactElement {
  const locale = useLocale()
  const copy = TAB_COPY[locale]
  const hex = WOOLS[dye].hex
  return (
    <SaduTabs
      className="demo-tabs"
      label={copy.label}
      dye={hex}
      defaultValue="motifs"
      tabs={[
        {
          value: "motifs",
          label: copy.motifs,
          panel: (
            <ul className="demo-list">
              {PICKABLE.slice(0, 3).map((id) => (
                <li key={id}>
                  <MotifSwatch motif={id} dye={hex} />
                  <span lang={locale === "ar" ? "ar" : "en"}>{locale === "ar" ? MOTIFS[id].arabic : MOTIFS[id].name}</span>
                  <span className="demo-list__meta" lang={locale === "ar" ? "en" : "ar"}>
                    {locale === "ar" ? MOTIFS[id].name : MOTIFS[id].arabic}
                  </span>
                </li>
              ))}
            </ul>
          ),
        },
        { value: "wool", label: copy.wool, panel: <Facts rows={copy.stock} /> },
        { value: "loom", label: copy.loom, panel: <Facts rows={copy.facts} /> },
      ]}
    />
  )
}

function RatingDemo({ max, initial }: { max: number; initial: number }): ReactElement {
  const locale = useLocale()
  const [value, setValue] = useState<number | null>(Math.min(initial, max))
  const label = pick(locale, { en: "Tightness of the weave", ar: "إحكام النسج" })
  return (
    <div className="demo-stack demo-fit">
      <span className="sadu-label">{label}</span>
      <EyeRating label={label} max={max} value={value} onValueChange={setValue} />
      <span className="demo-caption">
        {locale === "ar" ? `تقييم حصة: ${value ?? 0} من ${max}` : `Hessa's rating: ${value ?? 0} of ${max} eyes`}
      </span>
    </div>
  )
}

const LEVEL_LABELS = { thread: "Thread", cloth: "Cloth", stitch: "Stitch" } as const

const SIGNATURE: readonly EntryDefinition[] = [
  {
    id: "rug",
    registry: "sadu-core",
    file: "rug.tsx",
    name: "Rug",
    base: null,
    idea: "A whole textile: bands in mirror order around a Shajarah that is woven fresh from its seed.",
    arabicIdea: "نسيج كامل: أشرطة متناظرة حول شجرة تُنسج من جديد من بذرتها.",
    usage: "import { Rug } from \"@/components/sadu/rug\"\nimport { WOOLS } from \"@/components/sadu/palette\"\n\n<Rug motif=\"uwairjan\" dye={WOOLS.madder.hex} level=\"cloth\" seed={7} />",
    playground: playground(
      {
        dye: knob.dye(),
        motif: knob.motif("uwairjan", "Border motif"),
        level: knob.choice("Level of detail", ["thread", "cloth", "stitch"], "cloth", { labels: LEVEL_LABELS }),
        seed: knob.number("Shajarah seed", SEED, { min: 1, max: 999 }),
      },
      (values) => <RugDemo {...values} />,
      (values) => <RugCard dye={values.dye} motif={values.motif} />,
    ),
  },
  {
    id: "loom-slider",
    name: "Loom Slider",
    base: "Slider",
    idea: "Drag the wood beater and the cloth is woven behind it; ahead lies bare warp.",
    arabicIdea: "اسحب العارضة الخشبية فيُنسج القماش خلفها، وأمامها سدى عارٍ.",
    usage: "import { LoomSlider } from \"@/components/sadu/loom-slider\"\nimport { MOTIFS } from \"@/components/sadu/motifs\"\nimport { WOOLS } from \"@/components/sadu/palette\"\nimport { mainColors } from \"@/components/sadu/rug\"\n\nconst [rows, setRows] = useState(46)\n\n<LoomSlider\n  label=\"Rows woven\"\n  grid={MOTIFS.uwairjan.grid}\n  colors={mainColors(WOOLS.madder.hex)}\n  value={rows}\n  onValueChange={setRows}\n  max={96}\n/>",
    playground: playground(
      {
        dye: knob.dye(),
        motif: knob.motif("uwairjan"),
        level: knob.choice("Level of detail", ["thread", "cloth", "stitch"], "cloth", { labels: LEVEL_LABELS }),
        max: knob.number("Rows in the order", 96, { min: 20, max: 160, step: 4, remount: true }),
      },
      (values) => <SliderDemo {...values} />,
    ),
  },
  {
    id: "motif-select",
    name: "Motif Select",
    base: "Select",
    idea: "Pick a motif, watch it weave: every option is shown as cloth.",
    arabicIdea: "اختر نقشة وشاهدها تُنسج، فكل خيار يظهر قماشًا.",
    usage: "import { MotifSelect } from \"@/components/sadu/motif-select\"\nimport type { MotifId } from \"@/components/sadu/motifs\"\nimport { WOOLS } from \"@/components/sadu/palette\"\n\nconst [motif, setMotif] = useState<MotifId>(\"eyoun\")\n\n<MotifSelect label=\"Main band\" dye={WOOLS.madder.hex} value={motif} onValueChange={setMotif} />",
    playground: playground(
      { dye: knob.dye(), motif: knob.motif("eyoun", "Starting motif", { remount: true }) },
      (values) => <MotifSelectDemo {...values} />,
    ),
  },
  {
    id: "skein-radio",
    name: "Skeins",
    base: "Radio Group",
    idea: "Twisted skeins of dyed yarn. This one dyes the whole catalogue.",
    arabicIdea: "شلل مفتولة من خيوط مصبوغة، وهذه تصبغ الدليل كلّه.",
    usage: "import type { WoolId } from \"@/components/sadu/palette\"\nimport { SkeinRadio } from \"@/components/sadu/skein-radio\"\n\nconst [wool, setWool] = useState<WoolId>(\"madder\")\n\n<SkeinRadio label=\"Wool\" name=\"wool\" value={wool} onValueChange={setWool} />",
    playground: playground(
      { wools: knob.choice("Skeins", ["all", "dyed"], "all", { labels: { all: "All five", dyed: "Dyed only" } }) },
      (values) => <SkeinsDemo {...values} />,
    ),
  },
  {
    id: "sadu-switch",
    name: "Switch",
    base: "Switch",
    idea: "Off is bare warp, on is a woven band; the wood thumb is the beater.",
    arabicIdea: "الإيقاف سدى عارٍ، والتشغيل شريط منسوج، والمقبض الخشبي هو العارضة.",
    usage: "import { WOOLS } from \"@/components/sadu/palette\"\nimport { SaduSwitch } from \"@/components/sadu/sadu-switch\"\n\n<SaduSwitch defaultChecked dye={WOOLS.madder.hex}>\n  Dyed wool\n</SaduSwitch>",
    playground: playground(
      { dye: knob.dye(), checked: knob.toggle("Checked at first", true, { remount: true }), disabled: knob.toggle("Disabled") },
      (values) => <SwitchDemo {...values} />,
    ),
  },
  {
    id: "sadu-tabs",
    name: "Tabs",
    base: "Tabs",
    idea: "A three-row band rides under the active tab like a shuttle.",
    arabicIdea: "شريط من ثلاثة صفوف ينتقل تحت التبويب النشط كالمكّوك.",
    usage: "import { SaduTabs } from \"@/components/sadu/sadu-tabs\"\n\n<SaduTabs\n  label=\"Order 14\"\n  defaultValue=\"motifs\"\n  tabs={[\n    { value: \"motifs\", label: \"Motifs\", panel: <MotifList /> },\n    { value: \"wool\", label: \"Wool\", panel: <WoolStock /> },\n    { value: \"loom\", label: \"Loom\", panel: <LoomFacts /> },\n  ]}\n/>",
    playground: playground({ dye: knob.dye() }, (values) => <TabsDemo {...values} />),
  },
  {
    id: "eye-rating",
    name: "Rating",
    base: "Rating",
    idea: "Ain eyes counted on a single thread.",
    arabicIdea: "عيون من نقشة العين، تُعدّ على خيط واحد.",
    usage: "import { EyeRating } from \"@/components/sadu/eye-rating\"\n\nconst [score, setScore] = useState<number | null>(4)\n\n<EyeRating label=\"Tightness of the weave\" value={score} onValueChange={setScore} />",
    playground: playground(
      { max: knob.number("Eyes", 5, { min: 3, max: 8 }), initial: knob.number("Starting value", 4, { min: 0, max: 8, remount: true }) },
      (values) => <RatingDemo {...values} />,
    ),
  },
]

export { SIGNATURE }
