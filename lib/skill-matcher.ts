/**
 * Skill Matcher — TF-IDF style cosine similarity scoring engine
 * Matches user skills/profile against internship requirements
 * Returns match scores and explanations without any external APIs.
 */

import type { Internship, UserProfile, RecommendationScore } from "./types"

// ─── TF-IDF Helpers ───────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s.+#]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1)
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1)
  }
  // Normalize
  for (const [key, val] of tf.entries()) {
    tf.set(key, val / tokens.length)
  }
  return tf
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (const [term, valA] of a.entries()) {
    const valB = b.get(term) || 0
    dotProduct += valA * valB
    normA += valA * valA
  }
  for (const [, valB] of b.entries()) {
    normB += valB * valB
  }

  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// ─── Skill Matching ───────────────────────────────────────────────────────────

export function computeMatchScore(
  userProfile: UserProfile,
  internship: Internship,
  likedInternshipIds: number[] = [],
): RecommendationScore {
  const reasons: string[] = []
  const matchedSkills: string[] = []
  let score = 50 // Base score

  // 1. Skill matching (most important — 40 pts max)
  const userSkillsLower = userProfile.skills.map((s) => s.toLowerCase())
  const internshipRequirementsLower = internship.requirements.map((r) => r.toLowerCase())
  const internshipSkillsLower = internship.skills.map((s) => s.toLowerCase())

  const directMatches = userSkillsLower.filter((us) =>
    internshipRequirementsLower.some(
      (ir) => ir.includes(us) || us.includes(ir) || levenshteinSimilarity(ir, us) > 0.8,
    ),
  )

  if (directMatches.length > 0) {
    const skillBoost = Math.min(35, directMatches.length * 8)
    score += skillBoost
    directMatches.forEach((s) => matchedSkills.push(s.charAt(0).toUpperCase() + s.slice(1)))
    reasons.push(`${directMatches.length} direct skill match${directMatches.length > 1 ? "es" : ""} found`)
  }

  // 2. TF-IDF similarity between user interests and internship description
  const userText = [
    ...userProfile.skills,
    ...userProfile.interests,
    userProfile.experience,
    userProfile.location,
  ].join(" ")

  const internshipText = [
    internship.title,
    internship.description,
    ...internship.requirements,
    ...internship.skills,
    internship.sector,
  ].join(" ")

  const userTokens = tokenize(userText)
  const internshipTokens = tokenize(internshipText)

  const userTF = termFrequency(userTokens)
  const internshipTF = termFrequency(internshipTokens)

  const similarity = cosineSimilarity(userTF, internshipTF)
  const similarityBoost = Math.round(similarity * 200) // 0-20 range
  score += similarityBoost

  if (similarityBoost >= 10) reasons.push("Strong profile-to-role alignment")

  // 3. Work type preference (10 pts max)
  const preferRemote = userProfile.location.toLowerCase().includes("remote")
  const preferHybrid = userProfile.location.toLowerCase().includes("hybrid")
  if (
    (preferRemote && internship.type === "Remote") ||
    (preferHybrid && internship.type === "Hybrid") ||
    internship.type === "Remote"
  ) {
    score += 8
    reasons.push("Matches your work preference")
  }

  // 4. Interest alignment (10 pts max)
  const interestMatch = userProfile.interests.some((interest) =>
    internship.sector.toLowerCase().includes(interest.toLowerCase()) ||
    internship.title.toLowerCase().includes(interest.toLowerCase()),
  )
  if (interestMatch) {
    score += 10
    reasons.push("Aligns with your career interests")
  }

  // 5. Experience level fit (8 pts max)
  const isEntryLevel =
    internship.description.toLowerCase().includes("fresher") ||
    internship.description.toLowerCase().includes("entry level") ||
    internship.duration.includes("months")
  if (userProfile.experience === "Fresher" || userProfile.experience === "Beginner") {
    if (isEntryLevel) {
      score += 8
      reasons.push("Suitable for your experience level")
    }
  }

  // 6. Liked internship pattern boost (5 pts)
  if (likedInternshipIds.includes(internship.id)) {
    score += 5
    reasons.push("You previously shortlisted this role")
  }

  // Similar sectors to liked internships boost
  const sectorBoostApplied = false
  if (!sectorBoostApplied && reasons.length < 4) {
    if (directMatches.length === 0 && similarity > 0.1) {
      reasons.push("Partial profile alignment detected")
    }
  }

  return {
    internshipId: internship.id,
    score: Math.min(97, Math.max(45, Math.round(score))),
    reasons: reasons.slice(0, 3),
    matchedSkills: matchedSkills.slice(0, 5),
  }
}

// ─── Rank All Internships ─────────────────────────────────────────────────────

export function rankInternships(
  profile: UserProfile,
  internships: Internship[],
  likedIds: number[] = [],
): RecommendationScore[] {
  const scores = internships.map((internship) => computeMatchScore(profile, internship, likedIds))
  return scores.sort((a, b) => b.score - a.score)
}

// ─── Profile Builder ──────────────────────────────────────────────────────────

export function buildProfileFromSkills(skills: string[]): UserProfile {
  const lowerSkills = skills.map((s) => s.toLowerCase())

  // Infer interests from skills
  const interests: string[] = []
  if (lowerSkills.some((s) => /python|tensorflow|pytorch|ml|machine learning/i.test(s))) interests.push("AI & Machine Learning")
  if (lowerSkills.some((s) => /react|node|javascript|typescript|html|css/i.test(s))) interests.push("Software Development")
  if (lowerSkills.some((s) => /sql|pandas|data|analytics|tableau/i.test(s))) interests.push("Data Analytics")
  if (lowerSkills.some((s) => /figma|ui|ux|design/i.test(s))) interests.push("UI/UX Design")
  if (lowerSkills.some((s) => /aws|azure|gcp|docker|kubernetes/i.test(s))) interests.push("Cloud & DevOps")
  if (lowerSkills.some((s) => /android|ios|flutter|kotlin/i.test(s))) interests.push("Mobile Development")
  if (lowerSkills.some((s) => /marketing|seo|social/i.test(s))) interests.push("Digital Marketing")
  if (lowerSkills.some((s) => /finance|banking|accounting|excel/i.test(s))) interests.push("Finance & Banking")

  if (interests.length === 0) interests.push("General Technology")

  // Infer experience level
  let experience: UserProfile["experience"] = "Fresher"
  if (skills.length > 12) experience = "Intermediate"
  else if (skills.length > 7) experience = "Beginner"

  return {
    skills,
    interests,
    experience,
    location: "Remote/Hybrid preferred",
  }
}

// ─── Levenshtein similarity ───────────────────────────────────────────────────

function levenshteinSimilarity(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 4) return 0
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  const dist = levenshteinDistance(a, b)
  return 1 - dist / maxLen
}

function levenshteinDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[a.length][b.length]
}
