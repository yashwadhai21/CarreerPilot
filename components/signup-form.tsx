"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { passwordRegex } from "@/lib/validators"
import { toast } from "sonner"

interface SignupFormProps {
  onSignup: (user: any) => void
}

export function SignupForm({ onSignup }: SignupFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {}

    if (name.trim().length < 2) {
      errors.name = "Full name must be at least 2 characters long"
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address"
    }

    if (!passwordRegex.test(password)) {
      errors.password = "Min 8 characters, including at least 1 letter and 1 number"
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validate()) {
      return
    }

    setIsLoading(true)

    try {
      const result = await api.post("/api/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      })

      if (result.success && result.data) {
        toast.success("Account created successfully!", {
          description: `Welcome to CarreerPilot, ${result.data.name}!`,
        })
        onSignup(result.data)
      } else {
        const msg = result.error || "Failed to create account"
        setError(msg)
        toast.error("Registration failed", { description: msg })
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Network error. Please try again."
      setError(msg)
      toast.error("Registration failed", { description: msg })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full surface-card border-border/80 shadow-lg shadow-black/5 dark:shadow-black/20">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">Create your account</CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Get started with PM Scheme and top industry internships across India
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div
            role="alert"
            className="mb-5 p-3.5 text-sm rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-2.5 animate-in fade-in-50 duration-200"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium text-xs sm:text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-semibold text-foreground">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="name"
                type="text"
                placeholder="e.g. Yash Sharma"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }))
                }}
                required
                disabled={isLoading}
                className={`pl-10 h-11 bg-card border-border/80 focus-visible:ring-primary ${
                  fieldErrors.name ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                aria-invalid={!!fieldErrors.name}
              />
            </div>
            {fieldErrors.name && (
              <p className="text-xs text-destructive font-medium pl-1">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-semibold text-foreground">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }))
                }}
                required
                disabled={isLoading}
                autoComplete="email"
                className={`pl-10 h-11 bg-card border-border/80 focus-visible:ring-primary ${
                  fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                aria-invalid={!!fieldErrors.email}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-destructive font-medium pl-1">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 chars, 1 letter, 1 number"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }))
                }}
                required
                disabled={isLoading}
                autoComplete="new-password"
                className={`pl-10 pr-10 h-11 bg-card border-border/80 focus-visible:ring-primary ${
                  fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                aria-invalid={!!fieldErrors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-destructive font-medium pl-1">{fieldErrors.password}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                  }
                }}
                required
                disabled={isLoading}
                autoComplete="new-password"
                className={`pl-10 pr-10 h-11 bg-card border-border/80 focus-visible:ring-primary ${
                  fieldErrors.confirmPassword
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
                aria-invalid={!!fieldErrors.confirmPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-destructive font-medium pl-1">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-semibold btn-primary mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Creating your account...</span>
              </>
            ) : (
              "Create free account"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

