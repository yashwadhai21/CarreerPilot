import { NextRequest, NextResponse } from "next/server"
import { internshipsData } from "@/lib/internship-data"
import { rankInternships, buildProfileFromSkills } from "@/lib/skill-matcher"
import { requireAuth, AuthError } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { InternshipModel } from "@/lib/models/Internship"
import type { UserProfile, Internship } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    await connectDB()

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const userSkills =
      user.skills && user.skills.length > 0
        ? user.skills
        : body.userSkills || []

    const likedInternships = body.likedInternships || []

    if (!userSkills.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please upload your resume first so we can analyze your skills and provide tailored recommendations.",
        },
        { status: 400 }
      )
    }

    const profile: UserProfile = {
      skills: userSkills,
      interests: user.interests || [],
      experience: user.experience || "Fresher",
      location: user.location || "",
      education: user.education || "",
    }

    // Load internships from MongoDB or fallback to static dataset
    let internships: Internship[] = []
    try {
      const dbInternships = await InternshipModel.find().lean()
      if (dbInternships && dbInternships.length > 0) {
        internships = dbInternships.map((i) => ({
          id: i.id,
          title: i.title,
          company: i.company,
          location: i.location,
          duration: i.duration,
          description: i.description,
          requirements: i.requirements,
          salary: i.salary,
          type: i.type,
          logo: i.logo,
          scheme: i.scheme,
          sector: i.sector,
          skills: i.skills,
          missingSkills: i.missingSkills || [],
          applyLink: i.applyLink,
          postedDate: i.postedDate,
          openings: i.openings,
          source: (i.source as any) || "static",
        }))
      }
    } catch (e) {
      console.warn("Could not query InternshipModel, using fallback static data:", e)
    }

    if (internships.length === 0) {
      internships = internshipsData
    }

    // Rank internships
    const scores = rankInternships(profile, internships, likedInternships)

    // Attach matched internship details
    const recommendations = scores.slice(0, 10).map((score) => {
      const internship = internships.find((i) => i.id === score.internshipId)!
      return {
        ...score,
        internship: { ...internship, matchScore: score.score },
      }
    })

    // Stats
    const perfect = scores.filter((s) => s.score >= 85).length
    const good = scores.filter((s) => s.score >= 70 && s.score < 85).length

    return NextResponse.json({
      success: true,
      recommendations,
      stats: {
        totalAnalyzed: internships.length,
        perfectMatches: perfect,
        goodMatches: good,
        userProfile: profile,
      },
    })
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }
    console.error("[/api/recommendations] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to generate recommendations" },
      { status: 500 }
    )
  }
}
