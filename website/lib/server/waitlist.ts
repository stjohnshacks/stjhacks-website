import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { Resend } from "resend"

import { contact, event, location, siteUrl } from "@/lib/content"

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
        subject: "You're on the St. John's Hacks waitlist ⚡",
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

// Date and venue come from lib/content.ts, so the email always matches the site.
const confirmationText = (name: string) => `RED STORM ALERT

Hi ${name}, you're on the St. John's Hacks waitlist.

A Red Storm is brewing over NYC. Registration isn't open yet. When it opens, we'll email you first so you can grab your spot.

When: ${event.date}
Where: ${location.place}, ${location.campus}
${location.address}

${siteUrl}

See you there,
The St. John's Hacks team
${contact.email}`

// The email, styled like the site: the navy night, St. John's red, condensed
// all-caps headings, a RED STORM ALERT band like the past events' crawl, and
// white-outlined fact boxes like the wing's. Email apps only handle simple
// HTML, so it's tables and inline styles, with fallbacks for the fonts.
const NAVY = "#050a1a"
const PANEL = "#0b1430"
const RED = "#cf102d"
const CREAM = "#f3eee4"
const DISPLAY = "Anton, Impact, 'Arial Narrow Bold', 'Arial Black', sans-serif"
const TEXT = "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif"
const BOLT = '<span style="font-family:Arial,sans-serif;">&#991;</span>' // ϟ

const confirmationHtml = (name: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <link href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
    <title>You're on the St. John's Hacks waitlist</title>
  </head>
  <body style="margin:0;padding:0;background:${NAVY};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">You're on the list. We'll email you first when registration opens for ${escapeHtml(event.date)}.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${NAVY};">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
            <tr>
              <td style="background:${RED};padding:10px 16px;font-family:${DISPLAY};font-size:15px;letter-spacing:2px;color:#ffffff;text-transform:uppercase;text-align:center;">
                ${BOLT}&nbsp; Red Storm Alert &nbsp;${BOLT}&nbsp; Red Storm Alert &nbsp;${BOLT}
              </td>
            </tr>
            <tr>
              <td style="background:${PANEL};padding:36px 28px 32px;border-left:1px solid #1d2742;border-right:1px solid #1d2742;border-bottom:1px solid #1d2742;">
                <p style="margin:0;font-family:${DISPLAY};font-size:52px;line-height:0.95;letter-spacing:-0.5px;color:${RED};text-transform:uppercase;">St. John&rsquo;s<br>Hacks</p>
                <p style="margin:16px 0 0;font-family:${TEXT};font-size:14px;line-height:1.5;font-weight:700;letter-spacing:0.5px;color:#ffffff;text-transform:uppercase;">A Red Storm is brewing over NYC.</p>

                <p style="margin:32px 0 0;font-family:${DISPLAY};font-size:30px;line-height:1.1;color:#ffffff;text-transform:uppercase;">You&rsquo;re on the list, ${escapeHtml(name)}.</p>
                <p style="margin:12px 0 0;font-family:${TEXT};font-size:16px;line-height:1.6;color:${CREAM};">Registration isn&rsquo;t open yet. When it opens, you&rsquo;ll be the first to know, so you can grab your spot for 36 hours of building something real.</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
                  <tr>
                    <td valign="top" style="padding-bottom:10px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px solid #ffffff;border-radius:8px;">
                        <tr><td style="padding:12px 14px;">
                          <p style="margin:0;font-family:${TEXT};font-size:11px;font-weight:700;letter-spacing:2px;color:${RED};text-transform:uppercase;">When</p>
                          <p style="margin:4px 0 0;font-family:${DISPLAY};font-size:20px;line-height:1.15;color:#ffffff;text-transform:uppercase;">${escapeHtml(event.date)}</p>
                        </td></tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td valign="top">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px solid #ffffff;border-radius:8px;">
                        <tr><td style="padding:12px 14px;">
                          <p style="margin:0;font-family:${TEXT};font-size:11px;font-weight:700;letter-spacing:2px;color:${RED};text-transform:uppercase;">Where</p>
                          <p style="margin:4px 0 0;font-family:${DISPLAY};font-size:20px;line-height:1.15;color:#ffffff;text-transform:uppercase;">${escapeHtml(location.place)}</p>
                          <p style="margin:2px 0 0;font-family:${TEXT};font-size:13px;line-height:1.4;color:${CREAM};">${escapeHtml(location.campus)} &middot; ${escapeHtml(location.address)}</p>
                        </td></tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
                  <tr>
                    <td style="background:${RED};border-radius:999px;">
                      <a href="${escapeHtml(siteUrl)}" style="display:inline-block;padding:13px 26px;font-family:${TEXT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Visit the site &rarr;</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:32px 0 0;font-family:${TEXT};font-size:16px;line-height:1.6;color:${CREAM};">See you there,<br><strong style="color:#ffffff;">The St. John&rsquo;s Hacks team</strong></p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 4px 0;font-family:${TEXT};font-size:12px;line-height:1.6;color:#8d8a86;">
                <span style="color:${RED};font-size:14px;">${BOLT}</span>&nbsp;
                You got this because you joined the waitlist at <a href="${escapeHtml(siteUrl)}" style="color:${CREAM};">St. John&rsquo;s Hacks</a>. Questions? Email <a href="mailto:${escapeHtml(contact.email)}" style="color:${CREAM};">${escapeHtml(contact.email)}</a>.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
