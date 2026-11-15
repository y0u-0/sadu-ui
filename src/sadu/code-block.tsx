import "./styles/code-block.css"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs"
import { toast } from "@ui-sdk/react/toast"
import { Copy } from "lucide-react"
import { useEffect, useState, type ReactElement, type ReactNode } from "react"
import { useLocalized } from "./locale"
import { Cord, Eye, IconButton } from "./parts"
import { WoodScrollArea } from "./wood-scroll-area"

type CodeSnippet = {
  value: string
  label: string
  fileName: string
  code: string
  highlight?: readonly number[]
}

type CodeBlockProps = {
  snippets: readonly CodeSnippet[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  maxHeight?: number
  className?: string
}

type Token = { text: string; kind?: "keyword" | "string" | "comment" }

const COPY = {
  en: {
    languages: "Language",
    copy: (fileName: string) => `Copy ${fileName}`,
    copied: "Copied to the clipboard",
    failed: "Could not copy",
    failedHint: "Select the code and copy it by hand.",
  },
  ar: {
    languages: "لغة البرمجة",
    copy: (fileName: string) => `نسخ ${fileName}`,
    copied: "نُسخت الشيفرة",
    failed: "تعذّر النسخ",
    failedHint: "حدّد الشيفرة وانسخها يدويًا.",
  },
}

const COPIED_FOR = 1200
const KEYWORDS = new Set([
  "as", "async", "await", "const", "default", "else", "export", "from", "function", "if", "import", "let", "new", "return", "type",
])
const TOKEN = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b([a-z]+)\b/g

function tokensOf(line: string): Token[] {
  const tokens: Token[] = []
  let last = 0
  for (const match of line.matchAll(TOKEN)) {
    const [text, comment, string, word] = match
    const kind = comment ? "comment" : string ? "string" : word && KEYWORDS.has(word) ? "keyword" : undefined
    if (!kind) continue
    if (match.index > last) tokens.push({ text: line.slice(last, match.index) })
    tokens.push({ text, kind })
    last = match.index + text.length
  }
  if (last < line.length) tokens.push({ text: line.slice(last) })
  return tokens
}

function CopyButton({ snippet }: { snippet: CodeSnippet }): ReactElement {
  const labels = useLocalized(COPY)
  const [copiedAt, setCopiedAt] = useState<number | null>(null)
  useEffect(() => {
    if (copiedAt === null) return
    const timer = window.setTimeout(() => setCopiedAt(null), COPIED_FOR)
    return () => window.clearTimeout(timer)
  }, [copiedAt])
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(snippet.code)
      setCopiedAt(Date.now())
      toast.success(labels.copied, { description: snippet.fileName })
    } catch {
      toast.error(labels.failed, { description: labels.failedHint })
    }
  }
  return (
    <IconButton
      size={36}
      className="sadu-code__copy"
      aria-label={labels.copy(snippet.fileName)}
      data-copied={copiedAt === null ? undefined : ""}
      onClick={() => void copy()}
    >
      <Copy className="sadu-code__copy-icon" size={16} strokeWidth={2} aria-hidden="true" />
      <Eye size={10} tone="value" className="sadu-code__copied" />
    </IconButton>
  )
}

function Lines({ snippet, maxHeight }: { snippet: CodeSnippet; maxHeight: number }): ReactElement {
  const highlighted = new Set(snippet.highlight)
  return (
    <WoodScrollArea axis="both" label={snippet.fileName} dir="ltr" className="sadu-code__scroll" style={{ ["--sadu-code-max-height" as string]: `${maxHeight}px` }}>
      <pre className="sadu-code__pre">
        <code className="sadu-code__code">
          {snippet.code.split("\n").map((line, index) => (
            <span key={index} className="sadu-code__line" data-highlighted={highlighted.has(index + 1) || undefined}>
              <span className="sadu-code__number" aria-hidden="true">
                <span className={highlighted.has(index + 1) ? "sadu-code__digits sadu-float-highlight" : "sadu-code__digits"}>
                  {index + 1}
                </span>
              </span>
              <span className="sadu-code__text">
                {tokensOf(line).map((token, position) => (
                  <span key={position} className="sadu-code__token" data-kind={token.kind}>
                    {token.text}
                  </span>
                ))}
                {"\n"}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </WoodScrollArea>
  )
}

function Frame({ head, children }: { head: ReactNode; children: ReactNode }): ReactElement {
  return (
    <>
      <Cord size={4} className="sadu-code__cord" />
      <div className="sadu-code__head">{head}</div>
      {children}
    </>
  )
}

function CodeBlock({ snippets, value, defaultValue, onValueChange, maxHeight = 320, className }: CodeBlockProps): ReactElement | null {
  const labels = useLocalized(COPY)
  const classes = ["sadu-code", className].filter(Boolean).join(" ")
  const [first] = snippets
  if (!first) return null
  if (snippets.length === 1) {
    return (
      <figure className={classes}>
        <Frame
          head={
            <>
              <figcaption className="sadu-code__file">{first.fileName}</figcaption>
              <CopyButton snippet={first} />
            </>
          }
        >
          <Lines snippet={first} maxHeight={maxHeight} />
        </Frame>
      </figure>
    )
  }
  return (
    <Tabs<string>
      className={classes}
      value={value}
      defaultValue={value === undefined ? (defaultValue ?? first.value) : undefined}
      onValueChange={(next) => next && onValueChange?.(next)}
    >
      {(state) => {
        const current = snippets.find((snippet) => snippet.value === state.value) ?? first
        return (
          <Frame
            head={
              <>
                <TabsList className="sadu-code__tabs" aria-label={labels.languages}>
                  {snippets.map((snippet) => (
                    <TabsTab key={snippet.value} value={snippet.value} className="sadu-code__tab">
                      {snippet.label}
                    </TabsTab>
                  ))}
                </TabsList>
                <span className="sadu-code__file">{current.fileName}</span>
                <CopyButton key={current.value} snippet={current} />
              </>
            }
          >
            {snippets.map((snippet) => (
              <TabsPanel key={snippet.value} value={snippet.value} className="sadu-code__panel">
                <Lines snippet={snippet} maxHeight={maxHeight} />
              </TabsPanel>
            ))}
          </Frame>
        )
      }}
    </Tabs>
  )
}

export { CodeBlock }
export type { CodeBlockProps, CodeSnippet }
