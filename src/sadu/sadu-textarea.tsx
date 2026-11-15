import { FieldDescription, useFieldControl } from "@ui-sdk/react/field"
import { Textarea } from "@ui-sdk/react/textarea"
import { useState, type ComponentProps, type CSSProperties, type ReactElement } from "react"
import { partClass } from "./sadu-field"
import { DhursStrip } from "./sadu-input"
import type { Grid } from "./motifs"
import { Weave } from "./weave"
import "./styles/sadu-input.css"
import "./styles/sadu-textarea.css"

type SaduTextareaProps = ComponentProps<typeof Textarea> & {
  limit?: number
  countLabel?: (length: number, limit: number) => string
  boxClassName?: string
}

const WOVEN: Grid = ["xxxk", "xxxk"]
const TEETH: Grid = ["xx..", "..xx"]
const NEAR = 0.9
const WOVEN_COLORS = { ground: "var(--sadu-capsule)", dye: "var(--sadu-capsule)", accent: "var(--sadu-capsule-ink)" }
const OVER_COLORS = { ground: "var(--sadu-capsule)", dye: "var(--sadu-madder-cloth)", accent: "var(--sadu-madder-cloth)" }

function SaduTextarea({
  className,
  boxClassName,
  autoResize = true,
  limit,
  countLabel = (length, max) => `${length} / ${max}`,
  value,
  defaultValue,
  onValueChange,
  ...props
}: SaduTextareaProps): ReactElement {
  const field = useFieldControl()
  const [draft, setDraft] = useState(() => String(defaultValue ?? ""))
  const length = (value ?? draft).length
  const max = limit ?? props.maxLength
  const over = max !== undefined && length > max
  const near = max !== undefined && length >= max * NEAR
  const Count = field ? FieldDescription : "p"
  return (
    <div className="sadu-textarea" data-over={over || undefined} data-near={near || undefined}>
      <div className={["sadu-input sadu-textarea__box", boxClassName].filter(Boolean).join(" ")}>
        <Textarea
          {...props}
          value={value}
          defaultValue={defaultValue}
          autoResize={autoResize}
          onValueChange={(next, details) => {
            if (value === undefined) setDraft(next)
            onValueChange?.(next, details)
          }}
          className={partClass("sadu-textarea__control", className)}
        />
        <DhursStrip />
        {max !== undefined && (
          <span className="sadu-textarea__band" aria-hidden="true">
            <span className="sadu-textarea__cloth" style={{ "--sadu-fill": Math.min(length / max, 1) } as CSSProperties}>
              <Weave
                level="stitch"
                grid={over ? TEETH : WOVEN}
                colors={over ? OVER_COLORS : WOVEN_COLORS}
              />
            </span>
          </span>
        )}
      </div>
      {max !== undefined && <Count className="sadu-textarea__count">{countLabel(length, max)}</Count>}
    </div>
  )
}

export { SaduTextarea }
export type { SaduTextareaProps }
