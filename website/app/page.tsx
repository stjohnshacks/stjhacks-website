import { About } from "@/components/site/about"
import { Faq } from "@/components/site/faq"
import { Footer } from "@/components/site/footer"
import { Hero } from "@/components/site/hero"
import { Navbar } from "@/components/site/navbar"
import { OurStory } from "@/components/site/our-story"
import { PastEvents } from "@/components/site/past-events"
import { Sponsors } from "@/components/site/sponsors"
import { Street } from "@/components/site/street"
import { Subway } from "@/components/site/subway"
import { Team } from "@/components/site/team"

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Street />
        <Subway />
        <About />
        <OurStory />
        <Team />
        <PastEvents />
        <Sponsors />
        <Faq />
      </main>
      <Footer />
    </>
  )
}
