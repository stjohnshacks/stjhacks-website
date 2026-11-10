import Image from "next/image"

import { WaitlistForm } from "@/components/site/waitlist-form"
import { event, mascot } from "@/lib/content"

export function Hero() {
  return (
    <section className="relative flex flex-col overflow-hidden px-4 pt-6 sm:min-h-[calc(100svh-4.25rem)] sm:px-8">
      <h1 className="text-center text-[min(17.6vw,32svh)] leading-[0.88] font-extrabold tracking-[-0.06em] text-primary uppercase">
        St. John&rsquo;s
        <br />
        Hacks
      </h1>
      <WaitlistForm />
      <div className="mt-6 flex justify-between gap-6 font-semibold text-primary sm:absolute sm:inset-x-8 sm:bottom-6 sm:mt-0 sm:items-end">
        <p>{event.venue}</p>
        <p className="text-right">{event.date}</p>
      </div>
      {mascot && (
        <div className="relative mx-auto mt-8 h-[42svh] sm:mt-auto w-full max-w-md sm:w-2/5 sm:max-w-none">
          <Image
            src={mascot}
            alt="The St. John's mascot flexing"
            fill
            preload
            sizes="(min-width: 640px) 40vw, 100vw"
            className="object-contain object-bottom"
          />
        </div>
      )}
    </section>
  )
}
