import "./styles/beam-resizable.css"
import { Resizable, ResizableHandle, ResizablePanel } from "@ui-sdk/react/resizable"
import { useCallback, useLayoutEffect, useRef, type ComponentProps, type ReactElement, type Ref } from "react"
import { mergeClass } from "./merge-class"

type BeamResizableProps = ComponentProps<typeof Resizable>
type BeamResizablePanelProps = ComponentProps<typeof ResizablePanel>
type BeamResizableHandleProps = Omit<ComponentProps<typeof ResizableHandle>, "children">

/*
 * UI SDK shows a handle's cursor over the whole page by rewriting a `*, *::before, *::after` rule in a stylesheet it
 * adopts on the document: on hover, on press, at each limit and on release. Every rewrite restyles every rendered
 * element on the page, a 60ms task at 4x CPU on the catalogue, so hovering or dragging a handle stutters. The first
 * time that sheet appears, Sadu takes it out of the document; the SDK keeps writing to the detached sheet for free,
 * and beam-resizable.css shows the same cursors on the handle and across its panel group instead.
 */
const PAGE_CURSOR_SELECTORS = ["", "::before", "::after"]
const STATE_ATTRIBUTES = ["data-hovering", "data-dragging"]
const VALUE_ATTRIBUTES = ["aria-valuenow", "aria-valuemin", "aria-valuemax"]

const released = new WeakSet<Document>()

function isPageCursorSheet(sheet: CSSStyleSheet): boolean {
  const [rule] = sheet.cssRules
  if (sheet.cssRules.length !== 1 || !(rule instanceof CSSStyleRule) || rule.style.cursor === "") return false
  const selectors = rule.selectorText.split(",").map((selector) => selector.trim().replace(/^\*/, ""))
  return selectors.length === PAGE_CURSOR_SELECTORS.length && selectors.every((selector, index) => selector === PAGE_CURSOR_SELECTORS[index])
}

function releasePageCursor(doc: Document): void {
  if (released.has(doc)) return
  const adopted = doc.adoptedStyleSheets
  const kept = adopted.filter((sheet) => !isPageCursorSheet(sheet))
  if (kept.length === adopted.length) return
  doc.adoptedStyleSheets = kept
  released.add(doc)
}

function limitOf(handle: Element): "min" | "max" | undefined {
  const [now, min, max] = VALUE_ATTRIBUTES.map((name) => handle.getAttribute(name))
  if (now === null || min === null || max === null || min === max) return undefined
  if (Number(now) <= Number(min)) return "min"
  if (Number(now) >= Number(max)) return "max"
  return undefined
}

function useBeamHandle(forwarded: Ref<HTMLDivElement> | undefined): (node: HTMLDivElement | null) => void {
  const handle = useRef<HTMLDivElement | null>(null)
  const forwardedRef = useRef(forwarded)
  useLayoutEffect(() => {
    forwardedRef.current = forwarded
  })
  useLayoutEffect(() => {
    const node = handle.current
    if (!node) return
    const markLimit = () => {
      const limit = limitOf(node)
      if (limit === node.dataset.limit) return
      if (limit) node.dataset.limit = limit
      else delete node.dataset.limit
    }
    markLimit()
    const observer = new MutationObserver((records) => {
      if (records.some((record) => STATE_ATTRIBUTES.includes(record.attributeName ?? ""))) releasePageCursor(node.ownerDocument)
      markLimit()
    })
    observer.observe(node, { attributeFilter: [...STATE_ATTRIBUTES, ...VALUE_ATTRIBUTES] })
    return () => observer.disconnect()
  }, [])
  return useCallback((node: HTMLDivElement | null) => {
    handle.current = node
    const target = forwardedRef.current
    if (typeof target === "function") target(node)
    else if (target) target.current = node
  }, [])
}

function BeamResizable({ className, ...props }: BeamResizableProps): ReactElement {
  return <Resizable {...props} className={mergeClass("sadu-resizable", className)} />
}

function BeamResizablePanel({ className, ...props }: BeamResizablePanelProps): ReactElement {
  return <ResizablePanel {...props} className={mergeClass("sadu-resizable__panel", className)} />
}

function BeamResizableHandle({ className, ref, ...props }: BeamResizableHandleProps): ReactElement {
  const handleRef = useBeamHandle(ref)
  return (
    <ResizableHandle {...props} ref={handleRef} className={mergeClass("sadu-resizable__handle", className)}>
      <span className="sadu-resizable__thread" aria-hidden="true" />
      <span className="sadu-resizable__grip sadu-wood" aria-hidden="true" />
      <span className="sadu-resizable__beam sadu-wood" aria-hidden="true" />
    </ResizableHandle>
  )
}

export { BeamResizable, BeamResizableHandle, BeamResizablePanel }
export type { BeamResizableHandleProps, BeamResizablePanelProps, BeamResizableProps }
