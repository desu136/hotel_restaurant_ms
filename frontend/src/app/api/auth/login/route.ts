import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://hospitalityhub-backend.onrender.com";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
    // Proxy the request to the backend
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

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
  } catch (error) {
    console.error("Frontend Login Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
