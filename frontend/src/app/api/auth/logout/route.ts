import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cookiePath, withBasePath } from "@/lib/base-path";

function clearTokenCookie() {
  return cookies().then((cookieStore) => {
    cookieStore.set("token", "", {
      httpOnly: true,
      path: cookiePath(),
      maxAge: 0,
    });
  });
}

export async function GET(req: Request) {
  try {
    await clearTokenCookie();
    return NextResponse.redirect(new URL(withBasePath("/login"), req.url));
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    await clearTokenCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
