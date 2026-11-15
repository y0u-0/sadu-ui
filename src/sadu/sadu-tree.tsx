import { Tree, TreeGroup, TreeItem, TreeItemIndicator, TreeItemLabel } from "@ui-sdk/react/tree"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { Eye } from "./parts"
import "./sadu.css"
import "./styles/sadu-tree.css"

type SaduTreeProps = Omit<ComponentProps<typeof Tree>, "className"> & { className?: string }

function SaduTree({ className, ...props }: SaduTreeProps): ReactElement {
  return <Tree {...props} className={["sadu-tree", className].filter(Boolean).join(" ")} />
}

type SaduTreeItemProps = Omit<ComponentProps<typeof TreeItem>, "className" | "children" | "label"> & {
  label: string
  arabic?: string
  meta?: ReactNode
  icon?: ReactNode
  children?: ReactNode
  className?: string
}

function SaduTreeItem({ label, arabic, meta, icon, children, className, ...props }: SaduTreeItemProps): ReactElement {
  const branch = Boolean(children)
  return (
    <TreeItem {...props} label={label} className={["sadu-tree__item", className].filter(Boolean).join(" ")}>
      <TreeItemLabel className="sadu-tree__row">
        {branch ? (
          <TreeItemIndicator className="sadu-tree__eye">
            <Eye size={10} state="closed" tone="structure" className="sadu-tree__eye-closed" />
            <Eye size={10} tone="structure" className="sadu-tree__eye-open" />
          </TreeItemIndicator>
        ) : (
          <span className="sadu-tree__slot" aria-hidden="true" />
        )}
        {icon && <span className="sadu-tree__icon">{icon}</span>}
        <span className="sadu-tree__label">{label}</span>
        {arabic && (
          <span className="sadu-tree__arabic" lang="ar" dir="rtl">
            {arabic}
          </span>
        )}
        {meta && <span className="sadu-tree__meta">{meta}</span>}
      </TreeItemLabel>
      {branch && <TreeGroup className="sadu-tree__group">{children}</TreeGroup>}
    </TreeItem>
  )
}

export { SaduTree, SaduTreeItem }
