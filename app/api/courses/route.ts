import { NextRequest, NextResponse } from "next/server"
import { coursesData } from "@/lib/course-data"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const skillsParam = searchParams.get("skills") || ""
    const sectorsParam = searchParams.get("sectors") || ""
    const category = searchParams.get("category") || "all"

    const skillGaps = skillsParam
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)

    const sectors = sectorsParam
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)

    let courses = [...coursesData]

    // Filter by category
    if (category !== "all") {
      courses = courses.filter((c) => c.category.toLowerCase() === category.toLowerCase())
    }

    // Compute relevance scores
    const scored = courses.map((course) => {
      let relevanceScore = 0

      // Skill gap match: highest weight
      course.skills.forEach((courseSkill) => {
        const csLower = courseSkill.toLowerCase()
        skillGaps.forEach((gap) => {
          if (csLower.includes(gap) || gap.includes(csLower)) {
            relevanceScore += 3
          }
          // Partial match
          if (levenshteinSim(csLower, gap) > 0.75) {
            relevanceScore += 2
          }
        })
      })

      // Sector / relevantFor match
      sectors.forEach((sector) => {
        if (course.relevantFor.some((r) => r.toLowerCase().includes(sector) || sector.includes(r.toLowerCase()))) {
          relevanceScore += 2
        }
      })

      // Platform bonus (free government platforms ranked higher)
      if (course.platform === "NPTEL" || course.platform === "SWAYAM") {
        relevanceScore += 1
      }

      return { ...course, relevanceScore }
    })

    // Sort: relevant first, then by rating
    const sorted = scored.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore
      return b.rating - a.rating
    })

    return NextResponse.json({
      success: true,
      data: sorted,
      total: sorted.length,
      skillGaps,
    })
  } catch (error) {
    console.error("[/api/courses] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch courses" },
      { status: 500 }
    )
  }
}

function levenshteinSim(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 5) return 0
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return 1 - dp[m][n] / maxLen
}
