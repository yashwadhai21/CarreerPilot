"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, IndianRupee, Eye, Award, Building, Star } from "lucide-react"
import type { Internship } from "@/lib/types"

interface InternshipCardProps {
  internship: Internship
  onViewDetails: () => void
  swipeDirection?: "left" | "right" | null
  dragOffset: { x: number; y: number }
  /** Skills extracted from the user's uploaded resume */
  userSkills?: string[]
}

/** Case-insensitive partial match between two skill strings */
function skillsMatch(a: string, b: string): boolean {
  const al = a.toLowerCase().trim()
  const bl = b.toLowerCase().trim()
  return al === bl || al.includes(bl) || bl.includes(al)
}

export function InternshipCard({ internship, onViewDetails, swipeDirection, dragOffset, userSkills = [] }: InternshipCardProps) {
  const opacity = Math.max(0.6, 1 - Math.abs(dragOffset.x) / 300)
  const [imgError, setImgError] = useState(false)

  const initials = internship.company
    .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()

  // ── Dynamic skill gap computation (mirrors InternshipDetail logic) ──────────
  const hasResume = userSkills.length > 0
  const requirements = internship.requirements

  const dynamicMatchedSkills = hasResume
    ? userSkills.filter((us) => requirements.some((req) => skillsMatch(us, req)))
    : []

  const dynamicMissingSkills = requirements.filter(
    (req) => !userSkills.some((us) => skillsMatch(us, req))
  )

  const dynamicMatchPct =
    hasResume && requirements.length > 0
      ? Math.round((dynamicMatchedSkills.length / requirements.length) * 100)
      : null

  return (
    <Card
      className="h-full border-0 neon-card overflow-hidden"
      style={{ opacity }}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {/* PM Scheme banner */}
        {internship.scheme && (
          <div className="bg-gradient-to-r from-[oklch(0.68_0.20_50)] to-[oklch(0.55_0.24_280)] p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white font-bold text-[10px]">PM</span>
                </div>
                <span className="text-sm font-semibold">{internship.scheme}</span>
              </div>
              <span className="text-[10px] font-medium text-white/80 bg-white/15 px-2 py-0.5 rounded-full border border-white/20">
                Government Backed
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-4 mb-3">
            {/* Logo with fallback */}
            <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-[oklch(0.14_0.03_264)] flex-shrink-0 border border-[oklch(0.25_0.06_265/0.4)] flex items-center justify-center">
              {!imgError ? (
                <img
                  src={internship.logo}
                  alt={`${internship.company} logo`}
                  className="h-full w-full object-contain p-1"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-[oklch(0.75_0.20_265)] font-bold text-lg">{initials}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-foreground leading-tight text-balance">{internship.title}</h3>
              <p className="text-[oklch(0.70_0.22_265)] font-semibold text-sm">{internship.company}</p>
              {internship.sector && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Building className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{internship.sector}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="neon-badge text-[11px]">{internship.type}</span>
            {dynamicMatchPct !== null ? (
              <span className="neon-badge-green text-[11px] flex items-center gap-1">
                <Star className="h-2.5 w-2.5" />
                {dynamicMatchPct}% match
              </span>
            ) : internship.matchScore ? (
              <span className="neon-badge-green text-[11px] flex items-center gap-1">
                <Star className="h-2.5 w-2.5" />
                {internship.matchScore}% match
              </span>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 flex-1 flex flex-col">
          {/* Info row */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-[oklch(0.68_0.24_265/0.7)]" />
              <span>{internship.location}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-[oklch(0.68_0.24_265/0.7)]" />
              <span>{internship.duration}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <IndianRupee className="h-3.5 w-3.5 text-[oklch(0.78_0.18_150/0.8)]" />
              <span className="text-[oklch(0.78_0.18_150)] font-medium">{internship.salary}</span>
              {internship.scheme && (
                <span className="neon-badge-green text-[10px] ml-1">+ ₹5,000 Govt. Allowance</span>
              )}
            </div>
          </div>

          {/* Neon divider */}
          <div className="neon-divider mb-3" />

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-3 flex-1 line-clamp-4">
            {internship.description}
          </p>

          {/* Requirements */}
          <div className="mb-3">
            <h4 className="text-xs font-semibold mb-2 text-foreground/80">Requirements</h4>
            <div className="flex flex-wrap gap-1.5">
              {internship.requirements.slice(0, 4).map((req, index) => (
                <span key={index} className="text-[10px] px-2 py-0.5 rounded-md bg-[oklch(0.14_0.03_264)] border border-[oklch(0.25_0.06_265/0.3)] text-muted-foreground">
                  {req}
                </span>
              ))}
              {internship.requirements.length > 4 && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[oklch(0.14_0.03_264)] border border-[oklch(0.25_0.06_265/0.3)] text-muted-foreground">
                  +{internship.requirements.length - 4} more
                </span>
              )}
            </div>
          </div>

          {/* Skill match bar — dynamic when resume uploaded, hidden otherwise */}
          {hasResume && (
            <div className="mb-3 p-2.5 rounded-lg bg-[oklch(0.13_0.03_264)] border border-[oklch(0.25_0.06_265/0.2)]">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-3.5 w-3.5 text-[oklch(0.82_0.18_50)]" />
                <span className="text-xs font-medium text-foreground/80">Skill Match</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-[oklch(0.78_0.18_150)]">✓ {dynamicMatchedSkills.length} matched</span>
                {dynamicMissingSkills.length > 0 && (
                  <span className="text-[oklch(0.82_0.18_50)]">· {dynamicMissingSkills.length} to develop</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* View details */}
        <div className="p-5 pt-0">
          <Button
            onClick={onViewDetails}
            variant="ghost"
            className="w-full h-9 text-sm border border-[oklch(0.25_0.06_265/0.4)] text-[oklch(0.70_0.22_265)] hover:bg-[oklch(0.68_0.24_265/0.08)] hover:border-[oklch(0.68_0.24_265/0.5)] hover:text-[oklch(0.80_0.22_265)] transition-all duration-200 rounded-xl"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
