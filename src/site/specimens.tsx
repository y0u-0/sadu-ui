import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react"
import { flushSync } from "react-dom"
import { LoomSlider } from "../sadu/loom-slider"
import { MotifSelect } from "../sadu/motif-select"
import { MOTIFS, PICKABLE } from "../sadu/motifs"
import { OverlayDetails } from "../sadu/overlay-kit"
import { INK, WOOLS } from "../sadu/palette"
import { BandSwatch } from "../sadu/parts"
import { mainColors } from "../sadu/rug"
import {
  SaduAlertDialogClose,
  SaduAlertDialogDescription,
  SaduAlertDialogFooter,
  SaduAlertDialogSpecimen,
  SaduAlertDialogTitle,
} from "../sadu/sadu-alert-dialog"
import { SaduButton } from "../sadu/sadu-button"
import {
  SaduDialogClose,
  SaduDialogDescription,
  SaduDialogDismiss,
  SaduDialogFooter,
  SaduDialogHeader,
  SaduDialogSpecimen,
  SaduDialogTitle,
} from "../sadu/sadu-dialog"
import {
  SaduDrawerClose,
  SaduDrawerDescription,
  SaduDrawerDismiss,
  SaduDrawerFooter,
  SaduDrawerHeader,
  SaduDrawerSpecimen,
  SaduDrawerTitle,
} from "../sadu/sadu-drawer"
import { MotifPreview, SaduHoverCardSpecimen } from "../sadu/sadu-hover-card"
import { SaduNavigationMenuSpecimen, SaduNavigationMenuSpecimenLink } from "../sadu/sadu-navigation-menu"
import { SaduPopoverDescription, SaduPopoverSpecimen, SaduPopoverTitle } from "../sadu/sadu-popover"
import { SaduToastSpecimen } from "../sadu/sadu-toast"
import { SaduTooltipSpecimen } from "../sadu/sadu-tooltip"
import { SkeinRadio } from "../sadu/skein-radio"
import { useLocale } from "./locale"

type Text = { en: string; ar: string }

type Say = (text: Text) => string

type Specimen = { zoom: number; render: (dye: string, say: Say) => ReactNode }

const SPECIMENS: Readonly<Record<string, Specimen>> = {
  "sadu-dialog": {
    zoom: 0.56,
    render: (dye, say) => (
      <SaduDialogSpecimen motif="uwairjan" dye={dye}>
        <SaduDialogHeader>
          <div>
            <SaduDialogTitle>{say({ en: "Edit main band", ar: "تعديل الشريط الرئيسي" })}</SaduDialogTitle>
            <SaduDialogDescription>
              {say({ en: "Order 14, the majlis divider Umm Saad is weaving.", ar: "الطلب 14، قاطع المجلس الذي تنسجه أم سعد." })}
            </SaduDialogDescription>
          </div>
          <SaduDialogDismiss />
        </SaduDialogHeader>
        <div className="specimen__fields">
          <MotifSelect label={say({ en: "Motif", ar: "النقشة" })} dye={dye} value="uwairjan" />
          <SkeinRadio label={say({ en: "Wool", ar: "الصوف" })} value="madder" />
        </div>
        <SaduDialogFooter>
          <SaduDialogClose variant="secondary">{say({ en: "Cancel", ar: "إلغاء" })}</SaduDialogClose>
          <SaduDialogClose variant="primary">{say({ en: "Save", ar: "حفظ" })}</SaduDialogClose>
        </SaduDialogFooter>
      </SaduDialogSpecimen>
    ),
  },
  "sadu-alert-dialog": {
    zoom: 0.6,
    render: (_dye, say) => (
      <SaduAlertDialogSpecimen motif="eyoun">
        <SaduAlertDialogTitle>{say({ en: "Unravel this band?", ar: "نقض هذا الشريط؟" })}</SaduAlertDialogTitle>
        <SaduAlertDialogDescription>
          {say({
            en: "The 46 rows of Ain on order 14 go back to bare warp. The weft cannot be saved.",
            ar: "ستعود الصفوف الـ46 من نقشة العين في الطلب 14 سدى عاريًا. لا يمكن استرجاع اللحمة.",
          })}
        </SaduAlertDialogDescription>
        <SaduAlertDialogFooter>
          <SaduAlertDialogClose variant="secondary">{say({ en: "Keep weaving", ar: "مواصلة النسج" })}</SaduAlertDialogClose>
          <SaduAlertDialogClose variant="primary">{say({ en: "Unravel band", ar: "نقض الشريط" })}</SaduAlertDialogClose>
        </SaduAlertDialogFooter>
      </SaduAlertDialogSpecimen>
    ),
  },
  "sadu-drawer": {
    zoom: 0.6,
    render: (dye, say) => (
      <SaduDrawerSpecimen side="end" dye={dye}>
        <SaduDrawerHeader>
          <div>
            <SaduDrawerTitle>{say({ en: "Order 14", ar: "الطلب 14" })}</SaduDrawerTitle>
            <SaduDrawerDescription>{say({ en: "Majlis divider for Noura Al-Sabah.", ar: "قاطع مجلس لنورة الصباح." })}</SaduDrawerDescription>
          </div>
          <SaduDrawerDismiss />
        </SaduDrawerHeader>
        <OverlayDetails
          items={[
            { term: say({ en: "Client", ar: "العميلة" }), detail: say({ en: "Noura Al-Sabah", ar: "نورة الصباح" }) },
            { term: say({ en: "Weaver", ar: "النسّاجة" }), detail: say({ en: "Umm Saad", ar: "أم سعد" }) },
            { term: say({ en: "Size", ar: "المقاس" }), detail: say({ en: "3.2 × 0.6 m", ar: "3.2 × 0.6 م" }) },
            { term: say({ en: "Price", ar: "السعر" }), detail: say({ en: "185.000 KD", ar: "185.000 د.ك" }) },
            { term: say({ en: "Due", ar: "التسليم" }), detail: say({ en: "12 Rajab", ar: "12 رجب" }) },
          ]}
        />
        <SaduDrawerFooter>
          <SaduDrawerClose variant="secondary">{say({ en: "Close", ar: "إغلاق" })}</SaduDrawerClose>
          <SaduButton variant="primary">{say({ en: "Message Umm Saad", ar: "مراسلة أم سعد" })}</SaduButton>
        </SaduDrawerFooter>
      </SaduDrawerSpecimen>
    ),
  },
  "sadu-popover": {
    zoom: 0.72,
    render: (dye, say) => (
      <SaduPopoverSpecimen dye={dye}>
        <SaduPopoverTitle>{say({ en: "Band width", ar: "عرض الشريط" })}</SaduPopoverTitle>
        <SaduPopoverDescription>
          {say({ en: "Rows across the main band, before the border.", ar: "عدد الصفوف في عرض الشريط الرئيسي، من دون الحاشية." })}
        </SaduPopoverDescription>
        <div className="specimen__fields">
          <LoomSlider label={say({ en: "Woven", ar: "المنسوج" })} grid={MOTIFS.uwairjan.grid} colors={mainColors(dye)} min={11} max={80} value={46} />
        </div>
      </SaduPopoverSpecimen>
    ),
  },
  "sadu-hover-card": {
    zoom: 0.9,
    render: (dye, say) => (
      <SaduHoverCardSpecimen>
        <MotifPreview
          motif="uwairjan"
          dye={dye}
          meaning={say({ en: "Facing triangles. Woven beside the Shajarah.", ar: "مثلثات متقابلة، تُنسج بجوار الشجرة." })}
        />
      </SaduHoverCardSpecimen>
    ),
  },
  "sadu-tooltip": {
    zoom: 1,
    render: (_dye, say) => <SaduTooltipSpecimen shortcut="mod+z">{say({ en: "Undo last pick", ar: "التراجع عن آخر لحمة" })}</SaduTooltipSpecimen>,
  },
  "sadu-toast": {
    zoom: 1,
    render: (_dye, say) => (
      <div className="specimen__stack">
        <SaduToastSpecimen
          type="success"
          title={say({ en: "Dye lot recorded", ar: "سُجّلت دفعة الصبغ" })}
          description={say({ en: "Madder, 3 skeins.", ar: "أحمر، 3 شلل." })}
          action={say({ en: "Undo", ar: "تراجع" })}
          progress={0.62}
        />
        <SaduToastSpecimen
          type="error"
          title={say({ en: "Loom not reached", ar: "تعذّر الوصول إلى النول" })}
          description={say({ en: "Mariam's loom is offline.", ar: "نول مريم غير متصل." })}
          action={say({ en: "Retry", ar: "إعادة المحاولة" })}
          progress={0.3}
        />
      </div>
    ),
  },
  "sadu-navigation-menu": {
    zoom: 0.8,
    render: (dye, say) => (
      <SaduNavigationMenuSpecimen
        sections={[say({ en: "Motifs", ar: "النقوش" }), say({ en: "Materials", ar: "الخامات" }), say({ en: "Visit", ar: "الزيارة" })]}
        open={say({ en: "Motifs", ar: "النقوش" })}
      >
        <ul className="specimen__nav-grid">
          {PICKABLE.slice(0, 4).map((id) => (
            <li key={id}>
              <SaduNavigationMenuSpecimenLink
                current={id === "uwairjan"}
                title={say({ en: MOTIFS[id].name, ar: MOTIFS[id].arabic })}
                description={say({ en: `${MOTIFS[id].arabic}, ${MOTIFS[id].gloss}`, ar: MOTIFS[id].arabicGloss })}
                thumbnail={<BandSwatch grid={MOTIFS[id].grid} colors={{ ground: INK.black, dye, accent: INK.wool }} center={MOTIFS[id].center} />}
              />
            </li>
          ))}
        </ul>
      </SaduNavigationMenuSpecimen>
    ),
  },
}

function hasSpecimen(id: string): boolean {
  return id in SPECIMENS
}

function Scaled({ scale, children }: { scale: number; children: ReactNode }): ReactElement {
  const inner = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const node = inner.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.borderBoxSize[0]
      if (box) flushSync(() => setSize({ width: Math.round(box.inlineSize), height: Math.round(box.blockSize) }))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  const style = { "--specimen-scale": scale, width: size.width * scale, height: size.height * scale } as CSSProperties
  return (
    <div className="specimen__view" style={style} aria-hidden="true">
      <div ref={inner} className="specimen__inner">
        {children}
      </div>
    </div>
  )
}

function OpenState({ id, dye = WOOLS.madder.hex }: { id: string; dye?: string }): ReactElement | null {
  const locale = useLocale()
  const say: Say = (text) => text[locale]
  const specimen = SPECIMENS[id]
  if (!specimen) return null
  return <Scaled scale={specimen.zoom}>{specimen.render(dye, say)}</Scaled>
}

export { OpenState, hasSpecimen }
