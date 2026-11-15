type Grid = readonly string[]

type MotifId = "eyoun" | "shajarah" | "uwairjan" | "hubub" | "dhurs" | "dhalla"

type Motif = {
  id: MotifId
  name: string
  arabic: string
  gloss: string
  arabicGloss: string
  grid: Grid
  center: number
}

const ROWS = 11

const AIN: Grid = [
  "........",
  "...x....",
  "...xx...",
  "..xkx...",
  "..xkkx..",
  ".xkbkx.k",
  "..xkkx..",
  "..xkx...",
  "...xx...",
  "...x....",
  "........",
]

const UWAIRJAN: Grid = [
  "xxxxxxx.",
  "xxxxxx..",
  ".xxxxx..",
  ".xxxx...",
  "..xxx..k",
  "..xx..kk",
  "k..x..kk",
  "k....kkk",
  "kk...kkk",
  "kk..kkkk",
  "kkk.kkkk",
]

const DHURS: Grid = [
  "kkkkkkkk",
  "xxxx....",
  "xxxx....",
  "xxxx....",
  "xxxx....",
  "kkkkkkkk",
  "....xxxx",
  "....xxxx",
  "....xxxx",
  "....xxxx",
  "kkkkkkkk",
]

const DHALLA: Grid = ["....", "xx..", "xx..", "xx..", "xx..", "xx..", "xx..", "xx..", "xx..", "xx..", "...."]

const HUBUB: Grid = ["....", "....", "x...", "....", "..k.", "....", "x...", "....", "..k.", "....", "...."]

const SHAJARAH_SOURCE: Grid = [
  "........................",
  "kkkkk....k....k.........",
  ".kkkk....kk...kk..kkkkk.",
  ".kkk....kxk...k...kkkkk.",
  "..kk....kxxk......k.k.k.",
  "..x....kx.xk..x...k.k.k.",
  "..kk....kxxk......k.k.k.",
  ".kkk....kxk...k...k.k.k.",
  ".kkkk....kk...kk..k.k.k.",
  "kkkkk....k....k.........",
  "........................",
]

const PICTOGRAPHS: readonly (readonly [number, number])[] = [
  [0, 5],
  [7, 12],
  [13, 16],
  [18, 23],
]

function random(seed: number): () => number {
  let state = seed >>> 0 || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function shajarah(seed = 1): Grid {
  const next = random(seed)
  const order = PICTOGRAPHS.map((range) => ({ range, key: next() })).sort((a, b) => a.key - b.key)
  const gaps = order.map(() => (next() < 0.5 ? 2 : 3))
  return SHAJARAH_SOURCE.map((line) =>
    order.map(({ range: [start, end] }, index) => line.slice(start, end) + ".".repeat(gaps[index] ?? 2)).join(""),
  )
}

const MOTIFS: Record<MotifId, Motif> = {
  eyoun: { id: "eyoun", name: "Ain", arabic: "عين", gloss: "the eye", arabicGloss: "العين", grid: AIN, center: 3.5 },
  shajarah: {
    id: "shajarah",
    name: "Shajarah",
    arabic: "شجرة",
    gloss: "the tree, the picked centre band",
    arabicGloss: "الشريط الأوسط المنقوش",
    grid: shajarah(),
    center: 12,
  },
  uwairjan: { id: "uwairjan", name: "Uwairjan", arabic: "عويرجان", gloss: "facing triangles", arabicGloss: "مثلثات متقابلة", grid: UWAIRJAN, center: 4 },
  hubub: { id: "hubub", name: "Hubub", arabic: "حبوب", gloss: "seeds", arabicGloss: "حبّات متناثرة", grid: HUBUB, center: 2 },
  dhurs: { id: "dhurs", name: "Dhurus al-khail", arabic: "ضروس الخيل", gloss: "horse teeth", arabicGloss: "أسنان الخيل", grid: DHURS, center: 4 },
  dhalla: { id: "dhalla", name: "Dhalla", arabic: "ضلعة", gloss: "ribs", arabicGloss: "الأضلاع", grid: DHALLA, center: 2 },
}

const PICKABLE: readonly MotifId[] = ["eyoun", "uwairjan", "dhurs", "dhalla", "hubub"]

export { MOTIFS, PICKABLE, ROWS, shajarah }
export type { Grid, Motif, MotifId }
