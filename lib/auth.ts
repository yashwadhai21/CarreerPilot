import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { BlacklistedToken } from "@/lib/models/BlacklistedToken"

export const COOKIE = "cp_token"

function getJwtSecret(): Uint8Array {
  const secretStr = process.env.JWT_SECRET
  if (!secretStr) {
    throw new Error("JWT_SECRET is not set in environment variables")
  }
  return new TextEncoder().encode(secretStr)
}

export class AuthError extends Error {
  statusCode: number
  constructor(message = "Unauthorized", statusCode = 401) {
    super(message)
    this.name = "AuthError"
    this.statusCode = statusCode
  }
}

export async function signToken(userId: string): Promise<string> {
  const secret = getJwtSecret()
  const expiresIn = process.env.JWT_EXPIRES_IN || "1d"

  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)
}

export function getTokenFromRequest(req: Request): string | null {
  // 1. Authorization: Bearer <token>
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim()
  }

  // 2. Cookie via next/headers (sync in Next 14.2)
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(COOKIE)?.value
    if (token) return token
  } catch {
    // If called outside of Request context, fall back to parsing header
  }

  // 3. Fallback: Parse Cookie header manually
  const cookieHeader = req.headers.get("cookie")
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))
    if (match) {
      return decodeURIComponent(match[1])
    }
  }

  return null
}

export async function requireAuth(req: Request): Promise<{
  userId: string
  jti: string
  exp: number
}> {
  const token = getTokenFromRequest(req)
  if (!token) {
    throw new AuthError("Not authenticated", 401)
  }

  let payload
  try {
    const secret = getJwtSecret()
    const verified = await jwtVerify(token, secret, { algorithms: ["HS256"] })
    payload = verified.payload
  } catch (err: any) {
    throw new AuthError("Invalid or expired token", 401)
  }

  if (!payload.sub || !payload.jti || !payload.exp) {
    throw new AuthError("Malformed token payload", 401)
  }

  await connectDB()
  const isRevoked = await BlacklistedToken.exists({ jti: payload.jti })
  if (isRevoked) {
    throw new AuthError("Token has been revoked", 401)
  }

  return {
    userId: payload.sub,
    jti: payload.jti,
    exp: payload.exp,
  }
}
