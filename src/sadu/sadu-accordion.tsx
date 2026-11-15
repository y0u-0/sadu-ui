import "./styles/sadu-accordion.css"
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, AccordionTrigger } from "@ui-sdk/react/accordion"
import { useState, type ComponentProps, type ReactElement } from "react"
import { mergeClass } from "./merge-class"
import { MOTIFS, type Grid, type MotifId } from "./motifs"
import { WOOLS } from "./palette"
import { Eye } from "./parts"
import { mainColors } from "./rug"
import { GOAT_HAIR, LEVELS, Weave, beatStyle, useColumns } from "./weave"

type SaduAccordionProps<Value extends string> = Parameters<typeof Accordion<Value>>[0]

type SaduAccordionTriggerProps = ComponentProps<typeof AccordionTrigger> & {
  motif?: MotifId
  dye?: string
  headerClassName?: string
}

const WARP_THREAD = "#a8977d"
const FOLD: Grid = ["......", "xxxxxx", "......"]
const BEAT_CAP = 300
const SWATCH_COLUMNS = 10
const SWATCH_CAP = 400

function useOpenOnMount(open: boolean): boolean {
  const [openOnMount, setOpenOnMount] = useState(open)
  if (openOnMount && !open) setOpenOnMount(false)
  return openOnMount
}

function MotifSwatch({ open, motif, dye }: { open: boolean; motif: MotifId; dye: string }): ReactElement {
  const still = useOpenOnMount(open)
  const colors = mainColors(dye)
  return (
    <span
      className="sadu-accordion__swatch"
      data-still={still || undefined}
      style={beatStyle(SWATCH_COLUMNS, SWATCH_CAP)}
      aria-hidden="true"
    >
      <Weave bare grid={MOTIFS[motif].grid} colors={{ ...colors, ground: WARP_THREAD }} level="stitch" />
      <span className="sadu-accordion__swatch-cloth">
        <Weave grid={MOTIFS[motif].grid} colors={colors} level="stitch" />
      </span>
      <span className="sadu-beater sadu-accordion__beater" />
    </span>
  )
}

function FoldBand({ open, dye }: { open: boolean; dye: string }): ReactElement {
  const [ref, columns] = useColumns(LEVELS.stitch.width)
  const still = useOpenOnMount(open)
  return (
    <span
      ref={ref}
      className="sadu-accordion__fold"
      data-still={still || undefined}
      style={beatStyle(columns, BEAT_CAP)}
      aria-hidden="true"
    >
      <span className="sadu-accordion__thread" />
      <span className="sadu-accordion__cloth">
        <Weave grid={FOLD} colors={{ ground: GOAT_HAIR, dye, accent: dye }} level="stitch" />
      </span>
      <span className="sadu-beater sadu-accordion__beater" />
    </span>
  )
}

function SaduAccordion<Value extends string = string>({ className, ...props }: SaduAccordionProps<Value>): ReactElement {
  return <Accordion<Value> {...props} className={mergeClass("sadu-accordion", className)} />
}

function SaduAccordionItem({ className, ...props }: ComponentProps<typeof AccordionItem>): ReactElement {
  return <AccordionItem {...props} className={mergeClass("sadu-accordion__item", className)} />
}

function SaduAccordionTrigger({
  motif,
  dye = WOOLS.madder.hex,
  headerClassName,
  className,
  children,
  ...props
}: SaduAccordionTriggerProps): ReactElement {
  return (
    <AccordionHeader className={mergeClass("sadu-accordion__header", headerClassName)}>
      <AccordionTrigger {...props} className={mergeClass("sadu-accordion__trigger", className)}>
        {(state) => (
          <>
            {motif && <MotifSwatch open={state.open} motif={motif} dye={dye} />}
            <span className="sadu-accordion__label">{typeof children === "function" ? children(state) : children}</span>
            <Eye size={10} state={state.open ? "on" : "closed"} tone="structure" className="sadu-accordion__eye" />
            <FoldBand open={state.open} dye={dye} />
          </>
        )}
      </AccordionTrigger>
    </AccordionHeader>
  )
}

function SaduAccordionPanel({ className, children, ...props }: ComponentProps<typeof AccordionPanel>): ReactElement {
  return (
    <AccordionPanel {...props} className={mergeClass("sadu-accordion__panel", className)}>
      {(state) => <div className="sadu-accordion__content">{typeof children === "function" ? children(state) : children}</div>}
    </AccordionPanel>
  )
}

export { SaduAccordion, SaduAccordionItem, SaduAccordionPanel, SaduAccordionTrigger }
export type { SaduAccordionProps, SaduAccordionTriggerProps }
