import { chromium } from "@playwright/test"

const ORIGIN = process.env.SADU_ORIGIN ?? "http://localhost:5191"
const SIZES = { landscape: { width: 1600, height: 900 }, portrait: { width: 1080, height: 1350 } }
const formats = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SIZES)

const browser = await chromium.launch({ channel: "chrome" })
try {
  for (const format of formats) {
    const page = await browser.newPage({ viewport: SIZES[format], deviceScaleFactor: 2, reducedMotion: "reduce" })
    page.on("console", (message) => message.type() === "error" && console.error(`[${format}]`, message.text()))
    page.on("pageerror", (error) => console.error(`[${format}]`, error.message))
    await page.goto(`${ORIGIN}/social/?format=${format}`, { waitUntil: "networkidle" })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(800)
    const out = `docs/images/social-${format}.png`
    await page.screenshot({ path: out })
    console.log(out)
    await page.close()
  }
} finally {
  await browser.close()
}
