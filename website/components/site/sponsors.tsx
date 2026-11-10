import { Button } from "@/components/ui/button"
import { sponsors } from "@/lib/content"

export function Sponsors() {
  return (
    <section id="sponsors" className="bg-primary text-primary-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-8 md:grid-cols-2 md:gap-16">
          <h2 className="text-5xl font-extrabold tracking-tighter sm:text-7xl">
            {sponsors.heading}
          </h2>
          <div className="max-w-prose">
            <p className="text-lg leading-relaxed">{sponsors.body}</p>
            <Button
              variant="secondary"
              size="lg"
              nativeButton={false}
              render={<a href={sponsors.contactHref} />}
              className="mt-6"
            >
              {sponsors.contactLabel}
            </Button>
          </div>
        </div>
        <ul className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {sponsors.slots.map((slot, index) => (
            <li
              key={index}
              className="flex h-28 items-center justify-center rounded-lg border-2 border-dashed border-primary-foreground/60 px-3 text-center font-medium"
            >
              {slot}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
