import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { registerSchema } from "@/lib/validators"
import { signToken, COOKIE } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0]?.message || "Validation failed",
        },
        { status: 400 }
      )
    }

    const { name, email, password } = validation.data

    await connectDB()

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      lastLoginAt: new Date(),
    })

    const token = await signToken(user._id.toString())

    const response = NextResponse.json(
      {
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
      },
      { status: 201 }
    )

    response.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    })

    return response
  } catch (error: any) {
    console.error("[/api/auth/register] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register" },
      { status: 500 }
    )
  }
}
