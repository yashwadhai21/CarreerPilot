import { NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { LikedInternship } from "@/lib/models/LikedInternship"
import { likeInternshipSchema } from "@/lib/validators"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { userId } = await requireAuth(req)

    await connectDB()
    const likes = await LikedInternship.find({ userId })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: likes.map((like) => ({
        id: like._id.toString(),
        externalId: like.externalId,
        source: like.source,
        snapshot: like.snapshot,
        createdAt: like.createdAt,
      })),
    })
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }
    console.error("[GET /api/liked] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch liked internships" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth(req)
    const body = await req.json()
    const validation = likeInternshipSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0]?.message || "Validation failed",
        },
        { status: 400 }
      )
    }

    const { externalId, source, snapshot } = validation.data

    await connectDB()
    const updatedLike = await LikedInternship.findOneAndUpdate(
      { userId, externalId },
      {
        userId,
        externalId,
        source: source || "static",
        snapshot,
        createdAt: new Date(),
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updatedLike._id.toString(),
          externalId: updatedLike.externalId,
          source: updatedLike.source,
          snapshot: updatedLike.snapshot,
          createdAt: updatedLike.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }
    console.error("[POST /api/liked] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save liked internship" },
      { status: 500 }
    )
  }
}
