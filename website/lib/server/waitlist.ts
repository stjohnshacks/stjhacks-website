import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { Resend } from "resend"

// The only module that reads waitlist secrets or talks to Supabase and Resend.

const UNIQUE_VIOLATION = "23505"

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set.")
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

/** Adds a sign-up (already normalized) to the waitlist and sends the confirmation. */
export async function addToWaitlist({
  name,
  email,
}: {
  name: string
  email: string
}): Promise<"added" | "already_joined"> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("waitlist")
    .insert({ name, email })
    .select("id")
    .single()

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return "already_joined"
    throw new Error(`Waitlist insert failed: ${error.message}`)
  }

  await sendConfirmation(supabase, data.id, name, email)
  return "added"
}

// Never throws: a failed email must not lose the sign-up. Rows where
// confirmation_sent_at is null still need an email.
async function sendConfirmation(
  supabase: SupabaseClient,
  id: string,
  name: string,
  email: string,
) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.WAITLIST_FROM_EMAIL
  if (!apiKey || !from) {
    console.warn("Waitlist: RESEND_API_KEY or WAITLIST_FROM_EMAIL not set, skipping confirmation email.")
    return
  }

  try {
    const { error } = await new Resend(apiKey).emails.send(
      {
        from,
        to: email,
        subject: "You're on the St. John's Hacks waitlist",
        text: confirmationText(name),
        html: confirmationHtml(name),
      },
      { idempotencyKey: `waitlist-confirmation/${id}` },
    )
    if (error) {
      console.error("Waitlist: confirmation email failed:", error.message)
      return
    }

    const { error: updateError } = await supabase
      .from("waitlist")
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq("id", id)
    if (updateError) {
      console.error("Waitlist: couldn't record confirmation_sent_at:", updateError.message)
    }
  } catch (err) {
    console.error("Waitlist: confirmation email failed:", err)
  }
}

// Names are user input, so escape them before putting them in HTML.
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const confirmationText = (name: string) => `Hi ${name},

You're on the St. John's Hacks waitlist.

Registration isn't open yet. We'll email you as soon as it is, along with the date and venue.

St. John's Hacks`

const confirmationHtml = (name: string) => `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f1ecdf;font-family:Inter,Arial,sans-serif;color:#2e1a16;">
    <div style="max-width:480px;margin:0 auto;">
      <p style="margin:0 0 24px;font-size:28px;font-weight:800;letter-spacing:-0.03em;color:#cf102d;">St. John&rsquo;s Hacks</p>
      <p style="margin:0 0 16px;font-size:18px;font-weight:600;">Hi ${escapeHtml(name)}, you&rsquo;re on the waitlist.</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Registration isn&rsquo;t open yet. We&rsquo;ll email you as soon as it is, along with the date and venue.</p>
    </div>
  </body>
</html>`
