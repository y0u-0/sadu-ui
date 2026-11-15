import {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselIndicatorGroup,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselViewport,
} from "@ui-sdk/react/carousel"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Children, cloneElement, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { useLocalized, type Localized } from "./locale"
import { IconButton } from "./parts"
import "./sadu.css"
import "./styles/sadu-carousel.css"

type CarouselCopy = {
  previous: string
  next: string
  indicator: (page: number) => string
  indicators: string
  /** Undefined keeps UI SDK's own "1 of 5" slide names. */
  slide: ((position: number, count: number) => string) | undefined
}

const COPY: Localized<CarouselCopy> = {
  en: { previous: "Previous", next: "Next", indicator: (page) => `Slide ${page}`, indicators: "Choose a slide", slide: undefined },
  ar: {
    previous: "السابق",
    next: "التالي",
    indicator: (page) => `الشريحة ${page}`,
    indicators: "اختيار شريحة",
    slide: (position, count) => `${position} من ${count}`,
  },
}

type NamedSlide = ReactElement<{ "aria-label"?: string }>

function nameSlides(children: ReactNode, name: CarouselCopy["slide"]): ReactNode {
  if (!name) return children
  const slides = Children.toArray(children)
  return slides.map((slide, index) =>
    isValidElement<{ "aria-label"?: string }>(slide) && slide.props["aria-label"] === undefined
      ? cloneElement(slide as NamedSlide, { "aria-label": name(index + 1, slides.length) })
      : slide,
  )
}

type SaduCarouselProps = Omit<ComponentProps<typeof Carousel>, "className" | "children"> & {
  children: ReactNode
  previousLabel?: string
  nextLabel?: string
  indicatorLabel?: (page: number) => string
  indicatorsLabel?: string
  className?: string
}

function SaduCarousel({
  children,
  previousLabel,
  nextLabel,
  indicatorLabel,
  indicatorsLabel,
  className,
  ...props
}: SaduCarouselProps): ReactElement {
  const copy = useLocalized(COPY)
  const labelOf = indicatorLabel ?? copy.indicator
  const count = Children.toArray(children).length
  return (
    <Carousel {...props} className={["sadu-carousel", className].filter(Boolean).join(" ")}>
      <div className="sadu-carousel__frame">
        <CarouselPrevious className="sadu-carousel__step" data-side="previous" aria-label={previousLabel ?? copy.previous} render={<IconButton size={36} />}>
          <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
        </CarouselPrevious>
        <div className="sadu-carousel__loom">
          <CarouselViewport className="sadu-carousel__viewport">
            <CarouselContent className="sadu-carousel__content">{nameSlides(children, copy.slide)}</CarouselContent>
          </CarouselViewport>
          <span className="sadu-carousel__beam sadu-wood" data-side="start" aria-hidden="true" />
          <span className="sadu-carousel__beam sadu-wood" data-side="end" aria-hidden="true" />
        </div>
        <CarouselNext className="sadu-carousel__step" data-side="next" aria-label={nextLabel ?? copy.next} render={<IconButton size={36} />}>
          <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
        </CarouselNext>
      </div>
      <CarouselIndicatorGroup className="sadu-carousel__floats" aria-label={indicatorsLabel ?? copy.indicators}>
        {Array.from({ length: count }, (_, index) => (
          <CarouselIndicator key={index} page={index + 1} className="sadu-carousel__pick" aria-label={labelOf(index + 1)}>
            <span className="sadu-carousel__float" aria-hidden="true" />
          </CarouselIndicator>
        ))}
      </CarouselIndicatorGroup>
    </Carousel>
  )
}

type SaduCarouselItemProps = Omit<ComponentProps<typeof CarouselItem>, "className" | "children"> & {
  children: ReactNode
  caption?: ReactNode
  detail?: ReactNode
  className?: string
}

function SaduCarouselItem({ children, caption, detail, className, ...props }: SaduCarouselItemProps): ReactElement {
  return (
    <CarouselItem {...props} className={["sadu-carousel__item", className].filter(Boolean).join(" ")}>
      <figure className="sadu-carousel__figure">
        <div className="sadu-carousel__media">{children}</div>
        {(caption || detail) && (
          <figcaption className="sadu-carousel__caption">
            {caption && <span className="sadu-carousel__name">{caption}</span>}
            {detail && <span className="sadu-carousel__detail">{detail}</span>}
          </figcaption>
        )}
      </figure>
    </CarouselItem>
  )
}

export { SaduCarousel, SaduCarouselItem }
