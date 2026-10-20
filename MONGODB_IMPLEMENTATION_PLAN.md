# CarreerPilot — MongoDB + JWT Auth Implementation Plan

Repo analyzed: `yashwadhai21/CarreerPilot` (Next.js 14.2 App Router, TypeScript, Tailwind v4, shadcn/ui).
Status: **plan only — no code has been changed.**

---

## 1. What the project is today

| Area | Current state |
|---|---|
| Auth | **Fake.** `login-form.tsx` / `signup-form.tsx` wait 1 s with `setTimeout`, then flip `isAuthenticated` in `app/page.tsx`. Any email/password works. |
| Database | None. |
| Internships | `lib/internship-data.ts` (static) via `GET /api/internships`, plus live scraping via `GET /api/jobs/realtime` (GitHub, RemoteOK, Remotive; 10-min in-memory cache). |
| Courses | `lib/course-data.ts` via `GET /api/courses`. |
| Resume | `POST /api/resume/analyze` (pdf-parse / mammoth + heuristic parser). Result kept in `sessionStorage` only. |
| Recommendations | `POST /api/recommendations` (skill matcher). |
| User data (liked internships, resume analysis) | React state / `sessionStorage` only. Lost on refresh, not tied to a user. |

Health check I ran: `npm install` OK, `tsc --noEmit` = **0 errors**, `next build` = **succeeds**
(but `next.config.mjs` has `ignoreBuildErrors` + `ignoreDuringBuilds` turned on, which hides problems).

---

## 2. Bugs / issues found (debug report)

Ordered by impact.

| # | Severity | Issue | Where | Fix |
|---|---|---|---|---|
| 1 | **High** | **PDF upload is broken.** `pdf-parse` v2.4.5 exports a `PDFParse` class, not a function. I checked the installed package: `require("pdf-parse")` returns an object with `PDFParse`, so `pdfParse(buffer)` throws and every PDF returns "Could not read PDF". | `app/api/resume/analyze/route.ts` line 46–47 | `const { PDFParse } = require("pdf-parse"); const parser = new PDFParse({ data: buffer }); const { text } = await parser.getText(); await parser.destroy()`. Add `experimental: { serverComponentsExternalPackages: ["pdf-parse", "mammoth"] }` to `next.config.mjs`. Test with a real PDF (I did not run this end-to-end). |
| 2 | **High** | Auth is fake — anyone gets in, nothing is stored. | `app/page.tsx`, both forms | Section 5–7. |
| 3 | **High** | **Logout doesn't clear `sessionStorage`**, so the next user in the same tab inherits the previous user's resume analysis. | `app/page.tsx` `handleLogout`, `swipe-interface.tsx` | Move resume data to DB (per user); clear any local cache on logout. |
| 4 | Medium | **Liked internships are lost on refresh** and are rebuilt from the *currently loaded* list (`likedObjects`), so switching static ↔ LIVE or re-ranking makes liked items vanish. | `swipe-interface.tsx` lines 34, 99–101 | Persist a snapshot of each liked internship in MongoDB. |
| 5 | Medium | **Live internship IDs are unstable.** `realtime-parsers.ts` assigns `id: idCounter++` (starting at 10000, 11000, …), so a job's `id` depends on its position in that fetch's results. When the feed changes, a stored like can point to a different job. | `lib/realtime-parsers.ts` (lines 126, 183, 232, 287) | Use a stable key: `source + ":" + hash(company+title+link)` as `externalId`. |
| 6 | Medium | Build logs `DYNAMIC_SERVER_USAGE` errors for API routes that read `request.url` (seen for `/api/courses` and `/api/jobs/realtime`; `/api/internships` uses the same pattern). Build still passes, but it's noise and a sign the routes aren't declared dynamic. | `app/api/*/route.ts` | Add `export const dynamic = "force-dynamic"` to each route. |
| 7 | Medium | `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` are `true`. Currently harmless (tsc is clean) but will hide future errors. | `next.config.mjs` | Set both to `false` once Section 9 is done. |
| 8 | Low | "Retry" button calls `window.location.reload()` — with real auth this is fine only if the session is restored on load (`/api/auth/me`). | `swipe-interface.tsx` line 200 | Handled in Phase 4. |
| 9 | Low | AI recommendations silently falls back to made-up skills `["JavaScript","React","Python","SQL","Git"]` and hardcodes `experience: "Beginner"` when no resume exists. Misleading results. | `ai-recommendations.tsx` lines 30, 53–57 | Use profile skills from DB; if empty, show "Upload your resume first". |
| 10 | Low | `useEffect` in `swipe-interface.tsx` calls `fetchInternships` without it in the dependency array, and `handleResumeBack` fetches a second time. Double fetch after resume upload. | `swipe-interface.tsx` lines 88–90, 144–152 | Remove the manual re-fetch; keep the effect. |
| 11 | Low | The live-jobs source URL is `SimplifyJobs/Summer2025-Internships` — it's October 2026, so this is probably stale. **Not verified**, check the repo. | `app/api/jobs/realtime/route.ts` line 53 | Point at the current year's repo. |
| 12 | Cleanup | `package.json` name is `my-v0-project`; `@radix-ui/react-progress` is `"latest"`; both `package-lock.json` and `pnpm-lock.yaml` exist; duplicate `components/ui/use-toast.ts` vs `hooks/use-toast.ts`, `use-mobile` ×2; unused `styles/globals.css`; file comments mention Jooble/AuraMatch but the code uses Remotive; the old `implementation_plan.md` says "no API routes" (outdated). | various | Pick one package manager, pin versions, delete duplicates, update docs. |

---

## 3. 🔧 MANUAL WORK (things only you can do)

I can write all the code, but these steps need your accounts/machine.

### A. MongoDB Atlas (≈10 min)
1. Sign up at <https://www.mongodb.com/cloud/atlas> → **Create a free M0 cluster** (pick the **Mumbai (ap-south-1)** region for low latency in India).
2. **Database Access → Add New Database User** → username + password (choose *Read and write to any database*). Use a password **without special characters** (`@ : / ?`), or URL-encode it — otherwise the connection string breaks.
3. **Network Access → Add IP Address**
   - Local development: **Add Current IP Address**.
   - Vercel / any deployment: **Allow access from anywhere (`0.0.0.0/0`)**, because Vercel has no fixed IPs. This is acceptable for a student project *only because* the DB user has a strong password; tighten later.
4. **Database → Connect → Drivers → Node.js** → copy the string:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   Insert the database name before the `?`: `...mongodb.net/carreerpilot?retryWrites=...`
   (Collections are created automatically by Mongoose; you don't create them by hand.)

### B. `.env.local` (project root — already git-ignored by `.env*`)
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/carreerpilot?retryWrites=true&w=majority
JWT_SECRET=<64+ random chars>
JWT_EXPIRES_IN=1d
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
Generate the secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Never commit this file. I'll add a `.env.example` with empty values for the repo.

### C. Local machine
```bash
npm install mongoose bcryptjs jose
npm install -D tsx          # to run the seed script
```
Pick **one** lockfile (`npm` or `pnpm`) and delete the other.

### D. Deployment (only if you deploy to Vercel)
Project → **Settings → Environment Variables** → add `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN` for *Production* (and Preview) → **Redeploy**. Env changes don't apply to old deployments.

### E. After I finish the code
1. `npx tsx scripts/seed.ts` — loads internships + courses into Atlas (once).
2. Open **Atlas → Browse Collections** (or MongoDB Compass) and confirm `users`, `blacklistedtokens`, etc. appear after you register.
3. Test the routes in the browser, Postman or Thunder Client (checklist in Section 10).
4. Optional: install MongoDB Compass to inspect data visually.

---

## 4. Architecture decisions

| Decision | Choice | Why |
|---|---|---|
| ODM | **Mongoose** | Schemas, validation, indexes, TTL index — good for a project you will present. |
| Password hashing | **bcryptjs** (cost 12) | Pure JS, no native build problems on Vercel/Windows. |
| JWT library | **jose** | Works in Node *and* Edge runtime; actively maintained. (`jsonwebtoken` fails in Edge middleware.) |
| Token transport | **httpOnly cookie** `cp_token` (`SameSite=Lax`, `Secure` in prod) + also accept `Authorization: Bearer` | JS can't read an httpOnly cookie, so XSS can't steal the token. Bearer support makes Postman testing easy. |
| Token lifetime | 1 day, no refresh token | Simple and enough for this scope. Refresh tokens listed as optional extension. |
| Blacklist | `BlacklistedToken` collection keyed by JWT `jti`, with a **TTL index** on `expiresAt` | Logout inserts the token id; MongoDB deletes the row automatically after the token would have expired anyway, so the collection never grows forever. |
| Where blacklist is checked | Inside `requireAuth()` in route handlers (Node runtime) | Mongoose can't run in Edge middleware. The app is a single client-side page, so no page-level middleware is needed. |
| Validation | **zod** (already installed) | Shared schema for forms + API. |
| Next.js 14 detail | `cookies()` from `next/headers` is **synchronous** in 14.2 | Don't copy Next 15 `await cookies()` examples. |

---

## 5. Schemas (Mongoose, in `lib/models/`)

### 5.1 `User`
| Field | Type | Notes |
|---|---|---|
| `name` | String, required, trim, 2–60 | |
| `email` | String, required, **unique**, lowercase, trim | index |
| `passwordHash` | String, required, **`select: false`** | never returned by default |
| `skills` | [String] | filled from resume analysis |
| `interests` | [String] | |
| `experience` | enum `Fresher/Beginner/Intermediate/Advanced`, default `Fresher` | matches `UserProfile` |
| `location` | String | |
| `education` | String | |
| `role` | enum `student/admin`, default `student` | |
| `lastLoginAt` | Date | |
| timestamps | createdAt, updatedAt | |

### 5.2 `BlacklistedToken`  (logout)
| Field | Type | Notes |
|---|---|---|
| `jti` | String, **unique**, required | the token's unique id |
| `userId` | ObjectId → User | |
| `expiresAt` | Date, required, **TTL index `expireAfterSeconds: 0`** | copied from the JWT `exp` |
| `createdAt` | Date | |

### 5.3 `ResumeAnalysis`
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId → User, indexed | |
| `fileName`, `fileSize`, `mimeType` | String / Number | |
| `analysis` | Mixed (shape = `AnalysisResult`) | store **without** `extractedText` (privacy + size) |
| `skills` | [String] | copy for fast queries |
| `score` | Number | |
| timestamps | | latest one per user is "current" |

### 5.4 `LikedInternship`
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId → User | |
| `externalId` | String | stable key, e.g. `static:12`, `remoteok:abc123` |
| `source` | enum `static/github/remoteok/remotive` | |
| `snapshot` | Mixed (full `Internship`) | so the like survives when live data changes |
| `createdAt` | Date | |
| **Unique compound index** | `(userId, externalId)` | prevents duplicates |

### 5.5 `Internship`  (catalog, seeded)
Mirrors `lib/types.ts → Internship`: `externalId` (unique), `title`, `company`, `location`, `duration`, `description`, `requirements[]`, `salary`, `type` (enum), `logo`, `scheme`, `sector`, `skills[]`, `applyLink`, `postedDate`, `openings`, `source`. Indexes: text index on `title/company/description`, plus `sector`, `type`.

### 5.6 `Course`  (catalog, seeded)
Mirrors `CourseRecommendation`: `title`, `provider`, `platform`, `duration`, `level`, `rating`, `skills[]`, `category`, `relevantFor[]`, `link`, … Index on `skills`, `category`.

> Optional later: `Application` (userId, internshipExternalId, status) if you want an "applied" tracker.

---

## 6. API routes

All under `app/api/`. All responses are `{ success, data | error }` to match the existing routes.

### Auth
| Method | Route | Body | Behavior |
|---|---|---|---|
| POST | `/api/auth/register` | `{name, email, password, confirmPassword}` | zod-validate → reject duplicate email (409) → `bcrypt.hash(pw, 12)` → create user → sign JWT → set cookie → 201 |
| POST | `/api/auth/login` | `{email, password}` | find user (`+passwordHash`) → `bcrypt.compare` → **same generic error** `Invalid email or password` (401) for wrong email *or* password → sign JWT → set cookie |
| POST | `/api/auth/logout` | — | read token → verify → insert `{jti, userId, expiresAt}` into `BlacklistedToken` → clear cookie → 200. Idempotent: invalid/expired/missing token still returns 200 and clears the cookie. |
| GET | `/api/auth/me` | — | `requireAuth()` → return user (no hash). Used on page load to restore the session. |

Password rule: min 8 chars, at least 1 letter and 1 number. Email normalized to lowercase.

### User data (all protected)
| Method | Route | Purpose |
|---|---|---|
| PATCH | `/api/users/me` | update name, interests, experience, location, education |
| GET | `/api/liked` | list liked internships (snapshots) |
| POST | `/api/liked` | like `{externalId, source, snapshot}` (upsert) |
| DELETE | `/api/liked/[externalId]` | unlike |
| GET | `/api/resume/latest` | latest `ResumeAnalysis` for the user |

### Existing routes — changes
| Route | Change |
|---|---|
| `POST /api/resume/analyze` | Fix pdf-parse (Bug 1). Require auth. After analysis: save `ResumeAnalysis` and update `user.skills`. |
| `POST /api/recommendations` | Require auth. Take skills from DB profile instead of trusting the request body. |
| `GET /api/internships`, `/api/courses` | Read from MongoDB (seeded), keep same query params and response shape. Stay public. |
| `GET /api/jobs/realtime` | Require auth (it fans out to 3 third-party APIs — don't let anonymous traffic burn them). Add stable `externalId`. |

---

## 7. Auth implementation — core code (examples)

### `lib/db.ts` — cached connection (prevents "too many connections" on hot reload)
```ts
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) throw new Error("MONGODB_URI is not set in .env.local")

const g = globalThis as unknown as { _mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }
const cache = (g._mongoose ??= { conn: null, promise: null })

export async function connectDB() {
  if (cache.conn) return cache.conn
  cache.promise ??= mongoose.connect(MONGODB_URI!, { bufferCommands: false })
  cache.conn = await cache.promise
  return cache.conn
}
```

### `lib/models/BlacklistedToken.ts`
```ts
import { Schema, model, models } from "mongoose"

const schema = new Schema({
  jti:       { type: String, required: true, unique: true },
  userId:    { type: Schema.Types.ObjectId, ref: "User" },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }, // TTL
}, { timestamps: { createdAt: true, updatedAt: false } })

export const BlacklistedToken = models.BlacklistedToken || model("BlacklistedToken", schema)
```

### `lib/auth.ts` — sign / verify / requireAuth
```ts
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { BlacklistedToken } from "@/lib/models/BlacklistedToken"

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
export const COOKIE = "cp_token"

export async function signToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN ?? "1d")
    .sign(secret)
}

export function getTokenFromRequest(req: Request) {
  const h = req.headers.get("authorization")
  if (h?.startsWith("Bearer ")) return h.slice(7)
  return cookies().get(COOKIE)?.value ?? null          // Next 14: sync
}

/** Returns { userId, jti, exp } or throws */
export async function requireAuth(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) throw new AuthError("Not authenticated")
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
  await connectDB()
  if (await BlacklistedToken.exists({ jti: payload.jti }))
    throw new AuthError("Token has been revoked")
  return { userId: payload.sub!, jti: payload.jti!, exp: payload.exp! }
}

export class AuthError extends Error {}
```
Route handlers wrap this: `try { const { userId } = await requireAuth(req) } catch { return 401 }`.

### Cookie settings (register + login)
```ts
res.cookies.set(COOKIE, token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24,
})
```

### `app/api/auth/logout/route.ts` — token blacklisting
```ts
export async function POST(req: Request) {
  const res = NextResponse.json({ success: true })
  res.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 })
  try {
    const { userId, jti, exp } = await requireAuth(req)       // verifies signature + not already revoked
    await BlacklistedToken.create({ jti, userId, expiresAt: new Date(exp * 1000) })
  } catch { /* invalid/expired/already revoked → still a successful logout */ }
  return res
}
```
Token lifecycle: **login → JWT (jti=abc) → every request checks signature, expiry and `jti ∉ blacklist` → logout writes `jti=abc` → the same token now gets 401 even though its signature is still valid → Mongo's TTL deletes the row once the token would have expired.**

---

## 8. Frontend changes

| File | Change |
|---|---|
| `components/login-form.tsx` | `fetch("/api/auth/login")`; show server error inline (replace fake delay). |
| `components/signup-form.tsx` | `fetch("/api/auth/register")`; replace `alert()` with inline error; client-side zod validation. |
| `app/page.tsx` | On mount call `/api/auth/me` (show spinner) → restores session after refresh. `handleLogout` calls `/api/auth/logout`, clears local state, returns to login. Hold `user` in state, pass to `SwipeInterface`. |
| `components/swipe-interface.tsx` | Load liked internships from `/api/liked`; like/unlike call the API (optimistic update); load latest resume analysis from `/api/resume/latest` instead of `sessionStorage`; fix Bug 10. |
| `components/resume-analyzer.tsx` | No change in UI; the API now saves the result. |
| `components/ai-recommendations.tsx` | Remove fake default skills (Bug 9). |
| Global | If any API returns 401 → show login screen (single `apiFetch` helper in `lib/api.ts`). |

---

## 9. Implementation order (phases)

1. **Setup** — install deps, `.env.example`, `lib/db.ts`, fix `next.config.mjs` (externalize pdf-parse), add `force-dynamic` to API routes.
2. **Models** — all six in `lib/models/` (+ indexes).
3. **Auth core** — `lib/auth.ts`, `lib/validators.ts`, register / login / logout / me routes.
4. **Frontend auth** — forms, `app/page.tsx`, `lib/api.ts`.
5. **User data** — liked routes, resume save + `/api/resume/latest`, `PATCH /api/users/me`; wire `swipe-interface`.
6. **Catalog in DB** — `scripts/seed.ts`, switch `/api/internships` and `/api/courses` to Mongo; stable `externalId` for live jobs.
7. **Debug fixes** — Bugs 1, 5, 9, 10, 11, 12.
8. **Hardening** — turn off `ignoreBuildErrors` / `ignoreDuringBuilds`, run `npm run build`, add login rate limiting (e.g. 5 failed attempts / 15 min per email+IP, stored in Mongo with a TTL index).
9. **Docs** — rewrite `README` / replace the outdated `implementation_plan.md`.

---

## 10. Verification checklist

**Auth**
- [ ] Register → 201, cookie set, user visible in Atlas, `passwordHash` is a `$2b$12$…` hash (not plain text)
- [ ] Register same email again → 409
- [ ] Register with weak password / mismatched confirm → 400 with a clear message
- [ ] Login wrong password and unknown email → **identical** 401 message
- [ ] `GET /api/auth/me` with cookie → 200; without → 401
- [ ] Refresh the page → still logged in
- [ ] **Logout → then replay the old token** (copy it from DevTools → Application → Cookies, send it as `Authorization: Bearer …` in Postman) → **401 "Token has been revoked"**
- [ ] Atlas shows a row in `blacklistedtokens`; it disappears after `expiresAt` (TTL runs about once a minute)
- [ ] Tampered token (edit one character) → 401; expired token (temporarily set `JWT_EXPIRES_IN=5s`) → 401

**Features**
- [ ] Upload a **PDF**, a DOCX and a TXT resume → all analyze (PDF is the regression test for Bug 1)
- [ ] Analysis is still there after refresh and after logging in on another browser
- [ ] Like → refresh → still liked; toggle LIVE ↔ static → liked items still shown
- [ ] User B does not see User A's likes or resume
- [ ] `npm run build` passes with `ignoreBuildErrors: false`

---

## 11. Known limitations / optional extensions
- No refresh tokens (user re-logs in after 1 day).
- "Logout from all devices" can be added with a `tokenVersion` field on `User` that is checked in `requireAuth`.
- No email verification or password reset (needs an email provider such as Resend/SendGrid — more manual setup).
- The live-jobs cache is still in-memory per server instance; on Vercel serverless it resets often. A Mongo-backed cache with a TTL index is a straightforward upgrade.
