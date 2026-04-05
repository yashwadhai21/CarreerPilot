import { NextRequest, NextResponse } from "next/server"
import { internshipsData } from "@/lib/internship-data"
import { rankInternships, buildProfileFromSkills } from "@/lib/skill-matcher"
import type { UserProfile } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userSkills = [],
      likedInternships = [],
      userProfile,
    }: {
      userSkills: string[]
      likedInternships: number[]
      userProfile?: Partial<UserProfile>
    } = body

    if (!userSkills.length && !userProfile?.skills?.length) {
      return NextResponse.json(
        { success: false, error: "User skills are required" },
        { status: 400 }
      )
    }

    const profile: UserProfile = userProfile
      ? { ...buildProfileFromSkills(userProfile.skills || userSkills), ...userProfile }
      : buildProfileFromSkills(userSkills)

    // Rank all internships
    const scores = rankInternships(profile, internshipsData, likedInternships)

    // Attach matched internship details
    const recommendations = scores.slice(0, 10).map((score) => {
      const internship = internshipsData.find((i) => i.id === score.internshipId)!
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
        totalAnalyzed: internshipsData.length,
        perfectMatches: perfect,
        goodMatches: good,
        userProfile: profile,
      },
    })
  } catch (error) {
    console.error("[/api/recommendations] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to generate recommendations" },
      { status: 500 }
    )
  }
}
