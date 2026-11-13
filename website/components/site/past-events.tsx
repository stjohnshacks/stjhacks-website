"use client"

import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"

import { pastEvents } from "@/lib/content"
import { cn } from "@/lib/utils"

// How long each photo stays up on the big screen, in milliseconds.
const HOLD = 5000

type PastEvent = (typeof pastEvents.events)[number]

export function PastEvents() {
  const [season, setSeason] = useState(0)
  const event = pastEvents.events[season]

  return (
    <section id="past-events" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h2 className="font-display text-6xl uppercase tracking-tight text-white sm:text-8xl">
          {pastEvents.heading}
        </h2>

        {/* Season switch. */}
        {pastEvents.events.length > 1 && (
          <div role="group" aria-label="Season" className="flex gap-1 rounded-full bg-white/10 p-1">
            {pastEvents.events.map((e, i) => (
              <button
                key={e.season}
                type="button"
                onClick={() => setSeason(i)}
                aria-pressed={i === season}
                className={cn(
                  "rounded-full px-4 py-1.5 font-mono text-sm font-bold tracking-wider outline-none transition-colors focus-visible:ring-3 focus-visible:ring-white/60",
                  i === season ? "bg-primary text-white" : "text-white/70 hover:text-white",
                )}
              >
                {e.season}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Remounting per season starts its photos from the top. Phones get
          swipeable full-width photos; larger screens, the jumbotron. */}
      <PhoneSlides key={`phone-${event.season}`} event={event} />
      <div className="hidden sm:block">
        <Jumbotron key={event.season} event={event} />
      </div>
    </section>
  )
}

// Phones: the photos edge to edge across the screen, one at a time, swiped
// sideways and snapping into place, with the REPLAY tag on the photo's
// corner, its caption below, and dots showing which one you're on (tap a dot
// to jump to it). Tapping a photo opens the full-screen viewer.
function PhoneSlides({ event }: { event: PastEvent }) {
  const photos = event.photos
  const track = useRef<HTMLUListElement>(null)
  const [index, setIndex] = useState(0)
  const [viewing, setViewing] = useState(false)

  const goTo = (i: number) => {
    const el = track.current
    if (!el) return
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    el.scrollTo({ left: i * el.clientWidth, behavior: smooth ? "smooth" : "auto" })
  }

  return (
    <div className="mt-8 sm:hidden">
      {/* Over the photos, a weather-alert crawl on St. John's red, running
          the opposite way to the band below. */}
      <TickerBand phrases={["Red Storm Alert"]} reverse className="bg-primary text-white" />

      {/* Out past the section's side padding, so the photos reach the edges. */}
      <div className="relative -mx-4">
        <ul
          ref={track}
          role="region"
          aria-roledescription="carousel"
          aria-label={`${event.name} photos`}
          onScroll={(e) => {
            const el = e.currentTarget
            const i = Math.round(el.scrollLeft / el.clientWidth)
            if (i !== index) setIndex(i)
          }}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((photo, i) => (
            <li key={photo.src} className="relative aspect-[4/3] w-full shrink-0 snap-center bg-black">
              <button
                type="button"
                onClick={() => {
                  setIndex(i)
                  setViewing(true)
                }}
                aria-label={`View photo ${i + 1} of ${photos.length} larger: ${photo.caption}`}
                className="absolute inset-0 outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-inset"
              >
                <Image src={photo.src} alt="" fill sizes="100vw" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>

        {/* The broadcast REPLAY tag, on the photo's top left corner. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 rounded bg-black/70 px-2 py-1 font-display text-xs leading-none tracking-[0.12em] text-white uppercase"
        >
          <span className="size-2 rounded-full bg-primary shadow-[0_0_6px_rgba(255,42,72,0.9)] motion-safe:animate-pulse" />
          Replay
        </div>
      </div>

      {/* Under the photos, matching the alert band above: the name and
          season scrolling by in white on red, with lightning bolts between. */}
      <TickerBand
        phrases={["St. John’s Hacks", `${event.season} Highlights`]}
        className="bg-primary text-white"
      />

      {/* Dots: one per photo, the current one red and wider. */}
      {photos.length > 1 && (
        <div className="mt-3 flex justify-center gap-1">
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index || undefined}
              className="flex h-6 items-center px-0.5 outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span
                className={cn(
                  "block h-2 rounded-full transition-all duration-300",
                  i === index ? "w-5 bg-primary" : "w-2 bg-white/35",
                )}
              />
            </button>
          ))}
        </div>
      )}

      {viewing && <PhotoViewer event={event} index={index} onClose={() => setViewing(false)} />}
    </div>
  )
}

// The newest photos on a jumbotron drawn as a flat illustration, with the
// tricks an illustrator uses to make it read as a solid object: a dark oval
// cap with a smoked-glass band,
// the screen in a thick black frame, black wings with their inner faces
// showing as they turn back, and a white drum below whose curved edge and
// dark oval underside make it round. Glass streaks lie over the photo. Red
// sunburst rays and twinkling sparkles sit behind and round it.
//
// The drawing is an SVG (see VIEW below); the photos sit over the
// screen's spot in it, and the glass streaks over them. Arrows sit either side
// and thumbnails below. The screen advances every few seconds, pausing while
// hovered or focused; with reduced motion it doesn't advance and the drum's
// text holds still.
function Jumbotron({ event }: { event: PastEvent }) {
  const photos = event.photos
  const count = photos.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [viewing, setViewing] = useState(false)

  useEffect(() => {
    if (count < 2 || paused || viewing) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), HOLD)
    return () => window.clearInterval(timer)
  }, [count, paused, viewing])

  const go = (step: number) => setIndex((i) => (i + step + count) % count)
  const percent = (n: number, of: number) => `${(n / of) * 100}%`

  return (
    // Wider than the section around it, so the board can be big; it stays a
    // little in from the screen edges.
    <div
      className="relative left-1/2 mt-10 w-[min(calc(100vw-2rem),1320px)] -translate-x-1/2 overflow-x-clip"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* The board, with room either side for the arrows, which sit level
          with the middle of the screen. */}
      <div className="relative">
        {count > 1 && (
          <ArrowButton
            side="left"
            label="Previous photo"
            onClick={() => go(-1)}
            className="absolute left-0 -translate-y-1/2"
            style={{ top: SCREEN_MIDDLE }}
          />
        )}

        <div className="relative mx-12 sm:mx-[4.75rem]" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
          {/* Red sunburst rays behind the board, centered exactly on the
              screen and fading toward the edges, and sparkles twinkling
              round it. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-[4%] -inset-y-[6%]"
            style={{
              backgroundImage: `repeating-conic-gradient(from 0deg at 50% ${RAYS_Y}, rgba(207,16,45,0.28) 0deg 7deg, transparent 7deg 14deg)`,
              maskImage: `radial-gradient(circle at 50% ${RAYS_Y}, black 17%, transparent 66%)`,
            }}
          />
          {SPARKLES.map((s, i) => (
            <Sparkle
              key={i}
              className="absolute motion-safe:animate-pulse"
              style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: `${i * 0.37}s` }}
            />
          ))}

          <Board season={event.season} />

          {/* The photos, over the screen's spot in the drawing. */}
          <div
            role="region"
            aria-roledescription="carousel"
            aria-label={`${event.name} photos`}
            className="group absolute overflow-hidden bg-black"
            style={{
              left: percent(SCREEN.x - VIEW.x, VIEW.w),
              top: percent(SCREEN.y - VIEW.y, VIEW.h),
              width: percent(SCREEN.w, VIEW.w),
              height: percent(SCREEN.h, VIEW.h),
            }}
          >
            {photos.map((photo, i) => (
              <Image
                key={photo.src}
                src={photo.src}
                alt={photo.caption}
                fill
                sizes="(min-width: 1320px) 840px, 64vw"
                aria-hidden={i !== index}
                className={cn(
                  // On hover the photo eases in a little closer and brighter.
                  "object-cover transition-[opacity,scale,filter] duration-500 group-hover:scale-[1.04] group-hover:brightness-110",
                  i === index ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
            {/* A broadcast-style REPLAY tag in the top left, with a blinking
                red dot, like an arena screen showing highlights. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-[4%] left-[3%] z-10 flex items-center gap-[0.5em] rounded-[0.3em] bg-black/70 px-[0.7em] py-[0.35em] font-display text-[clamp(10px,1.5vw,20px)] leading-none tracking-[0.12em] text-white uppercase"
            >
              <span className="size-[0.6em] rounded-full bg-primary shadow-[0_0_0.5em_rgba(255,42,72,0.9)] motion-safe:animate-pulse" />
              Replay
            </div>
            {count > 0 && (
              <button
                type="button"
                onClick={() => setViewing(true)}
                aria-label={`View photo ${index + 1} larger`}
                className="absolute inset-0 outline-none transition-shadow duration-300 hover:shadow-[inset_0_0_0_3px_rgba(255,255,255,0.35)] focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-inset"
              />
            )}
          </div>

          <Glass />
        </div>

        {count > 1 && (
          <ArrowButton
            side="right"
            label="Next photo"
            onClick={() => go(1)}
            className="absolute right-0 -translate-y-1/2"
            style={{ top: SCREEN_MIDDLE }}
          />
        )}
      </div>

      {/* Thumbnails. */}
      {count > 1 && (
        // Padding inside the scrolling row leaves room for the selected
        // thumbnail's ring, which would otherwise be clipped at the edges.
        <ul className="mx-auto mt-5 flex justify-center gap-2 overflow-x-auto p-1 pb-2 [scrollbar-width:thin]">
          {photos.map((photo, i) => (
            <li key={photo.src} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}: ${photo.caption}`}
                aria-current={i === index || undefined}
                className={cn(
                  "relative block h-14 w-20 overflow-hidden rounded-md outline-none ring-2 transition sm:h-16 sm:w-24",
                  i === index ? "ring-primary" : "opacity-55 ring-transparent hover:opacity-100",
                  "focus-visible:ring-white",
                )}
              >
                <Image src={photo.src} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {viewing && (
        <PhotoViewer event={event} index={index} onClose={() => setViewing(false)} />
      )}
    </div>
  )
}

/**
 * A full-width band of words in a continuous loop, each followed by a
 * lightning bolt. The run is repeated to fill the screen, then doubled and
 * slid by one copy's width so there's no seam. Still with reduced motion.
 */
function TickerBand({ phrases, reverse = false, className }: { phrases: string[]; reverse?: boolean; className?: string }) {
  const repeats = Math.max(2, Math.ceil(6 / phrases.length))
  return (
    <div aria-hidden="true" className={cn("-mx-4 overflow-hidden py-2", className)}>
      <div
        className={cn(
          "flex w-max animate-ticker [animation-duration:24s] motion-reduce:animate-none",
          reverse && "[animation-direction:reverse]",
        )}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {Array.from({ length: repeats }, () => phrases)
              .flat()
              .map((phrase, i) => (
                <span key={i} className="flex items-center gap-3 pr-3 font-display text-lg leading-none tracking-wide uppercase">
                  {phrase}
                  <BoltIcon />
                </span>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** The drum's red lightning bolt, sized to the text around it. */
function BoltIcon() {
  return (
    <svg viewBox="-7 -13 14 26" className="h-[1em] w-auto" fill="currentColor">
      <path d="M3 -12L-6 1.5H-0.5L-3.5 12L6 -2H0.5L3.5 -12Z" />
    </svg>
  )
}

/** A full-screen, focused view of one photo: just the whole photo, uncropped,
 *  over a dark backdrop, and a red close button. Escape, a click on the
 *  backdrop or the button closes it. */
function PhotoViewer({ event, index, onClose }: { event: PastEvent; index: number; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const photo = event.photos[index]

  // Open as a modal, so focus stays inside and Escape closes it.
  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialog}
      aria-label={photo.caption}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-4 backdrop:bg-black/90 sm:p-10"
    >
      <div className="pointer-events-none flex h-full items-center justify-center">
        <div className="pointer-events-auto relative h-full max-h-[86dvh] w-full max-w-6xl">
          <Image src={photo.src} alt={photo.caption} fill sizes="100vw" className="object-contain" />
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 flex size-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-black/40 outline-none transition hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-white sm:top-6 sm:right-6"
      >
        <XIcon className="size-6" aria-hidden="true" />
      </button>
    </dialog>
  )
}

// The drawing's coordinates; VIEW is the part of them shown, cropped close
// round the board so it fills its box. SCREEN is where the photos go (16:9).
// The top includes room for the cables to rise into.
const VIEW = { x: 105, y: -10, w: 790, h: 600 }
const SCREEN = { x: 250, y: 168, w: 500, h: 281.25 }
const FRAME = 18

// Flat illustrated palette.
const BLACK = "#1b1c21"
const BLACK_DEEP = "#0f1013"
const WING = "#2c2e34"
const CAP_TOP = "#3d3f47"

// The cap on top: a cylinder, curved to the same viewing angle as the drum
// (its ry is to its rx as the drum's is), with its top surface showing.
const CAP = { cx: 500, top: 68, bottom: 118, rx: 300, ry: 20 }
const CAP_FACE = `M${CAP.cx - CAP.rx} ${CAP.top}A${CAP.rx} ${CAP.ry} 0 0 0 ${CAP.cx + CAP.rx} ${CAP.top}V${CAP.bottom}A${CAP.rx} ${CAP.ry} 0 0 1 ${CAP.cx - CAP.rx} ${CAP.bottom}Z`

// The cables meet at a hub in the middle of the cap's top, and fan out from
// it to these points up at the top of the drawing.
const HUB = { x: 500, y: 66 }
const CABLE_TOPS = [300, 440, 560, 700]

// The drum under the screen.
// Stands for a lightning bolt in the drum's text; drawn as a shape, not a letter.
const BOLT = "ϟ"
const DRUM = { cx: 500, top: 497, bottom: 548, rx: 168, ry: 11 }
// The drum's front: a band whose top and bottom edges curve the same way, as
// a cylinder's do, so it reads as round. Its top surface isn't shown.
const DRUM_FACE = `M${DRUM.cx - DRUM.rx} ${DRUM.top}A${DRUM.rx} ${DRUM.ry} 0 0 0 ${DRUM.cx + DRUM.rx} ${DRUM.top}V${DRUM.bottom}A${DRUM.rx} ${DRUM.ry} 0 0 1 ${DRUM.cx - DRUM.rx} ${DRUM.bottom}Z`

/** The jumbotron's drawing, everything behind the photos. */
function Board({ season }: { season: string }) {
  const display = { fontFamily: "var(--font-anton), sans-serif" }
  // BOLT marks where a lightning bolt goes between the words.
  const text = `ST. JOHN'S HACKS ${BOLT} ${season} HIGHLIGHTS ${BOLT} `
  const frame = { x: SCREEN.x - FRAME, y: SCREEN.y - FRAME, w: SCREEN.w + FRAME * 2, h: SCREEN.h + FRAME * 2 }
  const frameBottom = frame.y + frame.h
  return (
    <svg
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full overflow-visible"
    >
      <defs>
        <clipPath id="jt-drum-face">
          <path d={DRUM_FACE} />
        </clipPath>
        <clipPath id="jt-cap-face">
          <path d={CAP_FACE} />
        </clipPath>
        <linearGradient id="jt-drum" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={BLACK_DEEP} />
          <stop offset="0.32" stopColor={CAP_TOP} />
          <stop offset="0.62" stopColor={WING} />
          <stop offset="1" stopColor={BLACK_DEEP} />
        </linearGradient>
        <linearGradient id="jt-cable" gradientUnits="userSpaceOnUse" x1="0" y1={15} x2="0" y2={HUB.y}>
          <stop offset="0" stopColor="#2a2c33" stopOpacity={0} />
          <stop offset="1" stopColor="#2a2c33" />
        </linearGradient>
      </defs>

      {/* A short black connector from the cap down behind the frame. */}
      <path d={`M${CAP.cx - CAP.rx + 30} ${CAP.bottom}H${CAP.cx + CAP.rx - 30}V178H${CAP.cx - CAP.rx + 30}Z`} fill={BLACK_DEEP} />

      {/* Cap: a cylinder drawn like the drum below, its front a band with
          matching curved edges, darkest where it turns away, over a dark lip.
          Its top shows too, as a lighter oval with a sunken middle and a
          bright rim, which is what makes it read as a solid drum. */}
      <ellipse cx={CAP.cx} cy={CAP.bottom + 4} rx={CAP.rx + 2} ry={CAP.ry + 4} fill={BLACK_DEEP} />
      <path d={CAP_FACE} fill="url(#jt-drum)" />
      {/* RED STORM ALERT wrapped round the cap, turning like the drum's name. */}
      <CylinderText text={`RED STORM ALERT ${BOLT} `} cylinder={CAP} clipId="jt-cap-face" />
      <ellipse cx={CAP.cx} cy={CAP.top} rx={CAP.rx} ry={CAP.ry} fill={CAP_TOP} />
      <ellipse cx={CAP.cx} cy={CAP.top + 2} rx={CAP.rx - 22} ry={CAP.ry - 6} fill="#2b2d34" />
      <ellipse
        cx={CAP.cx}
        cy={CAP.top}
        rx={CAP.rx - 1.5}
        ry={CAP.ry - 1}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.14}
        strokeWidth={2}
      />

      {/* Cables holding it up: they fan out from a hub in the middle of the
          cap's top and fade into the dark not far above. */}
      {CABLE_TOPS.map((x) => (
        <path key={x} d={`M${x} ${VIEW.y}L${HUB.x} ${HUB.y}`} stroke="url(#jt-cable)" strokeWidth={3} />
      ))}
      <ellipse cx={HUB.x} cy={HUB.y + 3} rx={22} ry={6} fill="#15161a" />
      <rect x={HUB.x - 9} y={HUB.y - 7} width={18} height={11} rx={2} fill="#5c606a" />

      {/* Wings behind the frame: the outward panel, and the darker inner face
          showing where each turns back toward the screen. STJ runs down each
          panel, every letter skewed to follow it. */}
      {[1, -1].map((side) => (
        <g key={side} transform={side === 1 ? undefined : "translate(1000 0) scale(-1 1)"}>
          <path d={`M120 ${frame.y + 30}L196 ${frame.y + 6}V${frameBottom + 14}L120 ${frameBottom - 12}Z`} fill={WING} />
          <path d={`M196 ${frame.y + 6}L${frame.x + 4} ${frame.y + 22}V${frameBottom}L196 ${frameBottom + 14}Z`} fill={BLACK_DEEP} />
          <path d={`M120 ${frame.y + 30}L196 ${frame.y + 6}`} stroke="#ffffff" strokeOpacity={0.12} strokeWidth={3} />
        </g>
      ))}
      <g style={display} fill="#e3153a" fontSize={66} textAnchor="middle">
        {[
          { letter: "S", y: 262, skew: -9 },
          { letter: "T", y: 342, skew: 0 },
          { letter: "J", y: 422, skew: 9 },
        ].map(({ letter, y, skew }) => (
          <g key={letter}>
            <text transform={`translate(158 ${y}) skewY(${skew}) scale(0.7 1)`}>{letter}</text>
            <text transform={`translate(842 ${y}) skewY(${-skew}) scale(0.7 1)`}>{letter}</text>
          </g>
        ))}
      </g>

      {/* The thick black frame. */}
      <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} rx={8} fill={BLACK} />
      <rect
        x={frame.x + 6}
        y={frame.y + 6}
        width={frame.w - 12}
        height={frame.h - 12}
        rx={4}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.06}
        strokeWidth={2}
      />

      {/* The drum, in the same blacks and greys as the rest: its dark oval
          underside first, then the rounded front (darkest at the edges as it
          turns away) with the name wrapped round it. */}
      {/* The neck runs down behind the drum, so it meets the drum's curved top. */}
      <path d={`M330 ${frameBottom}H670L652 ${DRUM.top + DRUM.ry + 4}H348Z`} fill={BLACK} />
      <ellipse cx={DRUM.cx} cy={DRUM.bottom + 4} rx={DRUM.rx + 2} ry={DRUM.ry + 4} fill={BLACK_DEEP} />
      <path
        d={DRUM_FACE}
        fill="url(#jt-drum)"
      />
      <CylinderText text={text} cylinder={DRUM} clipId="jt-drum-face" />
    </svg>
  )
}

// Letters sit about this far apart (in the drawing's units) at the front of
// a cylinder, whatever its size.
const LETTER_GAP = 14.3

/** Text wrapped round a cylinder (the drum, or the cap). Each letter sits at
 *  an angle around its circumference: at the front it faces us full width;
 *  toward the sides it narrows, drops with the curve and fades as it turns
 *  away; round the back it's hidden. The cylinder turns slowly, so the
 *  letters come round, unless the viewer prefers reduced motion. */
function CylinderText({
  text,
  cylinder,
  clipId,
}: {
  text: string
  cylinder: { cx: number; top: number; bottom: number; rx: number; ry: number }
  clipId: string
}) {
  // Enough copies to go all the way round, evenly spaced.
  const copies = Math.max(1, Math.round((Math.PI * 2 * cylinder.rx) / LETTER_GAP / text.length))
  const letters = useMemo(() => text.repeat(copies).split(""), [text, copies])
  const refs = useRef<(SVGGraphicsElement | null)[]>([])

  useEffect(() => {
    const step = (Math.PI * 2) / letters.length
    const { cx, rx, ry } = cylinder
    const mid = (cylinder.top + cylinder.bottom) / 2
    const place = (turn: number) => {
      letters.forEach((_, i) => {
        const el = refs.current[i]
        if (!el) return
        // Angle round the drum, with 0 straight toward us.
        let angle = (i * step - turn) % (Math.PI * 2)
        if (angle > Math.PI) angle -= Math.PI * 2
        if (angle < -Math.PI) angle += Math.PI * 2
        const facing = Math.cos(angle)
        if (facing <= 0.02) {
          el.setAttribute("opacity", "0")
          return
        }
        const x = cx + rx * Math.sin(angle)
        const y = mid + ry * facing
        el.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${facing.toFixed(3)} 1)`)
        el.setAttribute("opacity", Math.min(1, facing * 1.6).toFixed(3))
      })
    }
    place(0)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    let last = performance.now()
    let turn = 0
    const tick = (now: number) => {
      turn += ((now - last) / 1000) * 0.22
      last = now
      place(turn)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [letters, cylinder])

  return (
    <g
      clipPath={`url(#${clipId})`}
      fill="#ff3b57"
      fontSize={24}
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontFamily: "var(--font-anton), sans-serif" }}
    >
      {letters.map((letter, i) => {
        const ref = (el: SVGGraphicsElement | null) => {
          refs.current[i] = el
        }
        // A red lightning bolt in place of the BOLT marker.
        return letter === BOLT ? (
          <g key={i} ref={ref} opacity={0}>
            <path d="M3 -12L-6 1.5H-0.5L-3.5 12L6 -2H0.5L3.5 -12Z" />
          </g>
        ) : (
          <text key={i} ref={ref} opacity={0}>
            {letter}
          </text>
        )
      })}
    </g>
  )
}

/** Glass streaks lying over the photo, like light catching the screen. */
function Glass() {
  return (
    <svg
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <clipPath id="jt-screen">
          <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} />
        </clipPath>
      </defs>
      <g clipPath="url(#jt-screen)" fill="#fff">
        <path d={`M${SCREEN.x + 30} ${SCREEN.y}H${SCREEN.x + 150}L${SCREEN.x + 40} ${SCREEN.y + SCREEN.h}H${SCREEN.x - 80}Z`} opacity={0.13} />
        <path d={`M${SCREEN.x + 175} ${SCREEN.y}H${SCREEN.x + 200}L${SCREEN.x + 90} ${SCREEN.y + SCREEN.h}H${SCREEN.x + 65}Z`} opacity={0.08} />
      </g>
    </svg>
  )
}

// The rays' center, straight behind the middle of the screen. The rays' box
// reaches 6% past the board's box above and below (-inset-y-[6%]), so the
// screen's middle is converted into that box's terms.
const RAYS_Y = `${((((SCREEN.y + SCREEN.h / 2 - VIEW.y) / VIEW.h + 0.06) / 1.12) * 100).toFixed(2)}%`

// The middle of the screen, as a share of the board's height, for the arrows.
const SCREEN_MIDDLE = `${(((SCREEN.y + SCREEN.h / 2 - VIEW.y) / VIEW.h) * 100).toFixed(2)}%`

// Where the sparkles sit round the board, as a share of its box.
const SPARKLES = [
  { left: "6%", top: "10%", size: 22 },
  { left: "13%", top: "62%", size: 14 },
  { left: "3%", top: "82%", size: 18 },
  { left: "22%", top: "2%", size: 12 },
  { left: "78%", top: "4%", size: 14 },
  { left: "91%", top: "20%", size: 24 },
  { left: "85%", top: "68%", size: 14 },
  { left: "94%", top: "86%", size: 18 },
]

/** A four-pointed white sparkle. */
function Sparkle({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("pointer-events-none", className)} style={style}>
      <path d="M12 0C12.9 7 17 11.1 24 12C17 12.9 12.9 17 12 24C11.1 17 7 12.9 0 12C7 11.1 11.1 7 12 0Z" fill="#fff" />
    </svg>
  )
}

function ArrowButton({
  side,
  label,
  onClick,
  className,
  style,
}: {
  side: "left" | "right"
  label: string
  onClick: () => void
  className?: string
  style?: CSSProperties
}) {
  const Icon = side === "left" ? ChevronLeftIcon : ChevronRightIcon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={style}
      className={cn(
        "z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white outline-none transition hover:bg-primary focus-visible:ring-3 focus-visible:ring-white sm:size-14",
        className,
      )}
    >
      <Icon className="size-6 sm:size-8" aria-hidden="true" />
    </button>
  )
}
