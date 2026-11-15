import { Children, createContext, Fragment, isValidElement, useContext, type ReactElement, type ReactNode } from "react"
import { useArabic } from "./locale"
import "./gallery.css"

type GalleryFilter = { only?: string }

const GalleryFilterContext = createContext<GalleryFilter>({})

function GalleryFilterProvider({ value, children }: { value: GalleryFilter; children: ReactNode }): ReactElement {
  return <GalleryFilterContext.Provider value={value}>{children}</GalleryFilterContext.Provider>
}

type GallerySectionProps = { title: string; lede: string; arabicTitle: string; arabicLede: string; children: ReactNode }

function cardsOf(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return []
    if (child.type === Fragment) return cardsOf(child.props.children)
    return child.type === Card ? [child] : []
  })
}

function GallerySection({ title, lede, arabicTitle, arabicLede, children }: GallerySectionProps): ReactElement {
  const filter = useContext(GalleryFilterContext)
  const arabic = useArabic()
  if (filter.only !== undefined) return <>{cardsOf(children)}</>
  return (
    <section className="gallery-section">
      <div className="gallery-section__head">
        <h2 className="gallery-section__title">{arabic ? arabicTitle : title}</h2>
        <p className="gallery-section__lede">{arabic ? arabicLede : lede}</p>
      </div>
      <div className="gallery-grid">{children}</div>
    </section>
  )
}

type CardProps = { name: string; idea: string; arabicIdea: string; wide?: boolean; children: ReactNode }

function Card({ name, idea, arabicIdea, wide, children }: CardProps): ReactElement | null {
  const filter = useContext(GalleryFilterContext)
  const arabic = useArabic()
  const shownIdea = arabic ? arabicIdea : idea
  const demo = <Fragment key={arabic ? "ar" : "en"}>{children}</Fragment>
  if (filter.only !== undefined) {
    return filter.only === name ? demo : null
  }
  return (
    <article className="gallery-card" data-wide={wide || undefined}>
      <div className="gallery-card__stage">{demo}</div>
      <div className="gallery-card__caption">
        <span className="gallery-card__name" lang="en">
          {name}
        </span>
        <span className="gallery-card__idea">{shownIdea}</span>
      </div>
    </article>
  )
}

export { Card, GalleryFilterProvider, GallerySection }
export type { GalleryFilter }
