"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Target,
  BookOpen,
  Building,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import type { AnalysisResult } from "@/lib/types"
import { toast } from "sonner"

interface ResumeAnalyzerProps {
  onBack: () => void
  onAnalysisComplete?: (analysis: AnalysisResult) => void
}

export function ResumeAnalyzer({ onBack, onAnalysisComplete }: ResumeAnalyzerProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setAnalysis(null)
      setError(null)
    }
  }

  const handleAnalyze = async () => {
    if (!file) return

    setIsAnalyzing(true)
    setError(null)
    setProgress(15)

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 15, 85))
    }, 400)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      const json = await res.json()
      clearInterval(progressInterval)
      setProgress(100)

      if (!json.success) {
        const msg = json.error || "Analysis failed. Please try again."
        setError(msg)
        toast.error("Resume analysis failed", { description: msg })
        setIsAnalyzing(false)
        return
      }

      setAnalysis(json.data)
      toast.success("Resume analyzed successfully!", {
        description: `Extracted ${json.data.skills?.length || 0} skills. Fit score: ${json.data.score}/100`,
      })
      onAnalysisComplete?.(json.data)
    } catch (err: any) {
      clearInterval(progressInterval)
      const msg = "Network error. Please check your connection and try again."
      setError(msg)
      toast.error("Network error", { description: msg })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      setAnalysis(null)
      setError(null)
    }
  }

  return (
    <div className="min-h-screen bg-app-ambient text-foreground pb-12">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-card/85 backdrop-blur-md border-b border-border shadow-xs">
        <div className="container mx-auto px-4 py-3 max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              className="rounded-xl border-border bg-card/60"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                  AI Resume Analyzer
                </h1>
                <p className="text-xs text-muted-foreground leading-none">
                  Tailored for PM Scheme & Indian Industry Internships
                </p>
              </div>
            </div>
          </div>
          {analysis && (
            <span className="badge-success text-xs font-bold py-1">Analysis Complete</span>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {!analysis ? (
          <div className="space-y-6">
            <Card className="surface-card rounded-3xl border border-border/80 shadow-md">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Upload className="h-5 w-5 text-primary" />
                  <span>Upload Your Resume</span>
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Get instant AI skill extraction, government eligibility rating, and personalized gap
                  analysis
                </p>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                {/* Drag and drop interactive container */}
                <div
                  className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer ${
                    isDragOver
                      ? "border-primary bg-primary/10 scale-[1.01]"
                      : error
                      ? "border-destructive/60 bg-destructive/5"
                      : "border-border/80 bg-card/60 hover:border-primary/50 hover:bg-card/90"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  tabIndex={0}
                  role="button"
                  aria-label="Click or drop file to upload resume"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8" />
                  </div>
                  <p className="text-base font-bold text-foreground mb-1">
                    {file ? file.name : "Drop your resume here or click to browse"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports PDF, DOCX, DOC, and TXT (up to 5MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm font-semibold">{error}</p>
                  </div>
                )}

                {file && (
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-card rounded-2xl border border-border/80 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="btn-primary h-11 px-5 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4" />
                            <span>Analyzing Profile...</span>
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-4 w-4" />
                            <span>Analyze Resume with AI</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {isAnalyzing && (
                      <div className="p-4 rounded-2xl surface-card space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                          <span>Extracting skills & evaluating PM scheme readiness...</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2 rounded-full" />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feature pillars */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="surface-card rounded-2xl border border-border/80 p-5 shadow-xs text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center mx-auto">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">PM Scheme Readiness</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Calculates eligibility for PM Internship Scheme and government-funded roles
                </p>
              </Card>

              <Card className="surface-card rounded-2xl border border-border/80 p-5 shadow-xs text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Skill Gap Analysis</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Identifies specific high-demand requirements you need to acquire
                </p>
              </Card>

              <Card className="surface-card rounded-2xl border border-border/80 p-5 shadow-xs text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-success/15 text-success flex items-center justify-center mx-auto">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Course Matching</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Connects your gaps directly to free NPTEL and SWAYAM certifications
                </p>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Score Card */}
            <Card className="surface-card rounded-3xl border border-border/80 shadow-md p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Resume Fit Score</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Evaluated across government PM scheme guidelines & top tier internships
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-2xl sm:text-3xl font-black ${
                      analysis.score >= 75
                        ? "text-success"
                        : analysis.score >= 55
                        ? "text-primary"
                        : "text-warning"
                    }`}
                  >
                    {analysis.score}/100
                  </span>
                  <span
                    className={`${
                      analysis.score >= 75
                        ? "badge-success"
                        : analysis.score >= 55
                        ? "badge-primary"
                        : "badge-warning"
                    } text-xs font-bold`}
                  >
                    {analysis.score >= 75
                      ? "Excellent Fit"
                      : analysis.score >= 55
                      ? "Good Potential"
                      : "Developing"}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <Progress value={analysis.score} className="h-2.5 rounded-full" />
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {analysis.score >= 75
                  ? "Your resume shows strong readiness for Government PM Scheme internships and leading engineering/business roles. Your existing qualifications fulfill key national criteria."
                  : "Your resume demonstrates a good foundation. Targeting the specific skill gaps highlighted below will substantially boost your match score for top roles."}
              </p>
            </Card>

            {/* Government Scheme Readiness Section */}
            <Card className="surface-card rounded-3xl border border-accent/40 bg-accent p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
                    PM
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">Government Scheme Readiness</h3>
                    <p className="text-xs text-muted-foreground">National 1 Crore Internship Program</p>
                  </div>
                </div>
                <span className="badge-warning text-xs font-bold">
                  {analysis.governmentSchemeReadiness.score}% Ready
                </span>
              </div>

              <div className="space-y-1.5">
                <Progress
                  value={analysis.governmentSchemeReadiness.score}
                  className="h-2 rounded-full"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-2">
                  <h4 className="text-xs font-bold text-success flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Eligible Schemes ({analysis.governmentSchemeReadiness.eligibleSchemes.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.governmentSchemeReadiness.eligibleSchemes.map((scheme, i) => (
                      <span key={i} className="badge-success text-xs">
                        {scheme}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-2">
                  <h4 className="text-xs font-bold text-warning-foreground flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-warning" />
                    Recommended Additions
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.governmentSchemeReadiness.missingRequirements.map((req, i) => (
                      <span key={i} className="badge-warning text-xs">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-2">
                <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5" />
                  Recommended Industry Sectors
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.governmentSchemeReadiness.recommendedSectors.map((sector, i) => (
                    <span key={i} className="badge-primary text-xs">
                      {sector}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-5">
              <Card className="surface-card rounded-2xl border border-border/80 p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-success flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Key Strengths
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm">
                  {analysis.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-success font-bold mt-0.5">✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="surface-card rounded-2xl border border-border/80 p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-warning-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  Opportunities to Strengthen
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm">
                  {analysis.improvements.map((imp, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-warning font-bold mt-0.5">•</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Skills & Background Details */}
            <div className="grid md:grid-cols-3 gap-5">
              <Card className="surface-card rounded-2xl border border-border/80 p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span>Detected Skills</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-0.5 rounded-lg bg-card border border-border font-medium text-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>

              <Card className="surface-card rounded-2xl border border-border/80 p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span>Experience Profile</span>
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {analysis.experience || "Student / Fresher Level"}
                </p>
              </Card>

              <Card className="surface-card rounded-2xl border border-border/80 p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span>Education Level</span>
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {analysis.education || "Undergraduate / Graduate Degree"}
                </p>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null)
                  setAnalysis(null)
                  setError(null)
                }}
                className="flex-1 h-12 rounded-xl border-border font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Analyze Another Resume</span>
              </Button>
              <Button
                onClick={() => {
                  if (analysis) onAnalysisComplete?.(analysis)
                  onBack()
                }}
                className="flex-1 h-12 btn-primary rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>View Tailored PM Internships</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

