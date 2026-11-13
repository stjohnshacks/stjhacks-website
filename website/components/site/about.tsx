import { WingPanel } from "@/components/site/wing-reveal"
import { about } from "@/lib/content"

// The About copy sits inside Johnny Thunderbird's wing, which grows to fit
// what it holds (on phones, a plain red block with feathers along the bottom). It
// reads straight down in steps: the heading and intro, a row of quick facts,
// the weekend in five numbered points, and a closing paragraph for beginners.
export function About() {
  return (
    <WingPanel id="about" className="mt-20 sm:mt-28">
      {/* Heading and intro. */}
      <h2 className="font-display text-4xl uppercase tracking-tight sm:text-6xl lg:text-7xl">{about.heading}</h2>
      <div className="mt-3 max-w-4xl space-y-2 text-base leading-relaxed sm:mt-5 sm:space-y-3 sm:text-lg">
        {about.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      {/* Quick facts. */}
      <dl className="mt-5 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-3 lg:grid-cols-4">
        {about.facts.map((fact) => (
          <div key={fact.value} className="rounded-lg border-2 border-white px-3 py-2 sm:px-4 sm:py-3">
            <dt className="font-display text-xl leading-none uppercase sm:text-3xl">{fact.value}</dt>
            <dd className="mt-1 text-xs sm:text-sm">{fact.label}</dd>
          </div>
        ))}
      </dl>

      {/* The weekend, in numbered points. */}
      <h3 className="mt-6 text-xl font-bold tracking-tight sm:mt-10 sm:text-2xl">{about.weekendHeading}</h3>
      <ol className="mt-3 grid gap-x-8 gap-y-3 sm:mt-4 sm:grid-cols-2 sm:gap-y-5">
        {about.weekend.map((item, i) => (
          <li key={item.title} className="flex gap-3 sm:gap-4">
            <span aria-hidden="true" className="font-display text-2xl leading-none sm:text-3xl">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="text-base font-bold sm:text-lg">{item.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed sm:text-base">{item.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Closing paragraph for beginners: centered, one line at a time,
          longest first, narrowing down to the call to action in bold. The
          lines never wrap: the text is sized to the space it has (cqw is 1%
          of this block's width), so the shape holds at any width. Below wide desktop sizes the
          lower wing is too narrow for a whole sentence to fit readably, so
          it gets shorter lines. */}
      <div className="@container mt-6 max-w-5xl sm:mt-10">
        <p className="text-center leading-relaxed whitespace-nowrap">
          <span className="hidden text-[min(24px,2.2cqw)] xl:block">
            {about.closing.lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
          <span className="block text-[min(22px,5cqw)] xl:hidden">
            {about.closing.narrowLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
          <strong className="mt-1 block text-[min(24px,5.4cqw)] font-bold">{about.closing.callToAction}</strong>
        </p>
      </div>
    </WingPanel>
  )
}
