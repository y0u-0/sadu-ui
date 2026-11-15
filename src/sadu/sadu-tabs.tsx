import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs"
import type { ReactElement, ReactNode } from "react"
import type { Grid } from "./motifs"
import { INK, WOOLS } from "./palette"
import { Weave } from "./weave"

const INDICATOR: Grid = ["k", "x", "k"]

type SaduTab = { value: string; label: ReactNode; panel: ReactNode }

type SaduTabsProps = {
  label: string
  tabs: readonly SaduTab[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  dye?: string
  target?: string
  className?: string
}

function SaduTabs({
  label,
  tabs,
  value,
  defaultValue,
  onValueChange,
  dye = WOOLS.madder.hex,
  target,
  className,
}: SaduTabsProps): ReactElement {
  return (
    <Tabs<string>
      className={["sadu-tabs", className].filter(Boolean).join(" ")}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => next && onValueChange?.(next)}
    >
      <TabsList className="sadu-tabs__list" aria-label={label}>
        {tabs.map((tab) => (
          <TabsTab
            key={tab.value}
            value={tab.value}
            className="sadu-tabs__tab"
            data-target={target && `${target}-${tab.value}`}
            data-cursor="pointer"
          >
            <span className="sadu-tabs__label">
              <span className="sadu-tabs__text">{tab.label}</span>
              <span className="sadu-tabs__reserve" aria-hidden="true">
                {tab.label}
              </span>
            </span>
          </TabsTab>
        ))}
        <TabsIndicator className="sadu-tabs__indicator">
          <Weave grid={INDICATOR} colors={{ ground: INK.black, dye, accent: INK.black }} level="stitch" />
        </TabsIndicator>
      </TabsList>
      {tabs.map((tab) => (
        <TabsPanel key={tab.value} value={tab.value} className="sadu-tabs__panel">
          {tab.panel}
        </TabsPanel>
      ))}
    </Tabs>
  )
}

export { SaduTabs }
export type { SaduTab }
