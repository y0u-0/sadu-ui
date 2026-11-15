type WoolId = "madder" | "saffron" | "indigo" | "camel" | "charcoal"

type Wool = { id: WoolId; name: string; arabic: string; hex: string; light: string; dark: string }

const WOOLS: Record<WoolId, Wool> = {
  madder: { id: "madder", name: "Madder", arabic: "أحمر", hex: "#a3231b", light: "#c2402f", dark: "#76150f" },
  saffron: { id: "saffron", name: "Saffron", arabic: "زعفراني", hex: "#cf7a1b", light: "#e39440", dark: "#9a5710" },
  indigo: { id: "indigo", name: "Indigo", arabic: "نيلي", hex: "#2a3c63", light: "#3f5687", dark: "#1a2643" },
  camel: { id: "camel", name: "Camel", arabic: "وبر", hex: "#a87a4f", light: "#c39568", dark: "#7a5534" },
  charcoal: { id: "charcoal", name: "Goat hair", arabic: "شعر الماعز", hex: "#2b221c", light: "#43372e", dark: "#17110d" },
}

const WOOL_ORDER: readonly WoolId[] = ["madder", "saffron", "indigo", "camel", "charcoal"]

const INK = {
  black: "#1f1813",
  wool: "#e6d9bf",
  bone: "#fbf7f0",
  sand: "#e9dcc6",
} as const

type Colors = { ground: string; dye: string; accent: string }

export { INK, WOOLS, WOOL_ORDER }
export type { Colors, Wool, WoolId }
