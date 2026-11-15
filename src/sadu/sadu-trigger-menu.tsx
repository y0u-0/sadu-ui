import "./styles/sadu-trigger-menu.css"
import { TokenInput, TokenInputEditor, TokenInputToken, type Token } from "@ui-sdk/react/token-input"
import {
  TriggerMenu,
  TriggerMenuContent,
  TriggerMenuEmpty,
  TriggerMenuGroup,
  TriggerMenuGroupLabel,
  TriggerMenuItem,
  TriggerMenuItemIcon,
  TriggerMenuList,
  TriggerMenuStatus,
  type TriggerMenuProps,
} from "@ui-sdk/react/trigger-menu"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { mergeClass } from "./merge-class"
import { MOTIFS, type MotifId } from "./motifs"
import { INK, WOOLS } from "./palette"
import { BandSwatch, Chip } from "./parts"
import { PopupSurface } from "./popup-surface"
import { DhursStrip } from "./sadu-input"
import { WeaverAvatar } from "./weaver-avatar"

type SaduNoteProps = ComponentProps<typeof TokenInput>
type SaduNoteEditorProps = ComponentProps<typeof TokenInputEditor>
type SaduTriggerMenuContentProps = Omit<ComponentProps<typeof TriggerMenuContent>, "children"> & { children?: ReactNode }
type SaduTriggerMenuItemProps = Omit<Parameters<typeof TriggerMenuItem<string>>[0], "children"> & {
  icon?: ReactNode
  hint?: ReactNode
  children?: ReactNode
}

const QUERY_HIGHLIGHT = "sadu-trigger-query"

function isMotifId(value: string): value is MotifId {
  return value in MOTIFS
}

function markQuery(match: string | null): void {
  if (typeof CSS === "undefined" || !("highlights" in CSS)) return
  CSS.highlights.delete(QUERY_HIGHLIGHT)
  const selection = window.getSelection()
  const node = selection?.focusNode
  const offset = selection?.focusOffset ?? 0
  if (match === null || !node || node.nodeType !== Node.TEXT_NODE || offset < match.length) return
  const range = document.createRange()
  range.setStart(node, offset - match.length)
  range.setEnd(node, offset)
  if (range.toString() === match) CSS.highlights.set(QUERY_HIGHLIGHT, new Highlight(range))
}

function NoteToken({ token }: { token: Token }): ReactElement {
  const motif = token.type === "motif" && isMotifId(token.value) ? MOTIFS[token.value] : null
  const sample = motif ? (
    <BandSwatch grid={motif.grid} colors={{ ground: INK.black, dye: WOOLS.madder.hex, accent: INK.wool }} center={motif.center} size="sm" />
  ) : token.type === "weaver" ? (
    <WeaverAvatar name={token.label} size={20} aria-hidden="true" />
  ) : undefined
  return (
    <TokenInputToken className="sadu-note__token" data-kind={token.type}>
      <Chip sample={sample}>{token.label}</Chip>
    </TokenInputToken>
  )
}

function renderNoteToken(token: Token): ReactNode {
  return <NoteToken token={token} />
}

function SaduNote({ renderToken = renderNoteToken, ...props }: SaduNoteProps): ReactElement {
  return <TokenInput {...props} renderToken={renderToken} />
}

function SaduNoteEditor({ className, ...props }: SaduNoteEditorProps): ReactElement {
  return (
    <span className="sadu-note__field">
      <TokenInputEditor {...props} className={mergeClass("sadu-note__editor", className)} />
      <DhursStrip />
    </span>
  )
}

function SaduTriggerMenu<T = string>({ onQueryChange, onOpenChange, ...props }: TriggerMenuProps<T>): ReactElement {
  return (
    <TriggerMenu<T>
      {...props}
      onQueryChange={(query, details) => {
        markQuery(details.argument ? null : `${details.trigger}${query}`)
        onQueryChange?.(query, details)
      }}
      onOpenChange={(open, details) => {
        markQuery(open && details.trigger ? details.trigger : null)
        onOpenChange?.(open, details)
      }}
    />
  )
}

function SaduTriggerMenuContent({ className, children, sideOffset = 6, ...props }: SaduTriggerMenuContentProps): ReactElement {
  return (
    <TriggerMenuContent {...props} sideOffset={sideOffset} render={<PopupSurface />} className={mergeClass("sadu-note__popup", className)}>
      <span className="sadu-note__thread" aria-hidden="true" />
      <TriggerMenuStatus className="sadu-note__status" />
      {children}
    </TriggerMenuContent>
  )
}

function SaduTriggerMenuList({ className, ...props }: ComponentProps<typeof TriggerMenuList>): ReactElement {
  return <TriggerMenuList {...props} className={mergeClass("sadu-note__list", className)} />
}

function SaduTriggerMenuGroup({ className, ...props }: ComponentProps<typeof TriggerMenuGroup>): ReactElement {
  return <TriggerMenuGroup {...props} className={mergeClass("sadu-note__group", className)} />
}

function SaduTriggerMenuGroupLabel({ className, ...props }: ComponentProps<typeof TriggerMenuGroupLabel>): ReactElement {
  return <TriggerMenuGroupLabel {...props} className={mergeClass("sadu-note__label", className)} />
}

function SaduTriggerMenuEmpty({ className, ...props }: ComponentProps<typeof TriggerMenuEmpty>): ReactElement {
  return <TriggerMenuEmpty {...props} className={mergeClass("sadu-note__empty", className)} />
}

function SaduTriggerMenuItem({ icon, hint, className, children, ...props }: SaduTriggerMenuItemProps): ReactElement {
  return (
    <TriggerMenuItem<string> {...props} className={mergeClass("sadu-note__item", className)}>
      {icon && <TriggerMenuItemIcon className="sadu-note__item-icon">{icon}</TriggerMenuItemIcon>}
      <span className="sadu-note__item-text">{children}</span>
      {hint && <span className="sadu-note__item-hint">{hint}</span>}
    </TriggerMenuItem>
  )
}

export {
  SaduNote,
  SaduNoteEditor,
  SaduTriggerMenu,
  SaduTriggerMenuContent,
  SaduTriggerMenuEmpty,
  SaduTriggerMenuGroup,
  SaduTriggerMenuGroupLabel,
  SaduTriggerMenuItem,
  SaduTriggerMenuList,
}
export type { SaduNoteEditorProps, SaduNoteProps, SaduTriggerMenuContentProps, SaduTriggerMenuItemProps }
