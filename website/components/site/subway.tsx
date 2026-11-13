"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowUpRightIcon } from "lucide-react"
import { useRef, type ReactNode } from "react"

import { event, location } from "@/lib/content"
import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Wheel diameter in px. Used to turn distance traveled into wheel rotation.
const WHEEL = 34

// An elevated subway platform. As you scroll, the section pins and a train
// pulls through from left to right, carrying the date and the address on its
// cars. With reduced motion (or before JS loads) the train sits parked and the
// row of cars scrolls sideways instead.
export function Subway() {
  const section = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const viewport = section.current!.querySelector<HTMLElement>("[data-viewport]")!
        const train = section.current!.querySelector<HTMLElement>("[data-train]")!
        const wheels = section.current!.querySelectorAll("[data-wheel]")
        const bodies = section.current!.querySelectorAll("[data-body]")

        gsap.set(viewport, { overflow: "hidden" })
        // Distance from fully off the left edge to fully off the right edge.
        const distance = () => viewport.clientWidth + train.scrollWidth

        // The car bodies bounce on their springs over the wheel trucks, each
        // a beat after the one ahead. The bounce follows the train's speed:
        // quick while it's rolling, easing to a slow sway when it stops.
        const rock = gsap.to(bodies, {
          y: 3,
          duration: 0.18,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: { each: 0.07, from: "end" },
          paused: true,
        })
        rock.timeScale(0.1)
        let settle: gsap.core.Tween | null = null
        const bounceWith = (velocity: number) => {
          const speed = Math.min(1, Math.abs(velocity) / 1500)
          gsap.to(rock, { timeScale: 0.1 + speed * 1.4, duration: 0.3, overwrite: true })
          settle?.kill()
          settle = gsap.delayedCall(0.3, () => {
            gsap.to(rock, { timeScale: 0.1, duration: 0.8, overwrite: true })
          })
        }

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: () => `+=${Math.round(distance() * 0.75)}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onToggle: (self) => (self.isActive ? rock.play() : rock.pause()),
            onUpdate: (self) => bounceWith(self.getVelocity()),
          },
        })
        timeline
          .fromTo(train, { x: () => -train.scrollWidth }, { x: () => viewport.clientWidth, ease: "none" }, 0)
          .fromTo(
            wheels,
            { rotation: 0 },
            { rotation: () => (distance() / (Math.PI * WHEEL)) * 360, ease: "none" },
            0,
          )

        // The station sign lights up as the train comes in.
        gsap.from("[data-sign]", {
          opacity: 0,
          y: -16,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: section.current, start: "top 70%" },
        })
      })
    },
    { scope: section },
  )

  return (
    <section
      ref={section}
      id="location"
      aria-labelledby="location-title"
      className="relative overflow-hidden bg-background"
    >
      <div className="relative flex min-h-svh flex-col justify-center py-24">
        <ElevatedStructure />
        {/* Blends the top of the station into the fading hero above. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-linear-to-b from-background via-background/80 to-transparent"
        />

        {/* Station sign, in the style of the black and white NYC signs. */}
        <div data-sign className="relative z-10 mx-auto w-[min(92vw,44rem)] px-4">
          <div className="border-t-[3px] border-white/90 bg-black px-5 py-4 shadow-2xl shadow-black/60 sm:px-7">
            <p className="font-[Helvetica_Neue,Helvetica,Arial,sans-serif] text-xs font-medium tracking-[0.2em] text-white/60 uppercase">
              Next stop
            </p>
            <div className="mt-1 flex items-center justify-between gap-4">
              <h2
                id="location-title"
                className="font-[Helvetica_Neue,Helvetica,Arial,sans-serif] text-3xl font-bold tracking-tight text-white sm:text-5xl"
              >
                St. John&rsquo;s Hacks
              </h2>
              <RouteBullets className="gap-1.5 sm:gap-2" bulletClassName="size-10 text-lg sm:size-14 sm:text-2xl" />
            </div>
          </div>
        </div>

        {/* The train. Cars are listed front first; row-reverse puts the front
            on the right, the end that leads when moving right. */}
        <div
          data-viewport
          className="relative z-10 mt-14 overflow-x-auto [scrollbar-width:none] sm:mt-20 [&::-webkit-scrollbar]:hidden"
        >
          <div data-train className="flex w-max flex-row-reverse items-end px-4 pb-6">
            <Car label="When" front>
              <p className="font-display text-2xl leading-none uppercase sm:text-4xl">{event.date}</p>
            </Car>
            <Coupler />
            <Car label="Where">
              <p className="font-display text-2xl leading-none uppercase sm:text-4xl">{location.place}</p>
              <p className="mt-1 text-xs text-foreground/80 sm:text-sm">{location.campus}</p>
            </Car>
            <Coupler />
            <Car label="Address">
              <p className="text-sm leading-snug font-medium sm:text-base">{location.address}</p>
              <a
                href={location.mapsHref}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/60"
              >
                Get directions
                <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
                <span className="sr-only">(opens Google Maps in a new tab)</span>
              </a>
            </Car>
          </div>
        </div>

        <Track />
        <Platform />
      </div>
    </section>
  )
}

// The route bullets, one letter per line in the style of NYC subway signs,
// all in St. John's red with white letters.
const ROUTES = [
  { letter: "S", className: "bg-primary text-white" },
  { letter: "T", className: "bg-primary text-white" },
  { letter: "J", className: "bg-primary text-white" },
]

function RouteBullets({
  className,
  bulletClassName,
  vertical = false,
}: {
  className?: string
  bulletClassName?: string
  vertical?: boolean
}) {
  return (
    <span aria-hidden="true" className={cn("flex shrink-0", vertical ? "flex-col" : "flex-row", className)}>
      {ROUTES.map((route) => (
        <span
          key={route.letter}
          className={cn(
            "flex items-center justify-center rounded-full font-[Helvetica_Neue,Helvetica,Arial,sans-serif] leading-none font-bold",
            route.className,
            bulletClassName,
          )}
        >
          {route.letter}
        </span>
      ))}
    </span>
  )
}

// One car, seen straight from the side like a stainless NYC subway car:
// air-conditioning pods on the roof, a
// pair of sliding doors at each end, the big window carrying the information,
// a red stripe, fluted steel below it, a darker skirt with equipment boxes
// underneath, and a wheel truck under each end. The front car has a cab
// window, a squarer nose, and the headlight with its beam.
function Car({ label, front = false, children }: { label: string; front?: boolean; children: ReactNode }) {
  return (
    <div className="relative w-[min(86vw,620px)] shrink-0">
      {/* Everything above the wheel trucks rides on the springs together. */}
      <div data-body className="relative">
      {/* Air-conditioning pods on the roof. */}
      <div aria-hidden="true" className="absolute -top-2.5 left-[16%] h-3 w-[22%] rounded-t-md bg-linear-to-b from-[#b9bfca] to-[#8d95a3]" />
      <div aria-hidden="true" className="absolute -top-2.5 right-[16%] h-3 w-[22%] rounded-t-md bg-linear-to-b from-[#b9bfca] to-[#8d95a3]" />

      <div
        className={cn(
          "relative h-64 overflow-hidden rounded-t-[14px] rounded-b-sm border border-white/40 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.25)] sm:h-72",
          "bg-[linear-gradient(to_bottom,#e3e7ee_0%,#cdd2db_40%,#b3bac6_70%,#9aa2b0_100%)]",
          front && "rounded-tr-[22px] rounded-br-md",
        )}
      >
        {/* Roof edge. */}
        <div className="absolute inset-x-0 top-0 h-3.5 bg-linear-to-b from-[#a7aebb] to-[#c6ccd6]" />

        {/* Doors at each end, with the information window between them. */}
        <div className={cn("absolute top-12 bottom-[52px] left-3 flex gap-3", front ? "right-14" : "right-3")}>
          <DoorPair />
          {/* A real-sized side window in the upper part of the car, with plain
              steel below. The information is posted in the window, over a
              faint view of the lit car inside. */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="relative z-10 flex h-[74%] flex-col justify-center overflow-hidden rounded-[10px] border-[3px] border-[#4d5464] bg-[#0d1530] px-4 text-foreground shadow-[inset_0_0_18px_rgba(0,0,0,0.65),0_0_0_2px_#e6e9ef] sm:px-5">
              <CarInterior />
              {/* Glass reflection. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.09)_38%,transparent_48%,transparent_60%,rgba(255,255,255,0.05)_64%,transparent_70%)]"
              />
              <div className="relative">
                <p className="text-[10px] font-semibold tracking-[0.25em] text-signal uppercase sm:text-xs">{label}</p>
                <div className="mt-1">{children}</div>
              </div>
            </div>
          </div>
          <DoorPair />
        </div>

        {/* Red stripe, the fluted steel below it, and the skirt. */}
        <div className="absolute inset-x-0 bottom-[42px] h-2 bg-primary" />
        <div className="absolute inset-x-0 bottom-3 h-[30px] bg-[repeating-linear-gradient(to_right,#c9ced7_0_3px,#a1a8b5_3px_5px,#d8dce3_5px_7px)]" />
        <div className="absolute inset-x-0 bottom-0 h-3 bg-[#6f7787]" />

        {/* Car number. */}
        <p aria-hidden="true" className="absolute top-5 left-4 font-mono text-[10px] font-bold tracking-widest text-[#4a5160]">
          SJH 2027
        </p>

        {front && (
          <>
            {/* Cab window, and the headlight and marker light at the nose. */}
            <div className="absolute top-12 right-3 bottom-[96px] w-8 rounded-md border-[3px] border-[#5d6575] bg-[#0b1433] shadow-[0_0_0_2px_#e6e9ef]" />
            <div className="absolute right-2.5 bottom-14 flex flex-col items-center gap-1.5">
              <span className="size-4 rounded-full border-2 border-[#6b7383] bg-white shadow-[0_0_10px_4px_rgba(255,246,216,0.95),0_0_32px_12px_rgba(255,240,200,0.55)]" />
              <span className="size-3 rounded-full bg-primary shadow-[0_0_10px_3px_rgba(207,16,45,0.8)]" />
            </div>
          </>
        )}
      </div>

      {front && (
        // The headlight's beam, shining ahead of the train: a wide cone of
        // warm light that starts exactly at the white lamp and spreads to the
        // full height of the train as it fades. The lamp is 16px across and
        // its edges sit 74px and 90px above the bottom of the car, 10px in
        // from the nose, so the cone's narrow end is pinned to those numbers.
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-[calc(100%-18px)] w-[min(95vw,1100px)] bg-[linear-gradient(to_right,rgba(255,244,214,0.75),rgba(255,236,190,0.22)_40%,transparent)] [clip-path:polygon(0_calc(100%-90px),100%_0,100%_100%,0_calc(100%-74px))]"
        />
      )}

      {/* Equipment boxes slung under the floor, between the trucks. */}
      <div aria-hidden="true" className="absolute -bottom-3.5 left-[32%] flex w-[36%] gap-1.5">
        <span className="h-3.5 flex-[2] rounded-b-sm bg-[#252a39]" />
        <span className="h-3 flex-1 rounded-b-sm bg-[#1d2130]" />
        <span className="h-3.5 flex-[1.5] rounded-b-sm bg-[#252a39]" />
      </div>

      </div>

      <Bogie className="left-[9%]" />
      <Bogie className="right-[9%]" />
    </div>
  )
}

/** A faint view into the lit car through a side window: the ceiling light
 *  strip, grab poles, and the backs of the seats. */
function CarInterior() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-x-0 top-0 h-[22%] bg-linear-to-b from-[#fff4d6]/20 to-transparent" />
      <div className="absolute inset-x-[6%] top-[5%] h-[3px] rounded-full bg-[#fff6dc]/45" />
      <div className="absolute inset-y-0 left-[30%] w-1 bg-[#c9ced7]/25" />
      <div className="absolute inset-y-0 left-[70%] w-1 bg-[#c9ced7]/25" />
      <div className="absolute inset-x-0 bottom-0 flex h-[26%] gap-1.5 px-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="flex-1 rounded-t-lg bg-[#25305a]/70" />
        ))}
      </div>
    </div>
  )
}

/** A pair of sliding doors: two leaves with tall windows, a rubber seam where
 *  they meet, a recessed frame, and an indicator light above. */
function DoorPair() {
  return (
    <div aria-hidden="true" className="relative hidden w-[70px] shrink-0 sm:block">
      <span className="absolute -top-2.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[#ffb547] shadow-[0_0_6px_2px_rgba(255,181,71,0.6)]" />
      <div className="flex h-full gap-px rounded-sm border-2 border-[#8a92a1] bg-[#2b3140] p-0.5">
        {[0, 1].map((leaf) => (
          <div key={leaf} className="flex flex-1 flex-col bg-linear-to-b from-[#d4d9e1] to-[#b3bac6] p-1">
            <div className="h-[46%] rounded-[3px] border border-[#5d6575] bg-[#0b1433]" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** A wheel truck under one end of a car: the side frame, springs and axle
 *  boxes over two wheels. */
function Bogie({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("absolute -bottom-6 flex gap-3", className)}>
      {/* Side frame, with the springs on it. */}
      <div className="absolute -inset-x-2 top-0.5 h-5 rounded-md bg-[#1b2033]">
        <span className="absolute top-1 left-1/2 flex -translate-x-1/2 gap-0.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-3 w-1.5 rounded-sm bg-[repeating-linear-gradient(to_bottom,#5b6378_0_2px,#2c3347_2px_3px)]" />
          ))}
        </span>
      </div>
      {[0, 1].map((i) => (
        <div
          key={i}
          data-wheel
          style={{ width: WHEEL, height: WHEEL }}
          className="relative rounded-full border-4 border-[#2c3347] bg-[#11151f] bg-[conic-gradient(from_0deg,#5b6378_0_10deg,transparent_10deg_90deg,#5b6378_90deg_100deg,transparent_100deg_180deg,#5b6378_180deg_190deg,transparent_190deg_270deg,#5b6378_270deg_280deg,transparent_280deg)]"
        >
          {/* Axle box. */}
          <span className="absolute inset-[30%] rounded-sm bg-[#5b6378]" />
        </div>
      ))}
    </div>
  )
}

/** Between two cars: the rubber accordion gangway, and the coupler below. */
function Coupler() {
  return (
    <div aria-hidden="true" className="relative mb-6 flex h-56 w-3.5 shrink-0 flex-col justify-between sm:h-64">
      <div className="h-[78%] rounded-sm bg-[repeating-linear-gradient(to_bottom,#262b3a_0_3px,#151925_3px_6px)]" />
      <div className="-mx-2 h-2.5 rounded-sm bg-[#3a4152]" />
    </div>
  )
}

function Track() {
  return (
    <div aria-hidden="true" className="relative z-0">
      <div className="h-2 bg-[linear-gradient(to_bottom,#c3c9d4,#6b7383)]" />
      {/* Ties. */}
      <div className="h-3 bg-[repeating-linear-gradient(to_right,#2a2f3f_0_18px,transparent_18px_44px)]" />
    </div>
  )
}

function Platform() {
  return (
    <div aria-hidden="true" className="relative z-0 mt-6">
      {/* The yellow tactile edge strip. */}
      <div className="h-4 bg-[#f3c623] bg-[radial-gradient(circle,rgba(0,0,0,0.25)_1.5px,transparent_2px)] bg-size-[10px_10px]" />
    </div>
  )
}

/** Steel columns and girders of an elevated line, in the background. */
function ElevatedStructure() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-x-0 top-0 h-10 bg-[#0d1530] shadow-[0_8px_24px_rgba(0,0,0,0.5)]" />
      <div className="absolute inset-x-0 top-10 h-6 bg-[repeating-linear-gradient(45deg,#0d1530_0_6px,transparent_6px_22px),repeating-linear-gradient(-45deg,#0d1530_0_6px,transparent_6px_22px)] opacity-80" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(to_right,transparent_0_220px,#0b1229_220px_244px)] opacity-90" />
      {/* Warm light from the platform lamps. */}
      <div className="absolute inset-x-0 top-16 h-1/2 bg-[radial-gradient(ellipse_at_top,rgba(255,214,150,0.08),transparent_65%)]" />
    </div>
  )
}
