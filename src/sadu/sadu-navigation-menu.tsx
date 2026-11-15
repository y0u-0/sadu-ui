import "./styles/sadu-navigation-menu.css"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@ui-sdk/react/navigation-menu"
import { ChevronDown } from "lucide-react"
import { useLayoutEffect, useRef, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { mergeClass } from "./merge-class"
import { BandSwatch, Eye, type BandSwatchProps } from "./parts"
import { PopupSurface } from "./popup-surface"
import { watchWidth } from "./weave"

type SaduNavigationMenuProps = Omit<ComponentProps<typeof NavigationMenu>, "children"> & {
  children?: ReactNode
  viewport?: Omit<ComponentProps<typeof NavigationMenuViewport>, "children">
}
type SaduNavigationMenuTriggerProps = Omit<ComponentProps<typeof NavigationMenuTrigger>, "children"> & { children?: ReactNode }
type SaduNavigationMenuLinkProps = Omit<ComponentProps<typeof NavigationMenuLink>, "children" | "title"> & {
  title: ReactNode
  description?: ReactNode
  thumbnail?: ReactNode
}
type SaduNavigationMenuSpecimenProps = {
  sections?: readonly string[]
  open?: string
  children?: ReactNode
  className?: string
}
type SaduNavigationMenuSpecimenLinkProps = {
  title: ReactNode
  description?: ReactNode
  thumbnail?: ReactNode
  current?: boolean
}

function LinkBody({ title, description, thumbnail }: { title: ReactNode; description?: ReactNode; thumbnail?: ReactNode }): ReactElement {
  return (
    <>
      {thumbnail}
      <span className="sadu-nav__link-text">
        <span className="sadu-nav__link-title">
          <Eye size={10} state="on" tone="value" className="sadu-nav__current" />
          {title}
        </span>
        {description && <span className="sadu-nav__link-description">{description}</span>}
      </span>
    </>
  )
}

function SaduNavigationMenu({ className, children, viewport, ...props }: SaduNavigationMenuProps): ReactElement {
  return (
    <NavigationMenu {...props} className={mergeClass("sadu-nav", className)}>
      {children}
      <NavigationMenuViewport
        sideOffset={6}
        {...viewport}
        render={<PopupSurface />}
        className={mergeClass("sadu-nav__viewport", viewport?.className)}
      >
        <Eye size={10} state="on" tone="value" className="sadu-nav__eye" />
      </NavigationMenuViewport>
    </NavigationMenu>
  )
}

function SaduNavigationMenuList({ className, ...props }: ComponentProps<typeof NavigationMenuList>): ReactElement {
  return <NavigationMenuList {...props} className={mergeClass("sadu-nav__list", className)} />
}

function SaduNavigationMenuItem({ className, ...props }: ComponentProps<typeof NavigationMenuItem>): ReactElement {
  return <NavigationMenuItem {...props} className={mergeClass("sadu-nav__item", className)} />
}

function SaduNavigationMenuTrigger({ className, children, ...props }: SaduNavigationMenuTriggerProps): ReactElement {
  const label = typeof children === "string" ? children : undefined
  return (
    <NavigationMenuTrigger {...props} className={mergeClass("sadu-nav__trigger", className)}>
      <span className="sadu-nav__trigger-label" data-label={label}>
        <span>{children}</span>
      </span>
      <ChevronDown className="sadu-nav__chevron" size={16} strokeWidth={2} aria-hidden="true" />
    </NavigationMenuTrigger>
  )
}

function SaduNavigationMenuContent({ className, ...props }: ComponentProps<typeof NavigationMenuContent>): ReactElement {
  return <NavigationMenuContent {...props} className={mergeClass("sadu-nav__content", className)} />
}

function SaduNavigationMenuLink({ title, description, thumbnail, className, ...props }: SaduNavigationMenuLinkProps): ReactElement {
  return (
    <NavigationMenuLink {...props} className={mergeClass("sadu-nav__link", className)}>
      <LinkBody title={title} description={description} thumbnail={thumbnail} />
    </NavigationMenuLink>
  )
}

function SaduNavigationMenuTopLink({ className, ...props }: ComponentProps<typeof NavigationMenuLink>): ReactElement {
  return <NavigationMenuLink {...props} className={mergeClass("sadu-nav__trigger", className)} />
}

function SaduNavigationMenuSpecimenLink({ title, description, thumbnail, current }: SaduNavigationMenuSpecimenLinkProps): ReactElement {
  return (
    <span className="sadu-nav__link" data-current={current || undefined}>
      <LinkBody title={title} description={description} thumbnail={thumbnail} />
    </span>
  )
}

function SaduNavigationMenuSpecimen({ sections, open, children, className }: SaduNavigationMenuSpecimenProps): ReactElement {
  const root = useRef<HTMLDivElement>(null)
  const sectionsKey = sections?.join("\n")
  useLayoutEffect(() => {
    const node = root.current
    const trigger = node?.querySelector<HTMLElement>(".sadu-nav__trigger[data-open]")
    if (!node || !trigger) return
    const place = () => {
      const start = node.matches(":dir(rtl)") ? node.offsetWidth - trigger.offsetLeft - trigger.offsetWidth : trigger.offsetLeft
      node.style.setProperty("--sadu-nav-specimen-start", `${start}px`)
      node.style.setProperty("--sadu-nav-specimen-centre", `${trigger.offsetWidth / 2}px`)
    }
    place()
    return watchWidth(trigger, place)
  }, [open, sectionsKey])
  return (
    <div ref={root} className={["sadu-nav sadu-nav__specimen", className].filter(Boolean).join(" ")}>
      {sections && (
        <div className="sadu-nav__list">
          {sections.map((section) => (
            <span key={section} className="sadu-nav__trigger" data-open={section === open || undefined}>
              <span className="sadu-nav__trigger-label" data-label={section}>
                <span>{section}</span>
              </span>
              <ChevronDown className="sadu-nav__chevron" size={16} strokeWidth={2} aria-hidden="true" />
            </span>
          ))}
        </div>
      )}
      <PopupSurface className="sadu-nav__viewport sadu-nav__specimen-panel" data-side="bottom">
        <Eye size={10} state="on" tone="value" className="sadu-nav__eye" />
        <div className="sadu-nav__content">{children}</div>
      </PopupSurface>
    </div>
  )
}

export {
  BandSwatch,
  SaduNavigationMenu,
  SaduNavigationMenuContent,
  SaduNavigationMenuItem,
  SaduNavigationMenuLink,
  SaduNavigationMenuList,
  SaduNavigationMenuSpecimen,
  SaduNavigationMenuSpecimenLink,
  SaduNavigationMenuTopLink,
  SaduNavigationMenuTrigger,
}
export type {
  BandSwatchProps,
  SaduNavigationMenuLinkProps,
  SaduNavigationMenuProps,
  SaduNavigationMenuSpecimenLinkProps,
  SaduNavigationMenuSpecimenProps,
  SaduNavigationMenuTriggerProps,
}
