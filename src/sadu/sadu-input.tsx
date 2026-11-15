import { Input, InputClear, InputGroup } from "@ui-sdk/react/input"
import { X } from "lucide-react"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import type { Grid } from "./motifs"
import { IconButton } from "./parts"
import { partClass } from "./sadu-field"
import { Weave } from "./weave"
import "./styles/sadu-input.css"

const TEETH: Grid = ["xxxx....", "....xxxx"]
const TEETH_COLORS = { ground: "var(--sadu-capsule)", dye: "var(--sadu-capsule-ink)", accent: "var(--sadu-madder-cloth)" }

function DhursStrip(): ReactElement {
  return (
    <span className="sadu-dhurs" aria-hidden="true">
      <span className="sadu-dhurs__cloth">
        <Weave level="stitch" grid={TEETH} colors={TEETH_COLORS} />
      </span>
      <span className="sadu-wood sadu-dhurs__beater" />
    </span>
  )
}

type SaduInputProps = Omit<ComponentProps<typeof Input>, "className"> & {
  start?: ReactNode
  end?: ReactNode
  clearLabel?: string
  className?: string
  inputClassName?: ComponentProps<typeof Input>["className"]
}

function SaduInput({ start, end, clearLabel, className, inputClassName, ...props }: SaduInputProps): ReactElement {
  return (
    <InputGroup className={["sadu-input", className].filter(Boolean).join(" ")}>
      {start && <span className="sadu-input__affix">{start}</span>}
      <Input {...props} className={partClass("sadu-input__control", inputClassName)} />
      {clearLabel && (
        <InputClear render={<IconButton size={28} />} className="sadu-input__clear" aria-label={clearLabel}>
          <X size={16} strokeWidth={2} aria-hidden="true" />
        </InputClear>
      )}
      {end && <span className="sadu-input__affix">{end}</span>}
      <DhursStrip />
    </InputGroup>
  )
}

export { DhursStrip, SaduInput }
export type { SaduInputProps }
