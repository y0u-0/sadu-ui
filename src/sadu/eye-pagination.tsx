import "./styles/eye-pagination.css"
import {
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  type PaginationRangeItem,
} from "@ui-sdk/react/pagination"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ComponentProps, CSSProperties, ReactElement } from "react"
import { mergeClass } from "./merge-class"
import type { Grid } from "./motifs"
import { INK, WOOLS } from "./palette"
import { Lozenge } from "./parts"
import { Weave } from "./weave"
import { useLocalized } from "./locale"

type EyePaginationProps = Omit<ComponentProps<typeof Pagination>, "children"> & {
  previousLabel?: string
  nextLabel?: string
  dye?: string
}

const BAND: Grid = ["x.", ".x"]


const COPY = {
  en: { previous: "Previous page", next: "Next page" },
  ar: { previous: "الصفحة السابقة", next: "الصفحة التالية" },
}

function placement(items: readonly PaginationRangeItem[], page: number): CSSProperties {
  return {
    "--sadu-pagination-current": Math.max(0, items.indexOf(page)),
    "--sadu-pagination-count": items.length,
  } as CSSProperties
}

function EyePagination({
  previousLabel,
  nextLabel,
  dye = WOOLS.madder.hex,
  className,
  ...props
}: EyePaginationProps): ReactElement {
  const copy = useLocalized(COPY)
  return (
    <Pagination {...props} className={mergeClass("sadu-eye-pagination", className)}>
      {({ items, page }) => (
        <div className="sadu-eye-pagination__loom" style={placement(items, page)}>
          <span className="sadu-eye-pagination__warp" aria-hidden="true">
            <span className="sadu-eye-pagination__cloth">
              <Weave grid={BAND} colors={{ ground: INK.black, dye, accent: dye }} level="stitch" />
            </span>
          </span>
          <PaginationList className="sadu-eye-pagination__list">
            <PaginationItem className="sadu-eye-pagination__item">
              <PaginationPrevious className="sadu-icon-button sadu-eye-pagination__step" data-size={36} aria-label={previousLabel ?? copy.previous}>
                <ChevronLeft className="sadu-eye-pagination__chevron" size={16} strokeWidth={2} aria-hidden="true" />
              </PaginationPrevious>
            </PaginationItem>
            {items.map((item) => (
              <PaginationItem key={item} className="sadu-eye-pagination__item">
                {typeof item === "number" ? (
                  <PaginationLink page={item} className="sadu-eye-pagination__page">
                    {(state) => <Lozenge chosen={state.current}>{item}</Lozenge>}
                  </PaginationLink>
                ) : (
                  <PaginationEllipsis className="sadu-eye-pagination__gap">
                    <span />
                    <span />
                    <span />
                  </PaginationEllipsis>
                )}
              </PaginationItem>
            ))}
            <PaginationItem className="sadu-eye-pagination__item">
              <PaginationNext className="sadu-icon-button sadu-eye-pagination__step" data-size={36} aria-label={nextLabel ?? copy.next}>
                <ChevronRight className="sadu-eye-pagination__chevron" size={16} strokeWidth={2} aria-hidden="true" />
              </PaginationNext>
            </PaginationItem>
          </PaginationList>
        </div>
      )}
    </Pagination>
  )
}

export { EyePagination }
export type { EyePaginationProps }
