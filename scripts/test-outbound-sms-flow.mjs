#!/usr/bin/env node
/**
 * Manual test: risk scoring → DB alerts/tasks → outbound SMS (assigned worker first).
 *
 * Loads `.env` / `.env.local` from the project root (via dotenv) if present.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Run (easiest):
 *   npm run test:outbound-sms
 *
 * Bash/macOS/Linux:
 *   export SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
 *   node scripts/test-outbound-sms-flow.mjs
 *
 * Windows PowerShell (note: use $env:, not VAR=value):
 *   $env:SUPABASE_URL = "https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "eyJ..."
 *   node scripts/test-outbound-sms-flow.mjs
 *
 * One line PowerShell:
 *   $env:SUPABASE_URL="https://..."; $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."; node scripts/test-outbound-sms-flow.mjs
 */

import dotenv from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: resolve(root, '.env') })
dotenv.config({ path: resolve(root, '.env.local') })

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Add them to .env in the project root, or set $env vars (PowerShell) / export (bash), then run:\n' +
      '  npm run test:outbound-sms',
  )
  process.exit(1)
}

async function postJson(path, body) {
  const res = await fetch(`${url}/functions/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  return { ok: res.ok, status: res.status, data }
}

async function main() {
  console.log('Step 1: score-risk (all facilities, chain SMS in test mode)\n')
  const risk = await postJson('score-risk', {
    send_sms_alerts: true,
    sms_test_mode: true,
  })
  console.log('HTTP', risk.status)
  console.log(JSON.stringify(risk.data, null, 2))

  const follow = risk.data?.sms_followup
  if (follow?.summary) {
    console.log('\nSMS follow-up summary:', follow.summary)
  }
  if (follow?.results?.length) {
    console.log('\nPer-alert results (recipients include assigned worker when task exists):')
    for (const r of follow.results) {
      console.log(
        ` - ${r.facility_name}: success=${r.success} recipients=${r.recipients} error=${r.error ?? ''}`,
      )
    }
  }

  console.log('\nStep 2 (optional): send-sms-alert alone for critical in last 24h, test mode\n')
  const smsOnly = await postJson('send-sms-alert', {
    severity_filter: ['critical', 'high'],
    test_mode: true,
  })
  console.log('HTTP', smsOnly.status)
  console.log(JSON.stringify(smsOnly.data, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
