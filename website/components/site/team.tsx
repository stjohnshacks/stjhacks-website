import Image from "next/image"

import { team } from "@/lib/content"
import { cn } from "@/lib/utils"

const RED = "#cf102d"

// A slight tilt for each poster, in turn, so they look slapped up by hand.
const TILTS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "-rotate-[1.5deg]", "rotate-[1.5deg]"]

// The team on a graffiti wall: a corrugated roll-down storefront gate covered
// in spray-painted tags, with each member on a paper poster taped over it.
export function Team() {
  return (
    <section id="team" className="relative isolate overflow-hidden">
      <Gate />
      <Tags />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
        <h2 className="font-display text-6xl uppercase tracking-tight text-white sm:text-8xl">
          {team.heading}
        </h2>
        <p className="mt-4 max-w-prose text-lg text-white/85">{team.intro}</p>

        {/* On phones and tablets, one poster after another straight down the
            page (kept to a comfortable width); three across from md up. */}
        <ul className="mx-auto mt-12 grid max-w-sm grid-cols-1 gap-x-10 gap-y-12 md:max-w-none md:grid-cols-3">
          {team.members.map((member, i) => (
            <li key={i} className={cn("transition-transform duration-300 hover:rotate-0", TILTS[i % TILTS.length])}>
              <Poster member={member} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** A wheatpasted paper poster: tape at the top corners, the photo, the name,
 *  the role, and link buttons. */
function Poster({ member }: { member: (typeof team.members)[number] }) {
  const initials = member.name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
  // LinkedIn shows as a small icon beside the role; any other links stay as
  // buttons.
  const linkedin = member.links.find((link) => link.label === "LinkedIn")
  const otherLinks = member.links.filter((link) => link !== linkedin)
  return (
    <article className="relative mx-auto max-w-64 bg-[#f1ece1] p-3 pb-4 text-[#14161f] shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
      {/* Tape. */}
      <span aria-hidden="true" className="absolute -top-2.5 -left-3 h-6 w-16 -rotate-[30deg] bg-[#e6dcc2]/85 shadow-sm" />
      <span aria-hidden="true" className="absolute -top-2.5 -right-3 h-6 w-16 rotate-[30deg] bg-[#e6dcc2]/85 shadow-sm" />

      <div className="relative aspect-square overflow-hidden bg-[#1b2340]">
        {member.photo ? (
          <Image src={member.photo} alt={member.name} fill sizes="256px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-6xl text-primary" aria-hidden="true">
            {initials}
          </div>
        )}
      </div>

      <h3 className="mt-3 font-display text-2xl leading-none uppercase">{member.name}</h3>
      {/* The role, with the LinkedIn icon at the far right of the same line. */}
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">{member.role}</p>
        {linkedin && (
          <a
            href={linkedin.href}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-sm outline-none transition-transform hover:scale-110 focus-visible:ring-3 focus-visible:ring-primary/50"
          >
            <LinkedInIcon className="size-5" />
            <span className="sr-only">{member.name} on LinkedIn (opens in a new tab)</span>
          </a>
        )}
      </div>

      {otherLinks.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {otherLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full bg-[#14161f] px-3 py-1 text-xs font-semibold text-white outline-none transition-colors hover:bg-primary focus-visible:ring-3 focus-visible:ring-primary/50"
              >
                {link.label}
                <span className="sr-only">
                  {" "}
                  for {member.name} (opens in a new tab)
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

/** The LinkedIn mark in St. John's red: a rounded square with a white "in". */
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width={24} height={24} rx={4} fill={RED} />
      <circle cx={7} cy={7.1} r={1.65} fill="#fff" />
      <rect x={5.6} y={9.6} width={2.8} height={8.6} fill="#fff" />
      <path
        d="M10.7 9.6h2.7v1.2c.4-.75 1.4-1.4 2.8-1.4 2.3 0 3.1 1.45 3.1 3.7v5.1h-2.8v-4.5c0-1.1-.3-1.85-1.35-1.85-1.05 0-1.6.8-1.6 1.85v4.5h-2.85Z"
        fill="#fff"
      />
    </svg>
  )
}

/** The roll-down gate: horizontal corrugated slats, darker toward the edges,
 *  with the bottom rail. */
function Gate() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,#2a3146_0_9px,#353d55_9px_12px,#1c2234_12px_15px)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(5,10,26,0.75))]" />
      {/* Fades in from the section above and out to the one below. */}
      <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-background to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent" />
    </div>
  )
}

/** Tags sprayed across the gate, run through a spray filter (rough edges and a
 *  little grain) and kept faint enough that the posters stay easy to read. */
function Tags() {
  const paint = { fontFamily: "var(--font-paint), sans-serif" }
  const block = { fontFamily: "var(--font-anton), sans-serif" }
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
    >
      <defs>
        <filter id="team-spray" x="-10%" y="-20%" width="120%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency={0.6} numOctaves={2} seed={5} result="wobble" />
          <feDisplacementMap in="SourceGraphic" in2="wobble" scale={3} xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency={1.6} numOctaves={1} seed={11} result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.6" result="speckle" />
          <feComposite in="rough" in2="speckle" operator="in" />
        </filter>
      </defs>

      <g filter="url(#team-spray)">
        <text x={70} y={170} fontSize={150} fill={RED} opacity={0.55} transform="rotate(-8 70 170)" style={paint}>
          STJ
        </text>
        <text x={820} y={150} fontSize={110} fill="none" stroke="#f3eee4" strokeWidth={3} opacity={0.3} transform="rotate(5 820 150)" style={block}>
          QUEENS
        </text>
        <text x={520} y={430} fontSize={120} fill="#ff5468" opacity={0.28} transform="rotate(-4 520 430)" style={paint}>
          RED STORM
        </text>
        <text x={90} y={470} fontSize={90} fill="#f3eee4" opacity={0.28} transform="rotate(9 90 470)" style={paint}>
          HACK
        </text>
        <g transform="rotate(-6 260 700)" opacity={0.5} style={block}>
          <text x={260} y={700} fontSize={150} fill={RED} stroke="#f3eee4" strokeWidth={10} strokeLinejoin="round" paintOrder="stroke">
            SJH &rsquo;27
          </text>
        </g>
        <text x={900} y={720} fontSize={110} fill="#7fb8ff" opacity={0.32} transform="rotate(7 900 720)" style={paint}>
          BUILD
        </text>

        {/* Scribbles, an arrow and a few drips. */}
        <g fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round" opacity={0.45}>
          <path d="M640 250C700 220 760 280 820 240S920 220 960 260" />
          <path d="M1010 330L1110 380M1110 380L1080 340M1110 380L1062 392" />
          <path d="M120 200V240M180 196V226M250 205V250" strokeWidth={4} />
        </g>
        <g fill="none" stroke="#f3eee4" strokeWidth={4} strokeLinecap="round" opacity={0.25}>
          <path d="M560 600C600 560 650 640 700 590S790 560 820 610" />
          <circle cx={1080} cy={560} r={34} />
          <path d="M1062 560L1076 574L1100 546" />
        </g>
      </g>
    </svg>
  )
}
