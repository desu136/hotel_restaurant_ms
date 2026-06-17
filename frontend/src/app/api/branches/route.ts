export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND = "http://localhost:4000"

async function proxyRequest(req: Request, path: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value ?? ""
  const method = req.method
  const hasBody = method !== "GET" && method !== "DELETE"

  const res = await fetch(`${BACKEND}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: hasBody ? await req.text() : undefined,
  })

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

export async function GET(req: Request) {
  return proxyRequest(req, "/api/branches")
}
export async function POST(req: Request) {
  return proxyRequest(req, "/api/branches")
}
