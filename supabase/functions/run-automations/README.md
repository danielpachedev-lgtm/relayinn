# run-automations Edge Function

Runs hourly and sends active automation messages to matching guests.

## Deploy

```bash
supabase functions deploy run-automations --no-verify-jwt
```

Or deploy via Supabase MCP / Dashboard.

## Schedule (hourly)

**Configured on RelayInn Supabase project (`vpeagsczoyizqevozrlb`):**

| Setting | Value |
|---------|--------|
| Job name | `run-automations-hourly` |
| Cron | `0 * * * *` (every hour, minute 0) |
| Method | `pg_cron` + `pg_net` HTTP POST |

### Re-create schedule manually

1. Enable extensions (Database → Extensions): `pg_cron`, `pg_net`
2. Run in SQL Editor (replace `YOUR_ANON_KEY`):

```sql
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'run-automations-hourly';

SELECT cron.schedule(
  'run-automations-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vpeagsczoyizqevozrlb.supabase.co/functions/v1/run-automations',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY',
      'apikey', 'YOUR_ANON_KEY'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### Alternative: Dashboard Schedules

Supabase Dashboard → Edge Functions → `run-automations` → Schedules → `0 * * * *`

## Manual test

```bash
curl -X POST 'https://vpeagsczoyizqevozrlb.supabase.co/functions/v1/run-automations' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Expected response: `{"sent":0,"skipped":0,"errors":[]}` (or higher counts if triggers match).

[functions.run-automations]
verify_jwt = false
