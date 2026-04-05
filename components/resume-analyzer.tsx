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
} from "lucide-react"
import type { AnalysisResult } from "@/lib/types"

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
    setProgress(10)

    // Simulate progress for UX
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 15, 85))
    }, 400)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        body: formData,
      })

      const json = await res.json()
      clearInterval(progressInterval)
      setProgress(100)

      if (!json.success) {
        setError(json.error || "Analysis failed. Please try again.")
        setIsAnalyzing(false)
        return
      }

      setAnalysis(json.data)
      onAnalysisComplete?.(json.data)
    } catch (err: any) {
      clearInterval(progressInterval)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      setAnalysis(null)
      setError(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">PM</span>
              </div>
              <h1 className="text-lg font-semibold text-slate-800">AI Resume Analyzer</h1>
            </div>
            {analysis && (
              <Badge className="ml-auto bg-green-100 text-green-700 border-green-200">
                ✓ Analysis Complete
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {!analysis ? (
          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <FileText className="h-5 w-5" />
                  Upload Your Resume
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Get AI-powered analysis aligned with Government of India internship requirements
                </p>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-white"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2 text-slate-700">
                    {file ? file.name : "Drop your resume here or click to browse"}
                  </p>
                  <p className="text-sm text-slate-500">Supports PDF, DOCX, DOC, and TXT (max 5MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {error && (
                  <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {file && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-slate-800">{file.name}</p>
                          <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-4 w-4" />
                            Analyze Resume
                          </>
                        )}
                      </Button>
                    </div>

                    {isAnalyzing && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-slate-600">
                          <span>Extracting text & analyzing skills...</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-slate-500 text-center">
                          Running skill extraction, gap analysis, and scheme readiness check
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-slate-200">
                <CardContent className="p-6 text-center">
                  <Award className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2 text-slate-800">Government Scheme Readiness</h3>
                  <p className="text-sm text-slate-600">Check eligibility for PM Internship and other government programs</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2 text-slate-800">Skill Gap Analysis</h3>
                  <p className="text-sm text-slate-600">Identify skills needed for top government internships</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2 text-slate-800">Learning Recommendations</h3>
                  <p className="text-sm text-slate-600">Get course suggestions from NPTEL, SWAYAM and Coursera</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Score Card */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-slate-800">
                  <span>Resume Analysis Results</span>
                  <Badge
                    variant={analysis.score >= 80 ? "default" : analysis.score >= 60 ? "secondary" : "destructive"}
                    className="text-lg px-3 py-1"
                  >
                    {analysis.score}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Overall Score</span>
                    <span className="text-sm text-slate-500">{analysis.score}%</span>
                  </div>
                  <Progress value={analysis.score} className="h-2" />
                </div>
                <p className="text-sm text-slate-600">
                  {analysis.score >= 75
                    ? "Your resume shows strong potential for government internship programs. Minor improvements can further boost your profile."
                    : "Your resume has a good base, but targeted improvements will significantly increase your chances for PM Scheme internships."}
                </p>
              </CardContent>
            </Card>

            {/* Government Scheme Readiness */}
            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Award className="h-5 w-5" />
                  Government Scheme Readiness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Eligibility Score</span>
                    <span className="text-sm text-slate-500">{analysis.governmentSchemeReadiness.score}%</span>
                  </div>
                  <Progress value={analysis.governmentSchemeReadiness.score} className="h-2" />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">Eligible Schemes</h4>
                    <div className="space-y-1">
                      {analysis.governmentSchemeReadiness.eligibleSchemes.map((scheme, index) => (
                        <Badge key={index} variant="outline" className="mr-2 mb-1 border-green-300 text-green-700 bg-green-50">
                          {scheme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-orange-800 mb-2">Missing Requirements</h4>
                    <div className="space-y-1">
                      {analysis.governmentSchemeReadiness.missingRequirements.map((req, index) => (
                        <Badge key={index} variant="outline" className="mr-2 mb-1 border-orange-300 text-orange-700 bg-orange-50">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Recommended Sectors</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.governmentSchemeReadiness.recommendedSectors.map((sector, index) => (
                      <Badge key={index} variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
                        <Building className="h-3 w-3 mr-1" />
                        {sector}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" /> Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="h-5 w-5" /> Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Detected Skills + Experience + Education */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <User className="h-5 w-5" /> Detected Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="border-slate-300">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Briefcase className="h-5 w-5" /> Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{analysis.experience}</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <GraduationCap className="h-5 w-5" /> Education
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{analysis.education}</p>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-800">AI Recommendations for Government Internships</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={() => { setFile(null); setAnalysis(null); setError(null) }}
                variant="outline"
                className="flex-1 border-slate-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Analyze Another Resume
              </Button>
              <Button
                onClick={() => {
                  // Re-signal the analysis to the parent so it always re-ranks
                  if (analysis) onAnalysisComplete?.(analysis)
                  onBack()
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Get Personalized PM Internship Matches
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
