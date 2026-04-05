"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Clock, Star, ExternalLink, Play, Award, Loader2, AlertCircle } from "lucide-react"
import type { CourseRecommendation, AnalysisResult } from "@/lib/types"

interface CourseRecommendationsProps {
  onBack: () => void
  currentInternship: any
  likedInternships: any[]
  resumeAnalysis?: AnalysisResult | null
}

export function CourseRecommendations({ onBack, currentInternship, likedInternships, resumeAnalysis }: CourseRecommendationsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [courses, setCourses] = useState<CourseRecommendation[]>([])
  const [skillGaps, setSkillGaps] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const categories = ["all", "Technology", "Data Science", "Finance", "Marketing", "Operations", "Design", "Agriculture", "Management", "Environment"]

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
    likedInternships.forEach((i) => { if (i?.sector) sectors.add(i.sector) })
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={onBack} className="flex items-center gap-2 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Skill Enhancement Courses</h1>
            <p className="text-slate-600">
              {resumeAnalysis ? "Personalized based on your resume analysis" : "Government-certified courses to bridge your skill gaps"}
            </p>
          </div>
        </div>

        {/* Skill Gap Badge Strip */}
        {skillGaps.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Award className="h-5 w-5" />
                Skills to Develop
              </CardTitle>
              <CardDescription>
                {resumeAnalysis ? "Detected from your resume analysis" : "Based on your internship preferences"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skillGaps.map((skill, index) => (
                  <Badge key={index} variant="outline" className="border-orange-300 text-orange-700">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "bg-blue-600 hover:bg-blue-700 whitespace-nowrap" : "whitespace-nowrap"}
            >
              {category === "all" ? "All Courses" : category}
            </Button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 space-x-3">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            <p className="text-slate-600">Loading personalized courses...</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex items-center justify-center py-12 space-x-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <p className="text-slate-600">{error}</p>
          </div>
        )}

        {/* Course Grid */}
        {!isLoading && !error && (
          <>
            {courses.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No courses found for this category.</p>
                <Button variant="outline" className="mt-4" onClick={() => setSelectedCategory("all")}>
                  Show All Courses
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow border-slate-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-slate-800">{course.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <span>{course.provider}</span>
                            <Badge variant="secondary" className="text-xs">{course.certificate}</Badge>
                          </CardDescription>
                        </div>
                        {(course.relevanceScore ?? 0) > 0 && (
                          <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                            <Star className="h-3 w-3 text-green-600 fill-current" />
                            <span className="text-xs text-green-700 font-medium">Recommended</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-600">{course.description}</p>

                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {course.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {course.level}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-current text-yellow-400" />
                          {course.rating}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Skills you'll learn:</span>
                          <span className="font-semibold text-green-600">{course.price}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {course.skills.map((skill, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className={`text-xs ${
                                skillGaps.some(
                                  (gap) =>
                                    gap.toLowerCase().includes(skill.toLowerCase()) ||
                                    skill.toLowerCase().includes(gap.toLowerCase()),
                                )
                                  ? "border-green-300 text-green-700 bg-green-50"
                                  : "border-slate-300 text-slate-600"
                              }`}
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => window.open(course.link, "_blank")}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Learning
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(course.link, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-center bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600">
            Courses sourced from <strong>NPTEL</strong>, <strong>SWAYAM</strong>, and <strong>Coursera</strong>
          </p>
          <p className="text-xs text-slate-500 mt-1">Free government platforms • Industry-recognized certifications • Real course links</p>
        </div>
      </div>
    </div>
  )
}
