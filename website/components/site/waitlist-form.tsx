"use client"

import { useActionState } from "react"

import { joinWaitlist } from "@/app/actions/waitlist"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { initialWaitlistState, MAX_EMAIL_LENGTH, MAX_NAME_LENGTH } from "@/lib/waitlist"

export function WaitlistForm() {
  const [state, formAction, pending] = useActionState(joinWaitlist, initialWaitlistState)
  const error = state.status === "error" ? state : null

  return (
    <div id="waitlist" className="mx-auto mt-8 w-full max-w-xl text-center">
      {state.status === "success" ? (
        <p role="status" className="text-lg font-semibold text-primary">
          {state.message}
        </p>
      ) : (
        <form action={formAction}>
          <p className="text-lg text-balance">
            Registration opens soon. Join the waitlist and we&rsquo;ll email you when it does.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
              className="h-11 bg-card px-3 text-base sm:w-40 sm:flex-none md:text-base"
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
              className="h-11 bg-card px-3 text-base md:text-base"
            />
            {/* Spam trap, hidden from people and screen readers. */}
            <div aria-hidden="true" className="absolute -left-[9999px]">
              <input type="text" name="company" tabIndex={-1} autoComplete="off" />
            </div>
            <Button type="submit" size="lg" disabled={pending} className="h-11 px-5 text-base">
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
