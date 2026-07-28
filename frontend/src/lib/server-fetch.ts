import { cookies } from "next/headers"

const BACKEND_URL = process.env.BACKEND_URL || "https://hospitalityhub-backend.onrender.com"

/**
 * Server-side fetch helper: injects the HTTP-only auth cookie
 * as a Bearer token for backend API calls made from Server Components.
 */
export async function serverFetch(path: string, options: RequestInit = {}) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value ?? ""

  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  })
}
