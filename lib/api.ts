/**
 * lib/api.ts
 * Type-safe API client for client components with automatic credentials,
 * error handling, and session expiration notification.
 */

export class ApiError extends Error {
  statusCode: number
  data?: any

  constructor(message: string, statusCode: number, data?: any) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
    this.data = data
  }
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; error?: string; [key: string]: any }> {
  const isFormData = options.body instanceof FormData

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...((options.headers as Record<string, string>) || {}),
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: "include", // include httpOnly cookies
  })

  let json: any
  try {
    json = await response.json()
  } catch {
    json = {
      success: response.ok,
      error: response.ok ? undefined : `Request failed with status ${response.status}`,
    }
  }

  if (!response.ok) {
    const errorMsg = json?.error || `Request failed with status ${response.status}`
    throw new ApiError(errorMsg, response.status, json)
  }

  return json
}

export const api = {
  get: <T = any>(url: string, options?: RequestInit) =>
    apiFetch<T>(url, { ...options, method: "GET" }),

  post: <T = any>(url: string, body?: any, options?: RequestInit) =>
    apiFetch<T>(url, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T = any>(url: string, body?: any, options?: RequestInit) =>
    apiFetch<T>(url, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T = any>(url: string, options?: RequestInit) =>
    apiFetch<T>(url, { ...options, method: "DELETE" }),
}
