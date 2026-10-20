"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Target,
  Brain,
  Star,
  MapPin,
  Clock,
  IndianRupee,
  AlertCircle,
  FileText,
  CheckCircle2,
} from "lucide-react"
import type { Internship, AnalysisResult, RecommendationScore } from "@/lib/types"
import { api } from "@/lib/api"

interface AIRecommendationsProps {
  onBack: () => void
  likedInternships: number[]
  currentInternships: Internship[]
  resumeAnalysis?: AnalysisResult | null
}

interface FullRecommendation extends RecommendationScore {
  internship: Internship
}

export function AIRecommendations({
  onBack,
  likedInternships,
  currentInternships,
  resumeAnalysis,
}: AIRecommendationsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [recommendations, setRecommendations] = useState<FullRecommendation[]>([])
  const [stats, setStats] = useState({ totalAnalyzed: 0, perfectMatches: 0, goodMatches: 0 })
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const userSkills = resumeAnalysis?.skills || []

  useEffect(() => {
    if (!userSkills.length) {
      setIsAnalyzing(false)
      return
    }

    const fetchRecommendations = async () => {
      setIsAnalyzing(true)
      setError(null)

      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 20, 80))
      }, 300)

      try {
        const json = await api.post("/api/recommendations", {
          userSkills,
          likedInternships,
          userProfile: resumeAnalysis
            ? {
                skills: resumeAnalysis.skills,
                interests: resumeAnalysis.governmentSchemeReadiness?.recommendedSectors,
                experience: resumeAnalysis.experience || "Beginner",
                location: "Remote/Hybrid preferred",
              }
            : undefined,
        })

        clearInterval(interval)
        setProgress(100)

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
  }, [likedInternships, resumeAnalysis, userSkills.length])

  return (
    <div className="min-h-screen bg-app-ambient text-foreground pb-12">
      {/* Header */}
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
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                  AI Fit Recommendations
                </h1>
                <p className="text-xs text-muted-foreground leading-none">
                  Smart semantic ranking based on your resume
                </p>
              </div>
            </div>
          </div>
          {userSkills.length > 0 && (
            <span className="badge-primary text-xs font-bold">Resume Active</span>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {userSkills.length === 0 ? (
          <div className="surface-card rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <FileText className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Upload Your Resume First</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To generate AI-ranked recommendations tailored to your exact skills and academic
                background, please analyze your resume first.
              </p>
            </div>
            <Button onClick={onBack} className="btn-primary w-full h-11 rounded-xl font-semibold">
              Go to Resume Analyzer
            </Button>
          </div>
        ) : isAnalyzing ? (
          <div className="surface-card rounded-3xl p-12 text-center max-w-md mx-auto space-y-5 shadow-lg">
            <div className="relative w-16 h-16 mx-auto">
              <Brain className="h-16 w-16 text-primary animate-pulse" />
              <Sparkles className="h-6 w-6 text-warning absolute -top-1 -right-1 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">Analyzing Your Skill Profile</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Evaluating {userSkills.length} skills against all verified PM Scheme & private internships
              </p>
            </div>
            <div className="w-full max-w-xs mx-auto space-y-2">
              <Progress value={progress} className="h-2 rounded-full" />
              <p className="text-[11px] text-muted-foreground">{progress}% complete</p>
            </div>
          </div>
        ) : error ? (
          <div className="surface-card rounded-3xl p-8 text-center max-w-md mx-auto space-y-4 shadow-lg">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">Could not generate recommendations</h2>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <Button onClick={() => window.location.reload()} className="btn-primary h-10 rounded-xl">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Skills Summary & Match Statistics */}
            <Card className="surface-card rounded-3xl border border-border/80 shadow-sm overflow-hidden">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span>Resume Match Baseline</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-5">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Extracted Skills ({userSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {userSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="text-xs px-2.5 py-0.5 rounded-lg bg-card border border-border text-foreground font-medium shadow-2xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/60">
                  <div className="text-center p-3 rounded-2xl bg-muted/40">
                    <p className="text-xl sm:text-2xl font-black text-foreground">{stats.totalAnalyzed}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">Evaluated</p>
                  </div>
                  <div className="text-center p-3 rounded-2xl bg-success/10">
                    <p className="text-xl sm:text-2xl font-black text-success">{stats.perfectMatches}</p>
                    <p className="text-[11px] text-success font-medium">Strong (85%+)</p>
                  </div>
                  <div className="text-center p-3 rounded-2xl bg-primary/10">
                    <p className="text-xl sm:text-2xl font-black text-primary">{stats.goodMatches}</p>
                    <p className="text-[11px] text-primary font-medium">Good (70-84%)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Ranked Opportunities ({recommendations.length})</span>
                </h2>
              </div>

              {recommendations.length === 0 ? (
                <div className="surface-card rounded-2xl p-8 text-center text-muted-foreground text-sm">
                  No matching recommendations found for your current skills. Try analyzing an updated resume.
                </div>
              ) : (
                recommendations.map((rec, index) => {
                  const scoreColor =
                    rec.score >= 85
                      ? "text-success"
                      : rec.score >= 70
                      ? "text-primary"
                      : "text-warning"

                  const scoreBadgeClass =
                    rec.score >= 85 ? "badge-success" : rec.score >= 70 ? "badge-primary" : "badge-warning"

                  return (
                    <Card
                      key={index}
                      className="surface-card surface-card-hover rounded-2xl border border-border/80 shadow-xs transition-all"
                    >
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <h3 className="font-bold text-base sm:text-lg text-foreground">
                                {rec.internship.title}
                              </h3>
                              {rec.internship.scheme && (
                                <span className="badge-warning text-[10px] font-bold">PM Scheme</span>
                              )}
                            </div>

                            <p className="text-primary font-semibold text-sm mb-3">
                              {rec.internship.company}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
                              <span className="flex items-center gap-1 font-medium">
                                <MapPin className="h-3.5 w-3.5 text-primary" />
                                {rec.internship.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-primary" />
                                {rec.internship.duration}
                              </span>
                              <span className="flex items-center gap-1 text-success font-bold">
                                <IndianRupee className="h-3.5 w-3.5" />
                                {rec.internship.salary}
                              </span>
                            </div>

                            {/* Why this matches you */}
                            {rec.reasons?.length > 0 && (
                              <div className="space-y-1.5 mb-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                                <p className="text-[11px] font-bold text-foreground">Match Rationale:</p>
                                <ul className="text-xs space-y-1">
                                  {rec.reasons.map((reason, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-center gap-1.5 text-muted-foreground"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                                      <span>{reason}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Matched Skills */}
                            <div className="space-y-1.5">
                              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                Matching Skills:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {rec.matchedSkills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[11px] px-2 py-0.5 rounded-md bg-success/15 text-success font-semibold border border-success/20"
                                  >
                                    ✓ {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Match Score Block */}
                          <div className="sm:text-right shrink-0 p-3 sm:p-0 rounded-xl bg-card border sm:border-0 border-border/60 w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between">
                            <div>
                              <div className={`text-2xl sm:text-3xl font-black ${scoreColor}`}>
                                {rec.score}%
                              </div>
                              <p className="text-[10px] text-muted-foreground font-semibold">Match Score</p>
                            </div>
                            <span className={`${scoreBadgeClass} text-xs mt-1 font-bold`}>
                              {rec.score >= 85 ? "Top Fit" : rec.score >= 70 ? "Good Match" : "Potential"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

