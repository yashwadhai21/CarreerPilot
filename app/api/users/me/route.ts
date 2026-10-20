import { NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { profileUpdateSchema } from "@/lib/validators"

export const dynamic = "force-dynamic"

export async function PATCH(req: Request) {
  try {
    const { userId } = await requireAuth(req)
    const body = await req.json()
    const validation = profileUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0]?.message || "Validation failed",
        },
        { status: 400 }
      )
    }

    await connectDB()
    const updateData: Record<string, any> = {}
    if (validation.data.name !== undefined) updateData.name = validation.data.name
    if (validation.data.interests !== undefined) updateData.interests = validation.data.interests
    if (validation.data.experience !== undefined) updateData.experience = validation.data.experience
    if (validation.data.location !== undefined) updateData.location = validation.data.location
    if (validation.data.education !== undefined) updateData.education = validation.data.education

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { returnDocument: "after", runValidators: true }
    ).select("-passwordHash")

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        skills: updatedUser.skills,
        interests: updatedUser.interests,
        experience: updatedUser.experience,
        location: updatedUser.location,
        education: updatedUser.education,
        role: updatedUser.role,
      },
    })
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }
    console.error("[/api/users/me] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update profile" },
      { status: 500 }
    )
  }
}
