"use client"

import { useEffect, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

// The fixed bar behind the navbar. It's clear at the top of the page so the
// hero shows through, then picks up a dark, blurred background once you
// scroll so the links stay readable over the sections below.
export function NavShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24)
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-white/10 bg-background/75 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      {children}
    </header>
  )
}
