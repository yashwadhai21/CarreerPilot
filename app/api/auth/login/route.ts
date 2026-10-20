import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { loginSchema } from "@/lib/validators"
import { signToken, COOKIE } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0]?.message || "Validation failed",
        },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    await connectDB()

    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash")

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      )
    }

    user.lastLoginAt = new Date()
    await user.save()

    const token = await signToken(user._id.toString())

    const response = NextResponse.json({
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
      },
    })

    response.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    })

    return response
  } catch (error: any) {
    console.error("[/api/auth/login] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log in" },
      { status: 500 }
    )
  }
}
