import { TokenInput, TokenInputEditor, TokenInputToken, TokenInputTokenRemove, type Token } from "@ui-sdk/react/token-input"
import {
  TriggerMenu,
  TriggerMenuContent,
  TriggerMenuEmpty,
  TriggerMenuItem,
  TriggerMenuItemIcon,
  TriggerMenuList,
  type TriggerMenuDataItem,
} from "@ui-sdk/react/trigger-menu"
import { X } from "lucide-react"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { partClass } from "./sadu-field"
import { DhursStrip } from "./sadu-input"
import { useLocalized } from "./locale"
import { Chip, EmptyWarp } from "./parts"
import { PopupSurface } from "./popup-surface"
import "./styles/sadu-suggestions.css"
import "./styles/sadu-input.css"
import "./styles/sadu-token-input.css"

type TokenSuggestion = { type: string; value: string; label: string; arabic?: string }

type TokenTrigger = { char: string; items: readonly TokenSuggestion[] }

type SaduTokenInputProps = Omit<ComponentProps<typeof TokenInput>, "renderToken" | "children"> & {
  triggers: readonly TokenTrigger[]
  renderSample: (type: string, value: string) => ReactNode
  placeholder?: string
  emptyLabel?: ReactNode
  removeLabel?: (label: string) => string
  editorProps?: ComponentProps<typeof TokenInputEditor>
  className?: string
}

const KEY_SEPARATOR = ":"

function keyOf(suggestion: Pick<TokenSuggestion, "type" | "value">): string {
  return `${suggestion.type}${KEY_SEPARATOR}${suggestion.value}`
}

const COPY = {
  en: { empty: "Nothing woven under that name.", remove: (label: string) => `Remove ${label}` },
  ar: { empty: "لم يُنسج شيء بهذا الاسم.", remove: (label: string) => `إزالة ${label}` },
}

function SaduTokenInput({
  triggers,
  renderSample,
  placeholder,
  emptyLabel,
  removeLabel,
  editorProps,
  tokenDeletion = "select",
  className,
  ...props
}: SaduTokenInputProps): ReactElement {
  const copy = useLocalized(COPY)
  const suggestions = new Map(triggers.flatMap((trigger) => trigger.items.map((item) => [keyOf(item), item] as const)))
  return (
    <div className={["sadu-input sadu-token-input", className].filter(Boolean).join(" ")}>
      <TokenInput
        {...props}
        tokenDeletion={tokenDeletion}
        renderToken={(token: Token) => (
          <TokenInputToken
            className="sadu-token-input__token"
            render={(tokenProps) => (
              <Chip
                {...tokenProps}
                sample={<span aria-hidden="true">{renderSample(token.type, token.value)}</span>}
                remove={
                  <TokenInputTokenRemove className="sadu-chip__remove sadu-token-input__remove" aria-label={(removeLabel ?? copy.remove)(token.label)}>
                    <X size={12} strokeWidth={2} aria-hidden="true" />
                  </TokenInputTokenRemove>
                }
              >
                {token.label}
              </Chip>
            )}
          />
        )}
      >
        <TokenInputEditor {...editorProps} placeholder={placeholder} className={partClass("sadu-token-input__editor", editorProps?.className)} />
        <TriggerMenu
          triggers={triggers.map((trigger) => ({
            char: trigger.char,
            items: trigger.items.map((item) => ({ value: keyOf(item), label: item.label, keywords: item.arabic ? [item.arabic] : [] })),
            insert: (item: TriggerMenuDataItem) => {
              const suggestion = suggestions.get(item.value)
              return { type: suggestion?.type ?? "token", value: suggestion?.value ?? item.value, label: item.label }
            },
          }))}
        >
          <TriggerMenuContent render={<PopupSurface />} className="sadu-suggestions" sideOffset={8}>
            <TriggerMenuEmpty className="sadu-suggestions__empty">
              <EmptyWarp>{emptyLabel ?? copy.empty}</EmptyWarp>
            </TriggerMenuEmpty>
            <TriggerMenuList className="sadu-suggestions__list">
              {(list) =>
                (list.items as TriggerMenuDataItem[]).map((item) => {
                  const suggestion = suggestions.get(item.value)
                  return (
                    <TriggerMenuItem key={item.value} value={item.value} label={item.label} className="sadu-suggestions__item sadu-token-input__item">
                      <TriggerMenuItemIcon className="sadu-token-input__item-sample">
                        {suggestion && renderSample(suggestion.type, suggestion.value)}
                      </TriggerMenuItemIcon>
                      <span className="sadu-suggestions__name">{item.label}</span>
                      <span className="sadu-suggestions__arabic" lang="ar" dir="rtl">
                        {suggestion?.arabic}
                      </span>
                    </TriggerMenuItem>
                  )
                })
              }
            </TriggerMenuList>
          </TriggerMenuContent>
        </TriggerMenu>
      </TokenInput>
      <DhursStrip />
    </div>
  )
}

export { SaduTokenInput }
export type { SaduTokenInputProps, TokenSuggestion, TokenTrigger }
