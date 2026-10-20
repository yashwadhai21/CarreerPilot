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
  Building,
  Sparkles,
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
    <div className="h-20 w-20 rounded-2xl overflow-hidden bg-card flex-shrink-0 border border-border shadow-xs flex items-center justify-center p-2">
      {!err ? (
        <img
          src={logo}
          alt={`${company} logo`}
          className="h-full w-full object-contain"
          onError={() => setErr(true)}
        />
      ) : (
        <span className="text-primary font-black text-2xl">{initials}</span>
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

export function InternshipDetail({
  internship,
  onBack,
  onApply,
  userSkills = [],
}: InternshipDetailProps) {
  const hasResume = userSkills.length > 0
  const requirements = internship.requirements || []

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
      : internship.matchScore ?? 0

  return (
    <div className="min-h-screen bg-app-ambient text-foreground pb-12">
      {/* Sticky Header with Back Button */}
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
            <div>
              <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight truncate max-w-[220px] sm:max-w-md">
                {internship.title}
              </h1>
              <p className="text-xs text-muted-foreground leading-none">{internship.company}</p>
            </div>
          </div>
          {internship.scheme && (
            <span className="badge-warning text-xs font-bold py-1">PM Scheme</span>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        {/* Main Card */}
        <Card className="border border-border/80 surface-card rounded-3xl overflow-hidden shadow-lg">
          {/* PM Scheme Header Banner */}
          {internship.scheme && (
            <div className="bg-gradient-to-r from-accent via-accent/80 to-card px-6 py-4 border-b border-accent/40 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                PM
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  Prime Minister Internship Scheme
                </h3>
                <p className="text-xs text-muted-foreground">
                  Government of India Initiative • Skilling 1 Crore Indian Youth
                </p>
              </div>
            </div>
          )}

          <CardHeader className="p-6 pb-4">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <LogoWithFallback company={internship.company} logo={internship.logo} />

              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                  {internship.title}
                </CardTitle>
                <p className="text-base text-primary font-semibold mt-1">{internship.company}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="badge-primary text-xs">{internship.type || "Internship"}</span>
                  {internship.sector && (
                    <span className="badge-secondary text-xs flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {internship.sector}
                    </span>
                  )}
                  {hasResume && (
                    <span className="badge-success text-xs font-bold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {matchPct}% Match
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-0 space-y-6">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-muted/40 border border-border/60">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Location</p>
                  <p className="font-semibold text-foreground">{internship.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Duration</p>
                  <p className="font-semibold text-foreground">{internship.duration}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                <div className="w-8 h-8 rounded-lg bg-success/15 text-success flex items-center justify-center shrink-0">
                  <IndianRupee className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Stipend</p>
                  <p className="font-bold text-success">{internship.salary}</p>
                </div>
              </div>
            </div>

            {/* Government Benefits Highlight */}
            {internship.scheme && (
              <div className="p-5 rounded-2xl bg-success/10 border border-success/25 space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Government Scheme Benefits
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <IndianRupee className="h-4 w-4 text-success shrink-0" />
                    <span>₹5,000 monthly govt. allowance</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Award className="h-4 w-4 text-success shrink-0" />
                    <span>Official National Certificate</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Users className="h-4 w-4 text-success shrink-0" />
                    <span>Industry Mentorship Program</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Calendar className="h-4 w-4 text-success shrink-0" />
                    <span>12-Month Guaranteed Tenure</span>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-foreground">About the role</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {internship.description}
              </p>
            </div>

            {/* Requirements */}
            <div className="space-y-2.5">
              <h3 className="text-sm sm:text-base font-bold text-foreground">Requirements & Qualifications</h3>
              <div className="flex flex-wrap gap-2">
                {requirements.map((req, index) => (
                  <span
                    key={index}
                    className="text-xs px-3 py-1 rounded-xl bg-card border border-border text-foreground font-medium shadow-2xs"
                  >
                    {req}
                  </span>
                ))}
              </div>
            </div>

            {/* Skill Gap Analysis Section */}
            <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Personalized Skill Gap Analysis
                  </h3>
                </div>
                {hasResume && (
                  <span className="badge-primary text-xs font-bold">{matchPct}% match</span>
                )}
              </div>

              {hasResume ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 font-medium">
                      <span>Requirement Readiness</span>
                      <span>
                        {matchedSkills.length} of {requirements.length} matched
                      </span>
                    </div>
                    <Progress value={matchPct} className="h-2.5 rounded-full" />
                  </div>

                  <div className="space-y-3">
                    {/* Matched skills */}
                    {matchedSkills.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-success/10 border border-success/25 space-y-2">
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-success" />
                          Skills You Already Have ({matchedSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {matchedSkills.map((skill, i) => (
                            <span
                              key={i}
                              className="text-xs px-2.5 py-0.5 rounded-lg bg-success/20 text-foreground font-medium"
                            >
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills to learn */}
                    {skillsToLearn.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/30 space-y-2">
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5 text-warning" />
                          Recommended Skills to Learn ({skillsToLearn.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {skillsToLearn.map((skill, i) => (
                            <span
                              key={i}
                              className="text-xs px-2.5 py-0.5 rounded-lg bg-warning/20 text-foreground font-medium"
                            >
                              + {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bonus skills */}
                    {bonusSkills.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 space-y-2">
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5 text-primary" />
                          Additional Strengths You Bring ({bonusSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {bonusSkills.slice(0, 6).map((skill, i) => (
                            <span
                              key={i}
                              className="text-xs px-2.5 py-0.5 rounded-lg bg-primary/20 text-foreground font-medium"
                            >
                              ★ {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Upload your resume</p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Upload your resume in the dashboard to see an automatic skill fit breakdown and missing
                    skills for this specific opportunity.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={onApply}
                className="flex-1 h-12 btn-primary rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Heart className="h-4 w-4" />
                <span>Like & Shortlist Internship</span>
              </Button>

              {internship.applyLink && (
                <Button
                  variant="outline"
                  onClick={() => window.open(internship.applyLink, "_blank")}
                  className="h-12 rounded-xl border-border hover:bg-muted font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Official Application Portal</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Learning & Culture Card */}
        <Card className="border border-border/80 surface-card rounded-3xl p-6 shadow-sm space-y-4">
          <CardTitle className="text-base font-bold text-foreground">What you will gain</CardTitle>
          <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <span className="text-primary font-bold mt-0.5">▸</span>
              <span>Direct hands-on experience working on real-world projects with modern technology.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-primary font-bold mt-0.5">▸</span>
              <span>1-on-1 mentorship from senior industry practitioners & government leaders.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-primary font-bold mt-0.5">▸</span>
              <span>Guaranteed certification recognized across top Indian corporations & startups.</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

