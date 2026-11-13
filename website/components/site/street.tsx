"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRef, type ReactNode } from "react"

import { streetChat } from "@/lib/content"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP)

// St. John's red, the same as the logo (--primary).
const RED = "#cf102d"

// The people who walk by: which way, how long a crossing takes in seconds,
// when they first appear, and the pause before they come by again.
const WALKERS = [
  { kind: "student", dir: 1, duration: 12, delay: 1, repeatDelay: 10 },
  { kind: "coffee", dir: -1, duration: 14, delay: 8, repeatDelay: 12 },
  { kind: "coat", dir: 1, duration: 13, delay: 16, repeatDelay: 14 },
] as const

// A side view of the sidewalk between the hero and the train: a fire hydrant,
// a couple of pigeons and Johnny Thunderbird, a subway grate and a manhole.
//
// The birds chat on a loop: a pigeon asks, Johnny answers. It runs on a timer
// from page load and has nothing to do with the scroll. With reduced motion
// it holds still with Johnny's first answer showing.
export function Street() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      // Each line has two bubbles: one over the bird (wider screens) and one
      // wide one across the top of the street (phones). Both play together;
      // only one of them is ever on screen.
      const line = (kind: "question" | "answer", i: number) =>
        gsap.utils.toArray<HTMLElement>(`[data-${kind}='${i}']`, root.current!)
      const q = streetChat.map((_, i) => line("question", i))
      const a = streetChat.map((_, i) => line("answer", i))
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(a[0], { opacity: 1 })
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // The conversation, one question and answer at a time, on repeat from
        // page load, with nothing tied to the scroll.
        // Whoever is talking moves: the pigeon bobs its head while it asks;
        // Johnny nods and works his beak while he answers, and the other
        // pigeon nods along. Heads pivot at the neck.
        const head = (bird: string) => root.current!.querySelector(`[data-bird='${bird}'] [data-head]`)
        const asker = head("asker")
        const listener = head("listener")
        const johnny = head("johnny")
        const mouth = root.current!.querySelector("[data-bird='johnny'] [data-mouth]")
        gsap.set([asker, listener], { svgOrigin: "31.5 9.5" })
        gsap.set(johnny, { svgOrigin: "32 27" })
        gsap.set(mouth, { svgOrigin: "20 21.6" })

        const chat = gsap.timeline({ repeat: -1, repeatDelay: 0.6 })
        streetChat.forEach((_, i) => {
          const ask = `ask${i}`
          const reply = `reply${i}`
          chat
            .addLabel(ask)
            .fromTo(q[i], { opacity: 0, y: 8, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(2)" }, ask)
            .to(asker, { rotation: 16, duration: 0.14, yoyo: true, repeat: 7, ease: "sine.inOut" }, ask)
            .to(q[i], { opacity: 0, duration: 0.2 }, `${ask}+=2.1`)
            .addLabel(reply)
            .fromTo(a[i], { opacity: 0, y: 8, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(2)" }, reply)
            .to(johnny, { rotation: -6, duration: 0.18, yoyo: true, repeat: 9, ease: "sine.inOut" }, reply)
            .to(mouth, { scaleY: 0.25, duration: 0.12, yoyo: true, repeat: 13, ease: "none" }, reply)
            .to(listener, { rotation: 14, duration: 0.2, yoyo: true, repeat: 3, ease: "sine.inOut" }, `${reply}+=0.5`)
            .to(a[i], { opacity: 0, duration: 0.2 }, `${reply}+=2.7`)
        })

        // The paper scraps rustle a little now and then on their own.
        const papers = gsap.utils.toArray<HTMLElement>("[data-paper]")
        papers.forEach((paper, i) => {
          gsap.to(paper.firstElementChild, {
            rotation: "random(-12, 12)",
            duration: 0.18,
            ease: "sine.inOut",
            repeat: -1,
            repeatDelay: 2.2 + i * 0.7,
            repeatRefresh: true,
          })
        })

        // Every so often a train passes under the street: the grate glows
        // and flickers, and the gust lifts the paper, tumbles it along and
        // drops it a little further on. Once a scrap has drifted far enough
        // it fades out and turns up back where it started.
        const glow = gsap.utils.toArray<HTMLElement>("[data-grate-glow]")
        const drift = papers.map(() => 0)
        const { random } = gsap.utils
        let next: gsap.core.Tween | null = null
        const gust = () => {
          const tl = gsap.timeline({ onComplete: () => (next = gsap.delayedCall(random(6, 11), gust)) })
          tl.to(glow, { opacity: 1, duration: 0.5, ease: "power2.out" })
            .to(glow, { opacity: 0.65, duration: 0.12, yoyo: true, repeat: 3, ease: "none" })
            .to(glow, { opacity: 0, duration: 1.6, ease: "power2.in" })
          papers.forEach((paper, i) => {
            const dx = random(30, 80)
            drift[i] += dx
            const at = 0.3 + i * 0.12
            tl.to(paper, { y: -random(18, 42), x: drift[i] - dx * 0.4, rotation: `+=${random(140, 320)}`, duration: 0.55, ease: "power2.out" }, at)
              .to(paper, { y: 0, x: drift[i], rotation: `+=${random(40, 120)}`, duration: 1.2, ease: "power1.in" }, at + 0.55)
            if (drift[i] > 220) {
              drift[i] = 0
              tl.to(paper, { opacity: 0, duration: 0.4 }, at + 2.2)
                .set(paper, { x: 0, rotation: 0 })
                .to(paper, { opacity: 1, duration: 0.8 })
            }
          })
        }
        next = gsap.delayedCall(3, gust)

        // People strolling across, each on their own schedule. Their
        // positions are worked out again on every pass, so they still cross
        // the whole street after a resize.
        gsap.utils.toArray<HTMLElement>("[data-walker]").forEach((el, i) => {
          const walker = WALKERS[i]
          const layer = el.parentElement!
          const start = () => (walker.dir > 0 ? -el.offsetWidth : layer.offsetWidth)
          const end = () => (walker.dir > 0 ? layer.offsetWidth : -el.offsetWidth)
          gsap.set(el, { opacity: 1, x: start })
          gsap.fromTo(
            el,
            { x: start },
            {
              x: end,
              duration: walker.duration,
              delay: walker.delay,
              repeat: -1,
              repeatDelay: walker.repeatDelay,
              repeatRefresh: true,
              ease: "none",
            },
          )

          // The walk: legs and arms swing in opposite pairs, with a small bob
          // on each step.
          const step = 0.42
          const swing = (selector: string, from: number, origin: string) => {
            const part = el.querySelector(selector)
            if (!part) return
            gsap.set(part, { svgOrigin: origin })
            gsap.fromTo(part, { rotation: from }, { rotation: -from, duration: step, repeat: -1, yoyo: true, ease: "sine.inOut" })
          }
          swing("[data-leg='a']", 20, "30 88")
          swing("[data-leg='b']", -20, "30 88")
          swing("[data-arm='a']", -16, "30 32")
          swing("[data-arm='b']", 16, "30 32")
          gsap.to(el.querySelector("svg"), { y: -4, duration: step / 2, repeat: -1, yoyo: true, ease: "sine.inOut" })
        })

        // Gusts after the first are scheduled from inside a callback, outside
        // this context, so stop the chain by hand on cleanup.
        return () => next?.kill()
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} aria-label="On the street" className="relative bg-background select-none">
      {/* The conversation, for screen readers. */}
      <div className="sr-only">
        {streetChat.map((line) => (
          <p key={line.question}>
            A pigeon asks: {line.question} Johnny Thunderbird answers: {line.answer}
          </p>
        ))}
      </div>

      <div aria-hidden="true" className="relative">
        {/* Foot traffic: people at real scale (about twice the hydrant's
            height), but only their lower legs and shoes show, fading out
            above the knee, as if seen from down at the birds' level. They
            pass behind everything else on the street and walk the full
            width of the page, clipped at its edges. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 sm:h-64">
          <div className="absolute inset-x-0 bottom-0 h-24 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_55%)] sm:h-36">
            {WALKERS.map((walker) => (
              <div key={walker.kind} data-walker className="absolute bottom-0 left-0 opacity-0">
                <Walker kind={walker.kind} className={cn("h-[17rem] sm:h-[26rem]", walker.dir < 0 && "-scale-x-100")} />
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto h-48 max-w-6xl sm:h-64">
          {/* Phones: one long bubble across the top of the street, white for
              the pigeon and red for Johnny, its tail pointing down toward
              whoever is talking. */}
          <div className="absolute inset-x-4 top-3 z-20 sm:hidden">
            {streetChat.map((chat, i) => (
              <Banner key={chat.question} data="question" index={i}>
                {chat.question}
              </Banner>
            ))}
            {streetChat.map((chat, i) => (
              <Banner key={chat.answer} data="answer" index={i} johnny>
                {chat.answer}
              </Banner>
            ))}
          </div>

          {/* The foot of a street lamp. It stands left of the hydrant on
              wider screens, and at the right end of the street on phones,
              where the left side is full. */}
          <LampPost className="absolute top-0 -bottom-1 right-[3%] w-[60px] sm:right-auto sm:left-[1%] sm:w-[90px]" />

          {/* The bottom of a mailbox at the right end, balancing the lamp
              post on the left. The far pigeon can stand in front of it on
              narrower screens. Hidden on phones, where the lamp post stands
              at the right instead. */}
          <Mailbox className="absolute top-0 -bottom-1 right-[2%] hidden w-48 sm:block" />

          {/* The hydrant with the birds beside it. */}
          <div className="absolute -bottom-1 left-[4%] flex items-end gap-4 sm:left-[15%] sm:gap-6">
            <Hydrant className="h-32 sm:h-48" />

            <div className="mb-1 flex items-end gap-12 sm:gap-28 lg:gap-48">
              <div data-bird="asker" className="relative">
                {streetChat.map((chat, i) => (
                  <Bubble key={chat.question} data="question" index={i}>
                    {chat.question}
                  </Bubble>
                ))}
                <Pigeon className="h-9 sm:h-12" />
              </div>
              <div data-bird="johnny" className="relative">
                {streetChat.map((chat, i) => (
                  <Bubble key={chat.answer} data="answer" index={i} johnny>
                    {chat.answer}
                  </Bubble>
                ))}
                <Thunderbird className="h-20 sm:h-32" />
              </div>
              <div data-bird="listener" className="hidden sm:block">
                <Pigeon className="h-11 -scale-x-100" />
              </div>
            </div>
          </div>
        </div>

        <Sidewalk />
      </div>
    </section>
  )
}

// The foot of a street lamp, at real scale next to the hydrant: a heavy
// fluted cast-iron base with the post rising out of view; the lamp itself is
// off the top of the street.
function LampPost({ className }: { className?: string }) {
  const metal = "#1b2340"
  const flute = "#283253"
  return (
    <div className={cn("pointer-events-none", className)}>
      {/* The post, fading out as it rises toward the lamp. */}
      <div
        className="absolute top-0 bottom-[118px] left-1/2 w-[17%] -translate-x-1/2 [mask-image:linear-gradient(to_bottom,transparent,black_45%)] sm:bottom-[178px]"
        style={{ backgroundColor: metal }}
      />

      {/* The base: a tapered neck and collars over a fluted shaft, a flared
          bell and a square plinth. Twice as tall as it is wide. */}
      <svg viewBox="0 0 60 120" className="absolute bottom-0 left-0 w-full">
        <path d="M24.8 0H35.2L37 34H23Z" fill={metal} />
        <rect x={19.5} y={33} width={21} height={6} rx={1.5} fill={metal} />
        <path d="M21 39H39L41 79H19Z" fill={metal} />
        <path d="M25 42V76M30 42V76M35 42V76" stroke={flute} strokeWidth={1.6} />
        <rect x={16.5} y={78} width={27} height={6} rx={1.5} fill={metal} />
        <path d="M19 84H41C45 88 50 96 52 112H8C10 96 15 88 19 84Z" fill={metal} />
        <path d="M22 88Q16 98 14 110M30 88V110M38 88Q44 98 46 110" stroke={flute} strokeWidth={1.4} fill="none" />
        <rect x={4} y={111} width={52} height={9} rx={1} fill={metal} />
      </svg>
    </div>
  )
}

// A flat silhouette of someone walking, facing right, in dark navy so they
// read as background. The legs and swinging arms are marked so the walk
// animation can find them; both pivot at the hip and shoulder. Kinds:
// a student with a backpack, someone holding a coffee, someone in a long coat
// and hat.
function Walker({ kind, className }: { kind: (typeof WALKERS)[number]["kind"]; className?: string }) {
  const far = "#0f1730"
  const near = "#18213f"
  const leg = (fill: string) => (
    <>
      <path d="M25 86H35L34 162H26Z" fill={fill} />
      <path d="M24.5 160H35Q41 160 41 166V170H24.5Z" fill={fill} />
    </>
  )
  const arm = <path d="M27 31H33L34.5 82Q34.5 86 31 86Q27.5 86 27.5 82Z" />
  return (
    <svg viewBox="0 0 60 170" overflow="visible" className={className}>
      {/* Far arm and leg. */}
      <g data-arm="b" fill={far}>
        {arm}
      </g>
      <g data-leg="b">{leg(far)}</g>
      {kind === "student" && (
        <>
          {/* Backpack and its strap. */}
          <rect x={8.5} y={34} width={13} height={36} rx={5} fill="#1f2948" />
          <path d="M21 36Q27 33 31 34" stroke="#1f2948" strokeWidth={2.5} fill="none" />
        </>
      )}

      {/* Near leg, body and head. */}
      <g data-leg="a">{leg(near)}</g>
      {kind === "coat" ? (
        <path d="M18 32Q30 26 42 32L46.5 122H13.5Z" fill={near} />
      ) : (
        <path d="M18.5 32Q30 26 41.5 32L43 92H17Z" fill={near} />
      )}
      <rect x={27} y={21} width={6} height={9} fill={near} />
      <circle cx={30} cy={14} r={10} fill={near} />
      {kind === "coat" && (
        <>
          {/* Hat: brim and crown. */}
          <rect x={16} y={6.5} width={28} height={3} rx={1.5} fill={far} />
          <path d="M21 7Q21 -2 30 -2Q39 -2 39 7Z" fill={far} />
        </>
      )}

      {/* Near arm: swinging, or bent forward holding a coffee. */}
      {kind === "coffee" ? (
        <>
          <path d="M27 31H33L35 58L48 50L50.5 54.5L34.5 64.5Q30 66 29.5 61Z" fill={near} />
          <path d="M45 39H54L53 51H46Z" fill="#cfc6b6" opacity={0.55} />
          <rect x={44.2} y={37} width={10.6} height={3} rx={1} fill="#cfc6b6" opacity={0.7} />
        </>
      ) : (
        <g data-arm="a" fill={near}>
          {arm}
        </g>
      )}
    </svg>
  )
}

// A speech bubble above a bird, with its tail pointing down at the speaker.
// Hidden until the animation shows it.
// The bubble sits just above the speaker's mouth, its corner tail pointing
// down at it. The pigeon faces right, so its bubble sits above its beak and
// runs off to the right; Johnny faces left, so his sits above his open beak
// and runs off to the left.
// The phone version of a bubble: as wide as the street, stacked in one spot
// at its top (only one line shows at a time). The tail drops from its bottom
// edge toward the speaker: the pigeon's beak, or Johnny's just to its right
// (the hydrant is 128px tall so about 85px wide, and the birds sit past it).
function Banner({ data, index, johnny = false, children }: BubbleProps) {
  return (
    <div
      {...{ [`data-${data}`]: index }}
      className={cn(
        "absolute inset-x-0 top-0 rounded-2xl px-4 py-2.5 text-center text-sm leading-snug font-semibold opacity-0",
        johnny ? "bg-primary text-white" : "bg-[#f3eee4] text-[#14161f]",
      )}
    >
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 16 12"
        className={cn("absolute top-[calc(100%-1px)] h-3 w-4", johnny ? "left-[12rem]" : "left-[8.25rem]")}
      >
        <path d={johnny ? "M0 0H16L4 12Z" : "M0 0H16L12 12Z"} fill={johnny ? RED : "#f3eee4"} />
      </svg>
    </div>
  )
}

type BubbleProps ={ data: "question" | "answer"; index: number; johnny?: boolean; children: ReactNode }

function Bubble({ data, index, johnny = false, children }: BubbleProps) {
  return (
    <div
      {...{ [`data-${data}`]: index }}
      className={cn(
        "absolute z-20 mb-2 hidden w-max sm:block max-w-[10rem] rounded-2xl px-3 py-2 text-sm leading-snug font-semibold opacity-0 sm:max-w-[15rem] sm:text-base",
        johnny
          ? "right-[78%] bottom-[90%] rounded-br-none bg-primary text-white"
          : "bottom-[92%] left-[72%] rounded-bl-none bg-[#f3eee4] text-[#14161f]",
      )}
    >
      {children}
      {/* The tail: a triangle growing straight out of the bubble's square
          corner, one edge running on from the bubble's side and overlapping
          the bubble by a pixel, so the two read as one shape with no seam. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 14 12"
        className={cn("absolute top-[calc(100%-1px)] h-3 w-3.5", johnny ? "right-0" : "left-0")}
      >
        <path d={johnny ? "M0 0H14V12Z" : "M0 0H14L0 12Z"} fill={johnny ? RED : "#f3eee4"} />
      </svg>
    </div>
  )
}

function Sidewalk() {
  return (
    <div className="relative">
      {/* The walking surface, seen almost edge on, with its expansion joints. */}
      <div className="relative h-4 bg-[linear-gradient(to_bottom,#2c3554,#3a4466)] sm:h-5">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(to_right,transparent_0_158px,rgba(5,10,26,0.55)_158px_161px)]" />
        {/* Subway grate: a run of bars over the dark vent below. Now and then
            a warm glow comes up through it, as if a train is passing under
            the street: a haze rising above it, and the slats lighting up. */}
        <div className="absolute top-1/2 left-[30%] hidden h-4 w-36 -translate-y-1/2 sm:block lg:w-44">
          <div
            data-grate-glow
            className="pointer-events-none absolute inset-x-0 bottom-1/2 h-44 bg-[linear-gradient(to_top,rgba(255,206,140,0.3),rgba(255,206,140,0.07)_45%,transparent)] opacity-0 blur-[2px] [clip-path:polygon(4%_100%,96%_100%,100%_0,0_0)]"
          />
          <Grate className="absolute inset-0 h-full w-full" />
          <div
            data-grate-glow
            className="pointer-events-none absolute inset-x-[3%] inset-y-[22%] rounded-sm bg-[#ffc98a] opacity-0 mix-blend-screen"
          />
        </div>

        {/* Scraps of paper lying on the sidewalk near the grate. */}
        {PAPERS.map((paper) => (
          <div key={paper.shape} data-paper className={cn("absolute bottom-[45%]", paper.className)}>
            <Paper shape={paper.shape} className="w-4 sm:w-5" />
          </div>
        ))}
        <Manhole className="absolute top-1/2 left-[58%] h-3 w-28 -translate-y-1/2 sm:left-[62%] sm:h-4 sm:w-40" />
      </div>
      {/* The curb's lit edge and its face. */}
      <div className="h-1 bg-[#4b5679]" />
      <div className="h-16 bg-[linear-gradient(to_bottom,#232b45,#141a30_60%,var(--background))] sm:h-20" />
    </div>
  )
}

// A sewer cover lying in the walking surface, seen nearly edge on: a flat
// ellipse with a raised rim and a few grip ridges across it.
function Manhole({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 16" preserveAspectRatio="none" className={className}>
      <ellipse cx={80} cy={8} rx={80} ry={8} fill="#4b5679" />
      <ellipse cx={80} cy={8} rx={72} ry={6} fill="#151b30" />
      <g fill="#2c3554">
        {[40, 62, 84, 106].map((x) => (
          <rect key={x} x={x} y={6.5} width={14} height={3} rx={1.5} />
        ))}
      </g>
    </svg>
  )
}

// A subway grate lying in the walking surface, in the same flat style as the
// manhole: a raised frame around evenly spaced slats over the dark vent.
// A blue mail collection box at real scale (a good deal taller than the
// hydrant), so only its lower part shows, fading out toward the top like the
// lamp post: the body with its MAIL label and red spray-painted "ST JOHN'S HACKS"
// graffiti tagged under it, the base frame,
// and the legs.
function Mailbox({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%)]", className)}>
      <svg viewBox="0 0 150 250" className="absolute bottom-0 left-0 w-full">
        {/* Body, with its shaded side. */}
        <rect x={6} y={0} width={138} height={214} fill="#1f3d70" />
        <rect x={116} y={0} width={28} height={214} fill="#19335f" />
        {/* The MAIL label, high on the front. */}
        <rect x={30} y={72} width={64} height={20} rx={2} fill="#e9e4da" opacity={0.85} />
        <text
          x={62}
          y={87}
          textAnchor="middle"
          fill="#1f3d70"
          fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
          fontWeight={700}
          fontSize={13}
          letterSpacing={1.5}
        >
          MAIL
        </text>

        {/* The graffiti, in capitals and a brushy hand-painted face, run
            through a spray-paint filter: the edges wobble a little and a fine
            grain lets the blue metal show through, so it reads as paint on
            the box rather than print. */}
        <defs>
          <filter id="mailbox-spray" x="-10%" y="-20%" width="120%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency={0.8} numOctaves={2} seed={3} result="wobble" />
            <feDisplacementMap in="SourceGraphic" in2="wobble" scale={1.1} xChannelSelector="R" yChannelSelector="G" result="rough" />
            <feTurbulence type="fractalNoise" baseFrequency={2.4} numOctaves={1} seed={8} result="grain" />
            <feColorMatrix
              in="grain"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.4 2.85"
              result="speckle"
            />
            <feComposite in="rough" in2="speckle" operator="in" />
          </filter>
        </defs>
        <g
          transform="rotate(-6 61 146)"
          textAnchor="middle"
          fill={RED}
          opacity={0.95}
          filter="url(#mailbox-spray)"
          style={{ fontFamily: "var(--font-paint), sans-serif" }}
        >
          <text x={60} y={132} fontSize={24} textLength={90} lengthAdjust="spacingAndGlyphs">ST JOHN&rsquo;S</text>
          <text x={61} y={164} fontSize={32} textLength={92} lengthAdjust="spacingAndGlyphs">HACKS</text>
        </g>
        {/* Base frame and legs. */}
        <rect x={2} y={212} width={146} height={8} rx={1} fill="#152c55" />
        <path d="M8 220H24L22 246H10Z" fill="#12264a" />
        <path d="M126 220H142L140 246H128Z" fill="#12264a" />
        <rect x={6} y={245} width={20} height={5} rx={1} fill="#12264a" />
        <rect x={124} y={245} width={20} height={5} rx={1} fill="#12264a" />
      </svg>
    </div>
  )
}

// Litter on the sidewalk, seen nearly edge on like everything else on it:
// a flat sheet, a crumpled ball, and a flyer with a red stripe.
const PAPERS = [
  { shape: "sheet", className: "left-[27%]" },
  { shape: "crumple", className: "left-[38%]" },
  { shape: "flyer", className: "left-[47%] sm:left-[50%]" },
] as const

function Paper({ shape, className }: { shape: (typeof PAPERS)[number]["shape"]; className?: string }) {
  return (
    <svg viewBox="0 0 20 12" overflow="visible" className={className}>
      {shape === "sheet" && (
        <>
          <path d="M1 9L18 7L19 9.6L2 11.6Z" fill="#9a948a" />
          <path d="M10 8L10.6 10.6" stroke="#77726a" strokeWidth={0.6} />
        </>
      )}
      {shape === "crumple" && (
        <>
          <path d="M4 11L2 6.5L6 3L11 4L14 2L17.5 6L15.5 11Z" fill="#8d877d" />
          <path d="M6 3L9 8L14 2M2 6.5L9 8L15.5 11" stroke="#6c675f" strokeWidth={0.6} fill="none" />
        </>
      )}
      {shape === "flyer" && (
        <>
          <path d="M2 10L16 6L18.4 8.8L4.4 12Z" fill="#a9a397" />
          <path d="M5.2 9.2L16.6 6L17.4 7L6 10.2Z" fill={RED} opacity={0.75} />
        </>
      )}
    </svg>
  )
}

function Grate({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 16" preserveAspectRatio="none" className={className}>
      <rect width={180} height={16} rx={3} fill="#4b5679" />
      <rect x={4} y={3} width={172} height={10} rx={1} fill="#090d1c" />
      <g fill="#2c3554">
        {Array.from({ length: 21 }, (_, i) => 8 + i * 8).map((x) => (
          <rect key={x} x={x} y={3} width={3} height={10} />
        ))}
      </g>
    </svg>
  )
}

// Johnny Thunderbird as the actual mascot, standing upright with his head
// turned to the side to face the pigeon on his left. The head follows the
// figurine's profile as one shape: a hooked beak open on a black mouth, a
// domed forehead with two white lightning streaks, and the back sweeping into
// three rounded spikes. Below it, a furry red body with a ragged hem and the white bolt on the chest,
// arms held a little out with the white zigzag feather trim under them,
// black-and-white striped socks and red sneakers.
function Thunderbird({ className }: { className?: string }) {
  const white = "#f4f1ee"
  const black = "#14161f"
  const shade = "#a50d25"
  // One arm, drawn on the left and mirrored for the right.
  const arm = (
    <>
      {/* The arm: a rounded shoulder, the upper arm curving down to a soft
          elbow bend, then the forearm tapering to a smooth rounded wingtip. */}
      <path
        d="M22 28.4C16.4 27.2 12.4 29.8 10.4 33.6C9 36.4 7 39.6 5.8 42.4C5 44.4 5.4 46 6.8 46.2C8.8 45.8 10.2 44.6 11.8 43C14.6 40.4 18 38.8 21.4 38.2Z"
        fill={RED}
      />
      {/* Feather trim hanging under the arm, following its curve: white
          zigzags with red inside. */}
      <path
        d="M21.4 38.2C18 38.8 14.6 40.4 11.8 43C10.2 44.6 8.8 45.8 6.8 46.2L7.2 49.6L9.8 47.8L10.8 52L12.8 48.6L14.8 52.6L15.8 48.2L17.8 51.6L18.8 46.8L21.4 48.2Z"
        fill={white}
      />
      <path
        d="M20.4 40.4C17.8 41 14.8 42.6 12.6 44.8L13 47.6L14.2 46.2L15.2 49L16.2 46.2L18 48.4L18.8 45.6L20.4 46.4Z"
        fill={RED}
      />    </>
  )
  return (
    <svg viewBox="0 0 60 80" className={className}>
      {/* Striped socks and red sneakers. */}
      <rect x={21.5} y={58} width={5} height={15} fill={black} />
      <rect x={33.5} y={58} width={5} height={15} fill={black} />
      <path d="M21.5 61H26.5M21.5 64.5H26.5M21.5 68H26.5M33.5 61H38.5M33.5 64.5H38.5M33.5 68H38.5" stroke={white} strokeWidth={1.1} />
      <path d="M17 77Q17 72.5 21.5 72.5H27V78H17Z" fill={RED} />
      <path d="M33 72.5H38.5Q43 72.5 43 77V78H33Z" fill={RED} />
      <rect x={16.5} y={77.4} width={11} height={2} rx={1} fill={white} />
      <rect x={32.5} y={77.4} width={11} height={2} rx={1} fill={white} />

      {/* Arms with their feather trim. */}
      {arm}
      <g transform="translate(60 0) scale(-1 1)">{arm}</g>

      {/* Furry body with a ragged hem, and the bolt on the chest. */}
      <path
        d="M18 32Q18 27 23 27H37Q42 27 42 32V58L40.5 60.5L39 58L37.5 60.5L36 58L34.5 60.5L33 58L31.5 60.5L30 58L28.5 60.5L27 58L25.5 60.5L24 58L22.5 60.5L21 58L19.5 60.5L18 58Z"
        fill={RED}
      />
      <path
        d="M28 33H33.4L30.8 38.2H34.4L27.4 47.6L29.8 40.8H26.4Z"
        fill={white}
        stroke={black}
        strokeWidth={0.5}
        strokeLinejoin="round"
      />

      {/* Everything from here down is the head, grouped so it can nod. */}
      <g data-head>
      {/* The head in profile, facing left toward the pigeon, as one shape:
          the hooked beak, the domed forehead, and the back of the head
          sweeping into three rounded spikes. The round stroke softens the
          spike tips. */}
      <path
        d="M9.6 23C8 17.2 12.6 12 20.4 10.8C23.4 6 29.6 3.4 37 3.6C43.6 3.8 49.6 5.4 54 8.2L46.2 11.6L53 15.6L45.2 17.4L49.8 23.2L41.2 22.6C38.4 27 32.6 28.6 27 27.8C24.6 27.6 22.6 26.8 21.4 25.6C19.4 26 16.6 25.4 15.4 23.6C13.6 23.6 11.2 24.2 9.6 23Z"
        fill={RED}
        stroke={RED}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      {/* The open mouth under the hooked beak. */}
      <path data-mouth d="M12.4 21.8Q18.4 20.4 27.4 22.4Q20.4 23.8 15.2 23.8Z" fill={black} />
      {/* Two lightning streaks kept clear of the eye, as on the costume: one
          along the forehead above it, one running back from behind it. */}
      <path d="M27.6 6.6L34.6 4.8L33.6 6.4L42.6 5L35.2 8.6L36.2 7.2L29.6 8.4Z" fill={white} />
      <path d="M34 12.8L39.6 11.2L38.8 12.8L45 12.6L38.8 16L39.6 14.6L34.8 15Z" fill={white} />
      {/* The eye, just behind the beak, under a heavy brow. */}
      {/* A white eye with the pupil looking forward, and a straight brow
          slanting down toward the beak for a determined look. */}
      {/* Pointed toward the beak, rounded off at the back. */}
      <path d="M24.4 11.6C25.8 9.6 30 9.1 31.5 10.7C32.3 11.6 31.7 13.2 29.8 13.6C27.8 14 25.7 13.1 24.4 11.6Z" fill={white} />
      <circle cx={27.7} cy={11.5} r={1.55} fill={black} />
      {/* A white glint cutting into the right side of the pupil. */}
      <circle cx={28.85} cy={11} r={0.6} fill={white} />
      <path d="M23.8 10.2L32.2 8.8" stroke={shade} strokeWidth={1.2} strokeLinecap="round" />
      </g>
    </svg>
  )
}

// A flat city pigeon in profile, facing right: a plump slate-grey body, a
// small dark head, the green and purple sheen on the neck, two black bars
// across the wing, a dark band on the tail, an orange eye, a short dark beak
// with its white cere, and pink feet.
function Pigeon({ className }: { className?: string }) {
  const bar = "#1d2029"
  return (
    <svg viewBox="0 0 44 32" className={className}>
      {/* Legs and toes. */}
      <path d="M19 22V29M24 22V29M17.4 29.6H21M22.4 29.6H26" stroke="#c4646e" strokeWidth={1.3} strokeLinecap="round" />
      {/* Tail, with its dark band. */}
      <path d="M2 12.6L14 11.6L14 17.6L3 16.2Z" fill="#474d63" />
      <path d="M2 12.6L5.4 12.3L5.8 16.6L3 16.2Z" fill={bar} />
      {/* Plump body. */}
      <path d="M10 14Q12 7 24 7.6Q32 8.6 33.4 15Q32.4 22.6 22 23Q12 23 10 14Z" fill="#596079" />
      {/* Wing, with two black bars. */}
      <path d="M11 13Q20 8.6 28.6 13Q22 18.4 11 17.2Z" fill="#6a7290" />
      <path d="M17.2 11.6L18.8 16.8M21.8 10.8L23.2 16.6" stroke={bar} strokeWidth={1.4} />
      {/* Neck sheen: green above, purple below. */}
      <path d="M26 9Q30 5.6 33.6 7.6L34.4 13.6Q30.6 15 27 12.8Z" fill="#3d7268" />
      <path d="M27 12.8Q30.6 15 34.4 13.6L33.8 16Q30 16.8 27.6 14.6Z" fill="#6b4c7c" />
      {/* Small head, eye, beak and cere, grouped so the head can bob. */}
      <g data-head>
        <circle cx={33} cy={6.4} r={3.9} fill="#474d63" />
        <circle cx={34.2} cy={5.6} r={1} fill="#e8752a" />
        <circle cx={34.4} cy={5.6} r={0.45} fill="#111" />
        <path d="M36.4 6.2L39.8 7.4L36.5 8.4Z" fill="#2b2d36" />
        <circle cx={36.8} cy={6.3} r={0.75} fill="#dcd9d2" />
      </g>
    </svg>
  )
}

function Hydrant({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 72" className={className}>
      {/* Flat fills only: one body color, one darker color for the details. */}
      {/* Bonnet and operating nut. */}
      <rect x={20} y={0} width={8} height={6} rx={1} fill="#8f0b20" />
      <path d="M12 21Q12 5 24 5Q36 5 36 21Z" fill={RED} />
      <rect x={9} y={19} width={30} height={7} rx={2} fill={RED} />
      {/* Barrel. */}
      <rect x={12} y={26} width={24} height={38} fill={RED} />
      {/* Side outlets with caps. */}
      <rect x={3} y={34} width={10} height={11} rx={2} fill={RED} />
      <rect x={0} y={36} width={4} height={7} rx={1} fill="#8f0b20" />
      <rect x={35} y={34} width={10} height={11} rx={2} fill={RED} />
      <rect x={44} y={36} width={4} height={7} rx={1} fill="#8f0b20" />
      {/* Front pumper outlet. */}
      <circle cx={24} cy={42} r={7} fill="#8f0b20" />
      <circle cx={24} cy={42} r={4} fill={RED} />
      {/* Base flange. */}
      <rect x={7} y={63} width={34} height={7} rx={2} fill="#8f0b20" />
      <rect x={4} y={69} width={40} height={3} rx={1} fill="#8f0b20" />
    </svg>
  )
}
