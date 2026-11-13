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
import { contact, location, registerHref, seo, siteUrl } from "@/lib/content"

// The event, described for search engines (schema.org Event), so Google can
// show its date and place right in the result.
const eventJsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "St. John's Hacks 2027",
  description: seo.description,
  startDate: "2027-02-06",
  endDate: "2027-02-07",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  isAccessibleForFree: true,
  location: {
    "@type": "Place",
    name: `${location.place}, ${location.campus}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "8000 Utopia Parkway",
      addressLocality: "Queens",
      addressRegion: "NY",
      postalCode: "11439",
      addressCountry: "US",
    },
  },
  image: [`${siteUrl}/opengraph-image.jpg`],
  url: siteUrl,
  offers: {
    "@type": "Offer",
    price: 0,
    priceCurrency: "USD",
    url: `${siteUrl}/${registerHref}`,
  },
  organizer: {
    "@type": "Organization",
    name: "St. John's Hacks",
    url: siteUrl,
    email: contact.email,
    sameAs: contact.social.map((item) => item.href),
  },
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd).replace(/</g, "\\u003c") }}
      />
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
