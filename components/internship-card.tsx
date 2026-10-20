"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, IndianRupee, Eye, Award, Building, Sparkles, Check, ArrowRight } from "lucide-react"
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

export function InternshipCard({
  internship,
  onViewDetails,
  swipeDirection,
  dragOffset,
  userSkills = [],
}: InternshipCardProps) {
  const opacity = Math.max(0.6, 1 - Math.abs(dragOffset.x) / 300)
  const [imgError, setImgError] = useState(false)

  const initials = internship.company
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  // Dynamic skill gap computation
  const hasResume = userSkills.length > 0
  const requirements = internship.requirements || []

  const dynamicMatchedSkills = hasResume
    ? userSkills.filter((us) => requirements.some((req) => skillsMatch(us, req)))
    : []

  const dynamicMissingSkills = requirements.filter(
    (req) => !userSkills.some((us) => skillsMatch(us, req))
  )

  const dynamicMatchPct =
    hasResume && requirements.length > 0
      ? Math.round((dynamicMatchedSkills.length / requirements.length) * 100)
      : internship.matchScore ?? null

  return (
    <Card
      className="h-full border border-border/80 surface-card rounded-3xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/25 flex flex-col select-none"
      style={{ opacity }}
    >
      <CardContent className="p-0 h-full flex flex-col justify-between">
        {/* Top Header / Scheme Bar */}
        <div>
          {internship.scheme ? (
            <div className="bg-gradient-to-r from-accent via-accent/80 to-card/90 px-4 py-2.5 border-b border-accent/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground font-black text-[10px] flex items-center justify-center shadow-xs">
                  PM
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block leading-tight">
                    {internship.scheme}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-none">
                    Govt. of India Initiative
                  </span>
                </div>
              </div>
              <span className="badge-warning text-[10px] py-0.5">₹5,000/mo Allowance</span>
            </div>
          ) : (
            <div className="px-5 pt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span className="badge-primary text-[10px]">{internship.type || "Internship"}</span>
              {internship.sector && (
                <span className="flex items-center gap-1 font-medium text-muted-foreground text-[11px]">
                  <Building className="h-3 w-3" />
                  {internship.sector}
                </span>
              )}
            </div>
          )}

          {/* Company & Role Header */}
          <div className="p-5 pb-3">
            <div className="flex items-start gap-4">
              {/* Logo with high-contrast fallback */}
              <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-card flex-shrink-0 border border-border/80 shadow-xs flex items-center justify-center p-1.5">
                {!imgError ? (
                  <img
                    src={internship.logo}
                    alt={`${internship.company} logo`}
                    className="h-full w-full object-contain"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-primary/10 text-primary font-black text-xl flex items-center justify-center">
                    {initials}
                  </div>
                )}
              </div>

              {/* Title & Organization */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-foreground leading-snug line-clamp-2">
                  {internship.title}
                </h3>
                <p className="text-primary font-semibold text-sm mt-0.5">{internship.company}</p>

                {/* Match score pill */}
                {dynamicMatchPct !== null && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success/15 border border-success/30 text-success text-xs font-bold">
                    <Sparkles className="h-3 w-3" />
                    <span>{dynamicMatchPct}% Match</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Key Meta Badges */}
          <div className="px-5 py-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-y border-border/50 bg-muted/30">
            <div className="flex items-center gap-1.5 py-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-medium text-foreground">{internship.location}</span>
            </div>
            <div className="flex items-center gap-1.5 py-1.5">
              <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{internship.duration}</span>
            </div>
            <div className="flex items-center gap-1 py-1.5 ml-auto text-success font-bold">
              <IndianRupee className="h-3.5 w-3.5 shrink-0" />
              <span>{internship.salary}</span>
            </div>
          </div>

          {/* Description */}
          <div className="p-5 pb-2">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {internship.description}
            </p>
          </div>

          {/* Requirements & Skill Chips */}
          <div className="px-5 pb-3">
            <h4 className="text-xs font-semibold text-foreground/80 mb-2">Key Skills & Requirements</h4>
            <div className="flex flex-wrap gap-1.5">
              {requirements.slice(0, 5).map((req, index) => {
                const isMatched = hasResume && userSkills.some((us) => skillsMatch(us, req))
                return (
                  <span
                    key={index}
                    className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-lg border font-medium ${
                      isMatched
                        ? "bg-success/15 border-success/30 text-success font-semibold"
                        : "bg-muted border-border/80 text-foreground"
                    }`}
                  >
                    {isMatched && <Check className="h-3 w-3" />}
                    {req}
                  </span>
                )
              })}
              {requirements.length > 5 && (
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-muted text-muted-foreground font-medium self-center">
                  +{requirements.length - 5} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card Footer: View Details CTA */}
        <div className="p-5 pt-2 border-t border-border/50 bg-card/60">
          <Button
            onClick={onViewDetails}
            variant="outline"
            className="w-full h-11 text-sm font-semibold rounded-2xl border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            <span>View Full Internship & Skill Analysis</span>
            <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

