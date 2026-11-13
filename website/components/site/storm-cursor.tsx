"use client"

import { useEffect, useRef } from "react"

// Red electricity that follows the bolt cursor: sparks shed as the mouse moves,
// small arcs crackle off the tip (more often over anything clickable), and a
// click throws a forked burst of lightning. Mouse only, and skipped entirely
// when the visitor prefers reduced motion. The canvas never takes pointer
// events, and the loop sleeps whenever there's nothing left to draw.

type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; hue: number }
type Arc = { paths: Array<Array<[number, number]>>; life: number; max: number; width: number }

const CLICKABLE = "a, button, summary, label, select, [role='button'], [role='tab'], [role='link']"

// Jagged line from (x1, y1) to (x2, y2) by midpoint displacement.
function jag(x1: number, y1: number, x2: number, y2: number, roughness: number, depth = 4): Array<[number, number]> {
  let pts: Array<[number, number]> = [
    [x1, y1],
    [x2, y2],
  ]
  let offset = Math.hypot(x2 - x1, y2 - y1) * roughness
  for (let d = 0; d < depth; d++) {
    const next: Array<[number, number]> = [pts[0]]
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i]
      const [bx, by] = pts[i + 1]
      const len = Math.hypot(bx - ax, by - ay) || 1
      // Push the midpoint sideways, perpendicular to the segment.
      const n = (Math.random() * 2 - 1) * offset
      next.push([(ax + bx) / 2 + (-(by - ay) / len) * n, (ay + by) / 2 + ((bx - ax) / len) * n], pts[i + 1])
    }
    pts = next
    offset /= 2
  }
  return pts
}

// A bolt with a couple of side forks.
function forkedBolt(x: number, y: number, angle: number, length: number) {
  const ex = x + Math.cos(angle) * length
  const ey = y + Math.sin(angle) * length
  const main = jag(x, y, ex, ey, 0.25)
  const paths = [main]
  const forks = 1 + Math.floor(Math.random() * 2)
  for (let f = 0; f < forks; f++) {
    const [sx, sy] = main[2 + Math.floor(Math.random() * (main.length - 4))]
    const a = angle + (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.6)
    const l = length * (0.25 + Math.random() * 0.3)
    paths.push(jag(sx, sy, sx + Math.cos(a) * l, sy + Math.sin(a) * l, 0.3, 3))
  }
  return paths
}

export function StormCursor() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    if (!window.matchMedia("(pointer: fine)").matches) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const sparks: Spark[] = []
    const arcs: Arc[] = []
    let flash = { x: 0, y: 0, life: 0 }
    let raf = 0
    let last = performance.now()
    let px = -1
    let py = -1
    let hot = false
    let nextCrackle = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const spark = (x: number, y: number, speed: number, max = 350 + Math.random() * 350) => {
      const a = Math.random() * Math.PI * 2
      const s = speed * (0.3 + Math.random())
      sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: max, max, hue: Math.random() })
    }

    const crackle = (x: number, y: number, length: number) => {
      const a = Math.random() * Math.PI * 2
      arcs.push({ paths: [jag(x, y, x + Math.cos(a) * length, y + Math.sin(a) * length, 0.35, 3)], life: 110, max: 110, width: 1.2 })
    }

    const wake = () => {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }

    const strokePath = (path: Array<[number, number]>) => {
      ctx.beginPath()
      ctx.moveTo(path[0][0], path[0][1])
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1])
      ctx.stroke()
    }

    function frame(now: number) {
      const dt = Math.min(now - last, 50)
      last = now
      ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight)
      ctx!.globalCompositeOperation = "lighter"
      ctx!.lineCap = "round"
      ctx!.lineJoin = "round"

      // Idle crackle at the tip while hovering something clickable.
      if (hot && px >= 0 && now > nextCrackle) {
        crackle(px, py, 10 + Math.random() * 14)
        nextCrackle = now + 90 + Math.random() * 260
      }

      if (flash.life > 0) {
        const t = flash.life / 220
        const g = ctx!.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, 90)
        g.addColorStop(0, `rgba(255, 90, 110, ${0.35 * t})`)
        g.addColorStop(1, "rgba(255, 40, 70, 0)")
        ctx!.fillStyle = g
        ctx!.fillRect(flash.x - 90, flash.y - 90, 180, 180)
        flash.life -= dt
      }

      for (let i = arcs.length - 1; i >= 0; i--) {
        const arc = arcs[i]
        arc.life -= dt
        if (arc.life <= 0) {
          arcs.splice(i, 1)
          continue
        }
        // Flicker: lightning doesn't fade smoothly.
        const t = (arc.life / arc.max) * (0.6 + Math.random() * 0.4)
        for (const [j, path] of arc.paths.entries()) {
          const w = j === 0 ? arc.width : arc.width * 0.6
          ctx!.strokeStyle = `rgba(207, 16, 45, ${0.45 * t})`
          ctx!.lineWidth = w * 4
          strokePath(path)
          ctx!.strokeStyle = `rgba(255, 70, 95, ${t})`
          ctx!.lineWidth = w
          strokePath(path)
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.life -= dt
        if (s.life <= 0) {
          sparks.splice(i, 1)
          continue
        }
        const k = dt / 16
        s.vx *= 0.94 ** k
        s.vy = s.vy * 0.94 ** k + 0.04 * k
        s.x += s.vx * k
        s.y += s.vy * k
        const t = s.life / s.max
        ctx!.strokeStyle =
          s.hue > 0.8 ? `rgba(255, 42, 68, ${t})` : s.hue > 0.4 ? `rgba(255, 84, 104, ${t})` : `rgba(207, 16, 45, ${t})`
        ctx!.lineWidth = 1.5
        ctx!.beginPath()
        ctx!.moveTo(s.x, s.y)
        ctx!.lineTo(s.x - s.vx * 2.5, s.y - s.vy * 2.5)
        ctx!.stroke()
      }

      if (sparks.length || arcs.length || flash.life > 0 || hot) {
        raf = requestAnimationFrame(frame)
      } else {
        raf = 0
        ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight)
      }
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return
      const { clientX: x, clientY: y } = event
      const dist = px < 0 ? 0 : Math.hypot(x - px, y - py)
      px = x
      py = y
      hot = !!(event.target as Element | null)?.closest?.(CLICKABLE)

      // Shed sparks in proportion to speed, capped so fast flicks stay cheap.
      const count = Math.min(Math.floor(dist / 14), 4)
      for (let i = 0; i < count; i++) spark(x, y, 1.2 + dist * 0.03)
      if (dist > 35 && Math.random() < 0.35) crackle(x, y, 14 + Math.random() * 18)
      if (sparks.length > 220) sparks.splice(0, sparks.length - 220)
      wake()
    }

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return
      const { clientX: x, clientY: y } = event
      const bolts = 4 + Math.floor(Math.random() * 3)
      const base = Math.random() * Math.PI * 2
      for (let b = 0; b < bolts; b++) {
        const angle = base + (b / bolts) * Math.PI * 2 + (Math.random() - 0.5) * 0.6
        arcs.push({ paths: forkedBolt(x, y, angle, 45 + Math.random() * 55), life: 320, max: 320, width: 1.8 })
      }
      for (let i = 0; i < 22; i++) spark(x, y, 4, 450 + Math.random() * 400)
      flash = { x, y, life: 220 }
      wake()
    }

    const onLeave = () => {
      px = -1
      hot = false
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onDown, { passive: true })
    document.documentElement.addEventListener("pointerleave", onLeave)
    window.addEventListener("resize", resize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onDown)
      document.documentElement.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100] h-full w-full" />
}
