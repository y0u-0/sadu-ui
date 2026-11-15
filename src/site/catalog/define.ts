import type { ReactNode } from "react"
import type { KnobValues, Knobs, Values } from "../knobs"

type Family = "signature" | "actions" | "overlays" | "entry" | "pickers" | "display"

type Span = "single" | "wide" | "tall" | "feature"

type Render = (values: KnobValues) => ReactNode

type PlaygroundSpec = { knobs: Knobs; render: Render; card: Render }

type EntryDefinition = {
  id: string
  name: string
  base: string | null
  idea?: string
  arabicIdea?: string
  usage?: string
  ownCard?: boolean
  registry?: string
  file?: string
  playground: PlaygroundSpec
}

function playground<K extends Knobs>(
  knobs: K,
  render: (values: Values<K>) => ReactNode,
  card?: (values: Values<K>) => ReactNode,
): PlaygroundSpec {
  const preview: Render = (values) => render(values as Values<K>)
  return { knobs, render: preview, card: card ? (values) => card(values as Values<K>) : preview }
}

export { playground }
export type { EntryDefinition, Family, PlaygroundSpec, Span }
