export function getBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH || ""
  if (!raw || raw === "/") return ""
  return raw.endsWith("/") ? raw.slice(0, -1) : raw
}

export function withBasePath(path: string): string {
  const base = getBasePath()
  if (!path.startsWith("/")) return path
  if (!base) return path
  if (path === base || path.startsWith(`${base}/`)) return path
  return `${base}${path}`
}

export function cookiePath(): string {
  return getBasePath() || "/"
}
