/**
 * Resume Parser — Enhanced heuristic NLP analysis, no external APIs
 * Fixed: stateful regex bug (gi flags), B.Tech detection, full college name extraction
 */

import type { AnalysisResult } from "./types"

// ─── Skill Dictionaries ───────────────────────────────────────────────────────

const SKILL_CATEGORIES = {
  programming: [
    "javascript", "typescript", "python", "java", "c++", "c#", "rust", "go", "golang", "ruby", "php",
    "swift", "kotlin", "matlab", "scala", "perl", "bash", "shell", "solidity",
  ],
  web: [
    "react", "reactjs", "react.js", "angular", "vue", "vuejs", "nextjs", "next.js", "nuxt",
    "html", "css", "tailwind", "bootstrap", "sass", "less", "webpack", "vite",
    "node", "nodejs", "node.js", "express", "fastapi", "django", "flask", "spring", "laravel",
    "graphql", "rest api", "restful", "soap", "grpc",
  ],
  data: [
    "machine learning", "deep learning", "neural network", "tensorflow", "pytorch", "keras",
    "scikit-learn", "pandas", "numpy", "matplotlib", "seaborn", "plotly",
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
    "tableau", "power bi", "looker", "data visualization", "data analysis", "statistics",
    "nlp", "natural language processing", "computer vision", "opencv",
    "spark", "hadoop", "kafka", "airflow", "etl", "data pipeline", "big data",
    "regression", "classification", "clustering", "dimensionality reduction",
    "recommendation system", "time series", "a/b testing",
  ],
  cloud_devops: [
    "aws", "azure", "gcp", "google cloud", "cloud computing", "kubernetes", "docker",
    "terraform", "ansible", "jenkins", "github actions", "ci/cd", "devops",
    "linux", "unix", "nginx", "apache", "microservices", "serverless", "lambda",
    "prometheus", "grafana", "elk stack", "datadog",
  ],
  mobile: [
    "android", "ios", "flutter", "react native", "swift", "kotlin", "xcode",
    "jetpack compose", "swiftui", "mobile development", "mobile app",
  ],
  design: [
    "figma", "adobe xd", "sketch", "photoshop", "illustrator", "canva",
    "ui design", "ux design", "ui/ux", "user interface", "user experience",
    "wireframing", "prototyping", "user research", "usability testing", "design system",
  ],
  finance: [
    "financial analysis", "financial modeling", "excel", "accounting", "auditing",
    "investment", "banking", "budget", "forecast", "valuation", "derivatives",
    "risk management", "compliance", "fintech", "blockchain", "cryptocurrency",
  ],
  marketing: [
    "digital marketing", "seo", "sem", "google ads", "facebook ads", "social media",
    "content marketing", "email marketing", "affiliate marketing", "influencer",
    "brand", "campaign", "analytics", "conversion", "copywriting",
  ],
  tools: [
    "git", "github", "gitlab", "jira", "confluence", "slack", "notion",
    "postman", "swagger", "vs code", "intellij", "vim", "linux",
  ],
  soft: [
    "leadership", "communication", "teamwork", "problem solving", "critical thinking",
    "project management", "agile", "scrum", "kanban", "presentation",
  ],
}

const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat()

// ─── Education Patterns (stateless — use i flag only, not gi to avoid lastIndex bug) ─────

// NOTE: We use RegExp constructor at call-site to avoid the stateful `gi` regex bug.
// All patterns stored as strings, compiled fresh per call.
const EDUCATION_PATTERN_DEFS: Array<{ pattern: string; flags: string; level: string }> = [
  // Ph.D must come before M.Tech/B.Tech to avoid subset matches
  { pattern: "phd|ph\\.d\\.|doctor\\s+of\\s+philosophy|doctoral", flags: "i", level: "Ph.D" },
  // Post-grad before undergrad to avoid B matching within M.Tech
  { pattern: "m\\.\\s*tech|mtech|master\\s+of\\s+technology|m\\.\\s*e\\.\\s", flags: "i", level: "M.Tech/M.E." },
  { pattern: "mca|master\\s+of\\s+computer\\s+application", flags: "i", level: "MCA" },
  { pattern: "mba|master\\s+of\\s+business\\s+administration|post\\s+graduate\\s+diploma\\s+in\\s+management", flags: "i", level: "MBA" },
  { pattern: "m\\.\\s*sc\\.?\\s|master\\s+of\\s+science", flags: "i", level: "M.Sc" },
  // Undergrad
  { pattern: "b\\.\\s*tech|btech|bachelor\\s+of\\s+technology|b\\.\\s*e\\.\\s|bachelor\\s+of\\s+engineering|be\\s+(?:in|from)", flags: "i", level: "B.Tech/B.E." },
  { pattern: "bca|bachelor\\s+of\\s+computer\\s+application", flags: "i", level: "BCA" },
  { pattern: "b\\.\\s*sc\\.?\\s|bachelor\\s+of\\s+science", flags: "i", level: "B.Sc" },
  { pattern: "b\\.\\s*com|bachelor\\s+of\\s+commerce", flags: "i", level: "B.Com" },
  { pattern: "b\\.\\s*a\\.?\\s|bachelor\\s+of\\s+arts", flags: "i", level: "B.A." },
  { pattern: "diploma\\s+in|diploma\\s+of|polytechnic", flags: "i", level: "Diploma" },
  { pattern: "12th|hsc|higher\\s+secondary|class\\s+xii|class\\s+12", flags: "i", level: "12th/HSC" },
  { pattern: "10th|ssc|secondary\\s+school|class\\s+x\\b|class\\s+10", flags: "i", level: "10th/SSC" },
]

// ─── College Name Extraction — ordered from most specific to generic ──────────

function extractCollegeName(text: string): string {
  // 1. Try to find "from <College Name>" or "at <College Name>" patterns near education keywords
  const fromPattern = /(?:from|at|@)\s+([A-Z][A-Za-z\s&'()-]{8,60})(?:\n|,|\.|$)/gm
  let m: RegExpExecArray | null
  const candidates: string[] = []

  while ((m = fromPattern.exec(text)) !== null) {
    const candidate = m[1].trim()
    if (/university|institute|college|iit|nit|iiit|bits|vit|srm|manipal|amity|mit|lpu|jnu|du|bhu|anna|osmania|calcutta|bombay|madras|delhi/i.test(candidate)) {
      candidates.push(candidate)
    }
  }
  if (candidates.length > 0) return candidates[0]

  // 2. Specific premium institutes
  const premiumPatterns: RegExp[] = [
    /indian\s+institute\s+of\s+technology[\s,]+\w+/i,
    /iit[\s-]+\w+(?:\s+\w+)?/i,
    /national\s+institute\s+of\s+technology[\s,]+\w+/i,
    /nit[\s-]+\w+(?:\s+\w+)?/i,
    /indian\s+institute\s+of\s+information\s+technology[\s,]+\w+/i,
    /iiit[\s-]+\w+(?:\s+\w+)?/i,
    /bits\s+pilani(?:[\s,]+\w+(?:\s+campus)?)?/i,
    /birla\s+institute\s+of\s+technology\s+(?:and\s+)?science/i,
    /vit\s+(?:university|vellore|chennai|bhopal|ap)?/i,
    /srm\s+(?:university|institute|college)?/i,
    /manipal\s+(?:university|institute|academy)?/i,
    /amity\s+university(?:\s+\w+)?/i,
    /delhi\s+(?:technological\s+university|university|dtu)/i,
    /netaji\s+subhas\s+university/i,
    /jamia\s+millia/i,
    /jawaharlal\s+nehru\s+university|jnu/i,
    /anna\s+university(?:\s+\w+)?/i,
    /osmania\s+university/i,
    /calcutta\s+university/i,
    /bombay\s+university|university\s+of\s+mumbai/i,
    /university\s+of\s+(?:delhi|mumbai|calcutta|madras|pune|hyderabad|rajasthan|mysore)/i,
    /[A-Z][a-zA-Z]+\s+university/,
    /[A-Z][a-zA-Z]+\s+institute\s+of\s+(?:technology|engineering|science)/,
    /[A-Z][a-zA-Z]+\s+college\s+of\s+(?:engineering|technology|science)/,
  ]

  for (const pat of premiumPatterns) {
    const match = text.match(pat)
    if (match) return match[0].trim()
  }

  // 3. Generic multi-word institution name after "University", "Institute", "College"
  const genericMatch = text.match(/([A-Z][A-Za-z\s&'()]{3,40})\s+(?:university|institute|college|polytechnic)\b/i)
  if (genericMatch) {
    const candidate = genericMatch[0].trim()
    if (candidate.length > 5 && candidate.length < 80) return candidate
  }

  return ""
}

const CERTIFICATION_PATTERNS_STR = [
  "aws\\s+certified|azure\\s+certified|google\\s+cloud\\s+certified|gcp\\s+certified",
  "certified\\s+\\w+\\s+professional|certified\\s+\\w+\\s+associate",
  "nptel\\s+certificate|coursera\\s+certificate|udemy\\s+certificate",
  "ccna|ccnp|ceh|cissp|cisa",
  "pmp|prince2|scrum\\s+master|safe\\s+agilist",
]

function hasCertification(text: string): boolean {
  return CERTIFICATION_PATTERNS_STR.some((p) => new RegExp(p, "i").test(text))
}

// ─── Main Analysis Function ───────────────────────────────────────────────────

export function analyzeResumeText(text: string): AnalysisResult {
  const lowerText = text.toLowerCase()

  const detectedSkills = extractSkills(lowerText)
  const educationInfo = extractEducation(text)
  const experienceInfo = extractExperience(text, lowerText)
  const baseScore = computeBaseScore(detectedSkills, educationInfo, experienceInfo, text)
  const skillGapAnalysis = computeSkillGap(detectedSkills, lowerText)
  const govtReadiness = computeGovtReadiness(detectedSkills, skillGapAnalysis, educationInfo)
  const strengths = generateStrengths(detectedSkills, educationInfo, experienceInfo, text)
  const improvements = generateImprovements(skillGapAnalysis, govtReadiness, detectedSkills)
  const recommendations = generateRecommendations(skillGapAnalysis, govtReadiness, detectedSkills)

  return {
    score: Math.min(95, Math.max(35, baseScore)),
    strengths,
    improvements,
    skills: detectedSkills.slice(0, 14),
    experience: experienceInfo.summary,
    education: educationInfo.summary,
    recommendations,
    governmentSchemeReadiness: govtReadiness,
    skillGapAnalysis: {
      strongSkills: skillGapAnalysis.strong,
      developingSkills: skillGapAnalysis.developing,
      missingSkills: skillGapAnalysis.missing,
      industryAlignment: skillGapAnalysis.alignmentScore,
    },
  }
}

// ─── Skill Extraction ─────────────────────────────────────────────────────────

function extractSkills(lowerText: string): string[] {
  const found: string[] = []

  for (const skill of ALL_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const pattern = new RegExp(`\\b${escaped}\\b`, "i")
    if (pattern.test(lowerText)) {
      const clean = skill.trim().replace(/\b\w/g, (c) => c.toUpperCase())
      if (!found.includes(clean)) found.push(clean)
    }
  }

  return found
}

// ─── Education Extraction (Fixed: no stateful gi regex) ──────────────────────

function extractEducation(text: string): { level: string; college: string; summary: string; score: number } {
  let level = ""
  let educationScore = 50

  // Try each pattern definition fresh (no shared state issue)
  for (const def of EDUCATION_PATTERN_DEFS) {
    const re = new RegExp(def.pattern, def.flags) // fresh instance each time
    if (re.test(text)) {
      level = def.level
      if (["B.Tech/B.E.", "M.Tech/M.E.", "MCA", "MBA", "M.Sc"].includes(level)) educationScore = 80
      else if (["B.Sc", "BCA", "B.Com", "B.A."].includes(level)) educationScore = 65
      else if (level === "Ph.D") educationScore = 95
      break
    }
  }

  const college = extractCollegeName(text)
  if (college) {
    if (/iit|bits\s+pilani|nit\s|iiit/i.test(college)) educationScore = Math.min(95, educationScore + 15)
    else if (/vit|srm|manipal|amity/i.test(college)) educationScore = Math.min(90, educationScore + 5)
  }

  const summary =
    level
      ? `${level}${college ? ` — ${college}` : ""}`
      : college
      ? `Studying at ${college}`
      : "Educational background found in resume"

  return { level, college, summary, score: educationScore }
}

// ─── Experience Extraction ────────────────────────────────────────────────────

function extractExperience(
  text: string,
  lowerText: string,
): { years: number; hasInternship: boolean; summary: string; score: number } {
  let years = 0
  let hasInternship = false
  let experienceScore = 40

  const yearMatch = text.match(/(\d+)\+?\s*years?\s+(?:of\s+)?(?:work\s+|industry\s+)?experience/i)
  if (yearMatch) {
    years = parseInt(yearMatch[1])
    experienceScore = Math.min(90, 50 + years * 10)
  }

  if (/internship|intern\s+at|interned\s+at|summer\s+intern|winter\s+intern|industrial\s+training/i.test(text)) {
    hasInternship = true
    experienceScore = Math.max(experienceScore, 65)
  }

  const projectCount = (lowerText.match(/project[\s:]|built\s+a|developed\s+a|created\s+a|implemented\s+a|designed\s+a/g) || []).length
  if (projectCount >= 3) experienceScore = Math.max(experienceScore, 60)
  if (projectCount >= 5) experienceScore = Math.max(experienceScore, 72)

  if (/hackathon|winner|first\s+place|award|achievement|publication|published|patent|rank\s+\d/i.test(text)) {
    experienceScore = Math.min(95, experienceScore + 10)
  }

  let summary: string
  if (years > 0) {
    summary = `${years}+ year${years > 1 ? "s" : ""} of experience`
    if (hasInternship) summary += " including internship experience"
  } else if (hasInternship) {
    summary = "Internship/industrial training experience in relevant domain"
  } else if (projectCount > 0) {
    summary = `${projectCount}+ academic and personal projects completed`
  } else {
    summary = "Fresher with strong academic background"
  }

  return { years, hasInternship, summary, score: experienceScore }
}

// ─── Score Computation ────────────────────────────────────────────────────────

function computeBaseScore(
  skills: string[],
  edu: ReturnType<typeof extractEducation>,
  exp: ReturnType<typeof extractExperience>,
  text: string,
): number {
  let score = 0
  score += Math.min(100, (skills.length / 15) * 100) * 0.4
  score += edu.score * 0.25
  score += exp.score * 0.25

  let presentationScore = 50
  if (text.length > 500) presentationScore += 10
  if (text.length > 1500) presentationScore += 10
  if (/quantif|achieved|increased|decreased|improved|reduced|grew|launched/i.test(text)) presentationScore += 15
  if (hasCertification(text)) presentationScore += 15
  score += Math.min(100, presentationScore) * 0.1

  return Math.round(score)
}

// ─── Skill Gap Analysis ───────────────────────────────────────────────────────

function computeSkillGap(
  skills: string[],
  lowerText: string,
): { strong: string[]; developing: string[]; missing: string[]; alignmentScore: number } {
  const skillLower = skills.map((s) => s.toLowerCase())

  const strong: string[] = []
  const developing: string[] = []
  const missing: string[] = []

  const cat = detectSkillCategories(skillLower)
  if (cat.programming) strong.push("Programming")
  if (cat.web) strong.push("Web Development")
  if (cat.data) (skillLower.length > 5 ? strong : developing).push("Data Analysis")
  if (cat.cloud_devops) developing.push("Cloud/DevOps")
  if (cat.mobile) strong.push("Mobile Development")
  if (cat.design) strong.push("UI/UX Design")
  if (cat.finance) strong.push("Financial Analysis")
  if (cat.marketing) strong.push("Digital Marketing")

  const highDemandSkills: Record<string, string[]> = {
    "Cloud Computing": ["aws", "azure", "gcp", "cloud", "kubernetes", "docker"],
    "Machine Learning": ["machine learning", "deep learning", "tensorflow", "pytorch"],
    "DevOps/CI-CD": ["docker", "kubernetes", "jenkins", "ci/cd", "github actions", "terraform"],
    "System Design": ["microservices", "distributed", "scalability", "system design"],
    "Cybersecurity": ["security", "owasp", "penetration", "vulnerability", "encryption"],
    "Blockchain": ["blockchain", "solidity", "web3", "smart contract"],
    "Mobile Development": ["android", "ios", "flutter", "react native"],
    "Data Engineering": ["spark", "hadoop", "kafka", "airflow", "data pipeline"],
  }

  for (const [skill, keywords] of Object.entries(highDemandSkills)) {
    if (!keywords.some((kw) => lowerText.includes(kw) || skillLower.some((s) => s.includes(kw)))) {
      missing.push(skill)
    }
  }

  const alignmentScore = Math.min(95, Math.max(30, (strong.length / 4) * 50 + (developing.length / 4) * 25 + 25))

  return {
    strong: strong.slice(0, 5),
    developing: developing.slice(0, 4),
    missing: missing.slice(0, 5),
    alignmentScore: Math.round(alignmentScore),
  }
}

function detectSkillCategories(skillsLower: string[]): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  for (const [category, keywords] of Object.entries(SKILL_CATEGORIES)) {
    result[category] = keywords.some((kw) => skillsLower.some((s) => s.includes(kw.trim())))
  }
  return result
}

// ─── Government Scheme Readiness ──────────────────────────────────────────────

function computeGovtReadiness(
  skills: string[],
  gap: ReturnType<typeof computeSkillGap>,
  edu: ReturnType<typeof extractEducation>,
): AnalysisResult["governmentSchemeReadiness"] {
  const eligibleSchemes: string[] = []
  const missingRequirements: string[] = []

  if (skills.length >= 3) eligibleSchemes.push("PM Internship Scheme")
  if (skills.some((s) => /python|java|js|node|react/i.test(s))) {
    eligibleSchemes.push("Digital India Initiative")
    eligibleSchemes.push("Startup India Internship")
  }
  if (edu.level) eligibleSchemes.push("Skill India Program")

  if (!edu.level) missingRequirements.push("Educational qualification certificate")
  if (gap.missing.includes("Cloud Computing")) missingRequirements.push("Cloud/Digital certifications")
  if (skills.length < 5) missingRequirements.push("Additional technical skills")
  if (!skills.some((s) => /git|agile|scrum/i.test(s))) missingRequirements.push("Version control & Agile methodology")

  const skillLower = skills.map((s) => s.toLowerCase())
  const recommendedSectors: string[] = []
  if (skillLower.some((s) => /python|java|js|react|node/i.test(s))) recommendedSectors.push("Information Technology")
  if (skillLower.some((s) => /data|sql|pandas|analytics/i.test(s))) recommendedSectors.push("Data Science & Analytics")
  if (skillLower.some((s) => /ml|ai|tensorflow|pytorch/i.test(s))) recommendedSectors.push("AI & Machine Learning")
  if (skillLower.some((s) => /figma|ui|ux|design/i.test(s))) recommendedSectors.push("Design & User Experience")
  if (skillLower.some((s) => /finance|excel|accounting/i.test(s))) recommendedSectors.push("Banking & Finance")
  if (recommendedSectors.length === 0) recommendedSectors.push("General IT & Operations")

  const govtScore = Math.min(95, 40 + eligibleSchemes.length * 12 + (4 - missingRequirements.length) * 5 + skills.length * 2)

  return {
    score: Math.round(govtScore),
    eligibleSchemes: eligibleSchemes.slice(0, 4),
    missingRequirements: missingRequirements.slice(0, 4),
    recommendedSectors: recommendedSectors.slice(0, 4),
  }
}

// ─── Text Generation ──────────────────────────────────────────────────────────

function generateStrengths(
  skills: string[],
  edu: ReturnType<typeof extractEducation>,
  exp: ReturnType<typeof extractExperience>,
  text: string,
): string[] {
  const strengths: string[] = []

  if (skills.length >= 8) strengths.push(`Strong technical skill set with ${skills.length} identified skills`)
  else if (skills.length >= 4) strengths.push("Solid foundation of core technical skills")
  if (edu.level) strengths.push(`${edu.level} qualification${edu.college ? ` from ${edu.college}` : ""}`)
  if (exp.hasInternship) strengths.push("Practical internship experience demonstrating real-world exposure")
  if (exp.years > 0) strengths.push(`${exp.years}+ year${exp.years > 1 ? "s" : ""} of hands-on work experience`)
  if (/project|built|developed|created|implemented/i.test(text)) strengths.push("Portfolio of project implementations shows initiative")
  if (hasCertification(text)) strengths.push("Industry-recognized certifications on profile")
  if (/hackathon|competition|contest/i.test(text)) strengths.push("Competitive programming/hackathon participation")
  if (/leadership|lead|managed|team|mentor/i.test(text)) strengths.push("Demonstrated leadership and team management")
  if (/quantif|achieved|increased|decreased|improved|%|lakhs|crore/i.test(text)) strengths.push("Quantified achievements with measurable impact metrics")

  return strengths.slice(0, 6)
}

function generateImprovements(
  gap: ReturnType<typeof computeSkillGap>,
  govt: AnalysisResult["governmentSchemeReadiness"],
  skills: string[],
): string[] {
  const improvements: string[] = []

  if (gap.missing.length > 0) improvements.push(`Develop in-demand skills: ${gap.missing.slice(0, 3).join(", ")}`)
  if (!skills.some((s) => /cloud|aws|azure|gcp/i.test(s))) improvements.push("Add cloud computing experience (AWS/Azure free tier projects)")
  if (!skills.some((s) => /git|github/i.test(s))) improvements.push("Create a GitHub profile with active open-source contributions")
  improvements.push("Quantify achievements with specific numbers and percentages")
  improvements.push("Add government-relevant projects or civic tech contributions")
  improvements.push("Include NPTEL/SWAYAM certifications to strengthen profile")
  if (govt.missingRequirements.length > 0) improvements.push(`Address PM scheme requirements: ${govt.missingRequirements[0]}`)

  return improvements.slice(0, 6)
}

function generateRecommendations(
  gap: ReturnType<typeof computeSkillGap>,
  govt: AnalysisResult["governmentSchemeReadiness"],
  skills: string[],
): string[] {
  const recs: string[] = []

  if (gap.missing.includes("Cloud Computing")) recs.push("Complete free AWS/Azure certifications to add cloud credentials to your profile")
  if (gap.missing.includes("Machine Learning")) recs.push("Enroll in NPTEL's free ML course by IIT Madras to fill the gap")
  recs.push("Build 2–3 end-to-end portfolio projects related to your target sector")
  recs.push("Apply to PM Internship Scheme (pminternship.mca.gov.in) — eligibility looks strong")
  if (gap.strong.length > 0) recs.push(`Your strength in ${gap.strong[0]} aligns well with ${govt.recommendedSectors[0] || "IT"} roles`)
  recs.push("Get a NPTEL certification in your primary skill area for government-recognized credentials")
  recs.push("Contribute to open-source projects in your domain for stronger GitHub visibility")

  return recs.slice(0, 6)
}
