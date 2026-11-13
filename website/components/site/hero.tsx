import Image from "next/image"

import { StormSkyline } from "@/components/site/storm-skyline"
import { WaitlistForm } from "@/components/site/waitlist-form"
import { mascot } from "@/lib/content"

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh flex-col overflow-hidden"
    >
      <StormSkyline className="absolute inset-0 -z-10" />
      {/* Darkens the bottom so the text reads, and fades into the page below. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-3/5 bg-linear-to-b from-transparent via-background/55 to-background"
      />
      {mascot && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[12vw] -z-10 mx-auto h-[45svh] w-full max-w-md">
          <Image
            src={mascot}
            alt="The St. John's mascot flexing"
            fill
            preload
            sizes="(min-width: 640px) 28rem, 100vw"
            className="object-contain object-bottom"
          />
        </div>
      )}

      {/* The date and address ride in on the subway train just below. */}
      <div className="mt-auto px-4 pt-36 pb-3 sm:px-8 sm:pb-4">
        <h1
          id="hero-title"
          className="font-display text-[15vw] leading-[0.92] tracking-tight whitespace-nowrap text-primary uppercase sm:text-[9vw] sm:leading-[0.86]"
        >
          St. John&rsquo;s <br className="sm:hidden" />
          Hacks
        </h1>
        {/* Sized and capped so it sets as two balanced lines on larger screens. */}
        <p className="mt-4 max-w-3xl text-base leading-snug font-bold text-balance text-white uppercase sm:mt-6 sm:text-[20px]">
          A Red Storm is brewing over NYC. Join us for an electrifying
          36-hour hackathon on Feb 6–7 at St. John&rsquo;s University.
        </p>
        <WaitlistForm className="mt-3 max-w-xl sm:mt-4" />
      </div>
    </section>
  )
}
