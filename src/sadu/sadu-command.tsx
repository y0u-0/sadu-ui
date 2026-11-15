import "./styles/sadu-command.css"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandItemIcon,
  CommandItemText,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  createCommandController,
} from "@ui-sdk/react/command"
import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type InputEvent,
  type ReactElement,
  type ReactNode,
} from "react"
import { useSaduLocale } from "./locale"
import { mergeClass } from "./merge-class"
import { EmptyWarp, Kbd } from "./parts"
import { DhursStrip } from "./sadu-input"

type SaduCommandProps = Omit<ComponentProps<typeof Command>, "children"> & { children?: ReactNode }
type SaduCommandInputProps = ComponentProps<typeof CommandInput>
type SaduCommandEmptyProps = Omit<ComponentProps<typeof CommandEmpty>, "children"> & {
  children?: (query: string) => ReactNode
}
type SaduCommandItemProps = Omit<ComponentProps<typeof CommandItem>, "children" | "label"> & {
  label: string
  icon?: ReactNode
  trailing?: ReactNode
}
type Rankable = { label: string; keywords?: readonly string[] }
type Segment = { text: string; match: boolean }

const BEAT_OFFSETS = [0, 3, -1, 0]
const RANK = { prefix: 4, wordPrefix: 3, contiguous: 2, scattered: 1 } as const
type Loom = {
  query: string
  describe: (value: string, item: Rankable) => void
  forget: (value: string) => void
}

const LoomContext = createContext<Loom>({ query: "", describe: () => {}, forget: () => {} })

function reducesMotion(element: Element): boolean {
  return element.closest('[data-motion="reduced"]') !== null || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
}

function scattered(text: string, query: string): boolean {
  let at = 0
  for (const character of text) {
    if (character === query[at]) at++
    if (at === query.length) return true
  }
  return false
}

function rankText(text: string, query: string): number {
  const folded = text.toLocaleLowerCase()
  if (folded.startsWith(query)) return RANK.prefix
  if (folded.split(/[\s,.-]+/).some((word) => word.startsWith(query))) return RANK.wordPrefix
  if (folded.includes(query)) return RANK.contiguous
  return scattered(folded, query) ? RANK.scattered : 0
}

function contiguousAt(text: string, query: string): number {
  const folded = text.toLocaleLowerCase()
  const words = [...folded.matchAll(/[^\s,.-]+/g)]
  const word = words.find((match) => match[0].startsWith(query))
  return word?.index ?? folded.indexOf(query)
}

function stitchSegments(text: string, query: string): Segment[] {
  const folded = query.trim().toLocaleLowerCase()
  if (folded === "") return [{ text, match: false }]
  const at = contiguousAt(text, folded)
  if (at >= 0) {
    const end = at + folded.length
    return [
      { text: text.slice(0, at), match: false },
      { text: text.slice(at, end), match: true },
      { text: text.slice(end), match: false },
    ].filter((segment) => segment.text !== "")
  }
  const segments: Segment[] = []
  let next = 0
  for (const character of text) {
    const match = next < folded.length && character.toLocaleLowerCase() === folded[next]
    if (match) next++
    const last = segments[segments.length - 1]
    if (last && last.match === match) last.text += character
    else segments.push({ text: character, match })
  }
  return next === folded.length ? segments : [{ text, match: false }]
}

function weaveRank(item: Rankable, query: string): number {
  const folded = query.trim().toLocaleLowerCase()
  if (folded === "") return 1
  return Math.max(rankText(item.label, folded), ...(item.keywords ?? []).map((keyword) => rankText(keyword, folded)))
}

function bestMatch(items: ReadonlyMap<string, Rankable>, query: string): string | null {
  let best: string | null = null
  let score = 0
  for (const [value, item] of items) {
    const rank = weaveRank(item, query)
    if (rank > score) {
      best = value
      score = rank
    }
  }
  return best
}

function SaduCommand({
  className,
  filter = weaveRank,
  query,
  defaultQuery,
  onQueryChange,
  controller,
  ...props
}: SaduCommandProps): ReactElement {
  const [typed, setTyped] = useState(defaultQuery ?? "")
  const [ownController] = useState(createCommandController)
  const [loom] = useState(() => {
    const items = new Map<string, Rankable>()
    return {
      items,
      describe: (value: string, item: Rankable) => {
        items.set(value, item)
      },
      forget: (value: string) => {
        items.delete(value)
      },
    }
  })
  const steer = controller ?? ownController
  const current = query ?? typed
  useEffect(() => {
    if (filter !== weaveRank || current.trim() === "") return
    const best = bestMatch(loom.items, current)
    if (best !== null && steer.getValue() !== best) steer.setValue(best)
  }, [current, filter, loom, steer])
  return (
    <LoomContext.Provider value={{ query: current, describe: loom.describe, forget: loom.forget }}>
      <Command
        {...props}
        controller={steer}
        query={query}
        defaultQuery={defaultQuery}
        onQueryChange={(next, details) => {
          setTyped(next)
          onQueryChange?.(next, details)
        }}
        filter={filter}
        className={mergeClass("sadu-command", className)}
      />
    </LoomContext.Provider>
  )
}

function SaduCommandInput({ className, onInput, ...props }: SaduCommandInputProps): ReactElement {
  const beater = useRef<HTMLSpanElement>(null)
  const beat = (event: InputEvent<HTMLInputElement>) => {
    onInput?.(event)
    const node = beater.current
    if (!node || reducesMotion(node) || typeof node.animate !== "function") return
    const direction = node.matches(":dir(rtl)") ? -1 : 1
    const frames = BEAT_OFFSETS.map((offset) => ({ translate: `${offset * direction}px 0` }))
    node.animate(frames, { duration: 120, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" })
  }
  return (
    <div className="sadu-command__field">
      <span ref={beater} className="sadu-wood sadu-command__beater" aria-hidden="true" />
      <CommandInput {...props} onInput={beat} className={mergeClass("sadu-command__input", className)} />
      <DhursStrip />
    </div>
  )
}

function SaduCommandList({ className, ...props }: ComponentProps<typeof CommandList>): ReactElement {
  return <CommandList {...props} className={mergeClass("sadu-command__list", className)} />
}

function SaduCommandGroup({ className, ...props }: ComponentProps<typeof CommandGroup>): ReactElement {
  return <CommandGroup {...props} className={mergeClass("sadu-command__group", className)} />
}

function SaduCommandGroupLabel({ className, ...props }: ComponentProps<typeof CommandGroupLabel>): ReactElement {
  return <CommandGroupLabel {...props} className={mergeClass("sadu-command__label", className)} />
}

function SaduCommandSeparator({ className, ...props }: ComponentProps<typeof CommandSeparator>): ReactElement {
  return <CommandSeparator {...props} className={mergeClass("sadu-command__separator", className)} />
}

const EMPTY = {
  en: (query: string) => `Nothing woven under “${query}”.`,
  ar: (query: string) => `لم يُنسج شيء باسم «${query}».`,
}

function SaduCommandEmpty({ className, children, ...props }: SaduCommandEmptyProps): ReactElement {
  const empty = children ?? EMPTY[useSaduLocale()]
  return (
    <CommandEmpty {...props} className={mergeClass("sadu-command__empty", className)}>
      {(state) => state.empty && <EmptyWarp>{empty(state.query)}</EmptyWarp>}
    </CommandEmpty>
  )
}

function SaduCommandItem({ label, icon, trailing, shortcut, className, ...props }: SaduCommandItemProps): ReactElement {
  const { query, describe, forget } = useContext(LoomContext)
  const value = props.value
  const keywords = props.keywords
  useEffect(() => {
    if (value !== undefined) describe(value, { label, keywords })
  }, [describe, value, label, keywords])
  useEffect(() => {
    if (value === undefined) return
    return () => forget(value)
  }, [forget, value])
  return (
    <CommandItem aria-label={label} {...props} label={label} shortcut={shortcut} className={mergeClass("sadu-command__item", className)}>
      {icon && <CommandItemIcon className="sadu-command__icon">{icon}</CommandItemIcon>}
      <CommandItemText className="sadu-command__text">
        {() =>
          stitchSegments(label, query).map((segment, index) => (
            <Fragment key={index}>
              {segment.match ? <mark className="sadu-stitch sadu-command__match">{segment.text}</mark> : segment.text}
            </Fragment>
          ))
        }
      </CommandItemText>
      {trailing && <span className="sadu-command__trailing">{trailing}</span>}
      {shortcut && <CommandShortcut className="sadu-command__keys">{(state) => <Kbd>{state.text}</Kbd>}</CommandShortcut>}
    </CommandItem>
  )
}

export {
  SaduCommand,
  SaduCommandEmpty,
  SaduCommandGroup,
  SaduCommandGroupLabel,
  SaduCommandInput,
  SaduCommandItem,
  SaduCommandList,
  SaduCommandSeparator,
  weaveRank,
}
export type { SaduCommandEmptyProps, SaduCommandInputProps, SaduCommandItemProps, SaduCommandProps }
