import { cookies } from "next/headers"
import { getBackendUrl } from "./backend-url"

/**
 * Server-side fetch helper: injects the HTTP-only auth cookie
 * as a Bearer token for backend API calls made from Server Components.
 */
export async function serverFetch(path: string, options: RequestInit = {}) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value ?? ""

  return fetch(`${getBackendUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  })
}
