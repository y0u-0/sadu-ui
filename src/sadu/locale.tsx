import { createContext, useContext, useSyncExternalStore, type ReactElement, type ReactNode } from "react"

type SaduLocale = "en" | "ar"

type Localized<Copy> = Record<SaduLocale, Copy>

const listeners = new Set<() => void>()
let observer: MutationObserver | undefined

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (!observer) {
    observer = new MutationObserver(() => {
      for (const notify of listeners) notify()
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] })
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size > 0) return
    observer?.disconnect()
    observer = undefined
  }
}

function documentLocale(): SaduLocale {
  return /^ar\b/i.test(document.documentElement.lang) ? "ar" : "en"
}

function serverLocale(): SaduLocale {
  return "en"
}

const SaduLocaleContext = createContext<SaduLocale | null>(null)

/** Pins the language of default labels for a subtree, e.g. an English demo inside an Arabic page. */
function SaduLocaleProvider({ locale, children }: { locale: SaduLocale; children: ReactNode }): ReactElement {
  return <SaduLocaleContext.Provider value={locale}>{children}</SaduLocaleContext.Provider>
}

/**
 * Default labels follow the nearest SaduLocaleProvider, else the page's `lang`, so a page that switches
 * to Arabic gets Arabic accessible names and messages without passing every label. Label props still win.
 */
function useSaduLocale(): SaduLocale {
  const pinned = useContext(SaduLocaleContext)
  const page = useSyncExternalStore(subscribe, documentLocale, serverLocale)
  return pinned ?? page
}

function useLocalized<Copy>(copy: Localized<Copy>): Copy {
  return copy[useSaduLocale()]
}

type ArabicCountForms = {
  /** The whole phrase for one, e.g. "ملف واحد". */
  one: string
  /** The whole phrase for two, the dual, e.g. "ملفان". */
  two: string
  /** Plural noun after 3 to 10, e.g. "ملفات". */
  few: string
  /** Accusative singular after 11 to 99, e.g. "ملفًا". */
  many: string
  /** Genitive singular after 100, 1000 and the like, e.g. "ملف". */
  other: string
}

const ARABIC_PLURALS = new Intl.PluralRules("ar")

function arabicCount(count: number, forms: ArabicCountForms): string {
  const category = ARABIC_PLURALS.select(count)
  if (category === "one") return forms.one
  if (category === "two") return forms.two
  if (category === "few") return `${count} ${forms.few}`
  if (category === "many") return `${count} ${forms.many}`
  return `${count} ${forms.other}`
}

export { SaduLocaleProvider, arabicCount, useLocalized, useSaduLocale }
export type { ArabicCountForms, Localized, SaduLocale }
