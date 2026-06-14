export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { signToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if the user is active, or if the tenant is active (skip tenant check for super admins)
    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "User account is suspended" }, { status: 403 })
    }

    if (!user.roles.includes("SUPER_ADMIN") && user.tenant?.status !== "ACTIVE") {
      return NextResponse.json({ error: "Tenant account is not active" }, { status: 403 })
    }

    // Generate JWT
    const token = await signToken({
      userId: user.id,
      tenantId: user.tenant_id,
      branchId: user.branch_id,
      roles: user.roles
    })

    const redirectUrl = user.roles.includes("SUPER_ADMIN") ? "/tenants" : "/dashboard"

    return NextResponse.json({ 
      success: true, 
      token,
      redirectUrl,
      user: {
        id: user.id,
        email: user.email,
        name: user.first_name + " " + user.last_name,
        roles: user.roles
      }
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
