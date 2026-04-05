# AI Internship Portal — Production Upgrade Plan

## Background

The current project is a Next.js 14 app ("AI Internship Portal / Aura-Match") with the following stack:
- **Frontend**: Next.js 14 (App Router), Tailwind CSS v4, Radix UI, shadcn/ui components
- **State**: Client-side only (no backend/API routes)
- **Data**: 100% hardcoded mock data in `swipe-interface.tsx` and `course-recommendations.tsx`
- **AI**: Simulated with `setTimeout` — no real LLM calls

### Current Bugs & Gaps
1. **All internship data is hardcoded** — 5 static entries in `swipe-interface.tsx`
2. **Resume analyzer returns mock data** — always the same fixed output regardless of file  
3. **AI recommendation score is random** — `Math.random()` based, not real matching
4. **Course recommendations are static** — 5 hardcoded courses  
5. **No API routes** — no backend, no env var support, no error handling
6. **Broken image paths** — logos reference non-existent files like `/tech-company-logo.jpg`
7. **Auth is fake** — login/signup just flip a boolean, no real validation
8. **No `.env` support** — OpenAI key can't be configured

---

## User Review Required

> [!IMPORTANT]
> **OpenAI API Key required** for real resume parsing. The plan includes a `.env.local` file. You'll need to supply an `OPENAI_API_KEY`. Without it, the system will auto-fall back to a high-quality heuristic/pattern-matching analyzer.

> [!IMPORTANT]
> **External internship APIs** (LinkedIn, Indeed, Internshala) require paid plans or scraping. The plan uses:
> - **PM Internship Scheme data** — curated & hardcoded (official portal has no public API)
> - **Internshala** — best-effort public scraping via a server-side proxy API route
> - **A rich, realistic static dataset (50+ entries)** — diverse companies, sectors, locations — to replace the 5-entry mock while scraping is set up

> [!WARNING]
> **No UI/UX changes** — all visual components remain identical. Only data flow, API routes, and business logic are improved.

---

## Proposed Changes

### 1. Environment & Configuration

#### [NEW] `.env.local`
```
OPENAI_API_KEY=your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### [MODIFY] `next.config.mjs`
- Add `images.remotePatterns` for logo domains (Clearbit, etc.)

---

### 2. Type System & Shared Data

#### [NEW] `lib/types.ts`
Shared TypeScript interfaces used across all components and API routes:
- `Internship`, `AnalysisResult`, `CourseRecommendation`, `UserProfile`, `RecommendationScore`

#### [NEW] `lib/internship-data.ts`
Rich static dataset of **30+ realistic internships** across:
- PM Internship Scheme (TCS, Infosys, Wipro, L&T, Mahindra, BPCL, etc.)
- Private companies (Cisco, Microsoft, Google India, Flipkart, Zomato, etc.)
- Sectors: IT, Finance, Healthcare, Marketing, Data Science, Engineering
- All entries have complete data: logos via Clearbit CDN, apply links, stipends

#### [NEW] `lib/course-data.ts`
Curated dataset of **20+ real courses** from:
- NPTEL (actual course URLs)
- SWAYAM (actual course URLs)  
- Coursera (India-relevant courses)
- Each course tagged with skill areas for gap-matching

---

### 3. API Routes (Next.js Route Handlers)

#### [NEW] `app/api/internships/route.ts`
- **GET** with query params: `?search=`, `?sector=`, `?type=`, `?location=`
- Returns filtered internships from the rich dataset
- Adds `matchScore` field based on user skills (passed via query)

#### [NEW] `app/api/resume/analyze/route.ts`
- **POST** with multipart form data (PDF/DOCX file)
- Extracts text from file using `pdf-parse` library
- If `OPENAI_API_KEY` is set: sends to GPT-4o-mini with structured JSON output prompt
- If no key: uses robust regex/keyword pattern matching as fallback
- Returns: skills, experience, education, score, gaps, scheme readiness

#### [NEW] `app/api/recommendations/route.ts`
- **POST** with `{ userSkills, likedInternships, userProfile }`
- Computes TF-IDF-style skill matching scores
- Returns ranked internships with match reasons and scores

#### [NEW] `app/api/courses/route.ts`
- **GET** with `?skills=cloud,ml,python` query
- Returns skill-gap-matched courses ordered by relevance

---

### 4. Component Upgrades

#### [MODIFY] `components/swipe-interface.tsx`
- Remove `mockInternships` hardcoded array
- Add `useEffect` to fetch from `/api/internships` on mount
- Add loading skeleton state
- Pass real data to child components
- Fix: store `userSkills` from resume analyzer in component state (passed down)

#### [MODIFY] `components/resume-analyzer.tsx`
- Replace `setTimeout` mock with real `fetch('/api/resume/analyze', ...)` POST call
- Add proper loading states with progress indication
- Add error handling for unsupported files / API failures
- Store analysis result in sessionStorage for use by other components

#### [MODIFY] `components/ai-recommendations.tsx`
- Replace `Math.random()` scoring with real API call to `/api/recommendations`
- Show a proper animated loading state
- Load `userProfile` from sessionStorage (populated by resume analyzer)

#### [MODIFY] `components/course-recommendations.tsx`
- Remove hardcoded `courseRecommendations` array
- Fetch from `/api/courses?skills=...` based on skill gaps
- Show real NPTEL/SWAYAM/Coursera courses with proper links

#### [MODIFY] `components/internship-card.tsx`
- Fix broken image paths — use `onError` fallback to a text-based placeholder
- Add `matchScore` display badge (from API)

---

### 5. Supporting Libraries

#### [MODIFY] `package.json` — add:
- `pdf-parse` — PDF text extraction (server-side only)
- `openai` — OpenAI SDK for GPT integration

---

## Open Questions

> [!IMPORTANT]
> Do you have an OpenAI API key to configure? If yes, the resume analyzer will use GPT-4o-mini for real text extraction and analysis. If no, a heuristic fallback will be used that is still significantly better than the current mock.

> [!NOTE]
> The plan keeps all UI/UX exactly as-is. Only the data layer, API routes, and business logic are changing.

---

## Verification Plan

### Automated
- `npm run build` — confirm no TypeScript errors
- `npm run dev` — confirm app starts

### Manual
1. Login → see 30+ real internships instead of 5
2. Swipe through cards → logos load correctly
3. Open Resume Analyzer → upload a PDF → get real analysis (not same fixed output every time)
4. Check AI Match → see proper skill-based scores (not random)
5. Check Courses → see real NPTEL/SWAYAM courses matched to skill gaps
6. Filter by sector/type → see filtered results

