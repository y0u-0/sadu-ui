import { toast } from "@ui-sdk/react/toast"
import { Download } from "lucide-react"
import { useState, type ReactElement } from "react"
import { SaduButton } from "../sadu/sadu-button"
import {
  SaduPopover,
  SaduPopoverClose,
  SaduPopoverContent,
  SaduPopoverDescription,
  SaduPopoverTitle,
  SaduPopoverTrigger,
} from "../sadu/sadu-popover"
import { CopyButton } from "./copy-button"
import { useCopy } from "./locale"
import { downloadLibrary, installPrompt } from "./registry"

function InstallPrompt(): ReactElement {
  const prompt = installPrompt()
  const copy = useCopy()
  const [beats, setBeats] = useState(0)
  return (
    <SaduPopover>
      <SaduPopoverTrigger render={<button type="button" className="stitch-link" />}>{copy.installPrompt}</SaduPopoverTrigger>
      <SaduPopoverContent className="install-prompt" side="bottom" align="end">
        {beats > 0 && <span key={beats} className="install-prompt__beat sadu-wood" aria-hidden="true" />}
        <SaduPopoverTitle>{copy.installPrompt}</SaduPopoverTitle>
        <SaduPopoverDescription>{copy.installPromptHint}</SaduPopoverDescription>
        <pre className="install-prompt__text" dir="ltr" lang="en">
          {prompt}
        </pre>
        <div className="install-prompt__footer">
          <SaduPopoverClose>{copy.close}</SaduPopoverClose>
          <CopyButton
            text={prompt}
            what="Installation prompt"
            label={copy.copy}
            copiedLabel={copy.copied}
            variant="primary"
            size="sm"
            onCopied={() => setBeats((count) => count + 1)}
          />
        </div>
      </SaduPopoverContent>
    </SaduPopover>
  )
}

async function downloadAll(): Promise<void> {
  try {
    await downloadLibrary()
  } catch (error) {
    toast.error("The library could not be packed", { description: error instanceof Error ? error.message : "Try again in a moment." })
  }
}

function DownloadLibrary({ className }: { className?: string }): ReactElement {
  const copy = useCopy()
  return (
    <SaduButton variant="secondary" size="sm" className={className} onClick={downloadAll} pendingAnnouncement={copy.packing}>
      <Download size={16} strokeWidth={2} aria-hidden="true" />
      {copy.downloadLibrary}
    </SaduButton>
  )
}

export { DownloadLibrary, InstallPrompt }
