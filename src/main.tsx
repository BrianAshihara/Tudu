import React from "react"
import ReactDOM from "react-dom/client"

import App from "@/App"
import { TuduProvider } from "@/store/tudu-store"
import "@/index.css"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TuduProvider>
      <App />
    </TuduProvider>
  </React.StrictMode>,
)
