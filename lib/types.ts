// Shared TypeScript interfaces for the AI Internship Portal

export interface Internship {
  id: number
  externalId?: string
  title: string
  company: string
  location: string
  duration: string
  description: string
  requirements: string[]
  salary: string
  type: "Remote" | "On-site" | "Hybrid"
  logo: string
  scheme?: string
  sector: string
  skills: string[]
  missingSkills: string[]
  applyLink?: string
  postedDate?: string
  openings?: number
  matchScore?: number
  source?: "static" | "github" | "remoteok" | "jooble"
  fetchedAt?: string
}

export interface UserProfile {
  skills: string[]
  interests: string[]
  experience: "Fresher" | "Beginner" | "Intermediate" | "Advanced"
  location: string
  education?: string
}

export interface AnalysisResult {
  score: number
  strengths: string[]
  improvements: string[]
  skills: string[]
  experience: string
  education: string
  recommendations: string[]
  governmentSchemeReadiness: {
    score: number
    eligibleSchemes: string[]
    missingRequirements: string[]
    recommendedSectors: string[]
  }
  skillGapAnalysis: {
    strongSkills: string[]
    developingSkills: string[]
    missingSkills: string[]
    industryAlignment: number
  }
  extractedText?: string
}

export interface CourseRecommendation {
  id: number
  title: string
  provider: string
  platform: "NPTEL" | "SWAYAM" | "Coursera" | "Other"
  duration: string
  level: "Beginner" | "Intermediate" | "Advanced"
  rating: number
  students: string
  skills: string[]
  description: string
  price: string
  category: string
  relevantFor: string[]
  certificate: string
  link: string
  relevanceScore?: number
}

export interface RecommendationScore {
  internshipId: number
  score: number
  reasons: string[]
  matchedSkills: string[]
}
