/**
 * End-to-end: POST an inbound-style SMS to the Edge Function, then verify a row in `reports`.
 *
 * Requires .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 * Optional: INBOUND_SMS_FUNCTION_PATH (default /functions/v1/inbound-sms)
 *
 * Uses JSON body (same parser as Africa's Talking after form decode).
 *
 * Run: npm run test:inbound-sms
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const url = process.env.VITE_SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY
const fnPath = process.env.INBOUND_SMS_FUNCTION_PATH || '/functions/v1/inbound-sms'

function fail(m) {
  console.error('\n❌', m, '\n')
  process.exit(1)
}

async function main() {
  if (!url || !anon) fail('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')

  const rest = createClient(url, anon)

  const { data: fac, error: fErr } = await rest
    .from('facilities')
    .select('id, name')
    .limit(1)
    .maybeSingle()

  if (fErr) fail(`facilities query: ${fErr.message}`)
  if (!fac?.id) fail('No facility row found — seed facilities first.')

  const bodyText = `F${fac.id}#E2E#good`
  const phone = '+233241234599'
  const endpoint = `${url.replace(/\/$/, '')}${fnPath}`

  console.log('ℹ️  Facility:', fac.name, fac.id)
  console.log('ℹ️  POST', endpoint)
  console.log('ℹ️  Body:', bodyText)

  const { data: beforeRow } = await rest
    .from('reports')
    .select('id')
    .eq('facility_id', fac.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anon}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: bodyText, from: phone })
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    console.error(json)
    if (res.status === 404) {
      fail(
        `Edge function HTTP 404 — deploy with: supabase functions deploy inbound-sms (or set INBOUND_SMS_FUNCTION_PATH to a running URL).`
      )
    }
    fail(`Edge function HTTP ${res.status}`)
  }

  if (!json.success) {
    console.error(json)
    fail('Edge function returned success=false')
  }

  const { data: row, error: rErr } = await rest
    .from('reports')
    .select('id, condition, notes, reported_by, created_at')
    .eq('facility_id', fac.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (rErr) fail(`reports query: ${rErr.message}`)
  if (!row) fail('Could not re-query reports')

  if (beforeRow?.id === row.id) {
    fail('No new report row detected (same latest id as before).')
  }

  if (row.condition !== 'good') fail(`Expected condition good, got ${row.condition}`)
  if (!String(row.notes || '').includes('E2E')) fail('Notes should mention block E2E')

  console.log('✅ Report inserted:', row.id)
  console.log('✅ Condition:', row.condition)
  console.log('✅ Parser + DB path verified.\n')
}

main().catch((e) => {
  console.error(e)
  fail(e.message)
})
