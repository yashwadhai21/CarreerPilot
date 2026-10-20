/**
 * /api/jobs/realtime
 * Hybrid aggregator: fetches from GitHub SimplifyJobs, RemoteOK, and Remotive
 * concurrently via Promise.allSettled, merges & skill-ranks the results.
 */

import { NextRequest, NextResponse } from "next/server"
import {
  parseGitHubMarkdown,
  parseRemoteOKJson,
  parseRemotiveResponse,
} from "@/lib/realtime-parsers"
import { rankInternships, buildProfileFromSkills } from "@/lib/skill-matcher"
import { requireAuth, AuthError } from "@/lib/auth"
import type { Internship } from "@/lib/types"

export const dynamic = "force-dynamic"

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

interface CacheEntry {
  data: Internship[]
  sourceStats: Record<string, number | string>
  cachedAt: number
}

// Key = sorted skills joined (e.g. "python,react"), Value = cache entry
const cache = new Map<string, CacheEntry>()

function getCacheKey(skills: string[]): string {
  return [...skills].map((s) => s.toLowerCase()).sort().join(",")
}

function getCached(key: string): CacheEntry | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry
}

// ─── External Fetch Helpers ───────────────────────────────────────────────────

async function fetchGitHub(): Promise<Internship[]> {
  const url =
    "https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/dev/README.md"
  const res = await fetch(url, {
    next: { revalidate: 600 },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`)
  const text = await res.text()
  return parseGitHubMarkdown(text, 30)
}

async function fetchRemoteOK(): Promise<Internship[]> {
  const res = await fetch("https://remoteok.com/api?tag=intern", {
    headers: { "User-Agent": "CareerPilot-InternshipPortal/1.0" },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`RemoteOK fetch failed: ${res.status}`)
  const json = await res.json()
  const jobs = Array.isArray(json) ? json.slice(1) : []
  return parseRemoteOKJson(jobs, 20)
}

async function fetchRemotive(skills: string[]): Promise<Internship[]> {
  const tag = skills.length > 0 ? skills[0].toLowerCase() : "software"
  const urls = [
    `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(tag + " intern")}&limit=15`,
    `https://remotive.com/api/remote-jobs?category=software-dev&search=intern&limit=15`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "CareerPilot-InternshipPortal/1.0" },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue
      const data = await res.json()
      const jobs = data?.jobs ?? []
      if (jobs.length > 0) return parseRemotiveResponse(jobs, 15)
    } catch {
      // silently try next URL
    }
  }
  return []
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const userSkills = searchParams.get("skills")?.split(",").filter(Boolean) ?? []
    const forceRefresh = searchParams.get("refresh") === "1"

    const cacheKey = getCacheKey(userSkills)

    // Serve from cache if available
    if (!forceRefresh) {
      const cached = getCached(cacheKey)
      if (cached) {
        return NextResponse.json({
          success: true,
          data: rankAndScore(cached.data, userSkills),
          sourceStats: cached.sourceStats,
          cached: true,
          cacheAgeSeconds: Math.floor((Date.now() - cached.cachedAt) / 1000),
        })
      }
    }

    // ── Concurrent fetch with graceful degradation ───────────────────────────
    const [githubResult, remoteokResult, remotiveResult] = await Promise.allSettled([
      fetchGitHub(),
      fetchRemoteOK(),
      fetchRemotive(userSkills),
    ])

    const sourceStats: Record<string, number | string> = {}
    const merged: Internship[] = []

    if (githubResult.status === "fulfilled") {
      sourceStats.github = githubResult.value.length
      merged.push(...githubResult.value)
    } else {
      sourceStats.github = 0
      sourceStats.githubError = String(githubResult.reason)
    }

    if (remoteokResult.status === "fulfilled") {
      sourceStats.remoteok = remoteokResult.value.length
      merged.push(...remoteokResult.value)
    } else {
      sourceStats.remoteok = 0
      sourceStats.remoteokError = String(remoteokResult.reason)
    }

    if (remotiveResult.status === "fulfilled") {
      sourceStats.remotive = remotiveResult.value.length
      merged.push(...remotiveResult.value)
    } else {
      sourceStats.remotive = 0
      sourceStats.remotiveError = String(remotiveResult.reason)
    }

    if (merged.length === 0) {
      return NextResponse.json(
        { success: false, error: "All external sources failed. Try again shortly." },
        { status: 503 }
      )
    }

    // Deduplicate by externalId or company + title
    const seen = new Set<string>()
    const deduped = merged.filter((job) => {
      const key = job.externalId || `${job.title.toLowerCase()}|${job.company.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Store in cache
    cache.set(cacheKey, { data: deduped, sourceStats, cachedAt: Date.now() })

    return NextResponse.json({
      success: true,
      data: rankAndScore(deduped, userSkills),
      sourceStats,
      cached: false,
    })
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }
    console.error("[/api/jobs/realtime] Unhandled error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ─── Skill Ranking Helper ─────────────────────────────────────────────────────

function rankAndScore(jobs: Internship[], skills: string[]): Internship[] {
  if (skills.length === 0) return jobs

  const profile = buildProfileFromSkills(skills)
  const scores = rankInternships(profile, jobs)
  const scoreMap = new Map(scores.map((s) => [s.internshipId, s.score]))

  return jobs
    .map((job) => ({ ...job, matchScore: scoreMap.get(job.id) ?? 50 }))
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
}
