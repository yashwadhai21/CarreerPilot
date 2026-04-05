/**
 * /api/jobs/realtime
 * Hybrid aggregator: fetches from GitHub SimplifyJobs, RemoteOK, and Jooble
 * concurrently via Promise.allSettled, merges & skill-ranks the results.
 *
 * Token-saving strategy:
 *   - Server-side in-memory cache (10-minute TTL, keyed by skill set)
 *   - Jooble is only called when the cache is cold (saves the 500-req limit)
 *   - GitHub & RemoteOK are free/unlimited
 *   - Cache is shared across all users hitting the same skill set
 */

import { NextRequest, NextResponse } from "next/server"
import {
  parseGitHubMarkdown,
  parseRemoteOKJson,
  parseRemotiveResponse,
} from "@/lib/realtime-parsers"
import { rankInternships, buildProfileFromSkills } from "@/lib/skill-matcher"
import type { Internship } from "@/lib/types"

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
    next: { revalidate: 600 }, // Next.js data cache — 10 min
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`)
  const text = await res.text()
  return parseGitHubMarkdown(text, 30) // max 30 rows from the table
}

async function fetchRemoteOK(): Promise<Internship[]> {
  const res = await fetch("https://remoteok.com/api?tag=intern", {
    headers: { "User-Agent": "AuraMatch-InternshipPortal/1.0" },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`RemoteOK fetch failed: ${res.status}`)
  const json = await res.json()
  // RemoteOK returns an array where index 0 is a legal notice
  const jobs = Array.isArray(json) ? json.slice(1) : []
  return parseRemoteOKJson(jobs, 20)
}

async function fetchRemotive(skills: string[]): Promise<Internship[]> {
  // Remotive is 100% free, no API key needed
  const tag = skills.length > 0 ? skills[0].toLowerCase() : "software"
  // Try skill-specific first, fall back to generic intern search
  const urls = [
    `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(tag + " intern")}&limit=15`,
    `https://remotive.com/api/remote-jobs?category=software-dev&search=intern&limit=15`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "AuraMatch-InternshipPortal/1.0" },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue
      const data = await res.json()
      const jobs = data?.jobs ?? []
      console.log(`[realtime] Remotive returned ${jobs.length} jobs from ${url}`)
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
    const { searchParams } = new URL(request.url)
    const userSkills = searchParams.get("skills")?.split(",").filter(Boolean) ?? []
    const forceRefresh = searchParams.get("refresh") === "1"

    const cacheKey = getCacheKey(userSkills)

    // Serve from cache if available (saves Jooble API calls)
    if (!forceRefresh) {
      const cached = getCached(cacheKey)
      if (cached) {
        console.log(`[realtime] Cache HIT for key="${cacheKey}"`)
        return NextResponse.json({
          success: true,
          data: rankAndScore(cached.data, userSkills),
          sourceStats: cached.sourceStats,
          cached: true,
          cacheAgeSeconds: Math.floor((Date.now() - cached.cachedAt) / 1000),
        })
      }
    }

    console.log(`[realtime] Cache MISS — fetching all sources for key="${cacheKey}"`)

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
      console.error("[realtime] GitHub failed:", githubResult.reason)
    }

    if (remoteokResult.status === "fulfilled") {
      sourceStats.remoteok = remoteokResult.value.length
      merged.push(...remoteokResult.value)
    } else {
      sourceStats.remoteok = 0
      sourceStats.remoteokError = String(remoteokResult.reason)
      console.error("[realtime] RemoteOK failed:", remoteokResult.reason)
    }

    if (remotiveResult.status === "fulfilled") {
      sourceStats.remotive = remotiveResult.value.length
      merged.push(...remotiveResult.value)
    } else {
      sourceStats.remotive = 0
      sourceStats.remotiveError = String(remotiveResult.reason)
      console.error("[realtime] Remotive failed:", remotiveResult.reason)
    }

    if (merged.length === 0) {
      return NextResponse.json(
        { success: false, error: "All external sources failed. Try again shortly." },
        { status: 503 }
      )
    }

    // Deduplicate by title + company (case-insensitive)
    const seen = new Set<string>()
    const deduped = merged.filter((job) => {
      const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Store in cache (raw deduped data, ranking happens per-request based on skills)
    cache.set(cacheKey, { data: deduped, sourceStats, cachedAt: Date.now() })

    return NextResponse.json({
      success: true,
      data: rankAndScore(deduped, userSkills),
      sourceStats,
      cached: false,
    })
  } catch (error: any) {
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
