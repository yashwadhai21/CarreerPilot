"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Star,
  ExternalLink,
  Play,
  Award,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import type { CourseRecommendation, AnalysisResult } from "@/lib/types"

interface CourseRecommendationsProps {
  onBack: () => void
  currentInternship: any
  likedInternships: any[]
  resumeAnalysis?: AnalysisResult | null
}

export function CourseRecommendations({
  onBack,
  currentInternship,
  likedInternships,
  resumeAnalysis,
}: CourseRecommendationsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [courses, setCourses] = useState<CourseRecommendation[]>([])
  const [skillGaps, setSkillGaps] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const categories = [
    "all",
    "Technology",
    "Data Science",
    "Finance",
    "Marketing",
    "Operations",
    "Design",
    "Agriculture",
    "Management",
    "Environment",
  ]

  // Derive skill gaps from resume analysis OR internship missingSkills
  const computeSkillGaps = (): string[] => {
    if (resumeAnalysis?.skillGapAnalysis?.missingSkills?.length) {
      return resumeAnalysis.skillGapAnalysis.missingSkills
    }
    const allMissing = new Set<string>()
    if (currentInternship?.missingSkills) {
      currentInternship.missingSkills.forEach((s: string) => allMissing.add(s))
    }
    likedInternships.forEach((i) => {
      i?.missingSkills?.forEach((s: string) => allMissing.add(s))
    })
    return Array.from(allMissing)
  }

  // Derive sectors from internship context
  const computeSectors = (): string[] => {
    const sectors = new Set<string>()
    if (currentInternship?.sector) sectors.add(currentInternship.sector)
    likedInternships.forEach((i) => {
      if (i?.sector) sectors.add(i.sector)
    })
    if (resumeAnalysis?.governmentSchemeReadiness?.recommendedSectors) {
      resumeAnalysis.governmentSchemeReadiness.recommendedSectors.forEach((s) => sectors.add(s))
    }
    return Array.from(sectors)
  }

  useEffect(() => {
    const gaps = computeSkillGaps()
    setSkillGaps(gaps)

    const fetchCourses = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (gaps.length > 0) params.set("skills", gaps.map((g) => g.toLowerCase()).join(","))
        const sectors = computeSectors()
        if (sectors.length > 0) params.set("sectors", sectors.join(","))
        if (selectedCategory !== "all") params.set("category", selectedCategory)

        const res = await fetch(`/api/courses?${params}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        setCourses(json.data)
      } catch (err: any) {
        setError(err.message || "Failed to load courses")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [selectedCategory, currentInternship, likedInternships, resumeAnalysis])

  return (
    <div className="min-h-screen bg-app-ambient text-foreground pb-12">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-card/85 backdrop-blur-md border-b border-border shadow-xs">
        <div className="container mx-auto px-4 py-3 max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              className="rounded-xl border-border bg-card/60"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/15 text-success flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                  Skill Enhancement Courses
                </h1>
                <p className="text-xs text-muted-foreground leading-none">
                  {resumeAnalysis
                    ? "Curated SWAYAM & NPTEL tracks based on resume analysis"
                    : "Government-certified courses to bridge internship skill gaps"}
                </p>
              </div>
            </div>
          </div>
          {skillGaps.length > 0 && (
            <span className="badge-warning text-xs font-bold">{skillGaps.length} Target Skills</span>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Skill Gap Alert Strip */}
        {skillGaps.length > 0 && (
          <Card className="surface-card rounded-2xl border border-warning/40 bg-warning/10 p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-warning/20 text-warning-foreground flex items-center justify-center shrink-0 mt-0.5">
                <Award className="h-4 w-4" />
              </div>
              <div className="space-y-2 flex-1">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Target Skills to Develop for PM Scheme Roles
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Courses below directly fulfill missing requirements from your target internships:
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skillGaps.map((skill, index) => (
                    <span key={index} className="badge-warning text-xs font-semibold">
                      + {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === category
                  ? "btn-primary shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-border/80"
              }`}
            >
              {category === "all" ? "All Tracks" : category}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="surface-card rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
            <p className="text-sm font-semibold text-foreground">Loading personalized courses...</p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="surface-card rounded-3xl p-8 text-center space-y-3 max-w-md mx-auto shadow-sm">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <p className="text-sm font-medium text-foreground">{error}</p>
          </div>
        )}

        {/* Course Grid */}
        {!isLoading && !error && (
          <>
            {courses.length === 0 ? (
              <div className="surface-card rounded-3xl p-12 text-center text-muted-foreground max-w-md mx-auto space-y-3">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/60" />
                <p className="text-sm font-medium">No courses found in this category.</p>
                <Button
                  variant="outline"
                  className="rounded-xl border-border"
                  onClick={() => setSelectedCategory("all")}
                >
                  Show All Courses
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {courses.map((course) => (
                  <Card
                    key={course.id}
                    className="surface-card surface-card-hover rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between"
                  >
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-bold text-foreground leading-snug line-clamp-2">
                            {course.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                            <span className="font-semibold text-primary">{course.provider}</span>
                            <span>•</span>
                            <span className="badge-primary text-[10px] py-0.2">
                              {course.certificate}
                            </span>
                          </div>
                        </div>

                        {(course.relevanceScore ?? 0) > 0 && (
                          <span className="badge-success text-[10px] font-bold shrink-0 flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" />
                            Recommended
                          </span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-4 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {course.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-y border-border/50 py-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5 text-primary" />
                          <span>{course.level}</span>
                        </div>
                        <div className="flex items-center gap-1 ml-auto font-semibold text-foreground">
                          <Star className="h-3.5 w-3.5 text-warning fill-current" />
                          <span>{course.rating}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Curriculum Skills:</span>
                          <span className="font-bold text-success">{course.price}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {course.skills.map((skill, index) => {
                            const isGapMatch = skillGaps.some(
                              (gap) =>
                                gap.toLowerCase().includes(skill.toLowerCase()) ||
                                skill.toLowerCase().includes(gap.toLowerCase())
                            )
                            return (
                              <span
                                key={index}
                                className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${
                                  isGapMatch
                                    ? "bg-success/15 border-success/30 text-success font-semibold"
                                    : "bg-muted border-border/80 text-foreground"
                                }`}
                              >
                                {isGapMatch && "✓ "}
                                {skill}
                              </span>
                            )
                          })}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1 btn-primary h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                          onClick={() => window.open(course.link, "_blank")}
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Start Learning</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 rounded-xl border-border text-muted-foreground hover:text-foreground cursor-pointer"
                          onClick={() => window.open(course.link, "_blank")}
                          aria-label="Open course in new tab"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer info card */}
        <Card className="surface-card rounded-2xl p-4 text-center border border-border/80 shadow-2xs">
          <p className="text-xs text-muted-foreground">
            Courses verified from <strong>NPTEL</strong>, <strong>SWAYAM</strong>, and{" "}
            <strong>Coursera</strong>. Free government platforms with recognized certificates.
          </p>
        </Card>
      </div>
    </div>
  )
}

