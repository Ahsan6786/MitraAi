
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Sparkles } from "lucide-react"

export function GenZToggle() {
  const { theme, setTheme } = useTheme()

  const isGenZMode = theme === "theme-genz-dark";

  const toggleGenZMode = () => {
    if (isGenZMode) {
      setTheme("theme-green-dark") // Or your preferred default dark theme
    } else {
      setTheme("theme-genz-dark")
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="genz-mode-toggle"
        checked={isGenZMode}
        onCheckedChange={toggleGenZMode}
      />
      <Label htmlFor="genz-mode-toggle" className="flex items-center gap-1 cursor-pointer">
        <Sparkles className="h-[1.2rem] w-[1.2rem] transition-all text-purple-400" />
        Gen Z Mode
      </Label>
    </div>
  )
}
