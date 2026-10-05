import { useEffect } from "react"

import { useStoredState } from "@/hooks/use-stored-state"

export const THEMES = ["system", "light", "dark"] as const

export type Theme = (typeof THEMES)[number]

export function useTheme() {
  const [theme, setTheme] = useStoredState<Theme>("tudu.theme", "system", THEMES)

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches)
      document.documentElement.classList.toggle("dark", dark)
    }
    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [theme])

  return [theme, setTheme] as const
}
