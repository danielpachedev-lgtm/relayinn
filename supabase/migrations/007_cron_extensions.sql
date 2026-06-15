-- Extensions required for hourly automation cron (pg_cron + pg_net)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Cron job `run-automations-hourly` (0 * * * *) is configured on the hosted
-- project to POST https://<project-ref>.supabase.co/functions/v1/run-automations
-- See supabase/functions/run-automations/README.md for setup / re-schedule steps.
