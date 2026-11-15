import { createRoot } from "react-dom/client"
import "../src/sadu/sadu.css"
import { Poster } from "./poster"

const root = document.getElementById("root")
if (!root) throw new Error("Missing #root")

createRoot(root).render(<Poster />)
