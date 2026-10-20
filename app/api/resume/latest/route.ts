import { NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { ResumeAnalysis } from "@/lib/models/ResumeAnalysis"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { userId } = await requireAuth(req)

    await connectDB()
    const latestAnalysis = await ResumeAnalysis.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: latestAnalysis ? latestAnalysis.analysis : null,
    })
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }
    console.error("[GET /api/resume/latest] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch resume analysis" },
      { status: 500 }
    )
  }
}
