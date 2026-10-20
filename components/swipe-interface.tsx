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
  Heart,
  X,
  FileText,
  RotateCcw,
  Sparkles,
  BookOpen,
  MapPin,
  Loader2,
  AlertCircle,
  ChevronRight,
  Radio,
} from "lucide-react"
import type { Internship, AnalysisResult } from "@/lib/types"
import { api } from "@/lib/api"

type FetchMode = "static" | "live"

interface LikedItemRecord {
  id?: string
  externalId: string
  source?: "static" | "github" | "remoteok" | "remotive" | "jooble"
  snapshot: Internship
  createdAt?: string
}

interface SwipeInterfaceProps {
  user?: any
  onLogout?: () => void
}

export function SwipeInterface({ user }: SwipeInterfaceProps) {
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

  // Persisted liked items from MongoDB
  const [likedRecords, setLikedRecords] = useState<LikedItemRecord[]>([])
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const [resumeAnalysis, setResumeAnalysis] = useState<AnalysisResult | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // ── 1. Read persisted resume analysis from DB / sessionStorage on mount ───────────
  useEffect(() => {
    let isMounted = true

    // Check sessionStorage first for instant render
    try {
      const stored = sessionStorage.getItem("resumeAnalysis")
      if (stored) {
        const parsed = JSON.parse(stored) as AnalysisResult
        if (parsed?.skills?.length) setResumeAnalysis(parsed)
      }
    } catch {}

    // Fetch latest analysis from MongoDB
    api
      .get<AnalysisResult | null>("/api/resume/latest")
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setResumeAnalysis(res.data)
          try {
            sessionStorage.setItem("resumeAnalysis", JSON.stringify(res.data))
          } catch {}
        }
      })
      .catch((err) => {
        console.warn("Could not load latest resume analysis from DB:", err)
      })

    // Load liked internships from MongoDB
    api
      .get<LikedItemRecord[]>("/api/liked")
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data)) {
          setLikedRecords(res.data)
        }
      })
      .catch((err) => {
        console.warn("Could not load liked internships from DB:", err)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // ── 2. Fetch internships ──────────────────────────────────────────────────────────
  const fetchInternships = useCallback(
    async (mode: FetchMode, forceRefresh = false) => {
      setIsLoading(true)
      setError(null)
      try {
        const skills = resumeAnalysis?.skills || []

        if (mode === "live") {
          const params = new URLSearchParams()
          if (skills.length > 0) params.set("skills", skills.join(","))
          if (forceRefresh) params.set("refresh", "1")
          const json = await api.get(`/api/jobs/realtime?${params}`)
          if (!json.success) throw new Error(json.error)
          setInternships(json.data)
          setSourceStats(json.sourceStats ?? null)
          setIsCached(json.cached ?? false)
        } else {
          const params = new URLSearchParams({ limit: "30" })
          if (skills.length > 0) params.set("skills", skills.join(","))
          const json = await api.get(`/api/internships?${params}`)
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
    },
    [resumeAnalysis]
  )

  useEffect(() => {
    fetchInternships(fetchMode)
  }, [resumeAnalysis, fetchMode, fetchInternships])

  const handleToggleLive = () => {
    const next: FetchMode = fetchMode === "static" ? "live" : "static"
    setFetchMode(next)
    setCurrentIndex(0)
  }

  const currentInternship = internships[currentIndex]

  // Liked items persisted snapshot (survives switching live/static, re-ranking, and page reload)
  const likedObjects = likedRecords.map((r) => r.snapshot)
  const likedInternshipIds = likedObjects.map((i) => i.id)

  const handleLikeCurrent = async (internship: Internship) => {
    const externalId =
      internship.externalId || `${internship.source || "static"}:${internship.id}`

    // Optimistic update
    setLikedRecords((prev) => {
      if (prev.some((r) => r.externalId === externalId)) return prev
      return [
        {
          externalId,
          source: (internship.source as any) || "static",
          snapshot: internship,
        },
        ...prev,
      ]
    })

    try {
      await api.post("/api/liked", {
        externalId,
        source: internship.source || "static",
        snapshot: internship,
      })
    } catch (err) {
      console.error("Failed to save like to DB:", err)
    }
  }

  const handleUnlike = async (targetId: number | string) => {
    const target = likedRecords.find(
      (r) => r.snapshot.id === targetId || r.externalId === String(targetId)
    )
    const externalId = target?.externalId || String(targetId)

    // Optimistic remove
    setLikedRecords((prev) =>
      prev.filter(
        (r) => r.snapshot.id !== targetId && r.externalId !== String(targetId)
      )
    )

    try {
      await api.delete(`/api/liked/${encodeURIComponent(externalId)}`)
    } catch (err) {
      console.error("Failed to delete like from DB:", err)
    }
  }

  const handleSwipe = (direction: "left" | "right") => {
    setSwipeDirection(direction)
    if (direction === "right" && currentInternship) {
      handleLikeCurrent(currentInternship)
    }
    setTimeout(() => {
      setCurrentIndex((prev) => (prev < internships.length - 1 ? prev + 1 : 0))
      setSwipeDirection(null)
      setDragOffset({ x: 0, y: 0 })
    }, 300)
  }

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setDragOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }
  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (Math.abs(dragOffset.x) > 100) handleSwipe(dragOffset.x > 0 ? "right" : "left")
    else setDragOffset({ x: 0, y: 0 })
  }
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: t.clientX, y: t.clientY })
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const t = e.touches[0]
    setDragOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y })
  }
  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (Math.abs(dragOffset.x) > 100) handleSwipe(dragOffset.x > 0 ? "right" : "left")
    else setDragOffset({ x: 0, y: 0 })
  }

  const handleResumeAnalysisComplete = (analysis: AnalysisResult) => {
    setResumeAnalysis(analysis)
    try {
      sessionStorage.setItem("resumeAnalysis", JSON.stringify(analysis))
    } catch {}
    setCurrentIndex(0)
  }

  // Returning from resume analyzer (Fix Bug 10: avoid double fetch)
  const handleResumeBack = () => {
    setShowResumeAnalyzer(false)
    setCurrentIndex(0)
  }

  // ── Route views ──────────────────────────────────────────────────────────────
  if (showResumeAnalyzer)
    return (
      <ResumeAnalyzer
        onBack={handleResumeBack}
        onAnalysisComplete={handleResumeAnalysisComplete}
      />
    )

  if (showAIRecommendations)
    return (
      <AIRecommendations
        onBack={() => setShowAIRecommendations(false)}
        likedInternships={likedInternshipIds}
        currentInternships={internships}
        resumeAnalysis={resumeAnalysis}
      />
    )

  if (showCourseRecommendations)
    return (
      <CourseRecommendations
        onBack={() => setShowCourseRecommendations(false)}
        currentInternship={currentInternship}
        likedInternships={likedObjects}
        resumeAnalysis={resumeAnalysis}
      />
    )

  if (showLiked)
    return (
      <LikedInternships
        internships={likedObjects}
        onBack={() => setShowLiked(false)}
        onUnlike={handleUnlike}
      />
    )

  if (showDetail && currentInternship)
    return (
      <InternshipDetail
        internship={currentInternship}
        onBack={() => setShowDetail(false)}
        userSkills={resumeAnalysis?.skills ?? []}
        onApply={() => {
          handleLikeCurrent(currentInternship)
          setShowDetail(false)
          handleSwipe("right")
        }}
      />
    )

  // ── Loading state: Rich Skeleton Loader ─────────────────────────────────────
  if (isLoading)
    return (
      <div className="min-h-screen bg-app-ambient p-4 pb-12">
        <div className="max-w-md mx-auto space-y-4">
          {/* Top bar skeleton */}
          <div className="surface-card rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-36 bg-muted rounded-md animate-pulse" />
              <div className="h-3 w-24 bg-muted/60 rounded-md animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-12 bg-muted rounded-xl animate-pulse" />
              <div className="h-8 w-16 bg-muted rounded-xl animate-pulse" />
              <div className="h-8 w-16 bg-muted rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Mode bar skeleton */}
          <div className="flex justify-between items-center px-1">
            <div className="h-7 w-20 bg-muted rounded-full animate-pulse" />
            <div className="h-5 w-32 bg-muted/60 rounded-md animate-pulse" />
          </div>

          {/* Card skeleton */}
          <div className="surface-card rounded-3xl p-6 h-[560px] flex flex-col justify-between">
            <div>
              <div className="flex gap-4 items-start mb-6">
                <div className="w-16 h-16 rounded-2xl bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-5 w-4/5 bg-muted rounded-md animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted/60 rounded-md animate-pulse" />
                  <div className="h-6 w-24 bg-muted/40 rounded-full animate-pulse" />
                </div>
              </div>

              <div className="h-10 w-full bg-muted/30 rounded-xl mb-5 animate-pulse" />

              <div className="space-y-2 mb-6">
                <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
                <div className="h-3 w-11/12 bg-muted/60 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-muted/60 rounded animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-6 w-16 bg-muted/50 rounded-lg animate-pulse" />
                  <div className="h-6 w-20 bg-muted/50 rounded-lg animate-pulse" />
                  <div className="h-6 w-14 bg-muted/50 rounded-lg animate-pulse" />
                  <div className="h-6 w-24 bg-muted/50 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>

            <div className="h-11 w-full bg-muted rounded-2xl animate-pulse" />
          </div>

          {/* Buttons skeleton */}
          <div className="flex items-center justify-center gap-6 pt-2">
            <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
            <div className="w-11 h-11 rounded-full bg-muted animate-pulse" />
            <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    )

  // ── Error state: Friendly modern message ────────────────────────────────────
  if (error)
    return (
      <div className="min-h-screen bg-app-ambient flex items-center justify-center p-4">
        <div className="surface-card rounded-3xl p-8 text-center space-y-4 max-w-sm mx-auto shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-foreground">Could not load internships</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
          </div>
          <Button
            onClick={() => fetchInternships(fetchMode, true)}
            className="w-full btn-primary h-11 rounded-xl"
          >
            Retry Connection
          </Button>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-app-ambient p-4 pb-12">
      <div className="max-w-md mx-auto">
        {/* Header bar / Quick Navigation Toolbar */}
        <div className="flex items-center justify-between mb-3 surface-card rounded-2xl p-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-black text-xs">CP</span>
              </div>
              <h2 className="text-base font-bold text-foreground">Discover Roles</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="badge-primary">
                {internships.length > 0 ? currentIndex + 1 : 0} of {internships.length}
              </span>
              <div className="flex items-center gap-1 font-medium">
                <MapPin className="h-3 w-3 text-primary" />
                <span>Pan-India</span>
              </div>
              {resumeAnalysis && <span className="badge-success">● AI-Ranked</span>}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="soft"
              size="sm"
              onClick={() => setShowAIRecommendations(true)}
              className="flex items-center gap-1 text-xs h-8 px-2.5 rounded-lg cursor-pointer"
              title="View AI-ranked recommendations"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI</span>
            </Button>
            <Button
              variant="soft-success"
              size="sm"
              onClick={() => setShowCourseRecommendations(true)}
              className="flex items-center gap-1 text-xs h-8 px-2.5 rounded-lg cursor-pointer"
              title="View courses for missing skills"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Courses</span>
            </Button>
            <Button
              variant="soft-accent"
              size="sm"
              onClick={() => setShowResumeAnalyzer(true)}
              className="flex items-center gap-1 text-xs h-8 px-2.5 rounded-lg cursor-pointer"
              title="Analyze resume and extract skills"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Resume</span>
            </Button>
          </div>
        </div>

        {/* Live mode bar */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            type="button"
            onClick={handleToggleLive}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
              fetchMode === "live"
                ? "bg-destructive/15 border-destructive/40 text-destructive shadow-xs"
                : "bg-card border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
            }`}
          >
            {fetchMode === "live" ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                </span>
                LIVE FEEDS
              </>
            ) : (
              <>
                <Radio className="h-3 w-3" />
                <span>Go Live</span>
              </>
            )}
          </button>

          {/* Source stats row (shown in live mode) */}
          {fetchMode === "live" && sourceStats && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              {isCached && <span className="opacity-70">(cached)</span>}
              {(sourceStats.github ?? 0) > 0 && (
                <span className="badge-primary text-[10px] py-0.5">
                  GitHub {sourceStats.github}
                </span>
              )}
              {(sourceStats.remoteok ?? 0) > 0 && (
                <span className="badge-warning text-[10px] py-0.5">
                  Remote {sourceStats.remoteok}
                </span>
              )}
              {(sourceStats.remotive ?? sourceStats.jooble ?? 0) > 0 && (
                <span className="badge-success text-[10px] py-0.5">
                  Remotive {sourceStats.remotive ?? sourceStats.jooble}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  fetchInternships("live", true)
                  setCurrentIndex(0)
                }}
                className="ml-1 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Force refresh live jobs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Card stack area */}
        <div className="relative h-[590px] mb-5">
          {internships.length === 0 || currentIndex >= internships.length ? (
            /* Friendly empty state */
            <div className="absolute inset-0 surface-card rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-lg">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="h-8 w-8" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h3 className="text-xl font-bold text-foreground">You're all caught up!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You've reviewed all available internships in this deck. Reset to view them again or switch
                  to live feeds.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-xs pt-2">
                <Button
                  onClick={() => setCurrentIndex(0)}
                  className="w-full btn-primary h-11 rounded-xl"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restart Deck
                </Button>
                {fetchMode === "static" && (
                  <Button
                    variant="outline"
                    onClick={handleToggleLive}
                    className="w-full h-11 rounded-xl border-border"
                  >
                    <Radio className="w-4 h-4 mr-2 text-destructive" />
                    Explore Live Tech Jobs
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Stack background cards for depth */}
              {internships.slice(currentIndex + 1, currentIndex + 3).map((_, index) => (
                <div
                  key={index}
                  className="absolute inset-0 surface-card rounded-3xl border border-border/60 pointer-events-none"
                  style={{
                    transform: `scale(${0.96 - index * 0.04}) translateY(${(index + 1) * 12}px)`,
                    zIndex: -index - 1,
                    opacity: 0.6 - index * 0.25,
                  }}
                />
              ))}

              {/* Active draggable card */}
              {currentInternship && (
                <div
                  ref={cardRef}
                  className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
                  style={{
                    transform: `translateX(${dragOffset.x}px) translateY(${
                      dragOffset.y * 0.25
                    }px) rotate(${dragOffset.x * 0.07}deg)`,
                    transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    zIndex: 10,
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <InternshipCard
                    internship={currentInternship}
                    onViewDetails={() => setShowDetail(true)}
                    swipeDirection={swipeDirection}
                    dragOffset={dragOffset}
                    userSkills={resumeAnalysis?.skills ?? []}
                  />
                </div>
              )}

              {/* Swipe indicator overlays */}
              {Math.abs(dragOffset.x) > 40 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div
                    className={`px-8 py-3.5 rounded-full font-black text-xl tracking-wider shadow-2xl backdrop-blur-md border-2 transition-transform ${
                      dragOffset.x > 0
                        ? "bg-card/95 border-success text-success rotate-12 scale-105"
                        : "bg-card/95 border-destructive text-destructive -rotate-12 scale-105"
                    }`}
                  >
                    {dragOffset.x > 0 ? "💚 LIKE & SAVE" : "✕ PASS"}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action buttons (Pass, Reset, Like) */}
        <div className="flex items-center justify-center gap-6 mb-5">
          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full w-14 h-14 min-w-[56px] min-h-[56px] border-destructive/30 text-destructive bg-card hover:bg-destructive/15 hover:border-destructive/50 shadow-md transition-all active:scale-95 cursor-pointer"
            onClick={() => handleSwipe("left")}
            aria-label="Pass on this internship"
            title="Pass (Swipe Left)"
          >
            <X className="h-6 w-6 stroke-[2.5]" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-11 h-11 min-w-[44px] min-h-[44px] border-border text-muted-foreground hover:text-foreground bg-card hover:bg-muted shadow-xs transition-all active:scale-95 cursor-pointer"
            onClick={() => setCurrentIndex(0)}
            aria-label="Reset deck from the beginning"
            title="Reset deck"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full w-14 h-14 min-w-[56px] min-h-[56px] border-success/30 text-success bg-card hover:bg-success/15 hover:border-success/50 shadow-md transition-all active:scale-95 cursor-pointer"
            onClick={() => handleSwipe("right")}
            aria-label="Like and save internship"
            title="Like (Swipe Right)"
          >
            <Heart className="h-6 w-6 stroke-[2.5]" />
          </Button>
        </div>

        {/* Source label for current card in live mode */}
        {fetchMode === "live" &&
          currentInternship?.source &&
          currentInternship.source !== "static" && (
            <div className="text-center mb-3">
              <span className="text-xs text-muted-foreground font-medium">
                {currentInternship.source === "github" && "🔵 Sourced live via SimplifyJobs"}
                {currentInternship.source === "remoteok" && "🟠 Sourced live via RemoteOK"}
                {currentInternship.source === "jooble" && "🟢 Sourced live via Jooble"}
              </span>
            </div>
          )}

        {/* Liked internships banner button */}
        {likedRecords.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowLiked(true)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl surface-card surface-card-hover group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0">
                <Heart className="h-5 w-5 fill-current" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">
                  {likedRecords.length} Saved Internship{likedRecords.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {likedObjects.filter((i) => i.scheme).length > 0
                    ? `${likedObjects.filter((i) => i.scheme).length} Government PM Scheme eligible`
                    : "Tap to review your shortlist & apply"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-primary text-xs">View Shortlist</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        ) : (
          <div className="text-center py-3">
            <p className="text-xs text-muted-foreground font-medium">
              Swipe right (or tap Heart) to shortlist · Swipe left to pass
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
