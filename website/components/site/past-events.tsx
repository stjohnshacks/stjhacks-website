import { pastEvents } from "@/lib/content"

export function PastEvents() {
  return (
    <section id="past-events" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
      <h2 className="text-5xl font-extrabold tracking-tighter text-primary sm:text-7xl">
        {pastEvents.heading}
      </h2>
      <ul className="mt-12 border-t">
        {pastEvents.events.map((pastEvent) => (
          <li
            key={pastEvent.name}
            className="grid gap-1 border-b py-6 md:grid-cols-3 md:items-baseline md:gap-8"
          >
            <h3 className="text-2xl font-bold tracking-tight">
              {pastEvent.name}
            </h3>
            <p className="text-lg">{pastEvent.date}</p>
            <p className="text-lg text-muted-foreground">{pastEvent.venue}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
