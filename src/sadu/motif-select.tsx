import { ChevronDown } from "lucide-react"
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
import { Field, FieldLabel } from "@ui-sdk/react/field"
import { useLayoutEffect, useRef, type ReactElement, type ReactNode, type RefObject } from "react"
import { useLocalized, useSaduLocale } from "./locale"
import { MOTIFS, PICKABLE, type MotifId } from "./motifs"
import { INK, type Colors } from "./palette"
import { BandSwatch, Eye, type BandSwatchSize } from "./parts"
import { PopupSurface } from "./popup-surface"

type MotifSelectProps = {
  label?: ReactNode
  dye: string
  value?: MotifId
  defaultValue?: MotifId
  onValueChange?: (value: MotifId) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean | "pointer"
  target?: string
  className?: string
}

const RELEASE_AFTER = 400
const USER_INPUT_WINDOW = 500

function useScriptedFocusGuard(open: boolean | undefined, triggerRef: RefObject<HTMLButtonElement | null>): void {
  useLayoutEffect(() => {
    const trigger = triggerRef.current
    const field = trigger?.closest(".sadu-motif")
    if (!open || !trigger || !field || !trigger.closest("[inert]")) return
    let userAt = -Infinity
    const note = () => {
      userAt = performance.now()
    }
    const keep = (event: FocusEvent) => {
      if (performance.now() - userAt < USER_INPUT_WINDOW) return
      if (event.target instanceof HTMLElement && !field.contains(event.target)) event.target.blur()
    }
    document.addEventListener("pointerdown", note, true)
    document.addEventListener("keydown", note, true)
    document.addEventListener("focusin", keep, true)
    return () => {
      window.setTimeout(() => {
        document.removeEventListener("pointerdown", note, true)
        document.removeEventListener("keydown", note, true)
        document.removeEventListener("focusin", keep, true)
      }, RELEASE_AFTER)
    }
  }, [open, triggerRef])
}

function swatchColors(dye: string): Colors {
  return { ground: INK.black, dye, accent: INK.wool }
}

type MotifSwatchProps = { motif: MotifId; dye: string; size?: BandSwatchSize; width?: number; className?: string }

function MotifSwatch({ motif, dye, size, width, className }: MotifSwatchProps): ReactElement {
  return (
    <BandSwatch
      grid={MOTIFS[motif].grid}
      colors={swatchColors(dye)}
      center={MOTIFS[motif].center}
      size={size}
      width={width === undefined ? undefined : Math.round(width / 6) * 6}
      className={className}
    />
  )
}

const LABEL = { en: "Motif", ar: "النقشة" }

function MotifSelect({
  label,
  dye,
  value,
  defaultValue,
  onValueChange,
  open,
  onOpenChange,
  modal,
  target,
  className,
}: MotifSelectProps): ReactElement {
  const fallbackLabel = useLocalized(LABEL)
  const arabic = useSaduLocale() === "ar"
  const triggerRef = useRef<HTMLButtonElement>(null)
  useScriptedFocusGuard(open, triggerRef)
  return (
    <Field className={["sadu-motif", className].filter(Boolean).join(" ")}>
      <FieldLabel className="sadu-label">{label ?? fallbackLabel}</FieldLabel>
      <Select<MotifId>
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => next && onValueChange?.(next)}
        open={open}
        onOpenChange={onOpenChange}
        modal={modal}
      >
        <SelectTrigger ref={triggerRef} className="sadu-motif__trigger" data-target={target && `${target}-trigger`} data-cursor="pointer">
          <SelectValueIcon />
          <SelectValue className="sadu-motif__value" />
          <ChevronDown className="sadu-motif__chevron" size={16} strokeWidth={2} aria-hidden="true" />
        </SelectTrigger>
        <SelectContent className="sadu-motif__content" sideOffset={6} render={<PopupSurface edge="cord" />}>
          {PICKABLE.map((id) => (
            <SelectItem
              key={id}
              value={id}
              label={arabic ? MOTIFS[id].arabic : MOTIFS[id].name}
              className="sadu-motif__item"
              data-target={target && `${target}-${id}`}
              data-cursor="pointer"
            >
              <SelectItemIcon>
                <MotifSwatch motif={id} dye={dye} />
              </SelectItemIcon>
              <span className="sadu-motif__text">
                {arabic ? (
                  <>
                    <span className="sadu-motif__name" lang="ar">
                      {MOTIFS[id].arabic}
                    </span>
                    <span className="sadu-motif__arabic" data-script="latin" lang="en" dir="ltr">
                      {MOTIFS[id].name}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="sadu-motif__name">{MOTIFS[id].name}</span>
                    <span className="sadu-motif__arabic" lang="ar" dir="rtl">
                      {MOTIFS[id].arabic}
                    </span>
                  </>
                )}
              </span>
              <span className="sadu-motif__check">
                <SelectItemIndicator>
                  <Eye size={10} />
                </SelectItemIndicator>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

export { MotifSelect, MotifSwatch }
export type { MotifSwatchProps }
