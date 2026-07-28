import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/backend-url";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backendUrl = getBackendUrl();

    // Proxy the request to the backend
    const res = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || "Invalid response from backend server" };
    }

    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Login failed" }, { status: res.status });
    }

    // Securely set the HTTP-only cookie on the frontend domain
    if (data.token) {
      const cookieStore = await cookies();
      cookieStore.set("token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });
    }

    return NextResponse.json({ success: true, redirectUrl: data.redirectUrl });
  } catch (error: any) {
    console.error("Frontend Login Proxy Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to communicate with authentication server" },
      { status: 500 }
    );
  }
}
