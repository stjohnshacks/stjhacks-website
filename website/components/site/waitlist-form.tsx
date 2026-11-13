"use client"

import { useActionState } from "react"

import { joinWaitlist } from "@/app/actions/waitlist"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { initialWaitlistState, MAX_EMAIL_LENGTH, MAX_NAME_LENGTH } from "@/lib/waitlist"

export function WaitlistForm({ className }: { className?: string }) {
  const [state, formAction, pending] = useActionState(joinWaitlist, initialWaitlistState)
  const error = state.status === "error" ? state : null

  return (
    <div id="waitlist" className={cn("w-full", className)}>
      {state.status === "success" ? (
        <p role="status" className="text-lg font-semibold text-signal">
          {state.message}
        </p>
      ) : (
        <form action={formAction}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="waitlist-name" className="sr-only">
              Name
            </label>
            <Input
              id="waitlist-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Name"
              required
              maxLength={MAX_NAME_LENGTH}
              defaultValue={error?.name ?? ""}
              aria-invalid={error?.field === "name" || undefined}
              aria-describedby="waitlist-error"
              className="h-12 rounded-full border-white/20 bg-white/5 px-5 text-base backdrop-blur-md placeholder:text-foreground/55 sm:w-36 sm:flex-none md:text-base"
            />
            <label htmlFor="waitlist-email" className="sr-only">
              Email address
            </label>
            <Input
              id="waitlist-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              required
              maxLength={MAX_EMAIL_LENGTH}
              defaultValue={error?.email ?? ""}
              aria-invalid={error?.field === "email" || undefined}
              aria-describedby="waitlist-error"
              className="h-12 rounded-full border-white/20 bg-white/5 px-5 text-base backdrop-blur-md placeholder:text-foreground/55 md:text-base"
            />
            {/* Spam trap, hidden from people and screen readers. */}
            <div aria-hidden="true" className="absolute -left-[9999px]">
              <input type="text" name="company" tabIndex={-1} autoComplete="off" />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="h-12 rounded-full px-6 text-base"
            >
              {pending ? "Joining…" : "Join the waitlist"}
            </Button>
          </div>
          <p id="waitlist-error" aria-live="polite" className="mt-2 min-h-5 text-sm text-destructive">
            {error?.message}
          </p>
        </form>
      )}
    </div>
  )
}
