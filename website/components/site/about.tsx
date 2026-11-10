import { about } from "@/lib/content"

export function About() {
  return (
    <section id="about" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
      <div className="grid gap-8 md:grid-cols-2 md:gap-16">
        <h2 className="text-5xl font-extrabold tracking-tighter text-primary sm:text-7xl">
          {about.heading}
        </h2>
        <div className="max-w-prose space-y-5 text-lg leading-relaxed">
          {about.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  )
}
