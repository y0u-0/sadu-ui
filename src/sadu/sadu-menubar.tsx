import "./styles/sadu-menubar.css"
import { MenuTrigger } from "@ui-sdk/react/menu"
import { Menubar } from "@ui-sdk/react/menubar"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { mergeClass } from "./merge-class"

type SaduMenubarProps = Omit<ComponentProps<typeof Menubar>, "children"> & { children?: ReactNode }
type SaduMenubarTriggerProps = Omit<ComponentProps<typeof MenuTrigger>, "children"> & { children: string }

function SaduMenubar({ className, children, ...props }: SaduMenubarProps): ReactElement {
  return (
    <Menubar {...props} className={mergeClass("sadu-menubar", className)}>
      {children}
      <span className="sadu-wood sadu-menubar__rod" data-lying="" aria-hidden="true" />
    </Menubar>
  )
}

function SaduMenubarTrigger({ className, children, ...props }: SaduMenubarTriggerProps): ReactElement {
  return (
    <MenuTrigger {...props} className={mergeClass("sadu-menubar__trigger", className)}>
      <span className="sadu-menubar__label" data-label={children}>
        <span>{children}</span>
      </span>
    </MenuTrigger>
  )
}

export { SaduMenubar, SaduMenubarTrigger }
export type { SaduMenubarProps, SaduMenubarTriggerProps }
