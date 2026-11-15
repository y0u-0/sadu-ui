import "./styles/sadu-menu.css"
import { ariaKeyshortcuts, formatShortcut } from "@ui-sdk/core"
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuItemIcon,
  MenuItemIndicator,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "@ui-sdk/react/menu"
import { ChevronRight } from "lucide-react"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { mergeClass } from "./merge-class"
import { Eye, Kbd, SkeinDot } from "./parts"
import { PopupSurface } from "./popup-surface"
import { SaduButton } from "./sadu-button"

type SaduMenuContentProps = Omit<ComponentProps<typeof MenuContent>, "children"> & { children?: ReactNode }
type SaduMenuTriggerProps = ComponentProps<typeof MenuTrigger>
type SaduMenuItemProps = Omit<ComponentProps<typeof MenuItem>, "children"> & {
  icon?: ReactNode
  inset?: boolean
  children?: ReactNode
}
type SaduMenuCheckboxItemProps = Omit<ComponentProps<typeof MenuCheckboxItem>, "children"> & {
  trailing?: ReactNode
  children?: ReactNode
}
type SaduMenuRadioItemProps = Omit<ComponentProps<typeof MenuRadioItem>, "children"> & {
  trailing?: ReactNode
  children?: ReactNode
}
type SaduMenuSubTriggerProps = Omit<ComponentProps<typeof MenuSubTrigger>, "children"> & {
  icon?: ReactNode
  inset?: boolean
  children?: ReactNode
}
type SaduMenuSpecimenItem = {
  label: string
  shortcut?: string
  icon?: ReactNode
  checked?: boolean
  destructive?: boolean
  separator?: boolean
  highlighted?: boolean
  submenu?: boolean
  trailing?: ReactNode
}
type SaduMenuSpecimenProps = {
  items?: readonly SaduMenuSpecimenItem[]
  children?: ReactNode
  className?: string
}

const SUBMENU_ALIGN_OFFSET = -16

function Shortcut({ keys }: { keys: string }): ReactElement {
  return (
    <MenuShortcut className="sadu-menu__shortcut">
      <Kbd>{formatShortcut(keys)}</Kbd>
    </MenuShortcut>
  )
}

function SaduMenuTrigger({ className, ...props }: SaduMenuTriggerProps): ReactElement {
  return <MenuTrigger {...props} render={<SaduButton variant="secondary" />} className={mergeClass("sadu-menu__trigger", className)} />
}

function SaduMenuContent({ className, children, sideOffset = 6, ...props }: SaduMenuContentProps): ReactElement {
  return (
    <MenuContent {...props} sideOffset={sideOffset} render={<PopupSurface />} className={mergeClass("sadu-menu__content", className)}>
      {children}
    </MenuContent>
  )
}

function SaduMenuSubContent({
  className,
  children,
  sideOffset = 2,
  alignOffset = SUBMENU_ALIGN_OFFSET,
  ...props
}: SaduMenuContentProps): ReactElement {
  return (
    <MenuSubContent
      {...props}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      render={<PopupSurface />}
      className={mergeClass("sadu-menu__content", className)}
    >
      {children}
    </MenuSubContent>
  )
}

function SaduMenuItem({ icon, inset, shortcut, className, children, ...props }: SaduMenuItemProps): ReactElement {
  return (
    <MenuItem
      aria-keyshortcuts={shortcut ? ariaKeyshortcuts(shortcut) : undefined}
      {...props}
      className={mergeClass("sadu-menu__item", className)}
      data-inset={inset || undefined}
    >
      {icon && <MenuItemIcon className="sadu-menu__lead">{icon}</MenuItemIcon>}
      <span className="sadu-menu__text">{children}</span>
      {shortcut && <Shortcut keys={shortcut} />}
    </MenuItem>
  )
}

function SaduMenuCheckboxItem({ trailing, className, children, ...props }: SaduMenuCheckboxItemProps): ReactElement {
  return (
    <MenuCheckboxItem {...props} className={mergeClass("sadu-menu__item", className)} data-mark="checkbox">
      <MenuItemIndicator keepMounted className="sadu-menu__lead">
        {(state) => state.checked && <Eye size={10} state="on" tone="value" className="sadu-menu__eye" />}
      </MenuItemIndicator>
      <span className="sadu-menu__text">{children}</span>
      {trailing && <span className="sadu-menu__trailing">{trailing}</span>}
    </MenuCheckboxItem>
  )
}

function SaduMenuRadioItem({ trailing, className, children, ...props }: SaduMenuRadioItemProps): ReactElement {
  return (
    <MenuRadioItem {...props} className={mergeClass("sadu-menu__item", className)} data-mark="radio">
      <MenuItemIndicator keepMounted className="sadu-menu__lead">
        {(state) => state.checked && <Eye size={10} state="on" tone="value" className="sadu-menu__eye" />}
      </MenuItemIndicator>
      <span className="sadu-menu__text">{children}</span>
      {trailing && <span className="sadu-menu__trailing">{trailing}</span>}
    </MenuRadioItem>
  )
}

function SaduMenuRadioGroup({ className, ...props }: ComponentProps<typeof MenuRadioGroup>): ReactElement {
  return <MenuRadioGroup {...props} className={mergeClass("sadu-menu__group", className)} />
}

function SaduMenuGroup({ className, ...props }: ComponentProps<typeof MenuGroup>): ReactElement {
  return <MenuGroup {...props} className={mergeClass("sadu-menu__group", className)} />
}

function SaduMenuGroupLabel({ className, ...props }: ComponentProps<typeof MenuGroupLabel>): ReactElement {
  return <MenuGroupLabel {...props} className={mergeClass("sadu-menu__label", className)} />
}

function SaduMenuSeparator({ className, ...props }: ComponentProps<typeof MenuSeparator>): ReactElement {
  return <MenuSeparator {...props} className={mergeClass("sadu-menu__separator", className)} />
}

function SaduMenuSubTrigger({ icon, inset, className, children, ...props }: SaduMenuSubTriggerProps): ReactElement {
  return (
    <MenuSubTrigger {...props} className={mergeClass("sadu-menu__item", className)} data-inset={inset || undefined}>
      {icon && <MenuItemIcon className="sadu-menu__lead">{icon}</MenuItemIcon>}
      <span className="sadu-menu__text">{children}</span>
      <MenuItemIcon mirror className="sadu-menu__chevron">
        <ChevronRight size={16} strokeWidth={2} />
      </MenuItemIcon>
    </MenuSubTrigger>
  )
}

function SpecimenRow({ item }: { item: SaduMenuSpecimenItem }): ReactElement {
  if (item.separator) {
    return <div className="sadu-menu__separator" />
  }
  const marked = item.checked !== undefined
  return (
    <div
      className="sadu-menu__item"
      data-highlighted={item.highlighted || undefined}
      data-destructive={item.destructive || undefined}
      data-checked={item.checked || undefined}
    >
      {(marked || item.icon) && (
        <span className="sadu-menu__lead">
          {marked ? item.checked && <Eye size={10} state="on" tone="value" className="sadu-menu__eye" /> : item.icon}
        </span>
      )}
      <span className="sadu-menu__text">{item.label}</span>
      {item.trailing && <span className="sadu-menu__trailing">{item.trailing}</span>}
      {item.shortcut && (
        <span className="sadu-menu__shortcut">
          <Kbd>{formatShortcut(item.shortcut)}</Kbd>
        </span>
      )}
      {item.submenu && (
        <span className="sadu-menu__chevron">
          <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
        </span>
      )}
    </div>
  )
}

function SaduMenuSpecimen({ items, children, className }: SaduMenuSpecimenProps): ReactElement {
  return (
    <PopupSurface className={["sadu-menu__content sadu-menu__specimen", className].filter(Boolean).join(" ")} data-side="bottom">
      {items?.map((item, index) => (
        <SpecimenRow key={`${item.label}-${index}`} item={item} />
      ))}
      {children}
    </PopupSurface>
  )
}

const SaduMenu = Menu
const SaduMenuSub = MenuSub

export {
  SaduMenu,
  SaduMenuCheckboxItem,
  SaduMenuContent,
  SaduMenuGroup,
  SaduMenuGroupLabel,
  SaduMenuItem,
  SaduMenuRadioGroup,
  SaduMenuRadioItem,
  SaduMenuSeparator,
  SaduMenuSpecimen,
  SaduMenuSub,
  SaduMenuSubContent,
  SaduMenuSubTrigger,
  SaduMenuTrigger,
  SkeinDot,
}
export type {
  SaduMenuCheckboxItemProps,
  SaduMenuContentProps,
  SaduMenuItemProps,
  SaduMenuRadioItemProps,
  SaduMenuSpecimenItem,
  SaduMenuSpecimenProps,
  SaduMenuSubTriggerProps,
  SaduMenuTriggerProps,
}
