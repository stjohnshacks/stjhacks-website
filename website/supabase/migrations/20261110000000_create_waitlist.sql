-- Waitlist sign-ups from the home page.
-- Only the server writes to this table, using the secret key, which bypasses
-- row-level security. RLS is on with no policies, so the public (anon) key can
-- neither read nor write it.

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  -- Set once Resend accepts the confirmation email. Null means it still needs sending.
  confirmation_sent_at timestamptz,

  constraint waitlist_email_key unique (email),
  -- The server lowercases emails before inserting, so duplicates can't differ by case.
  constraint waitlist_email_lowercase check (email = lower(email)),
  constraint waitlist_email_format check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint waitlist_email_length check (char_length(email) <= 254)
);

comment on table public.waitlist is 'Email waitlist for St. John''s Hacks registration.';

alter table public.waitlist enable row level security;

-- Defense in depth: remove the default grants for the public roles.
revoke all on table public.waitlist from anon, authenticated;
