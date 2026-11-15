import {
  ImageCropper,
  ImageCropperFlip,
  ImageCropperGrid,
  ImageCropperHandle,
  ImageCropperImage,
  ImageCropperRotate,
  ImageCropperSelection,
  ImageCropperViewport,
  ImageCropperZoom,
  type ImageCrop,
  type ImageCropperState,
} from "@ui-sdk/react/image-cropper"
import { FlipHorizontal2, RotateCw } from "lucide-react"
import { useState, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { MOTIFS, type Grid } from "./motifs"
import { INK, WOOLS, type Colors } from "./palette"
import { useLocalized, type Localized } from "./locale"
import { IconButton } from "./parts"
import { SaduSegment, SaduSegmentedControl } from "./sadu-segmented-control"
import "./sadu.css"
import "./styles/sadu-image-cropper.css"

const PEGS = ["nw", "ne", "se", "sw"] as const
const BARS = ["n", "e", "s", "w"] as const

type CropAspect = { label: string; value: number | undefined }

type SaduImageCropperProps = Omit<ComponentProps<typeof ImageCropper>, "className" | "children"> & {
  alt: string
  aspects?: readonly CropAspect[]
  aspectsLabel?: string
  defaultAspectRatio?: number
  onAspectRatioChange?: (aspectRatio: number | undefined) => void
  zoomLabel?: string
  rotateLabel?: string
  flipLabel?: string
  formatCrop?: (crop: ImageCrop) => ReactNode
  className?: string
}

function sizeOf(crop: ImageCrop): string {
  return `${Math.round(crop.width)} × ${Math.round(crop.height)} px`
}

type HandlePosition = (typeof BARS)[number] | (typeof PEGS)[number]

type CropperCopy = {
  aspects: string
  zoom: string
  rotate: string
  flip: string
  /** Undefined keeps UI SDK's English names for the selection and its handles. */
  selection: string | undefined
  handle: string | undefined
  handles: Record<HandlePosition, string> | undefined
}

const COPY: Localized<CropperCopy> = {
  en: { aspects: "Shape", zoom: "Zoom", rotate: "Rotate a quarter turn", flip: "Flip", selection: undefined, handle: undefined, handles: undefined },
  ar: {
    aspects: "الشكل",
    zoom: "التكبير",
    rotate: "تدوير ربع دورة",
    flip: "قلب الصورة",
    selection: "منطقة القص",
    handle: "مقبض تغيير الحجم",
    handles: {
      n: "الحافة العلوية",
      e: "الحافة اليمنى",
      s: "الحافة السفلية",
      w: "الحافة اليسرى",
      ne: "الزاوية العلوية اليمنى",
      nw: "الزاوية العلوية اليسرى",
      se: "الزاوية السفلية اليمنى",
      sw: "الزاوية السفلية اليسرى",
    },
  },
}

function SaduImageCropper({
  alt,
  aspects = [],
  aspectsLabel,
  aspectRatio,
  defaultAspectRatio,
  onAspectRatioChange,
  zoomLabel,
  rotateLabel,
  flipLabel,
  formatCrop = sizeOf,
  className,
  ...props
}: SaduImageCropperProps): ReactElement {
  const copy = useLocalized(COPY)
  const [ownAspect, setOwnAspect] = useState(defaultAspectRatio ?? aspects[0]?.value)
  const aspect = aspectRatio ?? ownAspect
  const chosen = aspects.find((option) => option.value === aspect)
  const [reshaping, setReshaping] = useState(false)
  const settle = () => setReshaping(false)
  return (
    <ImageCropper
      {...props}
      aspectRatio={aspect}
      className={["sadu-cropper", className].filter(Boolean).join(" ")}
      data-reshaping={reshaping || undefined}
      onKeyDownCapture={settle}
      onPointerDownCapture={settle}
    >
      {(state: ImageCropperState) => (
        <>
          {aspects.length > 0 && (
            <SaduSegmentedControl
              aria-label={aspectsLabel ?? copy.aspects}
              value={chosen?.label ?? null}
              onValueChange={(label) => {
                const next = aspects.find((option) => option.label === label)
                if (!next) return
                setOwnAspect(next.value)
                setReshaping(true)
                onAspectRatioChange?.(next.value)
              }}
              className="sadu-cropper__aspects"
            >
              {aspects.map((option) => (
                <SaduSegment key={option.label} value={option.label}>
                  {option.label}
                </SaduSegment>
              ))}
            </SaduSegmentedControl>
          )}
          <ImageCropperViewport className="sadu-cropper__viewport">
            <ImageCropperImage alt={alt} className="sadu-cropper__image" />
            <ImageCropperSelection
              className="sadu-cropper__selection"
              aria-label={copy.selection}
              aria-roledescription={copy.selection}
              onTransitionEnd={settle}
            >
              <ImageCropperGrid className="sadu-cropper__grid" />
              {BARS.map((position) => (
                <ImageCropperHandle
                  key={position}
                  position={position}
                  aria-label={copy.handles?.[position]}
                  aria-roledescription={copy.handle}
                  className="sadu-cropper__bar sadu-wood"
                />
              ))}
              {PEGS.map((position) => (
                <ImageCropperHandle
                  key={position}
                  position={position}
                  aria-label={copy.handles?.[position]}
                  aria-roledescription={copy.handle}
                  className="sadu-cropper__peg sadu-wood"
                  data-peg=""
                />
              ))}
            </ImageCropperSelection>
          </ImageCropperViewport>
          <div className="sadu-cropper__tools">
            <label className="sadu-cropper__zoom">
              <span className="sadu-label">{zoomLabel ?? copy.zoom}</span>
              <ImageCropperZoom className="sadu-cropper__range" aria-label={zoomLabel ?? copy.zoom} />
            </label>
            <ImageCropperRotate className="sadu-cropper__tool" aria-label={rotateLabel ?? copy.rotate} onClick={() => setReshaping(true)} render={<IconButton size={36} />}>
              <RotateCw size={16} strokeWidth={2} aria-hidden="true" />
            </ImageCropperRotate>
            <ImageCropperFlip className="sadu-cropper__tool" aria-label={flipLabel ?? copy.flip} render={<IconButton size={36} />}>
              <FlipHorizontal2 size={16} strokeWidth={2} aria-hidden="true" />
            </ImageCropperFlip>
            <span className="sadu-cropper__readout">{state.crop && formatCrop(state.crop)}</span>
          </div>
        </>
      )}
    </ImageCropper>
  )
}

type Band = { grid: Grid; colors: Colors }

const CELL = { width: 10, height: 4 }

function stripe(rows: number, color: string): Band {
  return { grid: Array.from({ length: rows }, () => "x"), colors: { ground: color, dye: color, accent: color } }
}

function colorOf(char: string, colors: Colors): string {
  if (char === "x") return colors.dye
  if (char === "k") return colors.accent
  if (char === "w") return INK.wool
  if (char === "b") return INK.black
  return colors.ground
}

function floats(band: Band): string {
  const columns = band.grid[0]?.length ?? 1
  const tile = columns * CELL.width
  return band.grid
    .flatMap((line, row) =>
      Array.from({ length: columns }, (_, column) => {
        const shift = row % 2 === 1 ? CELL.width / 2 : 0
        const x = column * CELL.width + shift
        const y = row * CELL.height
        const float = (left: number) =>
          `<rect x="${left}" y="${y}" width="${CELL.width}" height="${CELL.height}" rx="1.2" fill="${colorOf(line[column] ?? ".", band.colors)}"/><rect x="${left + CELL.width - 1}" y="${y}" width="1" height="${CELL.height}" fill="#000" opacity="0.22"/>`
        return x + CELL.width > tile ? float(x) + float(x - tile) : float(x)
      }).concat(`<rect y="${row * CELL.height}" width="${tile}" height="${CELL.height}" fill="url(#shade)"/>`),
    )
    .join("")
}

function wovenPhoto(width: number, height: number): string {
  const madder = WOOLS.madder.hex
  const dark = { ground: INK.black, dye: madder, accent: INK.wool }
  const light = { ground: INK.wool, dye: INK.black, accent: madder }
  const pattern: Band[] = [
    stripe(3, INK.black),
    stripe(2, madder),
    { grid: MOTIFS.dhurs.grid, colors: light },
    { grid: MOTIFS.eyoun.grid, colors: dark },
    { grid: MOTIFS.dhurs.grid, colors: light },
    stripe(2, madder),
    stripe(2, INK.wool),
    { grid: MOTIFS.shajarah.grid, colors: { ground: INK.black, dye: WOOLS.saffron.hex, accent: INK.wool } },
    stripe(3, WOOLS.indigo.hex),
    { grid: MOTIFS.uwairjan.grid, colors: dark },
    stripe(2, INK.wool),
    { grid: MOTIFS.hubub.grid, colors: { ground: INK.black, dye: WOOLS.camel.light, accent: madder } },
    stripe(4, INK.black),
  ]
  const bands = [...pattern, ...pattern, ...pattern]
  let top = 0
  const defs: string[] = []
  const fills: string[] = []
  bands.forEach((band, index) => {
    const columns = band.grid[0]?.length ?? 1
    const bandHeight = band.grid.length * CELL.height
    defs.push(
      `<pattern id="b${index}" patternUnits="userSpaceOnUse" y="${top}" width="${columns * CELL.width}" height="${bandHeight}"><rect width="100%" height="100%" fill="${band.colors.ground}"/>${floats(band)}</pattern>`,
    )
    fills.push(`<rect y="${top}" width="${width}" height="${bandHeight}" fill="url(#b${index})"/>`)
    top += bandHeight
  })
  const shade = `<linearGradient id="shade" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#fff" stop-opacity="0.1"/><stop offset="0.34" stop-color="#fff" stop-opacity="0"/><stop offset="0.66" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.16"/></linearGradient>`
  const vignette = `<radialGradient id="sun" cx="0.28" cy="0.2" r="0.95"><stop offset="0" stop-color="#fff3d6" stop-opacity="0.22"/><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.38"/></radialGradient>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${shade}${defs.join("")}${vignette}</defs><rect width="100%" height="100%" fill="${INK.black}"/><g transform="rotate(-4 ${width / 2} ${height / 2}) translate(-40 -20) scale(1.12)">${fills.join("")}</g><rect width="100%" height="100%" fill="url(#sun)"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export { SaduImageCropper, wovenPhoto }
export type { CropAspect }
