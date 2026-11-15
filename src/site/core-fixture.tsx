import { useState, type FormEvent, type ReactElement, type ReactNode } from "react"
import { EyeRating } from "../sadu/eye-rating"
import { LoomSlider } from "../sadu/loom-slider"
import { MotifSelect } from "../sadu/motif-select"
import { MOTIFS, type MotifId } from "../sadu/motifs"
import { WOOLS, type WoolId } from "../sadu/palette"
import { Rug, mainColors } from "../sadu/rug"
import { SaduSwitch } from "../sadu/sadu-switch"
import { SaduTabs } from "../sadu/sadu-tabs"
import { SkeinRadio } from "../sadu/skein-radio"
import { Reweave } from "../sadu/weave"
import "./styles/core-fixture.css"

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }): ReactElement {
  return (
    <section className="fixture" data-fixture={id} aria-label={title}>
      <h2 className="fixture__title">{title}</h2>
      {children}
    </section>
  )
}

function SliderFixtures(): ReactElement {
  const [rows, setRows] = useState(40)
  const colors = mainColors(WOOLS.madder.hex)
  return (
    <Section id="slider" title="Loom slider">
      <div className="fixture__wide" data-case="uncontrolled">
        <LoomSlider label="Uncontrolled" grid={MOTIFS.uwairjan.grid} colors={colors} defaultValue={20} name="uncontrolled" />
      </div>
      <div className="fixture__wide" data-case="controlled">
        <LoomSlider label="Controlled" grid={MOTIFS.uwairjan.grid} colors={colors} value={rows} onValueChange={setRows} unit="rows" />
        <output data-testid="controlled-rows">{rows}</output>
        <button type="button" onClick={() => setRows(72)}>
          Set 72
        </button>
      </div>
      <div className="fixture__wide" data-case="rtl" dir="rtl">
        <LoomSlider label="RTL" grid={MOTIFS.uwairjan.grid} colors={colors} defaultValue={40} />
      </div>
      <div className="fixture__wide" data-case="stitch">
        <LoomSlider label="Stitch" grid={MOTIFS.dhalla.grid} colors={colors} level="stitch" defaultValue={10} max={37} />
      </div>
    </Section>
  )
}

function MotifFixtures(): ReactElement {
  const [motif, setMotif] = useState<MotifId>("eyoun")
  const [calls, setCalls] = useState(0)
  return (
    <Section id="motif" title="Motif select">
      <MotifSelect
        label="Main band"
        dye={WOOLS.madder.hex}
        value={motif}
        onValueChange={(next) => {
          setMotif(next)
          setCalls((count) => count + 1)
        }}
      />
      <output data-testid="motif-value">{motif}</output>
      <output data-testid="motif-calls">{calls}</output>
    </Section>
  )
}

function SkeinFixtures(): ReactElement {
  const [submitted, setSubmitted] = useState("")
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    setSubmitted(String(new FormData(event.currentTarget).get("wool") ?? ""))
  }
  return (
    <Section id="skeins" title="Skeins">
      <form onSubmit={submit}>
        <SkeinRadio label="Wool" name="wool" defaultValue="saffron" />
        <button type="submit">Submit wool</button>
      </form>
      <output data-testid="skein-submitted">{submitted}</output>
    </Section>
  )
}

function SwitchFixtures(): ReactElement {
  return (
    <Section id="switch" title="Switch">
      <SaduSwitch>Dyed wool</SaduSwitch>
      <SaduSwitch disabled>Goat-hair warp</SaduSwitch>
      <div dir="rtl" data-case="rtl">
        <SaduSwitch defaultChecked>Fringe</SaduSwitch>
      </div>
    </Section>
  )
}

function TabsFixtures(): ReactElement {
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr")
  const [narrow, setNarrow] = useState(false)
  return (
    <Section id="tabs" title="Tabs">
      <div className="fixture__tabs" dir={direction} data-narrow={narrow || undefined}>
        <SaduTabs
          label="Order 14"
          defaultValue="motifs"
          tabs={[
            { value: "motifs", label: "Motifs", panel: <p>Motif panel</p> },
            { value: "wool", label: "Wool and dye lots", panel: <p>Wool panel</p> },
            { value: "loom", label: "Loom", panel: <p>Loom panel</p> },
          ]}
        />
      </div>
      <button type="button" onClick={() => setDirection((current) => (current === "ltr" ? "rtl" : "ltr"))}>
        Flip direction
      </button>
      <button type="button" onClick={() => setNarrow((current) => !current)}>
        Toggle width
      </button>
    </Section>
  )
}

function RatingFixtures(): ReactElement {
  const [value, setValue] = useState<number | null>(3)
  return (
    <Section id="rating" title="Rating">
      <EyeRating label="Tightness" value={value} onValueChange={setValue} />
      <output data-testid="rating-value">{value ?? "none"}</output>
      <EyeRating label="Deselectable" defaultValue={2} deselectable />
    </Section>
  )
}

const RUG_STEPS: readonly { motif: MotifId; wool: WoolId }[] = [
  { motif: "eyoun", wool: "madder" },
  { motif: "uwairjan", wool: "saffron" },
  { motif: "dhalla", wool: "indigo" },
]

function RugFixtures(): ReactElement {
  const [step, setStep] = useState(0)
  const current = RUG_STEPS[step % RUG_STEPS.length] ?? RUG_STEPS[0]!
  return (
    <Section id="rug" title="Rug">
      <div className="fixture__wide">
        <Rug motif={current.motif} dye={WOOLS[current.wool].hex} level="stitch" />
        <Reweave className="fixture__strip" grid={MOTIFS[current.motif].grid} colors={mainColors(WOOLS[current.wool].hex)} level="stitch" />
      </div>
      <output data-testid="rug-step">{`${current.motif}:${WOOLS[current.wool].hex}`}</output>
      <button type="button" onClick={() => setStep((index) => index + 1)}>
        Next rug
      </button>
      <button type="button" onClick={() => setStep((index) => Math.max(0, index - 1))}>
        Undo rug
      </button>
    </Section>
  )
}

function CoreFixture(): ReactElement {
  return (
    <main className="fixtures">
      <SliderFixtures />
      <MotifFixtures />
      <SkeinFixtures />
      <SwitchFixtures />
      <TabsFixtures />
      <RatingFixtures />
      <RugFixtures />
    </main>
  )
}

export { CoreFixture }
