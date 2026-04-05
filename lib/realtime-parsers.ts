/**
 * realtime-parsers.ts
 * Pure functions to convert raw external source data → Internship[]
 * Handles: GitHub SimplifyJobs README, RemoteOK JSON, Jooble REST
 */

import type { Internship } from "./types"

// ─── Skill keyword map (subset of resume-parser for fast extraction) ──────────

const SKILL_KEYWORDS: Record<string, string[]> = {
  "React": ["react"],
  "Next.js": ["next.js", "nextjs"],
  "TypeScript": ["typescript", "ts"],
  "JavaScript": ["javascript", "js"],
  "Python": ["python"],
  "Java": ["java"],
  "C++": ["c++", "cpp"],
  "Node.js": ["node.js", "nodejs", "node"],
  "Vue": ["vue", "vuejs"],
  "Angular": ["angular"],
  "SQL": ["sql", "mysql", "postgresql", "postgres"],
  "MongoDB": ["mongodb"],
  "AWS": ["aws", "amazon web services"],
  "Docker": ["docker"],
  "Kubernetes": ["kubernetes", "k8s"],
  "Machine Learning": ["machine learning", "ml"],
  "Deep Learning": ["deep learning"],
  "TensorFlow": ["tensorflow"],
  "PyTorch": ["pytorch"],
  "Data Analysis": ["data analysis", "data analyst"],
  "Pandas": ["pandas"],
  "Figma": ["figma"],
  "Flutter": ["flutter"],
  "Android": ["android"],
  "iOS": ["ios", "swift"],
  "Git": ["git", "github"],
  "REST API": ["rest", "restful", "api"],
  "GraphQL": ["graphql"],
  "DevOps": ["devops", "ci/cd", "cicd"],
  "Blockchain": ["blockchain", "solidity"],
  "Excel": ["excel", "spreadsheet"],
  "SEO": ["seo"],
  "Digital Marketing": ["digital marketing"],
}

/** Extract skill names from any freeform text string */
function extractSkillsFromText(text: string): string[] {
  const lower = text.toLowerCase()
  const found: string[] = []
  for (const [label, keywords] of Object.entries(SKILL_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw)) && !found.includes(label)) {
      found.push(label)
    }
  }
  return found
}

/** Normalize work-type from freeform location/tags */
function inferWorkType(text: string): "Remote" | "On-site" | "Hybrid" {
  const l = text.toLowerCase()
  if (l.includes("remote")) return "Remote"
  if (l.includes("hybrid")) return "Hybrid"
  return "On-site"
}

/** Clean up location strings */
function cleanLocation(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/\*\*/g, "")    // strip markdown bold
    .trim()
    .substring(0, 60)
}

// ─── 1. GitHub SimplifyJobs Markdown Table Parser ────────────────────────────

/**
 * Parses the SimplifyJobs README.md table.
 * Table format: | Company | Role | Location | Application | Date |
 */
export function parseGitHubMarkdown(markdown: string, maxRows = 30): Internship[] {
  const results: Internship[] = []
  const now = new Date().toISOString()

  // Find all table rows (lines starting with |)
  const lines = markdown.split("\n")
  let idCounter = 10000
  let rowCount = 0

  for (const line of lines) {
    if (rowCount >= maxRows) break

    // Skip header rows, separator rows
    if (!line.startsWith("|")) continue
    if (line.includes("---")) continue
    if (line.toLowerCase().includes("company") && line.toLowerCase().includes("role")) continue

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean)

    // Need at least 4 cells: company, role, location, link
    if (cells.length < 4) continue

    const [companyRaw, roleRaw, locationRaw, linkCell] = cells

    // Skip separator/empty rows
    if (!companyRaw || companyRaw === "---" || roleRaw === "---") continue

    // Extract href from markdown link: [text](url) or plain text
    const linkMatch = linkCell?.match(/\[.*?\]\((https?:\/\/[^\)]+)\)/)
    const applyLink = linkMatch ? linkMatch[1] : undefined

    // Extract company name (strip markdown links)
    const company = companyRaw.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1").trim()
    const role = roleRaw.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1").trim()
    const location = cleanLocation(locationRaw)

    if (!company || !role || company.length < 2) continue

    const skills = extractSkillsFromText(`${role} ${location}`)

    results.push({
      id: idCounter++,
      title: role,
      company,
      location: location || "USA",
      duration: "3 months",
      description: `${role} internship at ${company}. Open to motivated students with relevant skills.`,
      requirements: skills.length > 0 ? skills : ["Problem solving", "Communication"],
      salary: "Competitive",
      type: inferWorkType(location),
      logo: "🔵",
      sector: inferSectorFromTitle(role),
      skills,
      missingSkills: [],
      applyLink,
      postedDate: now.split("T")[0],
      source: "github",
      fetchedAt: now,
    })

    rowCount++
  }

  return results
}

// ─── 2. RemoteOK JSON API Parser ────────────────────────────────────────────

/**
 * Parses RemoteOK /api response.
 * Each job: { position, company, tags[], url, date, description, location }
 */
export function parseRemoteOKJson(jobs: any[], maxRows = 20): Internship[] {
  const results: Internship[] = []
  const now = new Date().toISOString()
  let idCounter = 11000

  for (const job of jobs) {
    if (results.length >= maxRows) break
    // RemoteOK first element is a legal notice object
    if (!job.position && !job.id) continue

    const title = job.position || job.title || ""
    const company = job.company || "Unknown"
    const location = job.location || "Remote"
    const tags: string[] = Array.isArray(job.tags) ? job.tags : []
    const description = job.description || ""

    if (!title || title.length < 3) continue

    const textForSkills = `${title} ${tags.join(" ")} ${description}`
    const skills = extractSkillsFromText(textForSkills)
    // Also add tags that look like skills (short, capitalized)
    for (const tag of tags) {
      if (tag.length <= 20 && !skills.includes(tag)) skills.push(tag)
    }

    results.push({
      id: idCounter++,
      title,
      company,
      location: location || "Remote",
      duration: "3–6 months",
      description: description
        ? description.replace(/<[^>]*>/g, "").substring(0, 200) + "..."
        : `${title} internship at ${company}.`,
      requirements: skills.slice(0, 6),
      salary: job.salary || "Competitive",
      type: "Remote",
      logo: "🟠",
      sector: inferSectorFromTitle(title),
      skills: skills.slice(0, 8),
      missingSkills: [],
      applyLink: job.url || `https://remoteok.com/l/${job.id}`,
      postedDate: job.date ? job.date.split("T")[0] : now.split("T")[0],
      source: "remoteok",
      fetchedAt: now,
    })
  }

  return results
}

// ─── 3. Jooble REST API Parser ───────────────────────────────────────────────

/**
 * Parses Jooble API response.
 * Each job: { title, company, location, snippet, link, salary, updated }
 */
export function parseJoobleResponse(jobs: any[], maxRows = 15): Internship[] {
  const results: Internship[] = []
  const now = new Date().toISOString()
  let idCounter = 12000

  for (const job of jobs) {
    if (results.length >= maxRows) break

    const title = job.title || ""
    const company = job.company || "Unknown Company"
    const location = cleanLocation(job.location || "")
    const snippet = job.snippet || ""

    if (!title || title.length < 3) continue

    const skills = extractSkillsFromText(`${title} ${snippet}`)

    results.push({
      id: idCounter++,
      title,
      company,
      location: location || "India",
      duration: "Internship",
      description: snippet || `${title} opportunity at ${company}. Apply now.`,
      requirements: skills.length > 0 ? skills : ["Relevant skills", "Communication"],
      salary: job.salary || "As per industry",
      type: inferWorkType(location),
      logo: "🟢",
      sector: inferSectorFromTitle(title),
      skills,
      missingSkills: [],
      applyLink: job.link,
      postedDate: job.updated ? job.updated.split("T")[0] : now.split("T")[0],
      source: "jooble",
      fetchedAt: now,
    })
  }

  return results
}

// ─── 4. Remotive Free API Parser ─────────────────────────────────────────────

/**
 * Parses Remotive.com /api/remote-jobs response.
 * Each job: { title, company_name, candidate_required_location, tags[], url, description, publication_date }
 */
export function parseRemotiveResponse(jobs: any[], maxRows = 15): Internship[] {
  const results: Internship[] = []
  const now = new Date().toISOString()
  let idCounter = 13000

  for (const job of jobs) {
    if (results.length >= maxRows) break

    const title = job.title || job.job_title || ""
    const company = job.company_name || job.company || "Unknown"
    const location = cleanLocation(job.candidate_required_location || job.location || "Remote")
    const tags: string[] = Array.isArray(job.tags) ? job.tags : []
    const description = job.description || ""

    if (!title || title.length < 3) continue

    const textForSkills = `${title} ${tags.join(" ")} ${description.replace(/<[^>]*>/g, " ")}`
    const skills = extractSkillsFromText(textForSkills)
    for (const tag of tags) {
      const clean = tag.trim()
      if (clean.length >= 2 && clean.length <= 25 && !skills.includes(clean)) {
        skills.push(clean)
      }
    }

    results.push({
      id: idCounter++,
      title,
      company,
      location: location || "Remote",
      duration: "3–6 months",
      description: description
        ? description.replace(/<[^>]*>/g, "").substring(0, 220) + "..."
        : `${title} internship at ${company}.`,
      requirements: skills.slice(0, 6),
      salary: job.salary || "Competitive",
      type: "Remote",
      logo: "🟣",
      sector: inferSectorFromTitle(title),
      skills: skills.slice(0, 8),
      missingSkills: [],
      applyLink: job.url,
      postedDate: job.publication_date ? job.publication_date.split("T")[0] : now.split("T")[0],
      source: "jooble" as any, // reuse jooble badge slot; swipe-interface shows 🟢 for jooble
      fetchedAt: now,
    })
  }

  return results
}

// ─── Sector Inference ─────────────────────────────────────────────────────────

function inferSectorFromTitle(title: string): string {
  const t = title.toLowerCase()
  if (/software|frontend|backend|full.?stack|web|mobile|ios|android|flutter/.test(t)) return "Software Development"
  if (/data|ml|machine learning|ai|analytics|scientist/.test(t)) return "Data Science & AI"
  if (/design|ui|ux|figma|graphic/.test(t)) return "Design"
  if (/marketing|seo|social media|content/.test(t)) return "Marketing"
  if (/finance|accounting|banking|investment/.test(t)) return "Finance"
  if (/product|project|program manager/.test(t)) return "Product Management"
  if (/devops|cloud|aws|azure|infra|sre/.test(t)) return "Cloud & DevOps"
  if (/security|cyber|penetration/.test(t)) return "Cybersecurity"
  if (/research|science/.test(t)) return "Research"
  return "Technology"
}
