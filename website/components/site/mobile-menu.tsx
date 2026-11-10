"use client"

import { MenuIcon } from "lucide-react"

import { RegisterButton, SignInButton } from "@/components/site/auth-buttons"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { navLinks } from "@/lib/content"

export function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="rounded-full text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground lg:hidden"
            aria-label="Open menu"
          />
        }
      >
        <MenuIcon className="size-5" />
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col px-4">
          {navLinks.map((link) => (
            <SheetClose
              key={link.href}
              nativeButton={false}
              render={
                <a
                  href={link.href}
                  className="rounded-md py-3 text-lg font-semibold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              }
            >
              {link.label}
            </SheetClose>
          ))}
        </nav>
        <SheetFooter>
          {/* SheetClose so the menu closes on the way to the waitlist form. */}
          <SheetClose render={<RegisterButton className="w-full" />} nativeButton={false} />
          <SignInButton className="w-full" />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
