import { NextResponse } from "next/server"
import { requireAuth, COOKIE } from "@/lib/auth"
import { BlacklistedToken } from "@/lib/models/BlacklistedToken"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  })

  // Clear cookie immediately
  response.cookies.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  try {
    // If authenticated, blacklist the token so it cannot be reused
    const { userId, jti, exp } = await requireAuth(req)
    await BlacklistedToken.create({
      jti,
      userId,
      expiresAt: new Date(exp * 1000),
    })
  } catch {
    // If token is missing, already invalid or expired, logout is still successful
  }

  return response
}
