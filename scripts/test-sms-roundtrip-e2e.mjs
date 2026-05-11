#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const anonDb = url && anon ? createClient(url, anon) : null
const svcDb = url && serviceKey ? createClient(url, serviceKey) : null

function fail(msg) {
  console.error(`\n❌ ${msg}\n`)
  process.exit(1)
}

async function callFn(name, body, bearer) {
  const res = await fetch(`${url}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearer}` },
    body: JSON.stringify(body),
  })
  const txt = await res.text()
  let data
  try { data = JSON.parse(txt) } catch { data = txt }
  return { ok: res.ok, status: res.status, data }
}

async function main() {
  if (!anonDb || !svcDb) fail('Missing SUPABASE_URL/VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY')

  const { data: fac, error: facErr } = await svcDb
    .from('facilities')
    .select('id, name, district_id')
    .limit(1)
    .maybeSingle()
  if (facErr || !fac?.id) fail(`No facility found: ${facErr?.message || 'unknown'}`)

  const inbound = await callFn('inbound-sms', { from: '+233241238888', text: `F${fac.id}#E2E#overflow` }, anon)
  if (!inbound.ok || inbound.data?.success === false) fail(`inbound-sms failed: ${JSON.stringify(inbound.data)}`)

  const score = await callFn('score-risk', { facility_ids: [fac.id] }, serviceKey)
  if (!score.ok || score.data?.success === false) fail(`score-risk failed: ${JSON.stringify(score.data)}`)

  const sms = await callFn(
    'send-sms-alert',
    { facility_ids: [fac.id], severity_filter: ['critical', 'high'], test_mode: true },
    serviceKey,
  )
  if (!sms.ok || sms.data?.success === false) fail(`send-sms-alert failed: ${JSON.stringify(sms.data)}`)

  const { data: logs, error: logErr } = await svcDb
    .from('sms_gateway_logs')
    .select('id, status, direction, created_at')
    .eq('facility_id', fac.id)
    .eq('direction', 'outbound')
    .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(5)
  if (logErr) fail(logErr.message)
  if (!logs?.length) fail('No outbound SMS log rows found for facility')

  console.log('✅ Full SMS round trip verified')
  console.log(`   Facility: ${fac.name}`)
  console.log(`   Outbound logs: ${logs.length}`)
}

main().catch((e) => fail(e.message || String(e)))
