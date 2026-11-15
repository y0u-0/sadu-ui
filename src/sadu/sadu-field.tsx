import { Field, FieldDescription, FieldError, FieldLabel } from "@ui-sdk/react/field"
import type { ComponentProps, ReactElement } from "react"
import { useLocalized } from "./locale"
import { Eye } from "./parts"
import "./styles/sadu-field.css"

type ClassName<State> = string | ((state: State) => string | undefined) | undefined

function partClass<State>(base: string, className: ClassName<State>): string | ((state: State) => string) {
  if (typeof className === "function") return (state: State) => [base, className(state)].filter(Boolean).join(" ")
  return [base, className].filter(Boolean).join(" ")
}

const PLIES = [0, 1, 2, 3, 4, 5, 6] as const

function FrayedThread(): ReactElement {
  return (
    <svg className="sadu-field__fray" viewBox="0 0 34 10" aria-hidden="true" focusable="false">
      {PLIES.map((ply) => (
        <ellipse
          key={ply}
          className="sadu-field__ply"
          data-shade={ply % 2 === 1 || undefined}
          cx={3 + ply * 3.1}
          cy={5}
          rx={2.1}
          ry={1.15}
          transform={`rotate(-38 ${3 + ply * 3.1} 5)`}
          style={{ animationDelay: `${ply * 24}ms` }}
        />
      ))}
      <path className="sadu-field__fibres" d="M22.4 4.6c2.2-.4 3.6-1.9 5.2-2.6 1.1-.5 2.2-.4 3.4.1M22.6 5.1c2.4.1 4.4.3 6.3-.1M22.4 5.6c1.8.6 3 1.9 4.6 2.6.8.3 1.6.4 2.6.2" />
    </svg>
  )
}

function SaduField({ className, ...props }: ComponentProps<typeof Field>): ReactElement {
  return <Field {...props} className={partClass("sadu-field", className)} />
}

type SaduFieldLabelProps = ComponentProps<typeof FieldLabel> & { requiredLabel?: string }

const REQUIRED = { en: "required", ar: "مطلوب" }

function SaduFieldLabel({ className, children, requiredLabel, dir = "auto", ...props }: SaduFieldLabelProps): ReactElement {
  const fallbackRequired = useLocalized(REQUIRED)
  return (
    <FieldLabel
      {...props}
      dir={dir}
      className={partClass("sadu-field__label", className)}
      render={(labelProps, state) => (
        <label {...labelProps}>
          {typeof children === "function" ? children(state) : children}
          {state.required && (
            <span className="sadu-field__required">
              <Eye size={10} tone="value" />
              <span className="sadu-field__hidden">{requiredLabel ?? fallbackRequired}</span>
            </span>
          )}
        </label>
      )}
    />
  )
}

function SaduFieldDescription({ className, dir = "auto", ...props }: ComponentProps<typeof FieldDescription>): ReactElement {
  return <FieldDescription {...props} dir={dir} className={partClass("sadu-field__description", className)} />
}

function SaduFieldError({ className, children, ...props }: ComponentProps<typeof FieldError>): ReactElement {
  return (
    <FieldError
      {...props}
      className={partClass("sadu-field__error", className)}
      render={(errorProps, state) => (
        <div {...errorProps}>
          <FrayedThread />
          <span dir="auto">{typeof children === "function" ? children(state) : (children ?? state.message)}</span>
        </div>
      )}
    />
  )
}

export { SaduField, SaduFieldDescription, SaduFieldError, SaduFieldLabel, partClass }
export type { ClassName }
