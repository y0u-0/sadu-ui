import { Checkbox, CheckboxGroup, CheckboxIndicator } from "@ui-sdk/react/checkbox"
import { useId, type ComponentProps, type ReactElement, type ReactNode } from "react"
import "./sadu.css"
import "./styles/sadu-checkbox.css"

type Float = { x: number; y: number }

const ROW = [1.8, 4.9, 8, 11.1] as const
const CHECK: readonly Float[] = [
  { x: 1.2, y: ROW[2] },
  { x: 4, y: ROW[3] },
  { x: 6.6, y: ROW[2] },
  { x: 8.8, y: ROW[1] },
  { x: 11, y: ROW[0] },
]
const BAR: readonly Float[] = [
  { x: 2, y: 6.6 },
  { x: 6.1, y: 6.6 },
  { x: 10.2, y: 6.6 },
]

function Floats({ floats, width, className }: { floats: readonly Float[]; width: number; className: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {floats.map((float, index) => (
        <rect key={index} className="sadu-checkbox__float" x={float.x} y={float.y} width={width} height={2.8} rx={1} />
      ))}
    </svg>
  )
}

type SaduCheckboxProps = Omit<ComponentProps<typeof Checkbox>, "children" | "className"> & {
  children?: ReactNode
  description?: ReactNode
  className?: string
}

function SaduCheckbox({ children, description, className, ...props }: SaduCheckboxProps): ReactElement {
  return (
    <label className={["sadu-checkbox", className].filter(Boolean).join(" ")}>
      <Checkbox {...props} className="sadu-checkbox__box">
        <CheckboxIndicator className="sadu-checkbox__indicator">
          <Floats floats={CHECK} width={3.8} className="sadu-checkbox__check" />
          <Floats floats={BAR} width={3.8} className="sadu-checkbox__bar" />
        </CheckboxIndicator>
      </Checkbox>
      {(children || description) && (
        <span className="sadu-checkbox__text">
          {children && <span className="sadu-checkbox__label">{children}</span>}
          {description && <span className="sadu-checkbox__description">{description}</span>}
        </span>
      )}
    </label>
  )
}

type SaduCheckboxGroupProps = Omit<ComponentProps<typeof CheckboxGroup>, "className"> & {
  legend?: ReactNode
  className?: string
}

function SaduCheckboxGroup({ legend, className, children, ...props }: SaduCheckboxGroupProps): ReactElement {
  const legendId = useId()
  return (
    <CheckboxGroup
      aria-labelledby={legend ? legendId : undefined}
      {...props}
      className={["sadu-checkbox-group", className].filter(Boolean).join(" ")}
    >
      {(state) => (
        <>
          {legend && (
            <span id={legendId} className="sadu-label sadu-checkbox-group__legend">
              {legend}
            </span>
          )}
          {typeof children === "function" ? children(state) : children}
        </>
      )}
    </CheckboxGroup>
  )
}

export { SaduCheckbox, SaduCheckboxGroup }
