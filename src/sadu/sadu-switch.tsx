import { Switch, SwitchThumb } from "@ui-sdk/react/switch"
import type { ReactElement, ReactNode } from "react"
import { MOTIFS } from "./motifs"
import { INK, WOOLS } from "./palette"
import { Weave } from "./weave"

type SaduSwitchProps = {
  children: ReactNode
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  dye?: string
  target?: string
  className?: string
}

const BARE = { ground: "#8a7864", dye: "#8a7864", accent: "#8a7864" }

function SaduSwitch({
  children,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  dye = WOOLS.madder.hex,
  target,
  className,
}: SaduSwitchProps): ReactElement {
  return (
    <label className={["sadu-switch-field", className].filter(Boolean).join(" ")} data-disabled={disabled || undefined}>
      <Switch
        className="sadu-switch"
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={(next) => onCheckedChange?.(next)}
        disabled={disabled}
        data-target={target}
        data-cursor="pointer"
      >
        <span className="sadu-switch__warp" aria-hidden="true">
          <Weave bare grid={MOTIFS.dhurs.grid} colors={BARE} level="stitch" />
        </span>
        <span className="sadu-switch__cloth" aria-hidden="true">
          <Weave grid={MOTIFS.dhurs.grid} colors={{ ground: INK.wool, dye, accent: INK.black }} level="stitch" />
        </span>
        <SwitchThumb className="sadu-switch__thumb sadu-wood" />
      </Switch>
      <span className="sadu-switch__text">{children}</span>
    </label>
  )
}

export { SaduSwitch }
