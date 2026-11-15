import { SlidersHorizontal } from "lucide-react"
import type { ReactElement } from "react"
import { WOOLS } from "../sadu/palette"
import { Cord } from "../sadu/parts"
import { SaduPopover, SaduPopoverContent, SaduPopoverTitle, SaduPopoverTrigger } from "../sadu/sadu-popover"
import { SaduSegment, SaduSegmentedControl } from "../sadu/sadu-segmented-control"
import { SaduTooltip, SaduTooltipContent, SaduTooltipTrigger } from "../sadu/sadu-tooltip"
import { SkeinRadio } from "../sadu/skein-radio"
import { WarpToggle } from "../sadu/warp-toggle"
import { useCopy, useLocale, type Copy } from "./locale"
import { InstallPrompt } from "./install-prompt"
import { hrefOf } from "./route"
import { useSettings } from "./settings"

type ToggleProps = { label: string; hint: string; pressed: boolean; onPressedChange: (pressed: boolean) => void; dye: string }

function SettingToggle({ label, hint, pressed, onPressedChange, dye }: ToggleProps): ReactElement {
  return (
    <SaduTooltip>
      <SaduTooltipTrigger render={<WarpToggle dye={dye} pressed={pressed} onPressedChange={(next: boolean) => onPressedChange(next)} />}>
        {label}
      </SaduTooltipTrigger>
      <SaduTooltipContent side="bottom">{hint}</SaduTooltipContent>
    </SaduTooltip>
  )
}

function ModeControls({ copy }: { copy: Copy }): ReactElement {
  const { dyeHex, theme, direction, motion, update } = useSettings()
  return (
    <>
      <SaduSegmentedControl
        className="topbar__theme"
        aria-label={copy.theme}
        value={theme}
        onValueChange={(next: unknown) => (next === "day" || next === "tent") && update({ theme: next })}
      >
        <SaduSegment value="day">{copy.day}</SaduSegment>
        <SaduSegment value="tent">{copy.tent}</SaduSegment>
      </SaduSegmentedControl>
      <SettingToggle
        label={copy.rtl}
        hint={copy.rtlHint}
        pressed={direction === "rtl"}
        onPressedChange={(pressed) => update({ direction: pressed ? "rtl" : "ltr" })}
        dye={dyeHex}
      />
      <SettingToggle
        label={copy.still}
        hint={copy.stillHint}
        pressed={motion === "reduced"}
        onPressedChange={(pressed) => update({ motion: pressed ? "reduced" : "full" })}
        dye={dyeHex}
      />
    </>
  )
}

function TopBar(): ReactElement {
  const { dye, update } = useSettings()
  const copy = useCopy()
  const locale = useLocale()
  const dyeName = locale === "ar" ? WOOLS[dye].arabic : WOOLS[dye].name
  return (
    <div className="topbar-dock">
      <nav className="topbar" aria-label={copy.navigation}>
        <Cord size={4} className="topbar__cord" />
        <a className="topbar__brand" href={hrefOf({ page: "home" })}>
          <span lang="en">Sadu</span>
          <span lang="ar">السدو</span>
        </a>
        <div className="topbar__settings">
          <div className="topbar__dye">
            <SkeinRadio
              className="topbar__skeins"
              label={copy.dye}
              value={dye}
              nameOf={(id) => (locale === "ar" ? WOOLS[id].arabic : WOOLS[id].name)}
              onValueChange={(next) => update({ dye: next })}
            />
            <span className="topbar__dye-name" aria-hidden="true">
              {dyeName}
            </span>
          </div>
          <span className="topbar__thread" aria-hidden="true" />
          <div className="topbar__modes">
            <ModeControls copy={copy} />
          </div>
          <SaduPopover>
            <SaduPopoverTrigger className="topbar__more" variant="ghost" size="icon" aria-label={copy.settings}>
              <SlidersHorizontal size={16} strokeWidth={2} aria-hidden="true" />
            </SaduPopoverTrigger>
            <SaduPopoverContent className="topbar__sheet" side="bottom" align="end">
              <SaduPopoverTitle>{copy.settings}</SaduPopoverTitle>
              <div className="topbar__sheet-controls">
                <ModeControls copy={copy} />
              </div>
            </SaduPopoverContent>
          </SaduPopover>
        </div>
        <div className="topbar__end">
          <InstallPrompt />
        </div>
      </nav>
    </div>
  )
}

export { TopBar }
