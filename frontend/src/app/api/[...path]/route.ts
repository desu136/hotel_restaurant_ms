import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/backend-url";

async function proxyRequest(req: Request, params: { path: string[] }) {
  let joinedPath = params.path.join("/");
  if (joinedPath.startsWith("v1/admin/")) {
    joinedPath = joinedPath.substring("v1/admin/".length);
  }
  const pathname = `/api/${joinedPath}`;
  const { search } = new URL(req.url);
  const targetUrl = `${getBackendUrl()}${pathname}${search}`;

  const isPublic = pathname.includes("/public/");
  const isPublicMenuGet = req.method === "GET" && pathname.includes("/restaurant/public/");

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type") || "";
  const isMultipart = contentType.toLowerCase().includes("multipart/form-data");
  if (isMultipart) {
    headers["Content-Type"] = contentType;
  } else if (contentType) {
    headers["Content-Type"] = contentType;
  } else if (req.method !== "GET" && req.method !== "HEAD") {
    headers["Content-Type"] = "application/json";
  }

  const authHeader = req.headers.get("Authorization");
  if (!isPublic) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else if (authHeader) {
      headers["Authorization"] = authHeader;
    }
  } else if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  let body: BodyInit | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = Buffer.from(await req.arrayBuffer());
    } catch {
      body = undefined;
    }
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
      ...(body ? { duplex: "half" as const } : {}),
    });

    const data = await backendRes.arrayBuffer();
    const responseHeaders = new Headers();
    responseHeaders.set(
      "Content-Type",
      backendRes.headers.get("Content-Type") || "application/json"
    );
    responseHeaders.set(
      "Cache-Control",
      isPublicMenuGet
        ? "public, max-age=15, s-maxage=15, stale-while-revalidate=60"
        : "private, no-store"
    );

    return new NextResponse(data, {
      status: backendRes.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy fetch error to backend:", error);
    return NextResponse.json({ error: "Backend is unreachable" }, { status: 502 });
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
