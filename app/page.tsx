"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { SignupForm } from "@/components/signup-form"
import { SwipeInterface } from "@/components/swipe-interface"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Loader2,
  LogOut,
  Sparkles,
  Target,
  User as UserIcon,
} from "lucide-react"
import { api } from "@/lib/api"

export default function Home() {
  const [currentView, setCurrentView] = useState<"login" | "signup" | "app">("login")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Restore session on mount
  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      try {
        const res = await api.get("/api/auth/me")
        if (isMounted && res.success && res.data) {
          setUser(res.data)
          setIsAuthenticated(true)
          setCurrentView("app")
        }
      } catch {
        // Not authenticated
        if (isMounted) {
          setIsAuthenticated(false)
          setCurrentView("login")
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [])

  const handleLogin = (userData: any) => {
    setUser(userData)
    setIsAuthenticated(true)
    setCurrentView("app")
  }

  const handleSignup = (userData: any) => {
    setUser(userData)
    setIsAuthenticated(true)
    setCurrentView("app")
  }

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout")
    } catch {
      // Ignore logout errors
    } finally {
      // Clear all local caches on logout
      if (typeof window !== "undefined") {
        sessionStorage.clear()
        localStorage.removeItem("careerpilot_liked")
        localStorage.removeItem("careerpilot_profile")
      }
      setUser(null)
      setIsAuthenticated(false)
      setCurrentView("login")
    }
  }

  // Initial session restoration loading state
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-app-ambient flex flex-col items-center justify-center p-4">
        <div className="relative mb-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/25 animate-pulse">
            <span className="text-primary-foreground font-black text-2xl tracking-tight">CP</span>
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-primary/20 blur-sm -z-10 animate-ping opacity-30" />
        </div>
        <div className="flex items-center gap-2.5 text-foreground font-semibold text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Restoring CareerPilot session...</span>
        </div>
      </div>
    )
  }

  // Authenticated App Shell (Screen 2: App Header)
  if (isAuthenticated && currentView === "app") {
    const userInitials = user?.name
      ? user.name
          .split(" ")
          .map((n: string) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "CP"

    return (
      <div className="min-h-screen bg-app-ambient text-foreground selection:bg-primary/20">
        <header className="border-b border-border bg-card/85 sticky top-0 z-50 backdrop-blur-md shadow-xs">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm shadow-primary/30">
                <span className="text-primary-foreground font-black text-base tracking-tight">CP</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-foreground leading-tight">CareerPilot</h1>
                  <span className="hidden md:inline-flex badge-primary text-[10px] px-2 py-0.2">
                    PM Scheme
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-none hidden sm:block">
                  AI Internship & Career Portal for India
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />

              {user?.name && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground bg-muted/80 px-3 py-1.5 rounded-full border border-border">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center">
                    {userInitials}
                  </div>
                  <span className="font-semibold text-foreground max-w-[120px] truncate hidden sm:inline-block">
                    {user.name}
                  </span>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 transition-colors"
                aria-label="Log out of CareerPilot"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        <main>
          <SwipeInterface user={user} onLogout={handleLogout} />
        </main>
      </div>
    )
  }

  // Screen 1: Login / Signup (Split Screen on Desktop, Single Column on Mobile)
  return (
    <div className="min-h-screen bg-app-ambient flex flex-col justify-between">
      {/* Top navbar with theme toggle */}
      <div className="w-full border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-black text-xs">CP</span>
            </div>
            <span className="font-bold text-base text-foreground tracking-tight">CareerPilot</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline-block font-medium">
              Digital India Initiative
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main split-screen container */}
      <div className="flex-1 container mx-auto px-4 sm:px-6 py-8 md:py-12 flex items-center justify-center">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Brand Panel (Desktop) */}
          <div className="lg:col-span-7 space-y-6 lg:pr-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/40 bg-accent text-accent-foreground text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-accent-foreground" />
              <span>Government of India & PM Internship Scheme</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.15]">
                Match your skills with <span className="text-primary">high-impact</span> internships.
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                Tinder-style swipe interface designed for Indian college students. Explore curated PM
                Scheme opportunities, verify skill alignment, and learn what you need to succeed.
              </p>
            </div>

            {/* 3 Benefit Bullets */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">AI-Powered Skill Gap Analysis</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    Upload your resume to instantly see % match scores and learn exactly which requirements
                    you already fulfill.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Government PM Scheme Opportunities</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    Access verified 12-month roles with guaranteed ₹5,000/mo allowance and certificates
                    recognized across India.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Curated NPTEL & SWAYAM Courses</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    Close skill gaps directly through government-certified free learning tracks matched to
                    your missing requirements.
                  </p>
                </div>
              </div>
            </div>

            {/* Trust metric strip */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground border-t border-border/80">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-success" />
                100% Free for College Students
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-success" />
                Verified Live Job Feeds
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-success" />
                No Spam & No Ads
              </span>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            {/* View Selector Tab Switcher */}
            <div className="flex p-1 bg-muted/80 rounded-2xl mb-4 border border-border">
              <button
                type="button"
                onClick={() => setCurrentView("login")}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  currentView === "login"
                    ? "bg-card text-foreground shadow-sm shadow-black/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setCurrentView("signup")}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  currentView === "signup"
                    ? "bg-card text-foreground shadow-sm shadow-black/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Account
              </button>
            </div>

            {currentView === "login" ? (
              <LoginForm onLogin={handleLogin} />
            ) : (
              <SignupForm onSignup={handleSignup} />
            )}

            <p className="text-[11px] text-center text-muted-foreground mt-4 leading-relaxed">
              By accessing CareerPilot, you agree to the government & academic internship terms. All data is
              stored securely.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-border/60 bg-card/40 backdrop-blur-sm py-4">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} CareerPilot. Built for students across India.</p>
          <div className="flex items-center gap-4">
            <span>PM Internship Scheme 2024-2025</span>
            <span>•</span>
            <span>SWAYAM & NPTEL Partnered</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

