type MeResponse = {
  success?: boolean
  user?: {
    id: string
    name: string
    email: string
    roles: string[]
    branch_id?: string | null
    branchName?: string | null
    [key: string]: unknown
  }
}

let inflight: Promise<MeResponse> | null = null
let cache: { at: number; data: MeResponse } | null = null
const TTL_MS = 15_000

export function fetchCurrentUser(force = false): Promise<MeResponse> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) {
    return Promise.resolve(cache.data)
  }
  if (!force && inflight) return inflight

  inflight = fetch("/api/auth/me", { credentials: "include" })
    .then(async (res) => {
      if (!res.ok) throw new Error("Unauthorized")
      const data = (await res.json()) as MeResponse
      cache = { at: Date.now(), data }
      return data
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

export function clearCurrentUserCache() {
  cache = null
  inflight = null
}
