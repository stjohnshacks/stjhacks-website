"use client"

import { Dialog } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"
import { useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { registerHref } from "@/lib/content"
import { cn } from "@/lib/utils"

// Sign in opens a form with email and password. It's a placeholder: nothing
// is sent anywhere yet. Wire it up here when the application portal exists.
export function SignInButton({ className }: { className?: string }) {
  const [submitted, setSubmitted] = useState(false)

  return (
    <Dialog.Root onOpenChange={(open) => !open && setSubmitted(false)}>
      <Dialog.Trigger render={<Button type="button" variant="ghost" size="lg" className={className} />}>
        Sign in
      </Dialog.Trigger>
      <Popup title="Sign in" description="Sign in to your St. John’s Hacks account.">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setSubmitted(true)
          }}
          className="mt-6 flex flex-col gap-4"
        >
          <Field id="signin-email" label="Email">
            <Input
              id="signin-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@school.edu"
              required
              className={inputClass}
            />
          </Field>
          <Field id="signin-password" label="Password">
            <Input
              id="signin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className={inputClass}
            />
          </Field>
          <Button type="submit" size="lg" className="mt-2 h-12 rounded-full text-base">
            Sign in
          </Button>
          <p aria-live="polite" className={cn("min-h-5 text-center text-sm text-white/70", !submitted && "invisible")}>
            Sign in isn&rsquo;t open yet. Check back soon!
          </p>
        </form>
      </Popup>
    </Dialog.Root>
  )
}

// Registration isn't open yet: Register explains that and points people to
// the waitlist form in the hero. `onNavigate` lets a parent (the mobile menu)
// close itself on the way there.
export function RegisterButton({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<Button type="button" size="lg" className={className} />}>Register</Dialog.Trigger>
      <Popup
        title="Registration isn’t open yet"
        // Smaller, so the whole title fits on one line, phones included.
        titleClassName="text-[min(1.6rem,5.8vw)] whitespace-nowrap"
        description="We’re still putting the finishing touches on St. John’s Hacks. Join the waitlist and you’ll be the first to know when registration opens, plus get every update on the way."
      >
        <Dialog.Close
          nativeButton={false}
          onClick={onNavigate}
          render={<Button nativeButton={false} size="lg" render={<a href={registerHref} />} className="mt-6 h-12 w-full rounded-full text-base" />}
        >
          Join the waitlist
        </Dialog.Close>
        <p className="mt-3 text-center text-sm text-white/60">
          You&rsquo;ll find it at the top of the home page.
        </p>
      </Popup>
    </Dialog.Root>
  )
}

/** The pop-up shared by Sign in and Register: navy, a thin white outline, a close button. */
function Popup({
  title,
  titleClassName,
  description,
  children,
}: {
  title: string
  titleClassName?: string
  description: string
  children: ReactNode
}) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(calc(100vw-2rem),26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-background p-6 text-white shadow-2xl transition duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-8">
        <Dialog.Close
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3 rounded-full text-white hover:bg-white/10 hover:text-white"
            />
          }
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </Dialog.Close>
        <Dialog.Title className={cn("pr-8 font-display text-4xl leading-none tracking-tight uppercase", titleClassName)}>
          {title}
        </Dialog.Title>
        <Dialog.Description className="mt-3 text-sm leading-relaxed text-white/75">{description}</Dialog.Description>
        {children}
      </Dialog.Popup>
    </Dialog.Portal>
  )
}

const inputClass =
  "h-12 rounded-full border-white/20 bg-white/5 px-5 text-base placeholder:text-white/40 md:text-base"

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
    </div>
  )
}
