import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { saduPlugin } from "./scripts/vite-plugin-sadu.mjs"

export default defineConfig({ plugins: [react(), saduPlugin()] })
