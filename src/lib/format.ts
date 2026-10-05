const LOCALE = "en-US"

const DAY = 24 * 60 * 60 * 1000

const time = new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit" })
const shortDate = new Intl.DateTimeFormat(LOCALE, { month: "short", day: "numeric" })
const fullDate = new Intl.DateTimeFormat(LOCALE, { month: "short", day: "numeric", year: "numeric" })
const longDate = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short" })

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function formatRelative(iso: string) {
  const date = new Date(iso)
  const diff = startOfDay(new Date()) - startOfDay(date)
  if (diff === 0) return time.format(date)
  if (diff === DAY) return "Yesterday"
  if (date.getFullYear() === new Date().getFullYear()) return shortDate.format(date)
  return fullDate.format(date)
}

export function formatLong(iso: string) {
  return longDate.format(new Date(iso))
}

export function plainPreview(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, "")
    .replace(/^\s*(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}
