import "./styles/sadu-button.css"
import { Button } from "@ui-sdk/react/button"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { mergeClass } from "./merge-class"
import type { Grid } from "./motifs"
import { WOOLS } from "./palette"
import { Weave } from "./weave"

type SaduButtonVariant = "primary" | "secondary" | "ghost" | "destructive"
type SaduButtonSize = "sm" | "md" | "lg" | "icon"

type SaduButtonProps = Omit<ComponentProps<typeof Button>, "children"> & {
  variant?: SaduButtonVariant
  size?: SaduButtonSize
  weaving?: boolean
  children?: ReactNode
}

const HEM: Grid = ["x.", ".x"]

function SaduButton({ variant = "primary", size = "md", weaving = false, className, children, ...props }: SaduButtonProps): ReactElement {
  return (
    <Button
      aria-busy={weaving || undefined}
      {...props}
      className={mergeClass("sadu-button", className)}
      data-variant={variant}
      data-size={size}
      data-weaving={weaving || undefined}
    >
      <span className="sadu-button__label">{children}</span>
      {variant === "primary" && (
        <span className="sadu-button__hem" aria-hidden="true">
          <span className="sadu-button__cloth">
            <Weave grid={HEM} colors={{ ground: WOOLS.madder.dark, dye: WOOLS.madder.hex, accent: WOOLS.madder.hex }} level="stitch" />
          </span>
        </span>
      )}
      {variant === "primary" && <span className="sadu-wood sadu-button__beater" aria-hidden="true" />}
    </Button>
  )
}

export { SaduButton }
export type { SaduButtonProps, SaduButtonSize, SaduButtonVariant }
