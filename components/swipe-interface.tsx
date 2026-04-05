"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { InternshipCard } from "@/components/internship-card"
import { InternshipDetail } from "@/components/internship-detail"
import { ResumeAnalyzer } from "@/components/resume-analyzer"
import { AIRecommendations } from "@/components/ai-recommendations"
import { CourseRecommendations } from "@/components/course-recommendations"
import { LikedInternships } from "@/components/liked-internships"
import { Button } from "@/components/ui/button"
import {
  Heart, X, FileText, RotateCcw, Sparkles, BookOpen, MapPin,
  Loader2, AlertCircle, ChevronRight, Radio, Wifi
} from "lucide-react"
import type { Internship, AnalysisResult } from "@/lib/types"

type FetchMode = "static" | "live"

export function SwipeInterface() {
  const [internships, setInternships] = useState<Internship[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchMode, setFetchMode] = useState<FetchMode>("static")
  const [sourceStats, setSourceStats] = useState<Record<string, number> | null>(null)
  const [isCached, setIsCached] = useState(false)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [showDetail, setShowDetail] = useState(false)
  const [showResumeAnalyzer, setShowResumeAnalyzer] = useState(false)
  const [showAIRecommendations, setShowAIRecommendations] = useState(false)
  const [showCourseRecommendations, setShowCourseRecommendations] = useState(false)
  const [showLiked, setShowLiked] = useState(false)
  const [likedInternships, setLikedInternships] = useState<number[]>([])
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const [resumeAnalysis, setResumeAnalysis] = useState<AnalysisResult | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // ── Read persisted resume analysis from sessionStorage on mount ───────────
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("resumeAnalysis")
      if (stored) {
        const parsed = JSON.parse(stored) as AnalysisResult
        if (parsed?.skills?.length) setResumeAnalysis(parsed)
      }
    } catch {}
  }, [])

  const fetchInternships = useCallback(async (mode: FetchMode, forceRefresh = false) => {
    setIsLoading(true)
    setError(null)
    try {
      const skills = resumeAnalysis?.skills || []

      if (mode === "live") {
        const params = new URLSearchParams()
        if (skills.length > 0) params.set("skills", skills.join(","))
        if (forceRefresh) params.set("refresh", "1")
        const res = await fetch(`/api/jobs/realtime?${params}`)
        if (!res.ok) throw new Error("Live fetch failed — try again")
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        setInternships(json.data)
        setSourceStats(json.sourceStats ?? null)
        setIsCached(json.cached ?? false)
      } else {
        const params = new URLSearchParams({ limit: "30" })
        if (skills.length > 0) params.set("skills", skills.join(","))
        const res = await fetch(`/api/internships?${params}`)
        if (!res.ok) throw new Error("Failed to fetch internships")
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        setInternships(json.data)
        setSourceStats(null)
        setIsCached(false)
      }
    } catch (err: any) {
      setError(err.message || "Could not load internships")
    } finally {
      setIsLoading(false)
    }
  }, [resumeAnalysis])

  useEffect(() => {
    fetchInternships(fetchMode)
  }, [resumeAnalysis, fetchMode])

  const handleToggleLive = () => {
    const next: FetchMode = fetchMode === "static" ? "live" : "static"
    setFetchMode(next)
    setCurrentIndex(0)
  }

  const currentInternship = internships[currentIndex]
  const likedObjects = likedInternships
    .map((id) => internships.find((i) => i.id === id))
    .filter(Boolean) as Internship[]

  const handleSwipe = (direction: "left" | "right") => {
    setSwipeDirection(direction)
    if (direction === "right" && currentInternship) {
      setLikedInternships((prev) =>
        prev.includes(currentInternship.id) ? prev : [...prev, currentInternship.id]
      )
    }
    setTimeout(() => {
      setCurrentIndex((prev) => (prev < internships.length - 1 ? prev + 1 : 0))
      setSwipeDirection(null)
      setDragOffset({ x: 0, y: 0 })
    }, 300)
  }

  const handleUnlike = (id: number) => {
    setLikedInternships((prev) => prev.filter((x) => x !== id))
  }

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => { setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }) }
  const handleMouseMove = (e: React.MouseEvent) => { if (!isDragging) return; setDragOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }) }
  const handleMouseUp = () => {
    if (!isDragging) return; setIsDragging(false)
    if (Math.abs(dragOffset.x) > 100) handleSwipe(dragOffset.x > 0 ? "right" : "left")
    else setDragOffset({ x: 0, y: 0 })
  }
  const handleTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]; setIsDragging(true); setDragStart({ x: t.clientX, y: t.clientY }) }
  const handleTouchMove = (e: React.TouchEvent) => { if (!isDragging) return; const t = e.touches[0]; setDragOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y }) }
  const handleTouchEnd = () => {
    if (!isDragging) return; setIsDragging(false)
    if (Math.abs(dragOffset.x) > 100) handleSwipe(dragOffset.x > 0 ? "right" : "left")
    else setDragOffset({ x: 0, y: 0 })
  }

  const handleResumeAnalysisComplete = (analysis: AnalysisResult) => {
    setResumeAnalysis(analysis)
    sessionStorage.setItem("resumeAnalysis", JSON.stringify(analysis))
    setCurrentIndex(0)
  }

  // When returning from resume analyzer: ensure internships are re-fetched with new skills
  const handleResumeBack = () => {
    setShowResumeAnalyzer(false)
    setCurrentIndex(0)
    // fetchInternships will re-run via useEffect when resumeAnalysis state was set
    // but if user closed without analyzing, manually re-fetch to be safe
    if (resumeAnalysis) {
      fetchInternships(fetchMode)
    }
  }

  // ── Route views ──────────────────────────────────────────────────────────────
  if (showResumeAnalyzer) return (
    <ResumeAnalyzer
      onBack={handleResumeBack}
      onAnalysisComplete={handleResumeAnalysisComplete}
    />
  )
  if (showAIRecommendations) return <AIRecommendations onBack={() => setShowAIRecommendations(false)} likedInternships={likedInternships} currentInternships={internships} resumeAnalysis={resumeAnalysis} />
  if (showCourseRecommendations) return <CourseRecommendations onBack={() => setShowCourseRecommendations(false)} currentInternship={currentInternship} likedInternships={likedObjects} resumeAnalysis={resumeAnalysis} />
  if (showLiked) return <LikedInternships internships={likedObjects} onBack={() => setShowLiked(false)} onUnlike={handleUnlike} />
  if (showDetail && currentInternship) return (
    <InternshipDetail
      internship={currentInternship}
      onBack={() => setShowDetail(false)}
      userSkills={resumeAnalysis?.skills ?? []}
      onApply={() => {
        setLikedInternships((prev) =>
          prev.includes(currentInternship.id) ? prev : [...prev, currentInternship.id]
        )
        setShowDetail(false)
        handleSwipe("right")
      }}
    />
  )

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-screen bg-neon-gradient flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border border-[oklch(0.68_0.24_265/0.3)] bg-[oklch(0.68_0.24_265/0.08)] flex items-center justify-center mx-auto">
            <Loader2 className="h-8 w-8 text-[oklch(0.75_0.22_265)] animate-spin" />
          </div>
        </div>
        <p className="text-foreground font-semibold">Loading internships...</p>
        <p className="text-sm text-muted-foreground">Fetching real opportunities from PM Scheme & top companies</p>
      </div>
    </div>
  )

  // ── Error state ───────────────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-neon-gradient flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm mx-auto px-4">
        <AlertCircle className="h-12 w-12 text-[oklch(0.78_0.20_25)] mx-auto" />
        <p className="text-foreground font-medium">{error}</p>
        <Button onClick={() => window.location.reload()} className="neon-btn">Retry</Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-neon-gradient p-4">
      <div className="max-w-md mx-auto">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-3 neon-card rounded-2xl p-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-[oklch(0.72_0.20_50)] to-[oklch(0.68_0.24_265)] rounded-full flex items-center justify-center shadow-[0_0_12px_oklch(0.68_0.24_265/0.4)]">
                <span className="text-white font-bold text-xs">PM</span>
              </div>
              <h2 className="text-base font-semibold text-foreground">Discover Internships</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="neon-badge">{currentIndex + 1} / {internships.length}</span>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>India</span>
              </div>
              {resumeAnalysis && <span className="neon-badge-green">● Smart-ranked</span>}
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setShowAIRecommendations(true)}
              className="flex items-center gap-1 text-xs h-8 px-2 text-[oklch(0.75_0.22_265)] hover:bg-[oklch(0.68_0.24_265/0.1)] hover:text-[oklch(0.82_0.22_265)]">
              <Sparkles className="h-3.5 w-3.5" />AI
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCourseRecommendations(true)}
              className="flex items-center gap-1 text-xs h-8 px-2 text-[oklch(0.78_0.18_150)] hover:bg-[oklch(0.72_0.20_150/0.1)] hover:text-[oklch(0.82_0.18_150)]">
              <BookOpen className="h-3.5 w-3.5" />Courses
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowResumeAnalyzer(true)}
              className="flex items-center gap-1 text-xs h-8 px-2 text-[oklch(0.82_0.18_50)] hover:bg-[oklch(0.72_0.20_50/0.1)] hover:text-[oklch(0.88_0.18_50)]">
              <FileText className="h-3.5 w-3.5" />Resume
            </Button>
          </div>
        </div>

        {/* Live mode bar */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            onClick={handleToggleLive}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ${
              fetchMode === "live"
                ? "bg-[oklch(0.65_0.22_25/0.15)] border-[oklch(0.78_0.20_25/0.6)] text-[oklch(0.88_0.20_25)] shadow-[0_0_8px_oklch(0.65_0.22_25/0.3)]"
                : "bg-transparent border-[oklch(0.25_0.06_265/0.4)] text-muted-foreground hover:border-[oklch(0.65_0.22_25/0.4)] hover:text-[oklch(0.78_0.20_25)]"
            }`}
          >
            {fetchMode === "live" ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.78_0.20_25)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[oklch(0.78_0.20_25)]" />
                </span>
                LIVE
              </>
            ) : (
              <>
                <Radio className="h-3 w-3" />
                Go Live
              </>
            )}
          </button>

          {/* Source stats row (shown in live mode) */}
          {fetchMode === "live" && sourceStats && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              {isCached && <span className="opacity-60">(cached)</span>}
              {(sourceStats.github ?? 0) > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[oklch(0.68_0.24_265/0.15)] border border-[oklch(0.68_0.24_265/0.3)] text-[oklch(0.75_0.22_265)]">
                  🔵 GitHub {sourceStats.github}
                </span>
              )}
              {(sourceStats.remoteok ?? 0) > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[oklch(0.72_0.20_50/0.12)] border border-[oklch(0.72_0.20_50/0.3)] text-[oklch(0.82_0.18_50)]">
                  🟠 Remote {sourceStats.remoteok}
                </span>
              )}
              {(sourceStats.remotive ?? sourceStats.jooble ?? 0) > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[oklch(0.72_0.20_150/0.12)] border border-[oklch(0.72_0.20_150/0.3)] text-[oklch(0.78_0.18_150)]">
                  🟣 Remotive {sourceStats.remotive ?? sourceStats.jooble}
                </span>
              )}
              <button
                onClick={() => { fetchInternships("live", true); setCurrentIndex(0) }}
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Force refresh (uses API quota)"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Card stack */}
        <div className="relative h-[580px] mb-5">
          {internships.slice(currentIndex + 1, currentIndex + 3).map((_, index) => (
            <div key={index} className="absolute inset-0 neon-card rounded-2xl"
              style={{ transform: `scale(${0.95 - index * 0.05}) translateY(${index * 8}px)`, zIndex: -index - 1, opacity: 0.4 - index * 0.15 }} />
          ))}

          {currentInternship && (
            <div ref={cardRef} className="absolute inset-0 cursor-grab active:cursor-grabbing"
              style={{ transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y * 0.3}px) rotate(${dragOffset.x * 0.08}deg)`, transition: isDragging ? "none" : "transform 0.3s ease-out", zIndex: 10 }}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
              <InternshipCard internship={currentInternship} onViewDetails={() => setShowDetail(true)} swipeDirection={swipeDirection} dragOffset={dragOffset} userSkills={resumeAnalysis?.skills ?? []} />
            </div>
          )}

          {/* Swipe indicator overlays */}
          {Math.abs(dragOffset.x) > 50 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className={`px-6 py-3 rounded-full font-bold text-lg ${dragOffset.x > 0
                ? "bg-[oklch(0.72_0.20_150/0.2)] border-2 border-[oklch(0.78_0.18_150)] text-[oklch(0.82_0.18_150)]"
                : "bg-[oklch(0.65_0.22_25/0.2)] border-2 border-[oklch(0.78_0.20_25)] text-[oklch(0.82_0.20_25)]"} backdrop-blur-sm`}>
                {dragOffset.x > 0 ? "💚 LIKE" : "✕ PASS"}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-5 mb-4">
          <Button variant="ghost" size="lg"
            className="rounded-full h-14 w-14 border border-[oklch(0.65_0.22_25/0.3)] hover:bg-[oklch(0.65_0.22_25/0.1)] hover:border-[oklch(0.78_0.20_25/0.5)] bg-[oklch(0.10_0.025_264)] shadow-[0_0_12px_oklch(0.65_0.22_25/0.1)] transition-all duration-200"
            onClick={() => handleSwipe("left")}>
            <X className="h-6 w-6 text-[oklch(0.78_0.20_25)]" />
          </Button>

          <Button variant="ghost" size="lg"
            className="rounded-full h-11 w-11 border border-[oklch(0.25_0.06_265/0.3)] hover:bg-[oklch(0.68_0.24_265/0.08)] bg-[oklch(0.10_0.025_264)] transition-all duration-200"
            onClick={() => { setCurrentIndex(0); setLikedInternships([]) }}>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button variant="ghost" size="lg"
            className="rounded-full h-14 w-14 border border-[oklch(0.72_0.20_150/0.3)] hover:bg-[oklch(0.72_0.20_150/0.1)] hover:border-[oklch(0.78_0.18_150/0.5)] bg-[oklch(0.10_0.025_264)] shadow-[0_0_12px_oklch(0.72_0.20_150/0.1)] transition-all duration-200"
            onClick={() => handleSwipe("right")}>
            <Heart className="h-6 w-6 text-[oklch(0.78_0.18_150)]" />
          </Button>
        </div>

        {/* Source label for current card in live mode */}
        {fetchMode === "live" && currentInternship?.source && currentInternship.source !== "static" && (
          <div className="text-center mb-2">
            <span className="text-[10px] text-muted-foreground">
              {currentInternship.source === "github" && "🔵 via GitHub SimplifyJobs"}
              {currentInternship.source === "remoteok" && "🟠 via RemoteOK"}
              {currentInternship.source === "jooble" && "🟢 via Jooble"}
            </span>
          </div>
        )}

        {/* Liked internships button — shown below swipe area */}
        {likedInternships.length > 0 ? (
          <button
            onClick={() => setShowLiked(true)}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl neon-card group hover:border-[oklch(0.68_0.24_265/0.4)] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Heart className="h-5 w-5 text-[oklch(0.78_0.18_150)]" fill="oklch(0.78 0.18 150)" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">
                  {likedInternships.length} Liked Internship{likedInternships.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {likedObjects.filter((i) => i.scheme).length > 0
                    ? `${likedObjects.filter((i) => i.scheme).length} PM Scheme eligible`
                    : "Tap to view your shortlist"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs neon-badge">View all</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[oklch(0.75_0.22_265)] transition-colors" />
            </div>
          </button>
        ) : (
          <div className="text-center py-3">
            <p className="text-xs text-muted-foreground">Swipe right to like internships · Swipe left to pass</p>
          </div>
        )}
      </div>
    </div>
  )
}
