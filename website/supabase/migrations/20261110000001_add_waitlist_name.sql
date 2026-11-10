-- Name for each waitlist sign-up, used to greet people in emails.
-- Nullable so this applies cleanly to rows that signed up before the field
-- existed; the server requires it for every new sign-up.

alter table public.waitlist
  add column name text,
  -- The server trims names before inserting, so stored names have no outer spaces.
  add constraint waitlist_name_trimmed check (name = btrim(name) and name <> ''),
  add constraint waitlist_name_length check (char_length(name) <= 100);
