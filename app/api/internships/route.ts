import { NextRequest, NextResponse } from "next/server"
import { internshipsData } from "@/lib/internship-data"
import { rankInternships, buildProfileFromSkills } from "@/lib/skill-matcher"
import { connectDB } from "@/lib/db"
import { InternshipModel } from "@/lib/models/Internship"
import type { Internship } from "@/lib/types"

export const dynamic = "force-dynamic"

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

    let sourceList: Internship[] = []

    try {
      await connectDB()
      const dbItems = await InternshipModel.find().lean()
      if (dbItems && dbItems.length > 0) {
        sourceList = dbItems.map((i) => ({
          id: i.id,
          externalId: i.externalId || `static:${i.id}`,
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
      console.warn("Could not load internships from MongoDB, falling back to static:", e)
    }

    if (sourceList.length === 0) {
      sourceList = internshipsData.map((item) => ({
        ...item,
        externalId: item.externalId || `static:${item.id}`,
      }))
    }

    // Filter internships
    let results = sourceList.filter((internship) => {
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
