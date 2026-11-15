import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test } from "vitest"
import { SaduSwitch } from "../../src/sadu"

test("switch toggles with Space and keeps its name", async () => {
  const user = userEvent.setup()
  render(<SaduSwitch>Dyed wool</SaduSwitch>)
  const control = screen.getByRole("switch", { name: "Dyed wool" })
  expect(control).toHaveAttribute("aria-checked", "false")
  control.focus()
  await user.keyboard(" ")
  expect(control).toHaveAttribute("aria-checked", "true")
})
