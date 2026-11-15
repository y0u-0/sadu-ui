import { expect, test } from "@playwright/test"

for (const batch of ["overlays", "menus", "inputs", "pickers", "display"]) {
  test(`${batch} gallery renders without console errors`, async ({ page }) => {
    const errors: string[] = []
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()))
    page.on("pageerror", (error) => errors.push(error.message))
    await page.goto(`/?gallery=${batch}`)
    await expect(page.locator(".gallery-card").first()).toBeVisible()
    await page.waitForTimeout(500)
    expect(errors).toEqual([])
  })
}
