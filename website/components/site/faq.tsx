import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { faqs } from "@/lib/content"

// The FAQ, on the site's navy: the heading, then the questions. On wide
// screens the heading sits to the left of the questions; on narrow ones,
// above them.
export function Faq() {
  return (
    <section id="faq" className="bg-background text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-8 md:grid-cols-[1fr_2fr] md:gap-x-16">
          {/* One word per line on wide screens, so it fits the narrow column. */}
          <h2 className="font-display text-5xl leading-[0.95] uppercase tracking-tight sm:text-7xl md:text-6xl lg:text-7xl">
            Frequently <br className="hidden md:block" />
            Asked <br className="hidden md:block" />
            Questions
          </h2>
          <Accordion>
            {faqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question} className="border-white/25">
                <AccordionTrigger className="py-4 text-lg font-semibold **:data-[slot=accordion-trigger-icon]:text-white">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="max-w-prose pb-4 text-base leading-relaxed text-white/90">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
