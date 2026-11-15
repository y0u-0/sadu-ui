import type { ReactElement } from "react"
import { LoomSlider } from "../src/sadu/loom-slider"
import { SaduLocaleProvider } from "../src/sadu/locale"
import { MotifSelect } from "../src/sadu/motif-select"
import { MOTIFS } from "../src/sadu/motifs"
import { WOOLS } from "../src/sadu/palette"
import { Rug, mainColors } from "../src/sadu/rug"
import {
  SaduAlertDialogClose,
  SaduAlertDialogDescription,
  SaduAlertDialogFooter,
  SaduAlertDialogSpecimen,
  SaduAlertDialogTitle,
} from "../src/sadu/sadu-alert-dialog"
import { SaduCalendar } from "../src/sadu/sadu-calendar"
import { SaduSegment, SaduSegmentedControl } from "../src/sadu/sadu-segmented-control"
import { SaduSwitch } from "../src/sadu/sadu-switch"
import { SaduToastSpecimen } from "../src/sadu/sadu-toast"
import { SkeinRadio } from "../src/sadu/skein-radio"
import "./poster.css"

const MADDER = WOOLS.madder.hex

type Format = "landscape" | "portrait"

function formatOf(): Format {
  return new URLSearchParams(location.search).get("format") === "portrait" ? "portrait" : "landscape"
}

function Masthead(): ReactElement {
  return (
    <section className="tile tile--copy">
      <div className="wordmark">
        <span>Sadu</span>
        <span className="wordmark__rule" aria-hidden="true" />
        <span className="wordmark__arabic" lang="ar">
          السدو
        </span>
      </div>
      <p className="lede">Interface components woven from Al Sadu, the Bedouin weaving.</p>
      <div className="footline">
        <span>56 React components on UI&nbsp;SDK</span>
        <span className="footline__url">sadu-ui.pages.dev</span>
      </div>
    </section>
  )
}

function Workbench(): ReactElement {
  return (
    <section className="tile tile--bench" data-theme="day">
      <div className="bench">
        <div className="bench__item bench__select">
          <MotifSelect label="Main band" dye={MADDER} value="eyoun" open modal={false} />
        </div>
        <div className="bench__item bench__detail">
          <SaduSegmentedControl aria-label="Level of detail" value="cloth">
            <SaduSegment value="thread">Thread</SaduSegment>
            <SaduSegment value="cloth">Cloth</SaduSegment>
            <SaduSegment value="stitch">Stitch</SaduSegment>
          </SaduSegmentedControl>
        </div>
        <div className="bench__item bench__skeins">
          <SkeinRadio value="madder" />
        </div>
        <div className="bench__item bench__slider">
          <LoomSlider label="Rows woven" grid={MOTIFS.uwairjan.grid} colors={mainColors(MADDER)} value={56} max={96} unit="rows" />
        </div>
        <div className="bench__item bench__switch">
          <SaduSwitch defaultChecked>Fringe at both ends</SaduSwitch>
        </div>
        <div className="bench__item bench__toast">
          <SaduToastSpecimen type="success" title="Dye lot recorded" description="Madder, 3 skeins." action="Undo" progress={0.62} />
        </div>
      </div>
    </section>
  )
}

function Calendar(): ReactElement {
  return (
    <section className="tile tile--calendar">
      <div className="calendar">
        <SaduCalendar mode="range" defaultMonth="2026-11" defaultValue={["2026-11-11", "2026-11-19"]} aria-label="Loom booked" />
      </div>
    </section>
  )
}

function Loom(): ReactElement {
  return (
    <section className="tile tile--loom">
      <div className="loom">
        <Rug className="loom__rug" motif="uwairjan" dye={MADDER} level="thread" seed={11} woven={300} />
        <span className="loom__beam sadu-wood" aria-hidden="true" />
        <span className="loom__beater sadu-wood" aria-hidden="true" />
      </div>
    </section>
  )
}

function Arabic(): ReactElement {
  return (
    <section className="tile tile--arabic" dir="rtl" lang="ar" data-theme="day">
      <SaduLocaleProvider locale="ar">
        <div className="arabic">
          <SaduAlertDialogSpecimen motif="eyoun">
            <SaduAlertDialogTitle>نقض هذا الشريط؟</SaduAlertDialogTitle>
            <SaduAlertDialogDescription>تعود صفوف العين الـ46 سدى عاريًا.</SaduAlertDialogDescription>
            <SaduAlertDialogFooter>
              <SaduAlertDialogClose variant="secondary">مواصلة النسج</SaduAlertDialogClose>
              <SaduAlertDialogClose variant="primary">نقض الشريط</SaduAlertDialogClose>
            </SaduAlertDialogFooter>
          </SaduAlertDialogSpecimen>
        </div>
      </SaduLocaleProvider>
    </section>
  )
}

function Poster(): ReactElement {
  const format = formatOf()
  return (
    <main className="poster" data-format={format} data-motion="reduced">
      <Masthead />
      <Workbench />
      <Calendar />
      <Loom />
      <Arabic />
    </main>
  )
}

export { Poster }
