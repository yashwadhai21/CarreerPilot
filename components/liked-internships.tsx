"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, Heart, MapPin, Clock, IndianRupee, ExternalLink,
  Building, Trash2, Star, Award
} from "lucide-react"
import type { Internship } from "@/lib/types"

interface LikedInternshipsProps {
  internships: Internship[]
  onBack: () => void
  onUnlike: (id: number) => void
}

function LogoWithFallback({ company, logo }: { company: string; logo: string }) {
  const [err, setErr] = useState(false)
  const initials = company.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
  return (
    <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border flex items-center justify-center">
      {!err ? (
        <img src={logo} alt={`${company} logo`} className="h-full w-full object-contain p-1" onError={() => setErr(true)} />
      ) : (
        <span className="text-primary font-bold text-sm">{initials}</span>
      )}
    </div>
  )
}

export function LikedInternships({ internships, onBack, onUnlike }: LikedInternshipsProps) {
  if (internships.length === 0) {
    return (
      <div className="min-h-screen bg-neon-gradient flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Heart className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">No Liked Internships Yet</h2>
          <p className="text-muted-foreground text-sm">Swipe right on internships you're interested in to save them here.</p>
          <Button onClick={onBack} className="neon-btn mt-2">
            Start Swiping
          </Button>
        </div>
      </div>
    )
  }

  const pmScheme = internships.filter((i) => i.scheme)
  const private_ = internships.filter((i) => !i.scheme)

  return (
    <div className="min-h-screen bg-neon-gradient">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <Heart className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Liked Internships</h1>
              <span className="neon-badge">{internships.length} saved</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        {/* PM Scheme section */}
        {pmScheme.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-700" />
              <h2 className="text-sm font-semibold text-amber-800 uppercase tracking-wider">
                Government Backed — PM Scheme ({pmScheme.length})
              </h2>
              <div className="flex-1 neon-divider ml-2" />
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
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">
                Private Companies ({private_.length})
              </h2>
              <div className="flex-1 neon-divider ml-2" />
            </div>
            <div className="space-y-3">
              {private_.map((internship) => (
                <InternshipRow key={internship.id} internship={internship} onUnlike={onUnlike} />
              ))}
            </div>
          </div>
        )}

        {/* Summary banner */}
        <Card className="neon-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Ready to apply? You've shortlisted {internships.length} role{internships.length !== 1 ? "s" : ""}
                </p>
                {pmScheme.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {pmScheme.length} role{pmScheme.length !== 1 ? "s" : ""} include ₹5,000/month govt. allowance
                  </p>
                )}
              </div>
              <Button
                size="sm"
                className="neon-btn text-xs"
                onClick={() => window.open("https://pminternship.mca.gov.in", "_blank")}
              >
                Apply on PM Portal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InternshipRow({ internship, onUnlike }: { internship: Internship; onUnlike: (id: number) => void }) {
  const [err, setErr] = useState(false)
  const initials = internship.company.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()

  return (
    <Card className="neon-card border-0 group transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border flex items-center justify-center">
            {!err ? (
              <img src={internship.logo} alt={internship.company} className="h-full w-full object-contain p-1" onError={() => setErr(true)} />
            ) : (
              <span className="text-primary font-bold text-sm">{initials}</span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="font-semibold text-foreground text-sm leading-tight">{internship.title}</h3>
                <p className="text-primary text-sm font-medium">{internship.company}</p>
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                {internship.scheme && (
                  <span className="neon-badge neon-badge-orange text-xs">PM Scheme</span>
                )}
                {internship.matchScore && (
                  <span className="neon-badge text-xs flex items-center gap-1">
                    <Star className="h-2.5 w-2.5" />
                    {internship.matchScore}%
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {internship.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {internship.duration}
              </span>
              <span className="flex items-center gap-1 text-emerald-700">
                <IndianRupee className="h-3 w-3" />
                {internship.salary}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-7 text-xs neon-btn"
                onClick={() => internship.applyLink && window.open(internship.applyLink, "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Apply Now
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => onUnlike(internship.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
