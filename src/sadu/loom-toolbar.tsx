import "./styles/loom-toolbar.css"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIcon,
  SelectItemIndicator,
  SelectTrigger,
  SelectValue,
  SelectValueIcon,
} from "@ui-sdk/react/select"
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from "@ui-sdk/react/toolbar"
import { ChevronDown } from "lucide-react"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { mergeClass } from "./merge-class"
import { useLocalized, useSaduLocale } from "./locale"
import { MOTIFS, type MotifId } from "./motifs"
import { INK, WOOLS } from "./palette"
import { BandSwatch, Eye } from "./parts"
import { PopupSurface } from "./popup-surface"

type LoomToolbarProps = Omit<ComponentProps<typeof Toolbar>, "children"> & { children?: ReactNode }
type LoomToolbarButtonProps = Omit<ComponentProps<typeof ToolbarButton>, "children"> & { children?: ReactNode }
type LoomMotifSelectProps = {
  label?: string
  motifs: readonly MotifId[]
  dye?: string
  value?: MotifId
  defaultValue?: MotifId
  onValueChange?: (value: MotifId) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

function motifColors(dye: string): { ground: string; dye: string; accent: string } {
  return { ground: INK.black, dye, accent: INK.wool }
}

function LoomToolbar({ className, children, ...props }: LoomToolbarProps): ReactElement {
  return (
    <Toolbar {...props} className={mergeClass("sadu-wood sadu-loom-toolbar", className)} data-lying="">
      <span className="sadu-loom-toolbar__lashing" aria-hidden="true" />
      <span className="sadu-loom-toolbar__tools">{children}</span>
      <span className="sadu-loom-toolbar__lashing" aria-hidden="true" />
    </Toolbar>
  )
}

function LoomToolbarButton({ className, ...props }: LoomToolbarButtonProps): ReactElement {
  return <ToolbarButton {...props} className={mergeClass("sadu-loom-toolbar__button", className)} />
}

function LoomToolbarGroup({ className, ...props }: ComponentProps<typeof ToolbarGroup>): ReactElement {
  return <ToolbarGroup {...props} className={mergeClass("sadu-loom-toolbar__group", className)} />
}

function LoomToolbarSeparator({ className, ...props }: ComponentProps<typeof ToolbarSeparator>): ReactElement {
  return <ToolbarSeparator {...props} className={mergeClass("sadu-loom-toolbar__thread", className)} />
}

const LABEL = { en: "Motif", ar: "النقشة" }

function LoomMotifSelect({
  label,
  motifs,
  dye = WOOLS.madder.hex,
  value,
  defaultValue,
  onValueChange,
  open,
  onOpenChange,
  className,
}: LoomMotifSelectProps): ReactElement {
  const fallbackLabel = useLocalized(LABEL)
  const arabic = useSaduLocale() === "ar"
  return (
    <Select<MotifId>
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => next && onValueChange?.(next)}
      open={open}
      onOpenChange={onOpenChange}
    >
      <ToolbarButton
        render={<SelectTrigger />}
        aria-label={label ?? fallbackLabel}
        className={["sadu-loom-toolbar__button sadu-loom-toolbar__select", className].filter(Boolean).join(" ")}
      >
        <SelectValueIcon className="sadu-loom-toolbar__select-icon" />
        <SelectValue className="sadu-loom-toolbar__select-value" />
        <ChevronDown className="sadu-loom-toolbar__chevron" size={16} strokeWidth={2} aria-hidden="true" />
      </ToolbarButton>
      <SelectContent className="sadu-loom-toolbar__popup" sideOffset={6} render={<PopupSurface />}>
        {motifs.map((id) => (
          <SelectItem key={id} value={id} label={arabic ? MOTIFS[id].arabic : MOTIFS[id].name} className="sadu-loom-toolbar__option">
            <SelectItemIcon className="sadu-loom-toolbar__option-swatch">
              <BandSwatch grid={MOTIFS[id].grid} colors={motifColors(dye)} center={MOTIFS[id].center} />
            </SelectItemIcon>
            {arabic ? (
              <>
                <span className="sadu-loom-toolbar__option-name" lang="ar">
                  {MOTIFS[id].arabic}
                </span>
                <span className="sadu-loom-toolbar__option-arabic" data-script="latin" lang="en" dir="ltr">
                  {MOTIFS[id].name}
                </span>
              </>
            ) : (
              <>
                <span className="sadu-loom-toolbar__option-name">{MOTIFS[id].name}</span>
                <span className="sadu-loom-toolbar__option-arabic" lang="ar">
                  {MOTIFS[id].arabic}
                </span>
              </>
            )}
            <span className="sadu-loom-toolbar__option-check">
              <SelectItemIndicator>
                <Eye size={10} state="on" tone="value" />
              </SelectItemIndicator>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { LoomMotifSelect, LoomToolbar, LoomToolbarButton, LoomToolbarGroup, LoomToolbarSeparator }
export type { LoomMotifSelectProps, LoomToolbarButtonProps, LoomToolbarProps }
