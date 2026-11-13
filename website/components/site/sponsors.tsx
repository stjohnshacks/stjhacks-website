import Image from "next/image"

import { Button } from "@/components/ui/button"
import { sponsors } from "@/lib/content"

export function Sponsors() {
  return (
    <section id="sponsors" className="bg-primary text-primary-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pt-20 sm:px-8 sm:pt-28">
        <div className="grid gap-8 md:grid-cols-2 md:gap-16">
          <h2 className="font-display text-6xl uppercase tracking-tight sm:text-8xl">
            {sponsors.heading}
          </h2>
          <div className="max-w-prose">
            <p className="text-lg leading-relaxed">{sponsors.body}</p>
            <Button
              variant="secondary"
              size="lg"
              nativeButton={false}
              render={<a href={sponsors.contactHref} />}
              className="mt-6 bg-white text-primary hover:bg-white/90"
            >
              {sponsors.contactLabel}
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-0 pb-6 sm:pt-4 sm:pb-12">
        <LogoMarquee />
      </div>
    </section>
  )
}

// The sponsor logos sliding from right to left across the full width of the
// page, on a loop that never stops, even on hover. The row is doubled and
// slid by one copy's width so there's no seam. With reduced motion it stands
// still and can be scrolled sideways by hand instead. The edges fade into the section.
function LogoMarquee() {
  return (
    <div
      role="region"
      aria-label="Our sponsors"
      className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:overflow-x-auto"
    >
      {/* Vertical padding inside the clipped strip leaves room for a card to
          lift and glow on hover without being cut off. */}
      <div className="flex w-max animate-ticker py-14 motion-reduce:animate-none">
        <LogoRow />
        <LogoRow hidden />
      </div>
    </div>
  )
}

// One copy of the row. Each card takes its logo's own background color and
// frames the logo to fill it, so logos that come as squares and as wide
// banners line up as matching tiles. There are enough copies of the list to
// fill a wide screen even with only a few sponsors.
function LogoRow({ hidden = false }: { hidden?: boolean }) {
  const repeats = Math.max(1, Math.ceil(8 / sponsors.logos.length))
  const items = Array.from({ length: repeats }, () => sponsors.logos).flat()
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-6 pr-6 sm:gap-8 sm:pr-8">
      {items.map((sponsor, i) => {
        // Only the first copy of the list is read out and reachable by Tab;
        // the repeats are just there to keep the loop full.
        const repeat = hidden || i >= sponsors.logos.length
        const card = (
          <div
            className="relative flex h-24 w-52 items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-black/20 transition-[translate,box-shadow] duration-300 group-hover/logo:-translate-y-1 group-hover/logo:shadow-[0_0_18px_6px_rgba(255,255,255,0.95),0_0_48px_16px_rgba(255,255,255,0.6)] sm:h-28 sm:w-64"
            style={{ backgroundColor: sponsor.background }}
          >
            {sponsor.logo ? (
              <Image
                src={sponsor.logo}
                alt={repeat ? "" : sponsor.name}
                fill
                sizes="256px"
                className={sponsor.fit === "cover" ? "object-cover" : "object-contain"}
                style={{ transform: sponsor.zoom !== 1 ? `scale(${sponsor.zoom})` : undefined }}
              />
            ) : (
              <span className="px-4 text-center font-semibold text-white">{sponsor.name}</span>
            )}
          </div>
        )
        return (
          <li key={i} aria-hidden={repeat || undefined} className="shrink-0">
            {sponsor.href ? (
              <a
                href={sponsor.href}
                target="_blank"
                rel="noreferrer"
                tabIndex={repeat ? -1 : undefined}
                className="group/logo block rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-white/70"
              >
                {card}
                {!repeat && <span className="sr-only"> (opens in a new tab)</span>}
              </a>
            ) : (
              card
            )}
          </li>
        )
      })}
    </ul>
  )
}
