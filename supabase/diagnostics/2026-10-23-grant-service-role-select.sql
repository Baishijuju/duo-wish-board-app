-- The digest Worker reads this table as service_role.
-- Only authenticated had SELECT; service_role had REFERENCES/TRIGGER/TRUNCATE
-- but not SELECT, so server side reads failed with 42501 permission denied.
grant select on table public.wish_count_progress_daily to service_role;
