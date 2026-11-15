import { useSaduLocale } from "../sadu/locale"

type Translate = (english: string, arabic: string) => string

const ENGLISH: Translate = (english) => english
const ARABIC: Translate = (_english, arabic) => arabic

/**
 * Demo copy in the page's language. Keep both arguments plain string or template literals: the docs
 * plugin reads the English one back out of the source so usage snippets show plain text.
 */
function useT(): Translate {
  return useSaduLocale() === "ar" ? ARABIC : ENGLISH
}

function useArabic(): boolean {
  return useSaduLocale() === "ar"
}

export { useArabic, useT }
export type { Translate }
