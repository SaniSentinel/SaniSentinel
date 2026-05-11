# Task Start Notifications (SMS + Email)

When a maintenance task is moved to **In Progress** from the UI, SaniSentinel now sends:
- SMS via Africa's Talking to the assigned worker phone
- Email to the assigned worker email (if provided)

## What changed

- `src/lib/maintenance.js`
  - `maintenance.start(taskId)` now:
    1. Reads current task status
    2. Updates status to `in_progress`
    3. Invokes edge function `notify-task-started` only when status actually transitioned and task has `assigned_to`

- `src/pages/ProfessionalMaintenance.jsx`
  - Start action uses `maintenance.start(taskId)` (instead of plain status update).

- New edge function:
  - `supabase/functions/notify-task-started/index.ts`
  - Sends SMS + email and logs SMS outcome to `sms_gateway_logs`.

## Required secrets in Supabase

Set these in **Supabase Dashboard > Edge Functions > Secrets**:

- `AFRICAS_TALKING_API_KEY` (required for SMS)
- `AFRICAS_TALKING_USERNAME` (use `sandbox` for simulator)
- `RESEND_API_KEY` (required for email delivery)
- `TASK_NOTIFICATION_FROM_EMAIL` (optional; default `SaniSentinel <onboarding@resend.dev>`)

Also already required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deploy

```bash
npm run deploy:notify-task-started
```

or deploy all telecom functions:

```bash
npm run deploy:telecom
```

## Behavior notes

- If worker has no email, SMS is still sent and email is skipped.
- If SMS fails, the failure is logged in `sms_gateway_logs`.
- If notification fails after status update, UI shows:
  - `Task started, but notification failed: ...`
  - task remains in `in_progress` so work state is not lost.
