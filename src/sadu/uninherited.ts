/*
 * UI SDK registers a few custom properties as non-inherited the first time a popup is positioned or a scroll area
 * binds. Registering a property restyles the whole document, so the first popup a person opens paid for a full
 * style recalculation. Registering the same definitions while the modules load, before anything is rendered, costs
 * nothing, and the SDK's own registration later is a caught no-op.
 */
function registerUninherited(names: readonly string[]): void {
  if (typeof CSS === "undefined" || typeof CSS.registerProperty !== "function") return
  for (const name of names) {
    try {
      CSS.registerProperty({ name, syntax: "*", inherits: false })
    } catch {
      // Already registered, by an earlier module or by UI SDK.
    }
  }
}

export { registerUninherited }
