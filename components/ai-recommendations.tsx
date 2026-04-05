"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Sparkles, TrendingUp, Target, Brain, Star, Heart, MapPin, Clock, DollarSign, AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"
import type { Internship, AnalysisResult, RecommendationScore } from "@/lib/types"

interface AIRecommendationsProps {
  onBack: () => void
  likedInternships: number[]
  currentInternships: Internship[]
  resumeAnalysis?: AnalysisResult | null
}

interface FullRecommendation extends RecommendationScore {
  internship: Internship
}

export function AIRecommendations({ onBack, likedInternships, currentInternships, resumeAnalysis }: AIRecommendationsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [recommendations, setRecommendations] = useState<FullRecommendation[]>([])
  const [stats, setStats] = useState({ totalAnalyzed: 0, perfectMatches: 0, goodMatches: 0 })
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const userSkills = resumeAnalysis?.skills || ["JavaScript", "React", "Python", "SQL", "Git"]

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsAnalyzing(true)
      setError(null)

      // Animate progress
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 20, 80))
      }, 300)

      try {
        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userSkills,
            likedInternships,
            userProfile: resumeAnalysis
              ? {
                  skills: resumeAnalysis.skills,
                  interests: resumeAnalysis.governmentSchemeReadiness.recommendedSectors,
                  experience: "Beginner",
                  location: "Remote/Hybrid preferred",
                }
              : undefined,
          }),
        })

        clearInterval(interval)
        setProgress(100)

        const json = await res.json()
        if (!json.success) throw new Error(json.error)

        setRecommendations(json.recommendations)
        setStats(json.stats)
      } catch (err: any) {
        clearInterval(interval)
        setError(err.message || "Failed to generate recommendations")
      } finally {
        setIsAnalyzing(false)
      }
    }

    fetchRecommendations()
  }, [likedInternships, resumeAnalysis])

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600"
    if (score >= 70) return "text-blue-600"
    return "text-orange-600"
  }

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "outline" => {
    if (score >= 85) return "default"
    if (score >= 70) return "secondary"
    return "outline"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Recommendations
            </h1>
            {resumeAnalysis && (
              <Badge className="ml-auto bg-blue-100 text-blue-700 border-blue-200">
                Resume-powered
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <Brain className="h-16 w-16 text-primary animate-pulse" />
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-6 w-6 text-primary animate-bounce" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mt-6 mb-2">Analyzing Your Profile</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Running TF-IDF skill matching across 30+ internships to find your best opportunities
            </p>
            <div className="w-64">
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <p className="text-slate-700">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Skills Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Your Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Matched Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {userSkills.slice(0, 8).map((skill, index) => (
                        <Badge key={index} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {(resumeAnalysis?.governmentSchemeReadiness.recommendedSectors || ["Software Development", "Data Analysis"]).map(
                        (interest, index) => (
                          <Badge key={index} variant="secondary">{interest}</Badge>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalAnalyzed}</div>
                    <div className="text-sm text-muted-foreground">Internships Analyzed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.perfectMatches}</div>
                    <div className="text-sm text-muted-foreground">Perfect Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.goodMatches}</div>
                    <div className="text-sm text-muted-foreground">Good Matches</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Personalized Recommendations</h2>
              {recommendations.map((rec, index) => {
                const internship = rec.internship
                return (
                  <Card key={rec.internshipId} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Rank badge */}
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                        </div>

                        {/* Logo */}
                        <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-muted flex-shrink-0 border">
                          <Image
                            src={internship.logo || "/placeholder.svg"}
                            alt={`${internship.company} logo`}
                            fill
                            className="object-contain p-1"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display = "none"
                            }}
                            unoptimized
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-balance">{internship.title}</h3>
                              <p className="text-primary font-medium">{internship.company}</p>
                            </div>
                            <Badge variant={getScoreBadgeVariant(rec.score)} className="ml-2 flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              <span className={getScoreColor(rec.score)}>{rec.score}% Match</span>
                            </Badge>
                          </div>

                          {/* Info row */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {internship.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {internship.duration}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {internship.salary}
                            </div>
                          </div>

                          {/* Match reasons */}
                          {rec.reasons.length > 0 && (
                            <div className="mb-3">
                              <h4 className="text-sm font-semibold mb-1">Why this matches you:</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {rec.reasons.map((reason, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-primary rounded-full" />
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Matched skills */}
                          {rec.matchedSkills.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold mb-2">Matching Skills:</h4>
                              <div className="flex flex-wrap gap-1">
                                {rec.matchedSkills.map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => internship.applyLink && window.open(internship.applyLink, "_blank")}
                            >
                              <Heart className="h-3 w-3" />
                              Apply Now
                            </Button>
                            <Button variant="outline" size="sm">View Details</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* CTA */}
            <Card>
              <CardContent className="p-6 text-center">
                <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Want Better Recommendations?</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your resume and like more internships to improve our AI matching algorithm
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={onBack}>Upload Resume</Button>
                  <Button onClick={onBack}>Continue Swiping</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
