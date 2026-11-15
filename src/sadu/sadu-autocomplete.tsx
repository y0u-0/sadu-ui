import {
  Autocomplete,
  AutocompleteClear,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteItemIcon,
  AutocompleteItemText,
  AutocompleteList,
} from "@ui-sdk/react/autocomplete"
import { Search, X } from "lucide-react"
import { useState, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { useLocalized } from "./locale"
import { IconButton } from "./parts"
import { PopupSurface } from "./popup-surface"
import { DhursStrip } from "./sadu-input"
import "./styles/sadu-suggestions.css"
import "./styles/sadu-input.css"
import "./styles/sadu-autocomplete.css"

const COPY = { en: { clear: "Clear" }, ar: { clear: "مسح" } }

type Suggestion = { value: string; label?: string; arabic?: string; sample?: ReactNode; keywords?: string[] }

type SaduAutocompleteProps = Omit<ComponentProps<typeof Autocomplete>, "items" | "children"> & {
  suggestions: readonly Suggestion[]
  placeholder?: string
  emptyLabel?: ReactNode
  clearLabel?: string
  inputProps?: ComponentProps<typeof AutocompleteInput>
  className?: string
}

function SaduAutocomplete({
  suggestions,
  placeholder,
  emptyLabel,
  clearLabel,
  inputProps,
  inlineComplete = true,
  className,
  ...props
}: SaduAutocompleteProps): ReactElement {
  const copy = useLocalized(COPY)
  const [box, setBox] = useState<HTMLDivElement | null>(null)
  return (
    <Autocomplete {...props} inlineComplete={inlineComplete}>
      <div ref={setBox} className={["sadu-input sadu-autocomplete", className].filter(Boolean).join(" ")}>
        <Search className="sadu-autocomplete__icon" size={16} strokeWidth={2} aria-hidden="true" />
        <AutocompleteInput {...inputProps} placeholder={placeholder} className="sadu-input__control sadu-autocomplete__control" />
        <AutocompleteClear render={<IconButton size={28} />} className="sadu-input__clear" aria-label={clearLabel ?? copy.clear}>
          <X size={16} strokeWidth={2} aria-hidden="true" />
        </AutocompleteClear>
        <DhursStrip />
      </div>
      <AutocompleteContent render={<PopupSurface />} className="sadu-suggestions sadu-autocomplete__popup" anchor={box} sideOffset={6}>
        {emptyLabel && <AutocompleteEmpty className="sadu-suggestions__empty">{emptyLabel}</AutocompleteEmpty>}
        <AutocompleteList className="sadu-suggestions__list">
          {suggestions.map((suggestion) => (
            <AutocompleteItem
              key={suggestion.value}
              value={suggestion.value}
              label={suggestion.label ?? suggestion.value}
              keywords={[...(suggestion.keywords ?? []), ...(suggestion.arabic ? [suggestion.arabic] : [])]}
              className="sadu-suggestions__item sadu-autocomplete__item"
              data-sampled={suggestion.sample ? "" : undefined}
            >
              {suggestion.sample && <AutocompleteItemIcon>{suggestion.sample}</AutocompleteItemIcon>}
              <AutocompleteItemText className="sadu-suggestions__name sadu-autocomplete__text">
                {(state) => state.segments.map((segment, index) => (segment.match ? <mark key={index} className="sadu-stitch">{segment.text}</mark> : segment.text))}
              </AutocompleteItemText>
              {suggestion.arabic && (
                <span className="sadu-suggestions__arabic" lang="ar" dir="rtl">
                  {suggestion.arabic}
                </span>
              )}
            </AutocompleteItem>
          ))}
        </AutocompleteList>
      </AutocompleteContent>
    </Autocomplete>
  )
}

export { SaduAutocomplete }
export type { SaduAutocompleteProps, Suggestion }
