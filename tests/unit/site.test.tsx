import { expect, test } from "vitest"
import { initialValues, knob, remountKey } from "../../src/site/knobs"
import { crc32, zipBytes } from "../../src/site/zip"

test("crc32 matches the standard check value", () => {
  expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926)
  expect(crc32(new Uint8Array())).toBe(0)
})

test("the zip writer stores every file with a valid directory", () => {
  const files = [
    { path: "sadu/components/sadu/a.tsx", content: "export {}\n" },
    { path: "sadu/components/sadu/styles/ب.css", content: ".a { color: red }" },
  ]
  const bytes = zipBytes(files, new Date(2026, 10, 14, 12, 30, 10))
  const view = new DataView(bytes.buffer)
  const end = bytes.length - 22
  expect(view.getUint32(end, true)).toBe(0x06054b50)
  expect(view.getUint16(end + 10, true)).toBe(2)
  let offset = view.getUint32(end + 16, true)
  const decoder = new TextDecoder()
  for (const file of files) {
    expect(view.getUint32(offset, true)).toBe(0x02014b50)
    expect(view.getUint16(offset + 8, true) & 0x0800).toBe(0x0800)
    const nameLength = view.getUint16(offset + 28, true)
    expect(decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength))).toBe(file.path)
    const local = view.getUint32(offset + 42, true)
    expect(view.getUint32(local, true)).toBe(0x04034b50)
    const size = view.getUint32(local + 18, true)
    const start = local + 30 + view.getUint16(local + 26, true)
    const data = bytes.subarray(start, start + size)
    expect(decoder.decode(data)).toBe(file.content)
    expect(view.getUint32(local + 14, true)).toBe(crc32(data))
    offset += 46 + nameLength
  }
})

test("knob defaults follow the catalogue dye and remount keys only track remounting knobs", () => {
  const knobs = {
    dye: knob.dye(),
    size: knob.choice("Size", ["sm", "lg"], "sm", { remount: true }),
    disabled: knob.toggle("Disabled"),
  }
  const values = initialValues(knobs, "indigo")
  expect(values).toEqual({ dye: "indigo", size: "sm", disabled: false })
  expect(remountKey(knobs, values)).toBe("size:sm")
  expect(remountKey(knobs, { ...values, disabled: true, dye: "camel" })).toBe("size:sm")
  expect(remountKey(knobs, { ...values, size: "lg" })).toBe("size:lg")
})
