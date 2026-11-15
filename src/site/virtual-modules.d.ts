declare module "virtual:sadu-docs" {
  type GalleryCard = { idea: string; arabicIdea: string; usage: string }
  type KeyboardDoc = { rows: string[][]; items: string[]; text: string }
  const cards: Readonly<Record<string, GalleryCard>>
  const keyboard: Readonly<Record<string, KeyboardDoc>>
  export { cards, keyboard }
  export type { GalleryCard, KeyboardDoc }
}
