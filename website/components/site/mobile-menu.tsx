"use client"

import { MenuIcon } from "lucide-react"
import { useState } from "react"

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
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="rounded-full text-white hover:bg-white/10 hover:text-white lg:hidden"
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
                  className="rounded-md py-3 text-lg font-semibold text-foreground outline-none hover:text-signal focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              }
            >
              {link.label}
            </SheetClose>
          ))}
        </nav>
        <SheetFooter>
          {/* The menu closes when Register sends someone on to the waitlist. */}
          <RegisterButton className="w-full" onNavigate={() => setOpen(false)} />
          <SignInButton className="w-full" />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
