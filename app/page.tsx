"use client"

import { useState } from "react"
import { LoginForm } from "@/components/login-form"
import { SignupForm } from "@/components/signup-form"
import { SwipeInterface } from "@/components/swipe-interface"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [currentView, setCurrentView] = useState<"login" | "signup" | "app">("login")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = () => {
    setIsAuthenticated(true)
    setCurrentView("app")
  }

  const handleSignup = () => {
    setIsAuthenticated(true)
    setCurrentView("app")
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentView("login")
  }

  if (isAuthenticated && currentView === "app") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Aura-Match</h1>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>
        <SwipeInterface />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">PM</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent mb-2">
            AI InternShip Portal
          </h1>
          <p className="text-slate-600 text-balance">Empowering Youth Through Government-Backed Internships</p>
          <p className="text-sm text-slate-500 mt-2">Part of Digital India Initiative</p>
        </div>

        {currentView === "login" ? (
          <div className="space-y-4">
            <LoginForm onLogin={handleLogin} />
            <div className="text-center">
              <Button variant="link" onClick={() => setCurrentView("signup")} className="text-primary">
                Don't have an account? Sign up
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <SignupForm onSignup={handleSignup} />
            <div className="text-center">
              <Button variant="link" onClick={() => setCurrentView("login")} className="text-primary">
                Already have an account? Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
