import { useMemo, type ReactElement } from "react"
import { MOTIFS } from "../sadu/motifs"
import { INK } from "../sadu/palette"
import { Eye } from "../sadu/parts"
import { Reweave } from "../sadu/weave"
import { Boundary } from "./boundary"
import { CATALOG, FAMILIES, type CatalogEntry, type FamilyInfo } from "./catalog"
import { FitStage } from "./fit-stage"
import { GalleryDemo } from "./gallery-demo"
import { DownloadLibrary } from "./install-prompt"
import { initialValues } from "./knobs"
import { useCopy, useLocale } from "./locale"
import { MastheadLoom } from "./masthead-loom"
import { hrefOf } from "./route"
import { useDye } from "./settings"

const UI_SDK = "https://ui-sdk.dev"

function Masthead(): ReactElement {
  const { dyeHex } = useDye()
  const copy = useCopy()
  return (
    <header className="masthead" data-theme="tent">
      <div className="masthead__inner">
        <div className="masthead__copy">
          <h1 className="masthead__title">
            <span lang="en">Sadu</span>
            <span className="masthead__arabic" lang="ar">
              السدو
            </span>
          </h1>
          <p className="masthead__lede">{copy.lede}</p>
          <p className="masthead__intro">
            {copy.introBefore}
            <a className="masthead__link" href={UI_SDK} lang="en" dir="ltr">
              {copy.introLink}
            </a>
            {copy.introAfter(CATALOG.length)}
          </p>
          <div className="masthead__actions">
            <DownloadLibrary />
            <span className="masthead__meta" dir="ltr" lang="en">
              @ui-sdk/react 0.1.0-beta.1
            </span>
          </div>
        </div>
        <MastheadLoom />
      </div>
      <div className="masthead__selvedge" aria-hidden="true">
        <Reweave grid={MOTIFS.dhurs.grid} colors={{ ground: INK.black, dye: dyeHex, accent: INK.wool }} level="cloth" />
      </div>
    </header>
  )
}

function CardDemo({ entry }: { entry: CatalogEntry }): ReactElement {
  const { dye } = useDye()
  const values = useMemo(() => initialValues(entry.playground.knobs, dye), [entry, dye])
  if (entry.family === "signature" || entry.ownCard) return <>{entry.playground.card(values)}</>
  return <GalleryDemo family={entry.family} name={entry.name} />
}

function CatalogCard({ entry }: { entry: CatalogEntry }): ReactElement {
  const locale = useLocale()
  const copy = useCopy()
  const titleId = `card-${entry.id}`
  const name = locale === "ar" ? entry.arabic : entry.name
  return (
    <article className="catalog-card" data-span={entry.span} data-id={entry.id} aria-labelledby={titleId}>
      <a className="catalog-card__head" href={hrefOf({ page: "component", id: entry.id })} aria-label={copy.openCard(name)}>
        <span className="catalog-card__number" dir="ltr">
          {entry.label}
        </span>
        <h3 className="catalog-card__name" id={titleId}>
          {name}
        </h3>
        <span className="catalog-card__rule" aria-hidden="true" />
        <Eye size={10} state="off" className="catalog-card__eye" />
      </a>
      <div className="catalog-card__stage">
        <Boundary name={entry.name}>
          <FitStage>
            <CardDemo entry={entry} />
          </FitStage>
        </Boundary>
      </div>
      {locale === "ar" && entry.arabicIdea ? (
        <p className="catalog-card__idea">{entry.arabicIdea}</p>
      ) : (
        entry.idea && (
          <p className="catalog-card__idea" lang="en" dir="auto">
            {entry.idea}
          </p>
        )
      )}
    </article>
  )
}

function FamilySection({ info }: { info: FamilyInfo }): ReactElement {
  const locale = useLocale()
  const first = info.entries[0]
  const last = info.entries.at(-1)
  const titleId = `family-${info.family}`
  return (
    <section className="family" aria-labelledby={titleId}>
      <header className="family__head">
        <h2 className="family__title" id={titleId}>
          {locale === "ar" ? info.arabic : info.title}
        </h2>
        <span className="family__range" dir="ltr">
          {first?.label}–{last?.label}
        </span>
        <span className="family__thread" aria-hidden="true" />
      </header>
      <div className="catalogue__grid">
        {info.entries.map((entry) => (
          <CatalogCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  )
}

function HomePage(): ReactElement {
  const copy = useCopy()
  return (
    <div className="home">
      <Masthead />
      <div className="catalogue" aria-label={copy.catalogue} role="region">
        {FAMILIES.map((info) => (
          <FamilySection key={info.family} info={info} />
        ))}
      </div>
    </div>
  )
}

export { HomePage }
