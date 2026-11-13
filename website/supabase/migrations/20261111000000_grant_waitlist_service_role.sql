-- The server talks to Supabase with the secret key, which acts as service_role.
-- Newer Supabase projects don't grant API roles access to new tables
-- automatically, so without this every insert fails with
-- "permission denied for table waitlist".
-- insert: new sign-ups. select: return the new row's id.
-- update: record confirmation_sent_at.
grant select, insert, update on table public.waitlist to service_role;
