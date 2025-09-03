
"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function GenZToggle() {
  const { theme, setTheme } = useTheme()

  const toggleGenZMode = () => {
    if (theme === "theme-genz-dark") {
      setTheme("theme-green-dark") // Or your preferred default dark theme
    } else {
      setTheme("theme-genz-dark")
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleGenZMode}>
      <Sparkles className="h-[1.2rem] w-[1.2rem] transition-all text-purple-400" />
      <span className="sr-only">Toggle GenZ Mode</span>
    </Button>
  )
}
