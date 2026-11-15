import { toast } from "@ui-sdk/react/toast"
import { Copy } from "lucide-react"
import { useEffect, useState, type ReactElement } from "react"
import { Eye, IconButton } from "../sadu/parts"
import { SaduButton, type SaduButtonSize, type SaduButtonVariant } from "../sadu/sadu-button"

const COPIED_FOR = 1600

async function copyText(text: string, what: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    toast.success("Copied to the clipboard", { description: what })
    return true
  } catch {
    toast.error("Could not copy", { description: "Select the text and copy it by hand." })
    return false
  }
}

type CopyButtonProps = {
  text: string
  what: string
  label?: string
  copiedLabel?: string
  onCopied?: () => void
  variant?: SaduButtonVariant
  size?: SaduButtonSize
  className?: string
}

function CopyButton({ text, what, label, copiedLabel = "Copied", onCopied, variant = "ghost", size = "sm", className }: CopyButtonProps): ReactElement {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), COPIED_FOR)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = async (): Promise<void> => {
    const done = await copyText(text, what)
    setCopied(done)
    if (done) onCopied?.()
  }
  const mark = copied ? <Eye size={10} state="on" /> : <Copy size={16} strokeWidth={2} aria-hidden="true" />

  if (!label) {
    return (
      <IconButton
        variant="ghost"
        className={["copy-button", className].filter(Boolean).join(" ")}
        aria-label={`Copy ${what}`}
        data-copied={copied || undefined}
        onClick={() => void copy()}
      >
        {mark}
      </IconButton>
    )
  }
  return (
    <SaduButton
      variant={variant}
      size={size}
      className={["copy-button", className].filter(Boolean).join(" ")}
      data-copied={copied || undefined}
      onClick={() => void copy()}
    >
      {copied ? copiedLabel : label}
    </SaduButton>
  )
}

export { CopyButton, copyText }
