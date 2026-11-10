import { About } from "@/components/site/about"
import { Faq } from "@/components/site/faq"
import { Footer } from "@/components/site/footer"
import { Hero } from "@/components/site/hero"
import { Navbar } from "@/components/site/navbar"
import { OurStory } from "@/components/site/our-story"
import { PastEvents } from "@/components/site/past-events"
import { Sponsors } from "@/components/site/sponsors"

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <OurStory />
        <PastEvents />
        <Sponsors />
        <Faq />
      </main>
      <Footer />
    </>
  )
}
