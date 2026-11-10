// Shared by the waitlist form (client) and the server action.

export type WaitlistField = "name" | "email"

export type WaitlistState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error"
      message: string
      /** The field to flag as invalid, if the error is about one field. */
      field?: WaitlistField
      name: string
      email: string
    }

export const initialWaitlistState: WaitlistState = { status: "idle" }

// Matches the check constraints on public.waitlist.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
export const MAX_EMAIL_LENGTH = 254
export const MAX_NAME_LENGTH = 100

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null
  const email = value.trim().toLowerCase()
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) return null
  return email
}

/** Trims the name and collapses inner runs of whitespace. */
export function normalizeName(value: unknown): string | null {
  if (typeof value !== "string") return null
  const name = value.trim().replace(/\s+/g, " ")
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) return null
  return name
}
