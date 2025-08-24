"use client"

import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Light Themes</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Blue (Default)
        </DropdownMenuItem>
         <DropdownMenuItem onClick={() => setTheme("theme-gold-light")}>
          Gold
        </DropdownMenuItem>
         <DropdownMenuItem onClick={() => setTheme("theme-pink-light")}>
          Pink
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Dark Themes</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Blue (Default)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-gold-dark")}>
          Golden Black
        </DropdownMenuItem>
         <DropdownMenuItem onClick={() => setTheme("theme-pink-dark")}>
          Pink Black
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
