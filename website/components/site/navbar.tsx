import Link from "next/link"

import { RegisterButton, SignInButton } from "@/components/site/auth-buttons"
import { MobileMenu } from "@/components/site/mobile-menu"
import { NavShell } from "@/components/site/nav-shell"
import { navLinks } from "@/lib/content"

// A bar across the full width of the page: the logo, links and buttons. It's
// clear over the hero and turns dark and blurred once you scroll (NavShell).
export function Navbar() {
  return (
    <NavShell>
      <div className="flex h-16 items-center justify-between gap-6 px-4 sm:px-8">
        <Link
          href="/"
          aria-label="St. John's Hacks home"
          className="rounded-full text-base font-bold text-white uppercase outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
        >
          STJ HACKS
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full text-sm font-medium text-white/85 outline-none hover:text-white focus-visible:ring-3 focus-visible:ring-ring/60"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-1 lg:flex">
          <SignInButton className="rounded-full text-white hover:bg-white/10 hover:text-white" />
          <RegisterButton className="rounded-full" />
        </div>
        <MobileMenu />
      </div>
    </NavShell>
  )
}
