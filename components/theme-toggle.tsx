"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={`w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl border-border bg-card/60 ${className ?? ""}`}
        aria-label="Toggle theme"
        disabled
      >
        <span className="w-4 h-4" />
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={`w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl border-border bg-card/60 backdrop-blur-sm text-foreground hover:bg-muted hover:text-foreground transition-all duration-200 cursor-pointer ${className ?? ""}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-warning transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-primary transition-transform duration-300 hover:-rotate-12" />
      )}
    </Button>
  )
}
