import { Rating, RatingItem } from "@ui-sdk/react/rating"
import type { ReactElement } from "react"
import { Eye } from "./parts"

type EyeRatingProps = {
  label: string
  value?: number | null
  defaultValue?: number
  onValueChange?: (value: number | null) => void
  max?: number
  deselectable?: boolean
  name?: string
  disabled?: boolean
  readOnly?: boolean
  className?: string
}

function EyeRating({
  label,
  value,
  defaultValue,
  onValueChange,
  max = 5,
  deselectable,
  name,
  disabled,
  readOnly,
  className,
}: EyeRatingProps): ReactElement {
  return (
    <Rating
      className={["sadu-rating", className].filter(Boolean).join(" ")}
      aria-label={label}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(next)}
      max={max}
      deselectable={deselectable}
      name={name}
      disabled={disabled}
      readOnly={readOnly}
    >
      <RatingItem className="sadu-rating__item">
        <span className="sadu-rating__knot" aria-hidden="true" />
        <Eye size={20} state="on" className="sadu-rating__eye" />
      </RatingItem>
    </Rating>
  )
}

export { EyeRating }
