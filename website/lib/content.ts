// All editable site copy lives here.
// Anything marked PLACEHOLDER is invented and needs replacing before launch.

export const event = {
  date: "February 6–7, 2027",
  venue: "Marillac Terrace, St. John's University Queens Campus",
}

// The site's address, used for search engines (sitemap, robots, links in the
// event details). Set NEXT_PUBLIC_SITE_URL to the final domain; on Vercel it
// falls back to the project's production address.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")

// What shows up on Google: the page title (the blue link) and description
// (the text under it), taken from the hero.
export const seo = {
  title: "St. John's Hacks 2027 | NYC's Red Storm Hackathon",
  description:
    "A Red Storm is brewing over NYC. St. John's Hacks is a free, 36-hour student hackathon on Feb 6–7, 2027 at St. John's University in Queens. Every major and skill level welcome. Food included. Join the waitlist.",
  keywords: [
    "St. John's Hacks",
    "hackathon",
    "NYC hackathon",
    "Queens",
    "St. John's University",
    "Red Storm",
    "student hackathon",
    "beginner-friendly hackathon",
  ],
}

// Shown on the subway train below the hero. Check the address and map link
// before launch.
export const location = {
  place: "Marillac Terrace",
  campus: "St. John's University, Queens Campus",
  address: "8000 Utopia Parkway, Queens, NY 11439",
  mapsHref:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("Marillac Hall, St. John's University, 8000 Utopia Parkway, Queens, NY 11439"),
}

// Set to "/mascot.png" once the transparent PNG is in website/public/.
export const mascot: string | null = null

// Where the Register buttons go. Change to the registration page once it exists.
export const registerHref = "#waitlist"

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Our Story", href: "#our-story" },
  { label: "Team", href: "#team" },
  { label: "Past Events", href: "#past-events" },
  { label: "Sponsors", href: "#sponsors" },
  { label: "FAQ", href: "#faq" },
]

export const about = {
  heading: "36 hours to build something.",
  paragraphs: [
    "St. John's Hacks is a 36-hour hackathon at St. John's University in Queens, New York, open to any college student.",
    "Bring an idea and spend the weekend turning it into something real. Build with a team, meet other students, and put your project in the running for a prize.",
  ],
  // The quick facts, shown as a row of tiles.
  facts: [
    { value: "36 hrs", label: "of hacking" },
    { value: "Queens, NY", label: "at St. John's University" },
    { value: "Any college", label: "student can join" },
    { value: "All levels", label: "beginners welcome" },
  ],
  weekendHeading: "Your weekend",
  weekend: [
    { title: "Express your idea", body: "Bring the thing you've been wanting to make, or find one with your team." },
    { title: "Build something", body: "Spend the weekend turning it into something real you can show." },
    { title: "Meet others", body: "Work alongside students from every school, major, and background." },
    { title: "Go for a prize", body: "Every project gets considered for a prize at the end of the weekend." },
    { title: "Learn as you go", body: "New to this? It's a great place to learn by doing." },
  ],
  // The closing paragraph, one line per sentence, longest first, so it narrows
  // as it goes down to the call to action, which is set in bold.
  closing: {
    lines: [
      "You don't need to be an expert, have a perfect idea, or bring years of experience.",
      "We think it's a great opportunity for everyone, whatever your skill level.",
      "Beginners are welcome, and it's a great place to learn.",
    ],
    // The same idea in shorter lines for phones, still narrowing as it goes.
    narrowLines: [
      "You don't need to be an expert,",
      "a perfect idea, or experience.",
      "Beginners are welcome here,",
      "and it's a place to learn.",
    ],
    callToAction: "Just start.",
  },
}

// The conversation on the sidewalk under the hero: a pigeon asks, Johnny
// Thunderbird answers. Keep each line short; they show in speech bubbles.
export const streetChat = [
  { question: "Wait, what's going on here?", answer: "St. John's Hacks! Feb 6–7 at Marillac Terrace." },
  { question: "Do I gotta know how to code?", answer: "Nope. Every major, every skill level." },
  { question: "I don't got a team…", answer: "Come solo. You'll find one there." },
  { question: "How much is it?", answer: "Free. Food included." },
]

export const story = {
  heading: "Our story",
  milestones: [
    {
      when: "2024",
      title: "The idea",
      body: "A group of students wanted a hackathon made for St. John's students, so they started planning one.",
    },
    {
      when: "2025",
      title: "St. John's Hacks is born",
      body: "The first St. John's Hacks filled St. Augustine Hall with St. John's students building together.",
    },
    {
      when: "2026",
      title: "Back again",
      body: "Same format, more people, and new sponsors joining in.",
    },
    {
      when: "2027",
      title: "Going bigger",
      body: "On February 6–7, 2027, we're going bigger and opening St. John's Hacks to the public.",
    },
  ],
}

// The team: the founder first, with Lauren and Sebastian beside him, then
// the other organizers in alphabetical order. Photos
// live in website/public/team/ (square works best); without one, the
// member's initials show instead. Links are optional and show as buttons on
// the poster, e.g. { label: "LinkedIn", href: "https://www.linkedin.com/in/..." }.
type TeamLink = { label: "LinkedIn" | "GitHub" | "Instagram" | "Website"; href: string }
export const team = {
  heading: "The team",
  intro: "The students putting St. John's Hacks together.",
  members: [
    {
      name: "Tomas Santos",
      role: "Founder",
      photo: "/team/tomas-santos.jpg",
      links: [{ label: "LinkedIn", href: "https://www.linkedin.com/in/tjsydev/" }],
    },
    {
      name: "Lauren Rodriguez",
      role: "Organizer",
      photo: "/team/lauren-rodriguez.png",
      links: [{ label: "LinkedIn", href: "https://www.linkedin.com/in/lauren-erodriguez/" }],
    },
    {
      name: "Sebastian Torres",
      role: "Organizer",
      photo: "/team/sebastian-torres.png",
      links: [{ label: "LinkedIn", href: "https://www.linkedin.com/in/torres-codes" }],
    },
    {
      name: "Brian Martinez",
      role: "Organizer",
      photo: "/team/brian-martinez.jpg",
      links: [{ label: "LinkedIn", href: "https://www.linkedin.com/in/brian-martinez-flores/" }],
    },
    {
      name: "Gali Desir",
      role: "Organizer",
      photo: "/team/gali-desir.jpg",
      links: [{ label: "LinkedIn", href: "https://www.linkedin.com/in/the-gali-desir/" }],
    },
    {
      name: "Gianni Faruzzo",
      role: "Organizer",
      photo: "/team/gianni-faruzzo.png",
      links: [{ label: "LinkedIn", href: "https://www.linkedin.com/in/giannnidfaruzzo/" }],
    },
    {
      name: "Jennifer Venus",
      role: "Organizer",
      photo: "/team/jennifer-venus.png",
      links: [{ label: "LinkedIn", href: "https://www.linkedin.com/in/jennifervenus/" }],
    },
    {
      name: "Joshua Peguero",
      role: "Organizer",
      photo: "/team/joshua-peguero.png",
      links: [{ label: "LinkedIn", href: "https://www.linkedin.com/in/joshua-peguero/" }],
    },
    {
      name: "Umair Mahmood",
      role: "Organizer",
      photo: "/team/umair-mahmood.jpg",
      links: [{ label: "LinkedIn", href: "https://www.linkedin.com/in/umair-swe/" }],
    },
  ] as { name: string; role: string; photo: string | null; links: TeamLink[] }[],
}

// Past events, newest first, each with its photos for the jumbotron. Photos
// live in website/public/events/<year>/ as web-sized JPGs (about 2000px
// wide); landscape fills the screen best. Each caption is the photo's
// description for screen readers.
export const pastEvents = {
  heading: "Past events",
  events: [
    {
      name: "St. John's Hacks 2026",
      season: "2026",
      photos: [
        { src: "/events/2026/01.jpg", caption: "The St. John's Hacks title slide, with Johnny Thunderbird beside the screen" },
        { src: "/events/2026/02.jpg", caption: "Two hackers at their laptops" },
        { src: "/events/2026/03.jpg", caption: "Hackers working in the computer lab" },
        { src: "/events/2026/04.jpg", caption: "A full room of hackers at the kickoff" },
        { src: "/events/2026/05.jpg", caption: "The team at the front of the room" },
        { src: "/events/2026/06.jpg", caption: "A winning team holding their prize check" },
      ],
    },
    {
      name: "St. John's Hacks 2025",
      season: "2025",
      photos: [
        { src: "/events/2025/01.jpg", caption: "Two hackers working on their laptops" },
        { src: "/events/2025/02.jpg", caption: "A hacker coding at a lab workstation" },
        { src: "/events/2025/03.jpg", caption: "Four hackers posing together" },
        { src: "/events/2025/04.jpg", caption: "Five hackers in front of the St. John's backdrop" },
        { src: "/events/2025/05.jpg", caption: "The group in front of the St. John's backdrop" },
        { src: "/events/2025/06.jpg", caption: "Hackers listening in the lecture hall" },
      ],
    },
  ] as { name: string; season: string; photos: { src: string; caption: string }[] }[],
}

// How to reach us, shown in the footer.
export const contact = {
  email: "stjohnshacks@gmail.com",
  social: [
    { label: "Instagram", handle: "@stjhacks", href: "https://www.instagram.com/stjhacks/" },
    { label: "LinkedIn", handle: "STJ Hacks", href: "https://www.linkedin.com/company/stj-hacks/" },
    { label: "Discord", handle: "Join the server", href: "https://discord.com/invite/3GDFszAswT" },
  ] as { label: "Instagram" | "LinkedIn" | "Discord"; handle: string; href: string }[],
}

export const sponsors = {
  heading: "Sponsors",
  body: "Sponsors help pay for food, prizes, and swag, and they get to meet students who love to build. We'd like to talk if your company wants to get involved.",
  // The scrolling row of sponsor logos, each linking to the sponsor's site.
  // Logos live in website/public/sponsors/. Each card takes the logo's own
  // background color; `fit` is "cover" to fill the card (cropping empty
  // margins) or "contain" to show the whole image, and `zoom` enlarges a
  // logo that sits small in the middle of a big image.
  logos: [
    {
      name: "Maspeth Federal Savings",
      logo: "/sponsors/maspeth-federal-savings.png",
      href: "https://www.maspethfederal.com",
      background: "#ffffff",
      fit: "cover",
      zoom: 1,
    },
    {
      name: "St. John's Collins College of Professional Studies",
      logo: "/sponsors/st-johns-ccps.jpg",
      href: "https://www.stjohns.edu/academics/schools/college-professional-studies",
      background: "#061b2e",
      fit: "contain",
      zoom: 1,
    },
    {
      name: "Headstarter",
      logo: "/sponsors/headstarter.png",
      href: "https://headstarter.co",
      background: "#070b13",
      fit: "cover",
      zoom: 1.8,
    },
    {
      name: "TOLTIQ",
      logo: "/sponsors/toltiq.png",
      href: "https://www.toltiq.com",
      background: "#000204",
      fit: "cover",
      zoom: 1.3,
    },
  ] as {
    name: string
    logo: string | null
    href: string | null
    background: string
    fit: "cover" | "contain"
    zoom: number
  }[],
  contactLabel: "Email us about sponsoring",
  // The same address as the footer's, with the subject filled in.
  contactHref: `mailto:${contact.email}?subject=Sponsoring%20St.%20John%27s%20Hacks`,
}

// PLACEHOLDER
export const faqs = [
  {
    question: "Who can attend?",
    answer:
      "Any college student can attend, whatever their school, major, or experience.",
  },
  {
    question: "Do I need to know how to code?",
    answer:
      "No. Teams need designers, writers, and presenters too, and mentors can help you learn as you go.",
  },
  {
    question: "How much does it cost?",
    answer: "It's free, and that includes food.",
  },
  {
    question: "Do I need a team?",
    answer:
      "No. You can come with a team or find one at the start of the event.",
  },
  {
    question: "What should I bring?",
    answer:
      "Bring your laptop, a charger, and an ID. We'll handle the rest.",
  },
  {
    question: "How do I register?",
    answer:
      "Registration isn't open yet. Join the waitlist at the top of this page and we'll email you when it opens.",
  },
]
