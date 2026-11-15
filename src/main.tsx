import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./sadu/sadu.css"
import "./page.css"
import { App } from "./app"

const root = document.getElementById("root")
if (!root) throw new Error("Missing #root")

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
