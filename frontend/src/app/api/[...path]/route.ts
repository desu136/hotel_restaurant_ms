import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = "http://localhost:4000";

async function proxyRequest(req: Request, params: { path: string[] }) {
  let joinedPath = params.path.join("/");
  if (joinedPath.startsWith("v1/admin/")) {
    joinedPath = joinedPath.substring("v1/admin/".length);
  }
  const pathname = `/api/${joinedPath}`;
  const { search } = new URL(req.url);
  const targetUrl = `${BACKEND_URL}${pathname}${search}`;

  // Read the HttpOnly token cookie server-side
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // Build forwarded headers
  const contentType = req.headers.get("content-type") || "";
  const headers: Record<string, string> = {};
  if (contentType) {
    headers["Content-Type"] = contentType;
  } else {
    headers["Content-Type"] = "application/json";
  }

  const authHeader = req.headers.get("Authorization");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  // Forward the request body for non-GET methods
  let body: any;
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (contentType.includes("multipart/form-data")) {
      try {
        body = await req.arrayBuffer();
      } catch {
        body = undefined;
      }
    } else {
      try {
        body = await req.text();
      } catch {
        body = undefined;
      }
    }
  }

  const backendRes = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  });

  const data = await backendRes.text();

  // Try to parse as JSON, fall back to raw text
  try {
    const json = JSON.parse(data);
    return NextResponse.json(json, { status: backendRes.status });
  } catch {
    return new NextResponse(data, {
      status: backendRes.status,
      headers: { "Content-Type": backendRes.headers.get("Content-Type") || "text/plain" },
    });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}
export async function POST(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}
export async function PUT(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}
export async function PATCH(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}
export async function DELETE(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}
