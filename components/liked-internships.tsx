"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Heart,
  MapPin,
  Clock,
  IndianRupee,
  ExternalLink,
  Building,
  Trash2,
  Star,
  Award,
  Sparkles,
} from "lucide-react"
import type { Internship } from "@/lib/types"

interface LikedInternshipsProps {
  internships: Internship[]
  onBack: () => void
  onUnlike: (id: number) => void
}

function LogoWithFallback({ company, logo }: { company: string; logo: string }) {
  const [err, setErr] = useState(false)
  const initials = company
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <div className="h-14 w-14 rounded-2xl overflow-hidden bg-card flex-shrink-0 border border-border shadow-xs flex items-center justify-center p-1.5">
      {!err ? (
        <img
          src={logo}
          alt={`${company} logo`}
          className="h-full w-full object-contain"
          onError={() => setErr(true)}
        />
      ) : (
        <span className="text-primary font-black text-base">{initials}</span>
      )}
    </div>
  )
}

export function LikedInternships({ internships, onBack, onUnlike }: LikedInternshipsProps) {
  if (internships.length === 0) {
    return (
      <div className="min-h-screen bg-app-ambient flex flex-col items-center justify-center p-6">
        <div className="surface-card rounded-3xl p-8 text-center space-y-4 max-w-sm shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-foreground">No Saved Internships Yet</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Swipe right on internships in the deck to save them here for easy comparison and application.
            </p>
          </div>
          <Button onClick={onBack} className="btn-primary w-full h-11 rounded-xl">
            Start Discovering
          </Button>
        </div>
      </div>
    )
  }

  const pmScheme = internships.filter((i) => i.scheme)
  const private_ = internships.filter((i) => !i.scheme)

  return (
    <div className="min-h-screen bg-app-ambient text-foreground pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/85 backdrop-blur-md border-b border-border shadow-xs">
        <div className="container mx-auto px-4 py-3 max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              className="rounded-xl border-border bg-card/60"
              aria-label="Back to internships"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-success/15 text-success flex items-center justify-center shrink-0">
                <Heart className="h-4 w-4 fill-current" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                  Saved Shortlist
                </h1>
                <p className="text-xs text-muted-foreground leading-none">
                  {internships.length} role{internships.length !== 1 ? "s" : ""} shortlisted
                </p>
              </div>
            </div>
          </div>
          <span className="badge-primary text-xs font-bold">{internships.length} Saved</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        {/* PM Scheme section */}
        {pmScheme.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-accent-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-accent-foreground">
                Government PM Scheme ({pmScheme.length})
              </h2>
              <div className="flex-1 surface-divider ml-2" />
            </div>
            <div className="space-y-3">
              {pmScheme.map((internship) => (
                <InternshipRow key={internship.id} internship={internship} onUnlike={onUnlike} />
              ))}
            </div>
          </div>
        )}

        {/* Private companies section */}
        {private_.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                Industry Opportunities ({private_.length})
              </h2>
              <div className="flex-1 surface-divider ml-2" />
            </div>
            <div className="space-y-3">
              {private_.map((internship) => (
                <InternshipRow key={internship.id} internship={internship} onUnlike={onUnlike} />
              ))}
            </div>
          </div>
        )}

        {/* Summary application banner */}
        <Card className="surface-card rounded-2xl border border-border/80 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-foreground">
                Ready to submit applications? You've shortlisted {internships.length} role
                {internships.length !== 1 ? "s" : ""}.
              </p>
              {pmScheme.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {pmScheme.length} role{pmScheme.length !== 1 ? "s" : ""} qualify for the official
                  ₹5,000/month government allowance.
                </p>
              )}
            </div>
            <Button
              size="sm"
              className="btn-primary h-10 px-5 rounded-xl shrink-0 font-bold"
              onClick={() => window.open("https://pminternship.mca.gov.in", "_blank")}
            >
              Apply on PM Portal
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

function InternshipRow({
  internship,
  onUnlike,
}: {
  internship: Internship
  onUnlike: (id: number) => void
}) {
  return (
    <Card className="surface-card surface-card-hover rounded-2xl border border-border/80 shadow-xs transition-all">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <LogoWithFallback company={internship.company} logo={internship.logo} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <h3 className="font-bold text-foreground text-sm sm:text-base leading-snug line-clamp-1">
                  {internship.title}
                </h3>
                <p className="text-primary text-xs sm:text-sm font-semibold">{internship.company}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {internship.scheme && (
                  <span className="badge-warning text-[10px] font-bold">PM Scheme</span>
                )}
                {internship.matchScore && (
                  <span className="badge-success text-[10px] font-bold flex items-center gap-1">
                    <Star className="h-2.5 w-2.5" />
                    {internship.matchScore}%
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {internship.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {internship.duration}
              </span>
              <span className="flex items-center gap-1 text-success font-bold">
                <IndianRupee className="h-3.5 w-3.5" />
                {internship.salary}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                className="btn-primary h-8 px-3 text-xs rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                onClick={() => internship.applyLink && window.open(internship.applyLink, "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Apply Now</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs rounded-lg border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 transition-colors cursor-pointer"
                onClick={() => onUnlike(internship.id)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                <span>Remove</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

