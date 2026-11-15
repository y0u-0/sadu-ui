import { PasswordInput, PasswordInputControl, PasswordInputToggle } from "@ui-sdk/react/password-input"
import type { ComponentProps, ReactElement } from "react"
import { partClass } from "./sadu-field"
import { DhursStrip } from "./sadu-input"
import { useLocalized } from "./locale"
import { Eye, IconButton } from "./parts"
import "./styles/sadu-input.css"
import "./styles/sadu-password-input.css"

type SaduPasswordInputProps = Omit<ComponentProps<typeof PasswordInput>, "children"> & {
  placeholder?: string
  toggleLabel?: string
  capsLockLabel?: string
  inputProps?: ComponentProps<typeof PasswordInputControl>
}

const COPY = {
  en: { toggle: "Show password", capsLock: "Caps Lock is on" },
  ar: { toggle: "إظهار كلمة المرور", capsLock: "زر Caps Lock مفعّل" },
}

function SaduPasswordInput({
  className,
  placeholder,
  toggleLabel,
  capsLockLabel,
  inputProps,
  ...props
}: SaduPasswordInputProps): ReactElement {
  const copy = useLocalized(COPY)
  return (
    <PasswordInput {...props} className={partClass("sadu-password", className)}>
      {(state) => (
        <>
          <span className="sadu-input sadu-password__box">
            <PasswordInputControl {...inputProps} placeholder={placeholder} className="sadu-input__control sadu-password__control" />
            <PasswordInputToggle render={<IconButton size={28} />} className="sadu-password__toggle" aria-label={toggleLabel ?? copy.toggle}>
              <Eye size={15} tone="structure" state={state.visible ? "on" : "closed"} />
            </PasswordInputToggle>
            <DhursStrip />
          </span>
          <span className="sadu-password__caps" aria-live="polite">
            {state.capsLock ? (capsLockLabel ?? copy.capsLock) : ""}
          </span>
        </>
      )}
    </PasswordInput>
  )
}

export { SaduPasswordInput }
export type { SaduPasswordInputProps }
