type ZipEntry = { path: string; content: string | Uint8Array }

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let index = 0; index < 256; index++) {
    let value = index
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    table[index] = value >>> 0
  }
  return table
})()

const UTF8_FLAG = 0x0800
const VERSION = 20

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function dosDateTime(date: Date): { time: number; day: number } {
  const year = Math.max(date.getFullYear(), 1980)
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    day: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  }
}

function header(size: number, write: (view: DataView) => void): Uint8Array {
  const bytes = new Uint8Array(size)
  write(new DataView(bytes.buffer))
  return bytes
}

function zipBytes(entries: readonly ZipEntry[], date = new Date()): Uint8Array {
  const encoder = new TextEncoder()
  const { time, day } = dosDateTime(date)
  const chunks: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const name = encoder.encode(entry.path)
    const data = typeof entry.content === "string" ? encoder.encode(entry.content) : entry.content
    const crc = crc32(data)
    const local = header(30, (view) => {
      view.setUint32(0, 0x04034b50, true)
      view.setUint16(4, VERSION, true)
      view.setUint16(6, UTF8_FLAG, true)
      view.setUint16(8, 0, true)
      view.setUint16(10, time, true)
      view.setUint16(12, day, true)
      view.setUint32(14, crc, true)
      view.setUint32(18, data.length, true)
      view.setUint32(22, data.length, true)
      view.setUint16(26, name.length, true)
      view.setUint16(28, 0, true)
    })
    central.push(
      header(46, (view) => {
        view.setUint32(0, 0x02014b50, true)
        view.setUint16(4, VERSION, true)
        view.setUint16(6, VERSION, true)
        view.setUint16(8, UTF8_FLAG, true)
        view.setUint16(10, 0, true)
        view.setUint16(12, time, true)
        view.setUint16(14, day, true)
        view.setUint32(16, crc, true)
        view.setUint32(20, data.length, true)
        view.setUint32(24, data.length, true)
        view.setUint16(28, name.length, true)
        view.setUint32(42, offset, true)
      }),
      name,
    )
    chunks.push(local, name, data)
    offset += local.length + name.length + data.length
  }

  const directorySize = central.reduce((sum, chunk) => sum + chunk.length, 0)
  const end = header(22, (view) => {
    view.setUint32(0, 0x06054b50, true)
    view.setUint16(8, entries.length, true)
    view.setUint16(10, entries.length, true)
    view.setUint32(12, directorySize, true)
    view.setUint32(16, offset, true)
  })

  const parts = [...chunks, ...central, end]
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let position = 0
  for (const part of parts) {
    out.set(part, position)
    position += part.length
  }
  return out
}

function downloadZip(fileName: string, entries: readonly ZipEntry[]): void {
  const bytes = zipBytes(entries)
  const url = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: "application/zip" }))
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export { crc32, downloadZip, zipBytes }
export type { ZipEntry }
