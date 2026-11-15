import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, test } from "vitest"
import { cards as docs, type GalleryCard } from "virtual:sadu-docs"
import { Card, GallerySection } from "../../src/gallery/card"
import { useT } from "../../src/gallery/locale"
import { SaduLocaleProvider, arabicCount } from "../../src/sadu/locale"
import { SaduNumberInput } from "../../src/sadu/sadu-number-input"
import { WoolMeter } from "../../src/sadu/wool-meter"

afterEach(() => {
  document.documentElement.lang = ""
})

describe("arabicCount", () => {
  const files = { one: "ملف واحد", two: "ملفان", few: "ملفات", many: "ملفًا", other: "ملف" }

  test.each([
    [1, "ملف واحد"],
    [2, "ملفان"],
    [3, "3 ملفات"],
    [10, "10 ملفات"],
    [11, "11 ملفًا"],
    [99, "99 ملفًا"],
    [100, "100 ملف"],
    [103, "103 ملفات"],
    [120, "120 ملفًا"],
  ])("%i reads as %s", (count, expected) => {
    expect(arabicCount(count, files)).toBe(expected)
  })
})

describe("default labels follow the page language", () => {
  test("English by default, Arabic once the document switches to Arabic", async () => {
    render(<SaduNumberInput defaultValue={4} aria-label="Rows" />)
    expect(screen.getByRole("button", { name: "Increase" })).toBeInTheDocument()
    await act(async () => {
      document.documentElement.lang = "ar"
    })
    expect(await screen.findByRole("button", { name: "زيادة" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "إنقاص" })).toBeInTheDocument()
  })

  test("an Arabic locale with a numbering extension still counts as Arabic", async () => {
    document.documentElement.lang = "ar-u-nu-arab"
    render(<WoolMeter label="Spun wool" value={2} max={20} low={5} high={17} />)
    expect(await screen.findByText(/منخفض/)).toBeInTheDocument()
  })

  test("a provider pins English inside an Arabic page", () => {
    document.documentElement.lang = "ar"
    render(
      <SaduLocaleProvider locale="en">
        <SaduNumberInput defaultValue={4} aria-label="Rows" />
      </SaduLocaleProvider>,
    )
    expect(screen.getByRole("button", { name: "Increase" })).toBeInTheDocument()
  })

  test("label props win over the defaults", () => {
    document.documentElement.lang = "ar"
    render(<SaduNumberInput defaultValue={4} aria-label="Rows" incrementLabel="More rows" />)
    expect(screen.getByRole("button", { name: "More rows" })).toBeInTheDocument()
  })
})

const cards = docs as Readonly<Record<string, GalleryCard & { arabicIdea?: string }>>

function Greeting(): string {
  return useT()("Save band", "حفظ الشريط")
}

describe("gallery copy", () => {
  test("sections, ideas and demo copy switch to Arabic with the page", () => {
    document.documentElement.lang = "ar"
    render(
      <GallerySection title="Menus" lede="Tools." arabicTitle="القوائم" arabicLede="أدوات.">
        <Card name="Button" idea="A press." arabicIdea="ضغطة.">
          <button type="button">
            <Greeting />
          </button>
        </Card>
      </GallerySection>,
    )
    expect(screen.getByRole("heading", { name: "القوائم" })).toBeInTheDocument()
    expect(screen.getByText("ضغطة.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "حفظ الشريط" })).toBeInTheDocument()
  })

  test("every gallery card has an Arabic idea, and usage snippets show plain English copy", () => {
    const entries = Object.entries(cards)
    expect(entries.length).toBeGreaterThan(40)
    for (const [name, card] of entries) {
      expect(card.arabicIdea, name).toMatch(/\p{Script=Arabic}/u)
      expect(card.usage, name).not.toMatch(/\bt\(|useT\b/)
    }
    expect(cards.Input?.usage).toContain("<SaduFieldLabel>Client name</SaduFieldLabel>")
    expect(cards.Input?.usage).toContain('clearLabel="Clear client name"')
  })
})
