import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react/field"
import { Listbox, ListboxItem, ListboxItemIndicator } from "@ui-sdk/react/listbox"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { MOTIFS, type MotifId } from "./motifs"
import { INK } from "./palette"
import { BandSwatch, Eye } from "./parts"
import "./sadu.css"
import "./styles/sadu-listbox.css"


type SaduListboxProps = Omit<ComponentProps<typeof Listbox<string, true>>, "className" | "multiple"> & {
  label: ReactNode
  description?: ReactNode
  className?: string
}

function SaduListbox({ label, description, className, activation = "manual", ...props }: SaduListboxProps): ReactElement {
  return (
    <Field className={["sadu-listbox", className].filter(Boolean).join(" ")}>
      <FieldLabel className="sadu-label">{label}</FieldLabel>
      <Listbox<string, true> {...props} multiple activation={activation} className="sadu-listbox__list" />
      {description && <FieldDescription className="sadu-listbox__description">{description}</FieldDescription>}
    </Field>
  )
}

function SaduListboxSwatch({ motif, dye }: { motif: MotifId; dye: string }): ReactElement {
  return (
    <BandSwatch
      grid={MOTIFS[motif].grid}
      colors={{ ground: INK.black, dye, accent: INK.wool }}
      center={MOTIFS[motif].center}
      className="sadu-listbox__swatch"
    />
  )
}

type SaduListboxItemProps = Omit<ComponentProps<typeof ListboxItem>, "className" | "children"> & {
  swatch?: ReactNode
  meta?: ReactNode
  children: ReactNode
  className?: string
}

function SaduListboxItem({ swatch, meta, children, className, ...props }: SaduListboxItemProps): ReactElement {
  return (
    <ListboxItem {...props} className={["sadu-listbox__item", className].filter(Boolean).join(" ")}>
      {swatch}
      <span className="sadu-listbox__name">{children}</span>
      {meta && <span className="sadu-listbox__meta">{meta}</span>}
      <ListboxItemIndicator keepMounted className="sadu-listbox__mark">
        {(indicator) => <Eye size={15} state={indicator.selected ? "on" : "off"} />}
      </ListboxItemIndicator>
    </ListboxItem>
  )
}

export { SaduListbox, SaduListboxItem, SaduListboxSwatch }
