import {
  FileInput,
  FileInputDropzone,
  FileInputItem,
  FileInputItemRemove,
  FileInputList,
  FileInputTrigger,
  formatFileSize,
} from "@ui-sdk/react/file-input"
import { RotateCcw, X } from "lucide-react"
import { useState, type ComponentProps, type CSSProperties, type ReactElement, type ReactNode } from "react"
import { arabicCount, useLocalized } from "./locale"
import { IconButton, Thread } from "./parts"
import { SaduButton } from "./sadu-button"
import "./sadu.css"
import "./styles/sadu-file-input.css"

const WARP_THREADS = 7

const COPY = {
  en: {
    prompt: "Drop files here or",
    browse: "browse",
    drop: (count: number) => `Let go to add ${count} ${count === 1 ? "file" : "files"}`,
    reject: "These files can’t go on this loom",
    list: "Files",
    retry: "Retry",
    remove: (name: string) => `Remove ${name}`,
  },
  ar: {
    prompt: "أفلت الملفات هنا أو",
    browse: "تصفّح",
    drop: (count: number) =>
      `أفلت لإضافة ${arabicCount(count, { one: "ملف واحد", two: "ملفين", few: "ملفات", many: "ملفًا", other: "ملف" })}`,
    reject: "لا يقبل هذا النول هذه الملفات",
    list: "الملفات",
    retry: "إعادة المحاولة",
    remove: (name: string) => `إزالة ${name}`,
  },
}

type FileBandProps = { fresh: boolean; progress: number | undefined; failed: boolean }

function FileBand({ fresh, progress, failed }: FileBandProps): ReactElement {
  const [arrivedWoven] = useState(() => fresh && progress === undefined && !failed)
  return (
    <span
      className="sadu-file__band"
      data-state={failed ? "failed" : progress === undefined ? "done" : "weaving"}
      data-fresh={arrivedWoven || undefined}
      style={{ "--sadu-file-progress": progress ?? 1 } as CSSProperties}
      aria-hidden="true"
    >
      <span className="sadu-file__cloth">
        {(arrivedWoven || (progress !== undefined && !failed)) && <span className="sadu-file__edge sadu-wood" />}
      </span>
    </span>
  )
}

type SaduFileInputProps = Omit<ComponentProps<typeof FileInput>, "className" | "children"> & {
  prompt?: ReactNode
  browseLabel?: ReactNode
  hint?: ReactNode
  dropLabel?: (count: number) => ReactNode
  rejectHint?: ReactNode
  listLabel?: string
  progressOf?: (file: File) => number | undefined
  errorOf?: (file: File) => string | undefined
  onRetry?: (file: File) => void
  retryLabel?: string
  removeLabel?: (fileName: string) => string
  className?: string
}

function SaduFileInput({
  prompt,
  browseLabel,
  hint,
  dropLabel,
  rejectHint,
  listLabel,
  progressOf,
  errorOf,
  onRetry,
  retryLabel,
  removeLabel,
  className,
  ...props
}: SaduFileInputProps): ReactElement {
  const copy = useLocalized(COPY)
  const [settled] = useState(() => new Set(props.value ?? props.defaultValue ?? []))
  const [dragged, setDragged] = useState(0)
  return (
    <FileInput {...props} className={["sadu-file", className].filter(Boolean).join(" ")}>
      <FileInputDropzone className="sadu-file__loom" onDragEnter={(event) => setDragged(event.dataTransfer.items.length)}>
        {(zone) => (
          <>
            <span className="sadu-file__beam sadu-wood" aria-hidden="true" />
            <span className="sadu-file__warp" aria-hidden="true">
              {Array.from({ length: WARP_THREADS }, (_, index) => (
                <Thread key={index} dashed={zone.disabled} className="sadu-file__thread" />
              ))}
            </span>
            <span className="sadu-file__beam sadu-wood" aria-hidden="true" />
            <span className="sadu-file__prompt">
              <span className="sadu-file__title">
                {zone.dragReject ? (
                  (rejectHint ?? copy.reject)
                ) : zone.dragAccept ? (
                  (dropLabel ?? copy.drop)(dragged)
                ) : (
                  <>
                    {prompt ?? copy.prompt} <FileInputTrigger className="sadu-file__browse">{browseLabel ?? copy.browse}</FileInputTrigger>
                  </>
                )}
              </span>
              {hint && <span className="sadu-file__hint">{hint}</span>}
            </span>
          </>
        )}
      </FileInputDropzone>
      <FileInputList aria-label={listLabel ?? copy.list} className="sadu-file__list">
        <FileInputItem className="sadu-file__row">
          {({ file }) => {
            const error = errorOf?.(file)
            const progress = error ? undefined : progressOf?.(file)
            return (
              <>
                <span className="sadu-file__name">{file.name}</span>
                <span className="sadu-file__size">
                  {error ?? (progress === undefined ? formatFileSize(file.size) : `${Math.round(progress * 100)}%`)}
                </span>
                {error && onRetry && (
                  <SaduButton variant="ghost" size="sm" className="sadu-file__retry" onClick={() => onRetry(file)}>
                    <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
                    {retryLabel ?? copy.retry}
                  </SaduButton>
                )}
                <FileInputItemRemove
                  className="sadu-file__remove"
                  aria-label={(removeLabel ?? copy.remove)(file.name)}
                  render={<IconButton size={28} />}
                >
                  <X size={16} strokeWidth={2} aria-hidden="true" />
                </FileInputItemRemove>
                <FileBand fresh={!settled.has(file)} progress={progress} failed={Boolean(error)} />
              </>
            )
          }}
        </FileInputItem>
      </FileInputList>
    </FileInput>
  )
}

export { SaduFileInput }
