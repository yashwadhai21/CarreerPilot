import { NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { userId } = await requireAuth(req)

    await connectDB()
    const user = await User.findById(userId).select("-passwordHash")

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        skills: user.skills,
        interests: user.interests,
        experience: user.experience,
        location: user.location,
        education: user.education,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
      },
    })
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }
    console.error("[/api/auth/me] Error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
