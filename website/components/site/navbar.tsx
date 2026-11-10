import Link from "next/link"

import { RegisterButton, SignInButton } from "@/components/site/auth-buttons"
import { MobileMenu } from "@/components/site/mobile-menu"
import { navLinks } from "@/lib/content"

// A red pill that floats over the page. The header itself is transparent and
// ignores clicks, so only the pill blocks the content scrolling beneath it.
export function Navbar() {
  return (
    <header className="pointer-events-none sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="pointer-events-auto mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 rounded-full bg-primary pr-2 pl-6 text-primary-foreground shadow-lg shadow-primary/25">
        <Link
          href="/"
          className="rounded-full text-lg font-extrabold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-primary-foreground/60"
        >
          St. John&rsquo;s Hacks
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full text-sm font-medium text-primary-foreground/85 outline-none hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-primary-foreground/60"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-1 lg:flex">
          <SignInButton className="rounded-full text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" />
          <RegisterButton className="rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90" />
        </div>
        <MobileMenu />
      </div>
    </header>
  )
}
