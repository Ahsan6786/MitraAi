
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function GenZToggle() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const isGenzMode = theme === 'theme-genz-dark'

  const toggleGenzMode = () => {
    if (isGenzMode) {
      // If we are in Gen Z mode, switch to the default light theme
      setTheme("theme-blue-light")
      toast({ title: "Gen Z Mode Off" })
    } else {
      // If we are not in Gen Z mode, switch to it
      setTheme("theme-genz-dark")
      toast({ title: "Gen Z Mode On ✨" })
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleGenzMode}
      aria-label="Toggle Gen Z Mode"
    >
      <Sparkles
        className={
            `h-[1.2rem] w-[1.2rem] transition-colors duration-300 ` +
            (isGenzMode ? 'text-yellow-400' : 'text-muted-foreground')
        }
      />
    </Button>
  )
}
