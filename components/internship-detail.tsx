"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  MapPin,
  Clock,
  IndianRupee,
  ExternalLink,
  Heart,
  Award,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Target,
  Upload,
} from "lucide-react"

function LogoWithFallback({ company, logo }: { company: string; logo: string }) {
  const [err, setErr] = useState(false)
  const initials = company
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
  return (
    <div className="h-20 w-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 flex items-center justify-center">
      {!err ? (
        <img
          src={logo}
          alt={`${company} logo`}
          className="h-full w-full object-contain p-1"
          onError={() => setErr(true)}
        />
      ) : (
        <span className="text-slate-700 font-bold text-xl">{initials}</span>
      )}
    </div>
  )
}

interface Internship {
  id: number
  title: string
  company: string
  location: string
  duration: string
  description: string
  requirements: string[]
  salary: string
  type: string
  logo: string
  scheme?: string
  sector?: string
  skills?: string[]
  missingSkills?: string[]
  applyLink?: string
  openings?: number
  matchScore?: number
}

interface InternshipDetailProps {
  internship: Internship
  onBack: () => void
  onApply: () => void
  /** Skills extracted from the user's uploaded resume */
  userSkills?: string[]
}

/** Case-insensitive partial match between two skill strings */
function skillsMatch(a: string, b: string): boolean {
  const al = a.toLowerCase().trim()
  const bl = b.toLowerCase().trim()
  return al === bl || al.includes(bl) || bl.includes(al)
}

export function InternshipDetail({ internship, onBack, onApply, userSkills = [] }: InternshipDetailProps) {
  const hasResume = userSkills.length > 0

  // ── Per-internship skill gap computation ─────────────────────────────────────
  const requirements = internship.requirements

  const matchedSkills = hasResume
    ? userSkills.filter((us) => requirements.some((req) => skillsMatch(us, req)))
    : []

  const skillsToLearn = requirements.filter(
    (req) => !userSkills.some((us) => skillsMatch(us, req))
  )

  const bonusSkills = hasResume
    ? userSkills.filter((us) => !requirements.some((req) => skillsMatch(us, req)))
    : []

  const matchPct =
    requirements.length > 0
      ? Math.round((matchedSkills.length / requirements.length) * 100)
      : 0

  return (
    <div className="min-h-screen bg-neon-gradient">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Internship Details</h1>
            {internship.scheme && (
              <span className="ml-auto neon-badge neon-badge-orange">{internship.scheme}</span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card className="mb-6 border-0 neon-card">
          <CardHeader>
            {internship.scheme && (
              <div className="bg-gradient-to-r from-[oklch(0.68_0.20_50)] to-[oklch(0.55_0.24_280)] -mx-6 -mt-6 mb-4 p-4 rounded-t-xl">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <span className="text-white font-bold text-sm">PM</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Prime Minister Internship Scheme</h3>
                    <p className="text-sm opacity-80">Government of India Initiative • 1 Crore Youth Program</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              <LogoWithFallback company={internship.company} logo={internship.logo} />

              <div className="flex-1">
                <CardTitle className="text-2xl mb-2 text-balance text-foreground">{internship.title}</CardTitle>
                <p className="text-lg text-primary font-semibold mb-2">{internship.company}</p>
                <div className="flex gap-2 mb-3">
                  <span className="neon-badge">{internship.type}</span>
                  {internship.sector && (
                    <span className="neon-badge text-muted-foreground">{internship.sector}</span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{internship.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{internship.duration}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <IndianRupee className="h-4 w-4 text-emerald-700" />
                <span className="text-emerald-700 font-medium">{internship.salary}</span>
              </div>
            </div>

            {internship.scheme && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <h3 className="text-base font-semibold mb-3 text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Government Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IndianRupee className="h-4 w-4 text-emerald-700" />
                    <span>₹5,000 monthly allowance</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Award className="h-4 w-4 text-emerald-700" />
                    <span>Government certificate</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4 text-emerald-700" />
                    <span>Skill development training</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-emerald-700" />
                    <span>12-month guaranteed duration</span>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-foreground">About this internship</h3>
              <p className="text-muted-foreground leading-relaxed text-pretty">{internship.description}</p>
            </div>

            {/* Requirements */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Requirements</h3>
              <div className="flex flex-wrap gap-2">
                {requirements.map((req, index) => (
                  <span
                    key={index}
                    className="text-xs px-2.5 py-1 rounded-lg bg-muted border border-border text-foreground"
                  >
                    {req}
                  </span>
                ))}
              </div>
            </div>

            {/* ── PER-INTERNSHIP SKILL GAP ANALYSIS ─────────────────────────────── */}
            <div className="mb-6 p-4 bg-muted/80 border border-border rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">Skill Gap Analysis</h3>
                {hasResume && (
                  <span className="ml-auto text-xs neon-badge">{matchPct}% match</span>
                )}
              </div>

              {hasResume ? (
                <>
                  {/* Match score bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Your fit for this role</span>
                      <span>{matchedSkills.length} / {requirements.length} requirements met</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${matchPct}%`,
                          background: matchPct >= 70
                            ? "#047857"
                            : matchPct >= 40
                            ? "#b45309"
                            : "#b91c1c",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {/* Matched skills */}
                    {matchedSkills.length > 0 && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <h4 className="text-xs font-semibold text-emerald-800 mb-2 flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5" />
                          You already have ({matchedSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {matchedSkills.map((skill, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800">
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills to learn */}
                    {skillsToLearn.length > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5" />
                          Skills to develop ({skillsToLearn.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {skillsToLearn.map((skill, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800">
                              + {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bonus skills */}
                    {bonusSkills.length > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5" />
                          Extra skills you bring ({bonusSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {bonusSkills.slice(0, 6).map((skill, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-800">
                              ★ {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {matchedSkills.length === 0 && skillsToLearn.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        No skill data to compare for this role.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                // No resume uploaded yet
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground opacity-50" />
                  <div>
                    <p className="text-sm text-muted-foreground">Upload your resume to see a personalised skill gap analysis for this role.</p>
                    <p className="text-xs text-muted-foreground mt-1 opacity-60">Shows which requirements you meet and what to learn next.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button onClick={onApply} className="flex-1 flex items-center gap-2 neon-btn">
                <Heart className="h-4 w-4" />
                Like & Save
              </Button>
              {internship.applyLink && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-border text-foreground hover:bg-accent bg-card"
                  onClick={() => window.open(internship.applyLink, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Official Portal
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional info card */}
        <div className="grid gap-4">
          <Card className="border-0 neon-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">What you'll learn</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">▸</span>Hands-on experience with industry-standard tools and technologies</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">▸</span>Direct mentorship from senior professionals and government liaisons</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">▸</span>Real-world project experience contributing to national development</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">▸</span>Professional networking with government and industry leaders</li>
                {internship.scheme && (
                  <>
                    <li className="flex items-start gap-2"><span className="text-amber-700 mt-0.5">▸</span>Understanding of government digital initiatives and policies</li>
                    <li className="flex items-start gap-2"><span className="text-amber-700 mt-0.5">▸</span>Certification recognized by Government of India</li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 neon-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">
                {internship.scheme ? "Partnership Impact" : "Company Culture"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-pretty">
                {internship.scheme
                  ? "This internship is part of the Government of India's mission to skill 1 crore youth. You'll contribute to nation-building while gaining valuable industry experience in a structured, government-backed program with guaranteed learning outcomes and career progression opportunities."
                  : "Join a dynamic team that values innovation, collaboration, and continuous learning. We provide a supportive environment where interns can grow and make meaningful contributions."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
