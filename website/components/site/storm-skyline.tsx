"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger, useGSAP)

// The animated skyline behind the hero. three.js loads after the page does, so
// it never holds up the first paint; until then (or without WebGL) the
// gradient on this element stands in.
export function StormSkyline({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  // Fade the scene out as the hero scrolls away, so it's gone by the time the
  // next section arrives instead of clashing with it.
  useGSAP(() => {
    const container = ref.current
    const hero = container?.parentElement
    if (!container || !hero) return
    const mm = gsap.matchMedia()
    mm.add(
      { motion: "(prefers-reduced-motion: no-preference)", reduced: "(prefers-reduced-motion: reduce)" },
      (context) => {
        gsap.to(container, {
          opacity: 0,
          // A slow push in while it fades, unless motion is reduced.
          scale: context.conditions?.motion ? 1.08 : 1,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom 15%", scrub: true },
        })
      },
    )
  })

  useEffect(() => {
    const container = ref.current
    if (!container) return
    let cancelled = false
    let cleanup = () => {}

    import("@/lib/three/storm-scene").then(({ createStormScene }) => {
      if (cancelled) return
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      const scene = createStormScene(container, { reducedMotion, onReady: () => setReady(true) })
      if (!scene) return

      // Click or tap the sky to call down a bolt.
      const section = container.parentElement ?? container
      const onPointerDown = (event: PointerEvent) => {
        if ((event.target as Element).closest("a, button, input, label, form")) return
        scene.strikeAt(event.clientX, event.clientY)
      }
      // Parallax follows a mouse, not a finger.
      const finePointer = window.matchMedia("(pointer: fine)").matches
      const onPointerMove = (event: PointerEvent) => {
        scene.setPointer((event.clientX / window.innerWidth) * 2 - 1, -((event.clientY / window.innerHeight) * 2 - 1))
      }
      section.addEventListener("pointerdown", onPointerDown)
      if (finePointer) window.addEventListener("pointermove", onPointerMove)

      cleanup = () => {
        section.removeEventListener("pointerdown", onPointerDown)
        window.removeEventListener("pointermove", onPointerMove)
        scene.dispose()
      }
    })

    return () => {
      cancelled = true
      cleanup()
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "bg-[linear-gradient(to_bottom,#060c22_0%,#0c1a40_45%,#1d2c5e_70%,#050a1a_100%)]",
        "[&>canvas]:transition-opacity [&>canvas]:duration-1000",
        ready ? "[&>canvas]:opacity-100" : "[&>canvas]:opacity-0",
        className,
      )}
    />
  )
}
