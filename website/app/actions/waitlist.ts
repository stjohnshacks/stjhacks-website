"use server"

import { addToWaitlist } from "@/lib/server/waitlist"
import { normalizeEmail, normalizeName, type WaitlistState } from "@/lib/waitlist"

const SUCCESS_MESSAGE = "You're on the list. We'll email you when registration opens."

export async function joinWaitlist(
  _previous: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  // Hidden spam-trap field: people never fill it in, simple bots do.
  // Pretend it worked so the bot learns nothing.
  if (formData.get("company")) {
    return { status: "success", message: SUCCESS_MESSAGE }
  }

  const rawName = formData.get("name")
  const rawEmail = formData.get("email")
  const entered = {
    name: typeof rawName === "string" ? rawName : "",
    email: typeof rawEmail === "string" ? rawEmail : "",
  }

  const name = normalizeName(rawName)
  if (!name) {
    return { status: "error", field: "name", message: "Enter your name.", ...entered }
  }

  const email = normalizeEmail(rawEmail)
  if (!email) {
    return {
      status: "error",
      field: "email",
      message: "Enter a valid email address, like name@example.com.",
      ...entered,
    }
  }

  try {
    // Repeat sign-ups get the same message, so the form doesn't reveal
    // who is already on the list.
    await addToWaitlist({ name, email })
    return { status: "success", message: SUCCESS_MESSAGE }
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "The waitlist isn't accepting sign-ups right now. Try again in a few minutes.",
      name,
      email,
    }
  }
}
