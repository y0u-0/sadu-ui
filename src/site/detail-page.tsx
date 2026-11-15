import { toast } from "@ui-sdk/react/toast"
import { ArrowLeft, ArrowRight, Download } from "lucide-react"
import { Suspense, use, useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react"
import { keyboard as keyboardDocs, type KeyboardDoc } from "virtual:sadu-docs"
import { CodeBlock, type CodeSnippet } from "../sadu/code-block"
import { WOOLS, type WoolId } from "../sadu/palette"
import { SaduLocaleProvider } from "../sadu/locale"
import { EmptyWarp } from "../sadu/parts"
import { SaduButton } from "../sadu/sadu-button"
import { SaduSegment, SaduSegmentedControl } from "../sadu/sadu-segmented-control"
import { Boundary } from "./boundary"
import { CATALOG, entryById, familyOf, type CatalogEntry } from "./catalog"
import { CopyButton } from "./copy-button"
import { KnobPanel, initialValues, remountKey, type KnobValue, type KnobValues, type Knobs } from "./knobs"
import { OpenState, hasSpecimen } from "./specimens"
import { useCopy, useLocale, type Copy } from "./locale"
import { CORE_ITEM, dependencyName, downloadItem, fetchItem, installCommand, type RegistryItem } from "./registry"
import { hrefOf } from "./route"
import { useSettings, type Direction, type Theme } from "./settings"

const UI_SDK_DOCS = "https://ui-sdk.dev/docs"
const COLLAPSED_LINES = 28
const LINE_HEIGHT = 20
const MAX_STATES = 6

function isWool(value: string): value is WoolId {
  return value in WOOLS
}

function docSlug(base: string): string {
  return base === "Radio Group" ? "radio" : base.toLowerCase().replace(/\s+/g, "-")
}

function ScopeSwitch<Value extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: Value
  options: readonly { value: Value; label: string }[]
  onChange: (next: Value) => void
}): ReactElement {
  return (
    <SaduSegmentedControl
      aria-label={label}
      value={value}
      onValueChange={(next: unknown) => {
        const match = options.find((option) => option.value === next)
        if (match) onChange(match.value)
      }}
    >
      {options.map((option) => (
        <SaduSegment key={option.value} value={option.value}>
          {option.label}
        </SaduSegment>
      ))}
    </SaduSegmentedControl>
  )
}

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }): ReactElement {
  const id = useId()
  return (
    <section className="detail__section" aria-labelledby={id}>
      <div className="detail__section-head">
        <h2 className="detail__subhead" id={id}>
          {title}
        </h2>
        <span className="detail__section-thread" aria-hidden="true" />
        {action}
      </div>
      {children}
    </section>
  )
}

function Anatomy({ mount, revision }: { mount: HTMLElement | null; revision: string }): ReactElement | null {
  const [slots, setSlots] = useState<readonly { slot: string; className: string }[]>([])
  useLayoutEffect(() => {
    if (!mount) return
    const read = () => {
      const seen = new Map<string, string>()
      for (const element of mount.querySelectorAll<HTMLElement>("[data-slot]")) {
        const slot = element.dataset.slot
        if (!slot || seen.has(slot)) continue
        const className = [...element.classList].find((name) => name.startsWith("sadu-")) ?? ""
        seen.set(slot, className)
      }
      setSlots([...seen.entries()].map(([slot, className]) => ({ slot, className })))
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(mount, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [mount, revision])
  if (slots.length === 0) return null
  return (
    <ul className="detail-anatomy" dir="ltr">
      {slots.map(({ slot, className }) => (
        <li key={slot}>
          <code className="detail-anatomy__slot">{slot}</code>
          <code className="detail-anatomy__class">{className ? `.${className}` : ""}</code>
        </li>
      ))}
    </ul>
  )
}

function Keyboard({ doc }: { doc: KeyboardDoc }): ReactElement {
  return (
    <div className="detail-keys" dir="ltr" lang="en">
      {doc.rows.length > 0 && (
        <table className="detail-keys__table">
          <tbody>
            {doc.rows.map(([keys, does]) => (
              <tr key={`${keys}-${does}`}>
                <th scope="row">
                  <kbd>{keys}</kbd>
                </th>
                <td>{does}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {doc.items.length > 0 && (
        <ul className="detail-keys__list">
          {doc.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {doc.text && <p className="detail-keys__text">{doc.text}</p>}
    </div>
  )
}

function variantsOf(knobs: Knobs, base: KnobValues): { label: string; values: KnobValues }[] {
  const variants: { label: string; values: KnobValues }[] = []
  for (const [key, knob] of Object.entries(knobs)) {
    if (knob.kind === "toggle") variants.push({ label: `${knob.label}`, values: { ...base, [key]: !base[key] } })
    if (knob.kind === "choice") {
      for (const option of knob.options) {
        if (option === base[key]) continue
        variants.push({ label: `${knob.label}: ${knob.labels[option] ?? option}`, values: { ...base, [key]: option } })
      }
    }
  }
  return variants.slice(0, MAX_STATES - 1)
}

function States({ entry, base }: { entry: CatalogEntry; base: KnobValues }): ReactElement | null {
  const locale = useLocale()
  const variants = variantsOf(entry.playground.knobs, base)
  const open = hasSpecimen(entry.id)
  if (variants.length === 0 && !open) return null
  const tiles = [{ label: "Default", values: base }, ...variants]
  return (
    <ul className="detail-states">
      {open && (
        <li className="detail-states__tile detail-states__tile--open">
          <span className="detail-states__label" dir="ltr" lang="en">
            Open state
          </span>
          <div className="detail-states__stage detail-states__stage--open" inert aria-hidden="true">
            <OpenState id={entry.id} />
          </div>
        </li>
      )}
      {tiles.map((tile) => (
        <li key={tile.label} className="detail-states__tile">
          <span className="detail-states__label" dir="ltr" lang="en">
            {tile.label}
          </span>
          <div className="detail-states__stage" lang={entry.family === "signature" ? undefined : "en"} inert aria-hidden="true">
            <SaduLocaleProvider locale={entry.family === "signature" ? locale : "en"}>
              <Boundary name={entry.name}>{entry.playground.render(tile.values)}</Boundary>
            </SaduLocaleProvider>
          </div>
        </li>
      ))}
    </ul>
  )
}

function Playground({ entry, copy }: { entry: CatalogEntry; copy: Copy }): ReactElement {
  const locale = useLocale()
  const settings = useSettings()
  const [overrides, setOverrides] = useState<KnobValues>({})
  const [themeChoice, setTheme] = useState<Theme | null>(null)
  const [directionChoice, setDirection] = useState<Direction | null>(null)
  const [mount, setMount] = useState<HTMLDivElement | null>(null)
  const theme = themeChoice ?? settings.theme
  const direction = directionChoice ?? settings.direction
  const { knobs, render } = entry.playground
  const base = initialValues(knobs, settings.dye)
  const values = { ...base, ...overrides }
  const dyeKey = Object.entries(knobs).find(([, knob]) => knob.kind === "dye")?.[0]
  const chosen = dyeKey === undefined ? undefined : values[dyeKey]
  const dyeHex = typeof chosen === "string" && isWool(chosen) ? WOOLS[chosen].hex : settings.dyeHex
  const remount = remountKey(knobs, values)
  const english = entry.family !== "signature"
  const change = (key: string, next: KnobValue): void => setOverrides((current) => ({ ...current, [key]: next }))
  const dirty = Object.keys(overrides).length > 0 || themeChoice !== null || directionChoice !== null

  return (
    <>
      <section className="playground" aria-label={`${entry.name} playground`}>
        <div className="playground__preview">
          <div className="playground__bar" role="group" aria-label={copy.stage}>
            <span className="playground__label">{copy.stage}</span>
            <ScopeSwitch
              label={copy.stageTheme}
              value={theme}
              options={[
                { value: "day", label: copy.day },
                { value: "tent", label: copy.tent },
              ]}
              onChange={setTheme}
            />
            <ScopeSwitch
              label={copy.stageDirection}
              value={direction}
              options={[
                { value: "ltr", label: "LTR" },
                { value: "rtl", label: "RTL" },
              ]}
              onChange={setDirection}
            />
            <SaduButton
              className="playground__reset"
              variant="ghost"
              size="sm"
              disabled={!dirty}
              onClick={() => {
                setOverrides({})
                setTheme(null)
                setDirection(null)
              }}
            >
              {copy.reset}
            </SaduButton>
          </div>
          <div className="playground__stage" data-theme={theme} dir={direction} lang={english ? "en" : undefined}>
            <SaduLocaleProvider locale={english ? "en" : locale}>
              <Boundary name={entry.name} resetKey={remount}>
                <div key={remount} ref={setMount} className="playground__mount">
                  {render(values)}
                </div>
              </Boundary>
            </SaduLocaleProvider>
          </div>
        </div>
        <aside className="playground__panel" aria-labelledby="props-title">
          <h2 className="detail__subhead" id="props-title">
            {copy.props}
          </h2>
          <KnobPanel knobs={knobs} values={values} dyeHex={dyeHex} onChange={change} />
        </aside>
      </section>

      <Section title={copy.states}>
        <States entry={entry} base={values} />
      </Section>

      <Section title={copy.anatomy}>
        <Anatomy mount={mount} revision={remount} />
      </Section>
    </>
  )
}

function snippetsOf(item: RegistryItem, file: string): CodeSnippet[] {
  const ordered = [...item.files].sort((a, b) => Number(b.path.endsWith(`/${file}`)) - Number(a.path.endsWith(`/${file}`)))
  return ordered.map((source) => ({
    value: source.path,
    label: source.path.slice(source.path.lastIndexOf("/") + 1),
    fileName: source.target,
    code: source.content.replace(/\n$/, ""),
  }))
}

function Source({ entry, copy }: { entry: CatalogEntry; copy: Copy }): ReactElement {
  const item = use(fetchItem(entry.registry))
  const snippets = snippetsOf(item, entry.file)
  const [active, setActive] = useState(snippets[0]?.value ?? "")
  const [expanded, setExpanded] = useState(false)
  const current = snippets.find((snippet) => snippet.value === active) ?? snippets[0]
  const lines = current ? current.code.split("\n").length : 0
  const long = lines > COLLAPSED_LINES
  const registryDependencies = item.registryDependencies.map(dependencyName).filter((name) => name !== CORE_ITEM)
  const linked = (name: string): CatalogEntry | undefined => CATALOG.find((candidate) => candidate.registry === name)
  return (
    <>
      <dl className="detail__deps">
        <div>
          <dt>{copy.packages}</dt>
          <dd dir="ltr">{item.dependencies.length > 0 ? item.dependencies.map((name) => <code key={name}>{name}</code>) : <span>{copy.none}</span>}</dd>
        </div>
        <div>
          <dt>{copy.needs}</dt>
          <dd>
            {entry.registry === CORE_ITEM ? <span>{copy.nothingElse}</span> : <code dir="ltr">{CORE_ITEM}</code>}
            {registryDependencies.map((name) => {
              const target = linked(name)
              return target ? (
                <a key={name} href={hrefOf({ page: "component", id: target.id })}>
                  {target.name}
                </a>
              ) : (
                <code key={name}>{name}</code>
              )
            })}
          </dd>
        </div>
        <div>
          <dt>{copy.files}</dt>
          <dd>{item.files.length}</dd>
        </div>
      </dl>
      <div className="detail-code" dir="ltr" data-collapsed={long && !expanded ? "" : undefined}>
        <CodeBlock
          className="detail__code"
          snippets={snippets}
          value={current?.value}
          onValueChange={(next) => {
            setActive(next)
            setExpanded(false)
          }}
          maxHeight={long && !expanded ? COLLAPSED_LINES * LINE_HEIGHT : Math.max(lines * LINE_HEIGHT + 40, 400)}
        />
        {long && (
          <div className="detail-code__more">
            <SaduButton variant="ghost" size="sm" onClick={() => setExpanded((open) => !open)}>
              {expanded ? copy.showLess : copy.showAll(lines)}
            </SaduButton>
          </div>
        )}
      </div>
    </>
  )
}

async function downloadEntry(entry: CatalogEntry): Promise<void> {
  try {
    await downloadItem(entry.registry)
  } catch (error) {
    toast.error(`${entry.name} could not be packed`, { description: error instanceof Error ? error.message : "Try again in a moment." })
  }
}

function Pager({ entry, copy, locale }: { entry: CatalogEntry; copy: Copy; locale: "en" | "ar" }): ReactElement {
  const previous = CATALOG[entry.number - 2]
  const next = CATALOG[entry.number]
  const nameOf = (target: CatalogEntry): string => (locale === "ar" ? target.arabic : target.name)
  return (
    <nav className="pager" aria-label={copy.moreComponents}>
      {previous ? (
        <a className="pager__link" href={hrefOf({ page: "component", id: previous.id })} rel="prev">
          <span className="pager__hint">
            <ArrowLeft className="pager__arrow" size={16} strokeWidth={2} aria-hidden="true" />
            {copy.previous}
          </span>
          <span className="pager__name">
            <span className="pager__number">{previous.label}</span> {nameOf(previous)}
          </span>
        </a>
      ) : (
        <span />
      )}
      {next && (
        <a className="pager__link pager__link--next" href={hrefOf({ page: "component", id: next.id })} rel="next">
          <span className="pager__hint">
            {copy.next}
            <ArrowRight className="pager__arrow" size={16} strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="pager__name">
            <span className="pager__number">{next.label}</span> {nameOf(next)}
          </span>
        </a>
      )}
    </nav>
  )
}

function DetailPage({ id }: { id: string }): ReactElement {
  const entry = entryById(id)
  const copy = useCopy()
  const locale = useLocale()
  if (!entry) {
    return (
      <div className="detail detail--missing">
        <EmptyWarp>{copy.missing}</EmptyWarp>
        <a className="stitch-link" href={hrefOf({ page: "home" })}>
          {copy.backToCatalogue}
        </a>
      </div>
    )
  }
  const family = familyOf(entry.family)
  const command = installCommand(entry.registry)
  const doc = entry.base ? keyboardDocs[docSlug(entry.base)] : undefined
  return (
    <article className="detail" key={entry.id}>
      <nav className="detail__crumbs" aria-label={copy.breadcrumb}>
        <a href={hrefOf({ page: "home" })}>{copy.components}</a>
        <span aria-hidden="true">/</span>
        <span>{locale === "ar" ? family.arabic : family.title}</span>
      </nav>
      <header className="detail__head">
        <p className="detail__number" dir="ltr">
          {entry.label}
        </p>
        <h1 className="detail__title">{locale === "ar" ? entry.arabic : entry.name}</h1>
        {locale === "ar" && (
          <p className="detail__latin" lang="en" dir="ltr">
            {entry.name}
          </p>
        )}
        {locale === "ar" && entry.arabicIdea ? (
          <p className="detail__idea">{entry.arabicIdea}</p>
        ) : (
          <p className="detail__idea" lang="en" dir="auto">
            {entry.idea}
          </p>
        )}
        <p className="detail__base">
          {entry.base ? (
            <>
              {copy.builtOnBefore}
              <a className="stitch-link" href={UI_SDK_DOCS} lang="en">
                {entry.base}
              </a>
              {copy.builtOnAfter}
            </>
          ) : (
            copy.pureSadu
          )}
        </p>
      </header>

      <Playground key={entry.id} entry={entry} copy={copy} />

      {doc && (
        <Section title={copy.keyboard}>
          <Keyboard doc={doc} />
        </Section>
      )}

      {entry.usage && (
        <Section title={copy.usage}>
          <div dir="ltr">
            <CodeBlock className="detail__code" snippets={[{ value: "usage", label: "Usage", fileName: "usage.tsx", code: entry.usage }]} maxHeight={640} />
          </div>
        </Section>
      )}

      <Section title={copy.install}>
        <div className="command-line" dir="ltr">
          <code className="command-line__text">{command}</code>
          <CopyButton text={command} what="Install command" />
        </div>
      </Section>

      <Section
        title={copy.source}
        action={
          <SaduButton variant="secondary" size="sm" onClick={() => downloadEntry(entry)} pendingAnnouncement={`Packing ${entry.name}`}>
            <Download size={16} strokeWidth={2} aria-hidden="true" />
            {copy.downloadZip}
          </SaduButton>
        }
      >
        <Boundary name="Source" resetKey={entry.id} fallback={<EmptyWarp>The source could not be fetched. Run npm run registry.</EmptyWarp>}>
          <Suspense fallback={<EmptyWarp>Fetching the source…</EmptyWarp>}>
            <Source entry={entry} copy={copy} />
          </Suspense>
        </Boundary>
      </Section>

      <Pager entry={entry} copy={copy} locale={locale} />
    </article>
  )
}

export { DetailPage }
