import { story } from "@/lib/content"

export function OurStory() {
  return (
    <section id="our-story" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
      <h2 className="text-5xl font-extrabold tracking-tighter text-primary sm:text-7xl">
        {story.heading}
      </h2>
      <ol className="mt-12 border-l-4 border-primary">
        {story.milestones.map((milestone) => (
          <li key={milestone.title} className="pb-10 pl-6 last:pb-0 sm:pl-10">
            <p className="font-semibold text-primary">{milestone.when}</p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight">
              {milestone.title}
            </h3>
            <p className="mt-2 max-w-prose text-lg leading-relaxed">
              {milestone.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
