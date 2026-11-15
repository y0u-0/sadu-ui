import "./styles/sadu-collapsible.css"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@ui-sdk/react/collapsible"
import type { ComponentProps, ReactElement } from "react"
import { mergeClass } from "./merge-class"
import { MOTIFS, type Grid, type MotifId } from "./motifs"
import { WOOLS } from "./palette"
import { Eye, Thread } from "./parts"
import { mainColors } from "./rug"
import { GOAT_HAIR, WOOL_CLOTH, Weave } from "./weave"

type SaduCollapsibleTriggerProps = ComponentProps<typeof CollapsibleTrigger> & { motif?: MotifId; dye?: string }

type SaduCollapsiblePanelProps = ComponentProps<typeof CollapsiblePanel> & { motif?: MotifId; dye?: string }

const FOLD_EDGE: Grid = ["kkkkkkkk", "xxxx....", "xxxx....", "....xxxx", "....xxxx", "kkkkkkkk"]

function SaduCollapsible({ className, ...props }: ComponentProps<typeof Collapsible>): ReactElement {
  return <Collapsible {...props} className={mergeClass("sadu-collapsible", className)} />
}

function FoldEdge({ motif, dye }: { motif?: MotifId; dye: string }): ReactElement {
  return (
    <span className="sadu-collapsible__edge" data-motif={motif ? "" : undefined} aria-hidden="true">
      {motif ? (
        <Weave grid={MOTIFS[motif].grid} colors={mainColors(dye)} level="stitch" />
      ) : (
        <Weave grid={FOLD_EDGE} colors={{ ground: WOOL_CLOTH, dye: GOAT_HAIR, accent: dye }} level="stitch" />
      )}
    </span>
  )
}

function SaduCollapsibleTrigger({
  motif,
  dye = WOOLS.madder.hex,
  className,
  children,
  ...props
}: SaduCollapsibleTriggerProps): ReactElement {
  return (
    <CollapsibleTrigger {...props} className={mergeClass("sadu-collapsible__trigger", className)}>
      {(state) => (
        <>
          <span className="sadu-collapsible__label">{typeof children === "function" ? children(state) : children}</span>
          <Eye size={10} state={state.open ? "on" : "closed"} tone="structure" className="sadu-collapsible__eye" />
          {state.disabled ? <Thread dashed className="sadu-collapsible__thread" /> : <FoldEdge motif={motif} dye={dye} />}
        </>
      )}
    </CollapsibleTrigger>
  )
}

function SaduCollapsiblePanel({ motif, dye = WOOLS.madder.hex, className, children, ...props }: SaduCollapsiblePanelProps): ReactElement {
  return (
    <CollapsiblePanel {...props} className={mergeClass("sadu-collapsible__panel", className)}>
      {(state) => (
        <div className="sadu-collapsible__fold">
          {motif && (
            <span className="sadu-collapsible__band" aria-hidden="true">
              <Weave grid={MOTIFS[motif].grid} colors={mainColors(dye)} level="cloth" />
            </span>
          )}
          <div className="sadu-collapsible__content">{typeof children === "function" ? children(state) : children}</div>
        </div>
      )}
    </CollapsiblePanel>
  )
}

export { SaduCollapsible, SaduCollapsiblePanel, SaduCollapsibleTrigger }
export type { SaduCollapsiblePanelProps, SaduCollapsibleTriggerProps }
