import { NextRequest, NextResponse } from "next/server"
import { internshipsData } from "@/lib/internship-data"
import { rankInternships, buildProfileFromSkills } from "@/lib/skill-matcher"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get("search")?.toLowerCase() || ""
    const sector = searchParams.get("sector") || ""
    const type = searchParams.get("type") || ""
    const scheme = searchParams.get("scheme") || ""
    const userSkills = searchParams.get("skills")?.split(",").filter(Boolean) || []
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "30")

    // Filter internships
    let results = internshipsData.filter((internship) => {
      if (search) {
        const searchable = [
          internship.title,
          internship.company,
          internship.location,
          internship.sector,
          internship.description,
          ...internship.requirements,
        ]
          .join(" ")
          .toLowerCase()
        if (!searchable.includes(search)) return false
      }

      if (sector && sector !== "All" && internship.sector !== sector) return false
      if (type && type !== "All" && internship.type !== type) return false
      if (scheme === "pm" && !internship.scheme) return false
      if (scheme === "private" && internship.scheme) return false

      return true
    })

    // Apply skill-based ranking if user has skills
    if (userSkills.length > 0) {
      const userProfile = buildProfileFromSkills(userSkills)
      const scores = rankInternships(userProfile, results)
      const scoreMap = new Map(scores.map((s) => [s.internshipId, s]))

      results = results
        .map((internship) => ({
          ...internship,
          matchScore: scoreMap.get(internship.id)?.score || 50,
        }))
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    }

    // Paginate
    const total = results.length
    const start = (page - 1) * limit
    const paginated = results.slice(start, start + limit)

    return NextResponse.json({
      success: true,
      data: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("[/api/internships] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch internships" },
      { status: 500 }
    )
  }
}
