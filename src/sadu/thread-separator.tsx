import "./styles/thread-separator.css"
import { Separator } from "@ui-sdk/react/separator"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { mergeClass } from "./merge-class"
import { Cord, Eye } from "./parts"

type ThreadSeparatorVariant = "thread" | "cord"

type ThreadSeparatorProps = Omit<ComponentProps<typeof Separator>, "children"> & {
  variant?: ThreadSeparatorVariant
  label?: ReactNode
}

function ThreadSeparator({ variant = "thread", label, orientation, className, ...props }: ThreadSeparatorProps): ReactElement {
  const strand = variant === "cord" && orientation !== "vertical" ? <Cord size={4} /> : null
  return (
    <Separator
      {...props}
      orientation={orientation}
      className={mergeClass("sadu-separator", className)}
      data-variant={variant}
      data-labelled={label ? "" : undefined}
    >
      {label ? (
        <>
          <span className="sadu-separator__line">{strand}</span>
          <Eye size={10} tone="separator" className="sadu-separator__knot" />
          <span className="sadu-separator__label">{label}</span>
          <Eye size={10} tone="separator" className="sadu-separator__knot" />
          <span className="sadu-separator__line">{strand}</span>
        </>
      ) : (
        strand
      )}
    </Separator>
  )
}

export { ThreadSeparator }
export type { ThreadSeparatorProps, ThreadSeparatorVariant }
