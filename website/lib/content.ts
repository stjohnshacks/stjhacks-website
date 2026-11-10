// All editable site copy lives here.
// Anything marked PLACEHOLDER is invented and needs replacing before launch.

export const event = {
  date: "February 6–7, 2027",
  venue: "Marillac Terrace, St. John's University Queens Campus",
}

// Set to "/mascot.png" once the transparent PNG is in website/public/.
export const mascot: string | null = null

// Where the Register buttons go. Change to the registration page once it exists.
export const registerHref = "#waitlist"

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Our Story", href: "#our-story" },
  { label: "Past Events", href: "#past-events" },
  { label: "Sponsors", href: "#sponsors" },
  { label: "FAQ", href: "#faq" },
]

// PLACEHOLDER
export const about = {
  heading: "Build something in a day.",
  paragraphs: [
    "St. John's Hacks is a student-run hackathon. You form a team, pick a problem, and build a working project before the day ends.",
    "It's open to every major and every skill level. Mentors are around to help when you get stuck, and meals are on us.",
  ],
}

// PLACEHOLDER
export const story = {
  heading: "Our story",
  milestones: [
    {
      when: "Fall 2024",
      title: "The idea",
      body: "A few students wanted a hackathon on their own campus, so they started planning one.",
    },
    {
      when: "April 2025",
      title: "The first event",
      body: "Students filled the second floor of St. Augustine Hall for a day of building.",
    },
    {
      when: "Next",
      title: "The next event",
      body: "The next St. John's Hacks is February 6–7, 2027.",
    },
  ],
}

export const pastEvents = {
  heading: "Past events",
  events: [
    {
      name: "St. John's Hacks 2025",
      date: "April 26, 2025",
      venue: "St. Augustine Hall, 2nd Floor",
    },
  ],
}

// PLACEHOLDER
export const sponsors = {
  heading: "Sponsors",
  body: "Sponsors help pay for food, prizes, and swag, and they get to meet students who love to build. We'd like to talk if your company wants to get involved.",
  slots: ["Your logo here", "Your logo here", "Your logo here", "Your logo here"],
  contactLabel: "Email us about sponsoring",
  contactHref: "mailto:sponsors@example.com",
}

// PLACEHOLDER
export const faqs = [
  {
    question: "Who can attend?",
    answer:
      "Any St. John's student can attend, whatever their major or experience.",
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
      "Bring your laptop, a charger, and your student ID. We'll handle the rest.",
  },
  {
    question: "How do I register?",
    answer:
      "Registration isn't open yet. Join the waitlist at the top of this page and we'll email you when it opens.",
  },
]
