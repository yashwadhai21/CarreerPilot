import { NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { LikedInternship } from "@/lib/models/LikedInternship"

export const dynamic = "force-dynamic"

export async function DELETE(
  req: Request,
  { params }: { params: { externalId: string } }
) {
  try {
    const { userId } = await requireAuth(req)
    const { externalId } = params

    if (!externalId) {
      return NextResponse.json(
        { success: false, error: "externalId parameter is required" },
        { status: 400 }
      )
    }

    await connectDB()
    await LikedInternship.findOneAndDelete({
      userId,
      externalId,
    })

    return NextResponse.json({
      success: true,
      message: "Internship unliked successfully",
    })
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }
    console.error("[DELETE /api/liked/[externalId]] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to unlike internship" },
      { status: 500 }
    )
  }
}
