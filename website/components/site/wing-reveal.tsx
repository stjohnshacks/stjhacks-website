"use client"

import { useLayoutEffect, useRef, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

// Johnny Thunderbird's wing, after the costume's sleeve, used as a full-width
// panel that holds content. It's shaped like an outstretched wing: full height
// at the shoulder on the left, tapering to a point at the tip on the right,
// with an even row of feathers along the curved lower edge. Body and feathers
// are the same solid red, so the wing reads as one silhouette, and each
// feather ends in a white tip like the costume's fur trim. It stays still.

const RED = "#d4122f"
const FUR = "#f4f1ee"

type Pt = [number, number]

// The lower (trailing) edge of the wing, from the shoulder to the tip, as
// fractions of the panel's width and height: one long arc that rises a little
// at the shoulder, dips lowest under the content, and sweeps up to the tip.
// Phones get a flatter arc, since the content is wider there and the panel
// much taller than it is wide.
const EDGE: Pt[] = [
  [0, 0.8],
  [0.06, 0.88],
  [0.15, 0.95],
  [0.28, 0.99],
  [0.4, 1],
  [0.55, 0.97],
  [0.67, 0.9],
  [0.78, 0.76],
  [0.88, 0.55],
  [0.95, 0.3],
  [1, 0],
]
const EDGE_NARROW: Pt[] = [
  [0, 0.9],
  [0.12, 0.96],
  [0.26, 0.99],
  [0.4, 1],
  [0.65, 0.95],
  [0.8, 0.88],
  [0.9, 0.76],
  [0.96, 0.5],
  [0.99, 0.2],
  [1, 0],
]
const NARROW = 640

// Phones skip the wing shape: the section is a plain red block the full width
// of the screen, with one even row of feathers hanging off its bottom edge.
const PHONE = "(max-width: 639px)"

/** The phone's fringe: feathers about every 34px along the bottom edge, all swept a little right. */
function flatFeathers(w: number, h: number): { long: FeatherSpec[]; short: FeatherSpec[]; cap?: undefined } {
  const count = Math.max(8, Math.round(w / 34))
  const spacing = w / count
  const length = spacing * 2.2
  const long: FeatherSpec[] = []
  const short: FeatherSpec[] = []
  for (let i = -1; i <= count; i++) {
    const base = { angle: -12, order: 0 }
    long.push({ ...base, x: (i + 0.5) * spacing, y: h - spacing * 0.2, length, width: spacing * 1.15 })
    short.push({ ...base, x: (i + 1) * spacing, y: h - spacing * 0.4, length: length * 0.55, width: spacing })
  }
  return { long: long.reverse(), short: short.reverse() }
}

/** Height of the edge (as a fraction) at a point x along the wing. */
function edgeAt(edge: Pt[], x: number) {
  for (let i = 1; i < edge.length; i++) {
    const [x0, y0] = edge[i - 1]
    const [x1, y1] = edge[i]
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
  }
  return edge[edge.length - 1][1]
}

/** The wing's outline as a CSS polygon: one straight line along the top to the tip, back along the edge. */
function clipPolygon(edge: Pt[]) {
  const points: Pt[] = [[0, 0], ...edge.slice().reverse()]
  return `polygon(${points.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(", ")})`
}

/**
 * Clips the feathers to below the wing's top line (extended past both ends),
 * so none poke up above it and the top runs straight into the tip.
 */
function belowTopLine(edge: Pt[]) {
  const tipY = edge[edge.length - 1][1] * 100
  return `polygon(-50% ${-tipY * 0.5}%, 150% ${tipY * 1.5}%, 150% 400%, -50% 400%)`
}

/** A curved feather hanging from (0, 0), its tip swept slightly right. */
function featherPath(length: number, width: number) {
  const w = width / 2
  return (
    `M ${-w} 0 C ${-w} ${length * 0.5} ${-width * 0.2} ${length * 0.85} ${width * 0.18} ${length} ` +
    `C ${width * 0.45} ${length * 0.72} ${w} ${length * 0.4} ${w} 0 Z`
  )
}

type FeatherSpec = {
  x: number
  y: number
  angle: number
  length: number
  width: number
  /** 0 at the shoulder to 1 at the tip; sets when it swings in. */
  order: number
}

// Which way the feathers point, in degrees below horizontal (pointing right).
// They fan from down-and-right at the shoulder to almost straight out at the
// tip, the way a spread wing's feathers do. Each is then pulled halfway toward
// pointing straight out from the edge, so they stick out evenly wherever the
// edge curves, including where it rises at the shoulder.
const FEATHER_ANGLE_SHOULDER = 75
const FEATHER_ANGLE_TIP = 5
/** Feather length, in multiples of the spacing between them. */
const FEATHER_LENGTH = 2.8

/**
 * Feathers spaced evenly along the lower edge, in pixels, all the same size
 * so the edge reads as an even fringe. Each overlaps the next like shingles,
 * and a wider feather caps the tip so the top edge runs straight into it.
 *
 * Returned tip first, so the feathers nearer the shoulder are drawn on top.
 */
function layFeathers(
  edge: Pt[],
  w: number,
  h: number,
): { long: FeatherSpec[]; short: FeatherSpec[]; cap: FeatherSpec } {
  const pts = edge.map(([x, y]) => [x * w, y * h] as Pt)
  const segs = pts.slice(1).map((p, i) => {
    const q = pts[i]
    return { from: q, dx: p[0] - q[0], dy: p[1] - q[1], len: Math.hypot(p[0] - q[0], p[1] - q[1]) }
  })
  const total = segs.reduce((sum, s) => sum + s.len, 0)
  // About one feather every 50px, whatever the wing's size.
  const count = Math.max(12, Math.min(48, Math.round(total / 50)))
  const spacing = total / count

  /**
   * The point a given distance along the edge. Negative distances continue
   * straight on past the shoulder, off the left of the screen.
   */
  const pointAt = (distance: number): Pt => {
    if (distance < 0) {
      const first = segs[0]
      return [first.from[0] + (first.dx / first.len) * distance, first.from[1] + (first.dy / first.len) * distance]
    }
    let d = Math.min(distance, total)
    let seg = segs[0]
    for (const s of segs) {
      seg = s
      if (d <= s.len) break
      d -= s.len
    }
    return [seg.from[0] + (seg.dx / seg.len) * d, seg.from[1] + (seg.dy / seg.len) * d]
  }

  const at = (distance: number, length: number, width: number, inset: number): FeatherSpec => {
    const [x, y] = pointAt(distance)
    // The edge's direction, averaged over a feather's spacing either side so
    // the angle turns smoothly instead of jumping at each corner of the edge.
    const a = pointAt(distance - spacing)
    const b = pointAt(distance + spacing)
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    const ux = (b[0] - a[0]) / len
    const uy = (b[1] - a[1]) / len
    // Outward from the wing: the edge direction turned a quarter clockwise.
    const nx = -uy
    const ny = ux
    const order = Math.max(0, distance / total)
    const fan = FEATHER_ANGLE_SHOULDER + (FEATHER_ANGLE_TIP - FEATHER_ANGLE_SHOULDER) * order
    const outward = (Math.atan2(ny, nx) * 180) / Math.PI
    // The feather is drawn hanging straight down (90°), so turn it to point
    // halfway between the fan and straight out.
    const angle = (fan + outward) / 2 - 90
    // Tucked inside the edge so the wing covers the base.
    return { x: x - nx * inset, y: y - ny * inset, angle, length, width, order }
  }

  const length = spacing * FEATHER_LENGTH
  const long: FeatherSpec[] = []
  const short: FeatherSpec[] = []
  // A few extra feathers start off screen to the left, so the row runs on
  // past the shoulder instead of leaving a notch at the bottom left corner.
  const offscreen = Math.ceil(FEATHER_LENGTH)
  for (let i = -offscreen; i < count; i++) {
    long.push(at((i + 0.5) * spacing, length, spacing * 1.15, spacing * 0.2))
    short.push(at((i + 1) * spacing, length * 0.55, spacing * 1.0, spacing * 0.4))
  }

  // The wingtip: the longest feather, lying along the top line. Its point sits
  // exactly on that line (the point is 0.18 of the width off the feather's
  // center line, so the root drops by that much), and the part above the line
  // is clipped away, so the top edge runs straight out into a sharp point.
  const [tx, ty] = pts[pts.length - 1]
  const capWidth = spacing * 2
  const capX = tx - spacing * 0.6
  const cap: FeatherSpec = {
    x: capX,
    y: (ty * capX) / tx + capWidth * 0.18,
    angle: (Math.atan2(ty, tx) * 180) / Math.PI - 90,
    length: length * 1.3,
    width: capWidth,
    order: 1,
  }
  return { long: long.reverse(), short: short.reverse(), cap }
}

function Feather({ spec }: { spec: FeatherSpec }) {
  return (
    <g transform={`translate(${spec.x} ${spec.y}) rotate(${spec.angle})`}>
      {/* White fur showing just past the red at the feather's tip. */}
      <path d={featherPath(spec.length + spec.width * 0.45, spec.width * 1.04)} fill={FUR} />
      <path d={featherPath(spec.length, spec.width)} fill={RED} />
    </g>
  )
}

export function WingPanel({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  const wingRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number; minH: number; flat: boolean } | null>(null)

  // Feathers are laid out in pixels along the edge, so track the wing's size.
  // The content follows the wing's shape: the lower edge sweeps up toward the
  // tip, so each block of content (heading, paragraphs, lists...) is allowed
  // to run right only as far as the edge still passes below it. Blocks near
  // the top reach out toward the tip; lower ones stop shorter, stepping in
  // along the edge. The wing is made tall enough to hold it all inside the
  // shoulder end.
  useLayoutEffect(() => {
    const wing = wingRef.current
    const content = contentRef.current
    if (!wing || !content) return
    // Space kept between the content and the edge, in pixels.
    const GAP = 28
    const measure = () => {
      const w = wing.offsetWidth
      if (window.matchMedia(PHONE).matches) {
        // A plain block: the content runs the full width, and the block is
        // just as tall as it.
        for (const block of Array.from(content.children) as HTMLElement[]) block.style.maxWidth = ""
        setSize({ w, h: content.offsetHeight, minH: 0, flat: true })
        return
      }
      const edge = w < NARROW ? EDGE_NARROW : EDGE
      const padLeft = parseFloat(getComputedStyle(content).paddingLeft)
      // Tall enough that the content's bottom clears the edge where it's
      // highest under the broad, shoulder half of the wing.
      const clearance = Math.min(edgeAt(edge, padLeft / w), edgeAt(edge, 0.45))
      const minH = Math.ceil((content.offsetHeight + GAP) / clearance)
      for (const block of Array.from(content.children) as HTMLElement[]) {
        // The block's bottom, as a share of the wing's height...
        const depth = (block.offsetTop + block.offsetHeight + GAP) / minH
        // ...and the furthest right the edge is still below it.
        let reach = 1
        while (reach > 0.3 && edgeAt(edge, reach) < depth) reach -= 0.005
        const width = Math.max(260, reach * w - padLeft - GAP)
        // Only nudge when it moves a little, so the layout settles.
        if (Math.abs((parseFloat(block.style.maxWidth) || 0) - width) > 6) block.style.maxWidth = `${width}px`
      }
      setSize({ w, h: minH, minH, flat: false })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(wing)
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  const flat = size?.flat ?? false
  const edge = size && size.w < NARROW ? EDGE_NARROW : EDGE
  const feathers = size ? (flat ? flatFeathers(size.w, size.h) : layFeathers(edge, size.w, size.h)) : null

  return (
    // overflow-x-clip keeps feathers past the right edge from widening the
    // page; the bottom padding leaves room for the hanging feathers.
    <section id={id} className={cn("relative w-full overflow-x-clip pb-20 sm:pb-36", className)}>
      {/* Short of full width on larger screens by about the length the tip
          feather sticks out past the wing's body (some 200px), so the very
          tip of the wing lands at the right edge of the screen. */}
      <div data-wing ref={wingRef} className="relative z-10 w-full sm:w-[calc(100%-12.5rem)]">
        {/* Feathers sit behind the wing body, so it covers their bases. */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          style={{ clipPath: flat ? undefined : belowTopLine(edge) }}
        >
          {feathers?.long.map((spec, i) => <Feather key={`long-${i}`} spec={spec} />)}
          {feathers?.short.map((spec, i) => <Feather key={`short-${i}`} spec={spec} />)}
          {feathers?.cap && <Feather spec={feathers.cap} />}
        </svg>

        <div
          data-wing-body
          className="relative text-white"
          style={{ backgroundColor: RED, clipPath: flat ? undefined : clipPolygon(edge), minHeight: size?.minH }}
        >
          {/* Content spans the wing; each block's width is fitted to the
              wing's shape in measure() above. */}
          <div
            data-wing-content
            ref={contentRef}
            className="relative w-full pt-8 pr-2 pb-4 pl-4 sm:pt-14 sm:pr-8 sm:pb-8 sm:pl-10 xl:pl-16"
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
