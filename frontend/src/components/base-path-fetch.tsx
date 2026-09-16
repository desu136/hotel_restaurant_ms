"use client"

import { useEffect } from "react"

/**
 * Prefix same-origin fetch() calls with NEXT_PUBLIC_BASE_PATH so client
 * requests hit /rms/api/... instead of the betting app on /.
 */
export function BasePathFetch() {
  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "")
    if (!base) return

    const original = window.fetch.bind(window)
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === "string" && input.startsWith("/") && !input.startsWith("//")) {
        if (input !== base && !input.startsWith(`${base}/`)) {
          input = `${base}${input}`
        }
      } else if (input instanceof URL && input.origin === window.location.origin) {
        if (input.pathname !== base && !input.pathname.startsWith(`${base}/`)) {
          input = new URL(`${base}${input.pathname}${input.search}${input.hash}`, input.origin)
        }
      }
      return original(input, init)
    }

    return () => {
      window.fetch = original
    }
  }, [])

  return null
}
