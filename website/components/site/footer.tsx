import { MailIcon } from "lucide-react"
import type { ReactNode } from "react"

import { contact, navLinks } from "@/lib/content"

// The footer, on the site's navy under a thin top line: the name
// over Johnny Thunderbird in binary; a column of the page's sections;
// and the social links and email, each just its icon and name. A thin bar
// along the bottom carries the copyright.
export async function Footer() {
  const year = await currentYear()
  return (
    <footer className="relative border-t border-white/15 bg-background">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 sm:px-8 md:grid-cols-[1.3fr_1fr_1fr] md:gap-10 md:py-20">
        {/* The name, styled like the Explore and Connect headings, above
            Johnny Thunderbird in binary. The drawing fills this column's
            width: its digits are sized to it (cqw is 1% of the column; the
            drawing is about 43 characters' worth of em wide). */}
        <div className="@container w-full">
          <h2 className="mb-4 text-sm font-bold tracking-[0.2em] text-primary uppercase">St. John&rsquo;s Hacks</h2>
          <pre
            aria-hidden="true"
            className="w-fit font-mono text-[1.72cqw] leading-[1.15] text-primary select-none"
          >
            {JOHNNY_BINARY.join("\n")}
          </pre>
        </div>

        {/* The page's sections. */}
        <nav aria-label="Footer">
          <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase">Explore</h2>
          <ul className="mt-4 space-y-2.5">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-sm text-white outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/60"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Social links and email. */}
        <div>
          <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase">Connect</h2>
          <ul className="mt-4 space-y-3">
            {contact.social.map((item) => (
              <li key={item.label}>
                <FooterLink href={item.href} icon={<SocialIcon name={item.label} />} external>
                  {item.label}
                </FooterLink>
              </li>
            ))}
            <li>
              <FooterLink href={`mailto:${contact.email}`} icon={<MailIcon className="size-5" aria-hidden="true" />}>
                Email
              </FooterLink>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar. */}
      <div className="border-t border-white/10">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 text-sm text-white/60 sm:px-8">
          <p>&copy; {year} St. John&rsquo;s Hacks</p>
        </div>
      </div>
    </footer>
  )
}

// The year for the copyright. With Cache Components on, the page is
// prerendered, and Next won't read the clock during that unless the value is
// marked as fine to cache, so it's cached here and refreshed as the page is.
async function currentYear() {
  "use cache"
  return new Date().getFullYear()
}

// Johnny Thunderbird's head in 0s and 1s, traced from the St. John's
// Thunderbird logo's silhouette: the hooked beak open on his mouth, the
// feathers swept back off his head, and gaps for his eye and the two white
// lightning streaks.
const JOHNNY_BINARY = [
  "                                                      0100110111111001101011",
  "                                           01111111001000001111001100100011100000011010",
  "                                   1111111010100011010000101001011111100000101010100100011101",
  "                              011100010111000101101111100110001101101000111110100111000011111",
  "                         01001010010011111101111000000110001001011000011011001000",
  "                  11010000000011101     1111000011111111001100011111001011111",
  "                 0111010001011              01100100001100110010111001111",
  "                111100101                            0011101010111011101111101",
  "               001100011100001000000010                   111101111111001101000000001000",
  "               1101001101010 00110110000       111011111101010111011000011111101001110001",
  "               100111        1011110           0001110000000001000100000011110110111",
  "        11010001111         011011110             0111110111110110011101111000",
  "     0011100100000011      1011101110100010           010001011011110001001",
  "   11100110001110111101001001     011000101100101         10001001011111101",
  "  000001000100111100101011100        111011111100011110       0110110111111010",
  " 100000000001100110000010111001                  000000011010    011111000000001",
  "1011011111000000111111001111010               101010000010011111110100000011000111",
  "1111100011111101001100000110101100010          010110101011010101111001101001100000",
  "111101100011100        1110101100001111110        1111111011000100111011010000011100",
  "01001010010            1001001111011010001001111      11110111111101010",
  " 0100000              11100001111110111010100001110110  11000000001",
  "  1100                10101100001010101101001010000100000101001111100",
  "                   0011011101110011111010111011011100110011011010001",
  "                110100111010100111010111110011001101110110111000",
  "            0110100001000001001111000011100100110010011101110",
  "           010100001101000010000001101111011011011001111",
  "             1000000111101110011101001010000101101",
  "                  00100000011100010001101",
]

/** A contact link: an icon in a round badge, then the platform's name. */
function FooterLink({
  href,
  icon,
  external = false,
  children,
}: {
  href: string
  icon: ReactNode
  external?: boolean
  children: ReactNode
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="group flex items-center gap-3 rounded-md text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 transition-colors group-hover:bg-primary">
        {icon}
      </span>
      <span className="font-semibold">{children}</span>
      {external && <span className="sr-only">(opens in a new tab)</span>}
    </a>
  )
}

/** The Instagram, LinkedIn and Discord marks, simplified, in white. */
function SocialIcon({ name }: { name: "Instagram" | "LinkedIn" | "Discord" }) {
  if (name === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <rect x={3} y={3} width={18} height={18} rx={5} />
        <circle cx={12} cy={12} r={4} />
        <circle cx={17.5} cy={6.5} r={1} fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (name === "LinkedIn") {
    return (
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
        <circle cx={5} cy={5} r={2.1} />
        <rect x={3.1} y={8.6} width={3.8} height={12.4} rx={0.6} />
        <path d="M9.5 8.6h3.6v1.8c.6-1.1 2-2.1 4-2.1 3.3 0 4.4 2 4.4 5.3V21h-3.8v-6.6c0-1.6-.4-2.7-1.9-2.7-1.6 0-2.4 1.2-2.4 2.7V21H9.5Z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <path d="M19.3 5.4A16.6 16.6 0 0 0 15.2 4l-.5 1a15.4 15.4 0 0 0-5.4 0l-.5-1a16.6 16.6 0 0 0-4.1 1.4C2.1 9.3 1.4 13.1 1.7 16.8a16.7 16.7 0 0 0 5 2.6l1.1-1.7a10.7 10.7 0 0 1-1.7-.8l.4-.3a11.9 11.9 0 0 0 11 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.7a16.6 16.6 0 0 0 5-2.6c.4-4.3-.7-8-2.8-11.4ZM8.7 14.6c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
    </svg>
  )
}
