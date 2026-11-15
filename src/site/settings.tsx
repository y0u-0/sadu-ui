import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactElement, type ReactNode } from "react"
import { WOOLS, WOOL_ORDER, type WoolId } from "../sadu/palette"

type Theme = "day" | "tent"
type Direction = "ltr" | "rtl"
type Motion = "full" | "reduced"

type Settings = { dye: WoolId; theme: Theme; direction: Direction; motion: Motion }

type SettingsContextValue = Settings & {
  dyeHex: string
  update: (next: Partial<Settings>) => void
}

const STORAGE_KEY = "sadu-site-settings"
const DEFAULTS: Settings = { dye: "madder", theme: "day", direction: "ltr", motion: "full" }

const SettingsContext = createContext<SettingsContextValue | null>(null)
const DyeContext = createContext<{ dye: WoolId; dyeHex: string } | null>(null)
const DirectionContext = createContext<Direction>(DEFAULTS.direction)

function isOneOf<Value extends string>(value: unknown, options: readonly Value[]): value is Value {
  return typeof value === "string" && (options as readonly string[]).includes(value)
}

function readStored(): Settings {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null")
    if (typeof raw !== "object" || raw === null) return DEFAULTS
    const stored = raw as Record<string, unknown>
    return {
      dye: isOneOf(stored.dye, WOOL_ORDER) ? stored.dye : DEFAULTS.dye,
      theme: isOneOf(stored.theme, ["day", "tent"] as const) ? stored.theme : DEFAULTS.theme,
      direction: isOneOf(stored.direction, ["ltr", "rtl"] as const) ? stored.direction : DEFAULTS.direction,
      motion: isOneOf(stored.motion, ["full", "reduced"] as const) ? stored.motion : DEFAULTS.motion,
    }
  } catch {
    return DEFAULTS
  }
}

function SettingsProvider({ children }: { children: ReactNode }): ReactElement {
  const [settings, setSettings] = useState<Settings>(readStored)

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.theme = settings.theme
    root.dataset.dye = settings.dye
    root.dataset.motion = settings.motion
    root.dir = settings.direction
    root.lang = settings.direction === "rtl" ? "ar" : "en"
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      return
    }
  }, [settings])

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      dyeHex: WOOLS[settings.dye].hex,
      update: (next) => setSettings((current) => ({ ...current, ...next })),
    }),
    [settings],
  )

  const dye = useMemo(() => ({ dye: settings.dye, dyeHex: WOOLS[settings.dye].hex }), [settings.dye])

  return (
    <SettingsContext.Provider value={value}>
      <DyeContext.Provider value={dye}>
        <DirectionContext.Provider value={settings.direction}>{children}</DirectionContext.Provider>
      </DyeContext.Provider>
    </SettingsContext.Provider>
  )
}

function useDye(): { dye: WoolId; dyeHex: string } {
  const value = useContext(DyeContext)
  if (!value) throw new Error("useDye must be used inside SettingsProvider")
  return value
}

function useDirection(): Direction {
  return useContext(DirectionContext)
}

function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext)
  if (!value) throw new Error("useSettings must be used inside SettingsProvider")
  return value
}

export { SettingsProvider, useDirection, useDye, useSettings }
export type { Direction, Motion, Settings, Theme }
