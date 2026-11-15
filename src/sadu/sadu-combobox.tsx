import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIcon,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  type ComboboxProps,
} from "@ui-sdk/react/combobox"
import { ChevronDown } from "lucide-react"
import { useState, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { useLocalized, useSaduLocale } from "./locale"
import { Chip, ChipRemove, EmptyWarp, Eye, IconButton } from "./parts"
import { PopupSurface } from "./popup-surface"
import { DhursStrip } from "./sadu-input"
import "./styles/sadu-suggestions.css"
import "./styles/sadu-input.css"
import "./styles/sadu-combobox.css"

type ComboboxOption = { value: string; label: string; arabic?: string; sample?: ReactNode; keywords?: string[]; disabled?: boolean }

type SharedProps = {
  options: readonly ComboboxOption[]
  placeholder?: string
  emptyLabel?: (query: string) => ReactNode
  triggerLabel?: string
  inputProps?: ComponentProps<typeof ComboboxInput>
  className?: string
}

type RootProps<Multiple extends boolean, Shape> =
  Extract<ComboboxProps<string, Multiple>, Shape> extends infer Props
    ? Props extends unknown
      ? Omit<Props, "multiple" | "children" | "items" | "itemToLabel">
      : never
    : never

type SingleProps = SharedProps & RootProps<false, { multiple?: false }> & { multiple?: false }

type MultipleProps = SharedProps &
  RootProps<true, { multiple: true }> & {
    multiple: true
    removeLabel?: (label: string) => string
  }

type SaduComboboxProps = SingleProps | MultipleProps

const COPY = {
  en: {
    empty: (query: string): ReactNode => (query ? `Nothing woven under “${query}”.` : "Nothing woven yet."),
    trigger: "Show options",
    remove: (label: string) => `Remove ${label}`,
  },
  ar: {
    empty: (query: string): ReactNode => (query ? `لم يُنسج شيء باسم «${query}».` : "لم يُنسج شيء بعد."),
    trigger: "عرض الخيارات",
    remove: (label: string) => `إزالة ${label}`,
  },
}

type ComboboxParts = {
  labelOf: (value: string) => string
  sampleOf: (value: string) => ReactNode
  anchorRef: (element: HTMLDivElement | null) => void
  boxClass: string
  input: ReactElement
  trigger: ReactElement
  content: ReactElement
}

function useComboboxParts({
  options,
  placeholder,
  emptyLabel,
  triggerLabel,
  inputProps,
  className,
}: SharedProps): ComboboxParts {
  const copy = useLocalized(COPY)
  const empty = emptyLabel ?? copy.empty
  const [box, setBox] = useState<HTMLDivElement | null>(null)
  const byValue = new Map(options.map((option) => [option.value, option]))
  return {
    labelOf: (value) => byValue.get(value)?.label ?? value,
    sampleOf: (value) => byValue.get(value)?.sample,
    anchorRef: setBox,
    boxClass: ["sadu-input sadu-combobox", className].filter(Boolean).join(" "),
    input: <ComboboxInput {...inputProps} placeholder={placeholder} className="sadu-input__control sadu-combobox__input" />,
    trigger: (
      <ComboboxTrigger render={<IconButton size={28} />} className="sadu-input__clear sadu-combobox__trigger" aria-label={triggerLabel ?? copy.trigger}>
        <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
      </ComboboxTrigger>
    ),
    content: (
      <ComboboxContent render={<PopupSurface />} className="sadu-suggestions" anchor={box} sideOffset={6}>
        <ComboboxEmpty className="sadu-suggestions__empty">
          {(state) => <EmptyWarp>{empty(state.query)}</EmptyWarp>}
        </ComboboxEmpty>
        <ComboboxList className="sadu-suggestions__list">
          {options.map((option) => (
            <ComboboxItem
              key={option.value}
              value={option.value}
              label={option.label}
              keywords={[...(option.keywords ?? []), ...(option.arabic ? [option.arabic] : [])]}
              disabled={option.disabled}
              className="sadu-suggestions__item"
            >
              <ComboboxItemIcon>{option.sample}</ComboboxItemIcon>
              <span className="sadu-suggestions__name">{option.label}</span>
              <span className="sadu-suggestions__arabic" lang="ar" dir="rtl">
                {option.arabic}
              </span>
              <span className="sadu-suggestions__mark">
                <ComboboxItemIndicator>
                  <Eye size={10} tone="value" />
                </ComboboxItemIndicator>
              </span>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    ),
  }
}

function SingleCombobox({ options, placeholder, emptyLabel, triggerLabel, inputProps, className, value, defaultValue, onValueChange, ...root }: SingleProps): ReactElement {
  const parts = useComboboxParts({ options, placeholder, emptyLabel, triggerLabel, inputProps, className })
  const [draft, setDraft] = useState<string | null>(defaultValue ?? null)
  const chosen = value === undefined ? draft : value
  return (
    <Combobox<string, false>
      {...root}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next, details) => {
        if (value === undefined) setDraft(next)
        onValueChange?.(next, details)
      }}
      itemToLabel={parts.labelOf}
    >
      <div ref={parts.anchorRef} className={parts.boxClass}>
        {chosen !== null && parts.sampleOf(chosen) && <span className="sadu-combobox__value-icon">{parts.sampleOf(chosen)}</span>}
        {parts.input}
        {parts.trigger}
        <DhursStrip />
      </div>
      {parts.content}
    </Combobox>
  )
}

function MultipleCombobox({
  options,
  placeholder,
  emptyLabel,
  triggerLabel,
  removeLabel,
  inputProps,
  className,
  ...root
}: MultipleProps): ReactElement {
  const remove = removeLabel ?? COPY[useSaduLocale()].remove
  const parts = useComboboxParts({ options, placeholder, emptyLabel, triggerLabel, inputProps, className })
  return (
    <Combobox<string, true> {...root} itemToLabel={parts.labelOf}>
      <div ref={parts.anchorRef} className={parts.boxClass} data-multiple="">
        <ComboboxChips className="sadu-combobox__chips">
          <ComboboxValue>
            {(state) =>
              (state.value as string[]).map((value, index) => (
                <ComboboxChip
                  key={value}
                  value={value}
                  className="sadu-combobox__chip"
                  render={(chipProps) => (
                    <Chip
                      {...chipProps}
                      sample={parts.sampleOf(value)}
                      remove={<ComboboxChipRemove render={<ChipRemove />} value={value} aria-label={remove(state.labels[index] ?? value)} />}
                    >
                      {state.labels[index]}
                    </Chip>
                  )}
                />
              ))
            }
          </ComboboxValue>
          {parts.input}
        </ComboboxChips>
        {parts.trigger}
        <DhursStrip />
      </div>
      {parts.content}
    </Combobox>
  )
}

function SaduCombobox(props: SaduComboboxProps): ReactElement {
  return props.multiple ? <MultipleCombobox {...props} /> : <SingleCombobox {...props} />
}

export { SaduCombobox }
export type { ComboboxOption, SaduComboboxProps }
