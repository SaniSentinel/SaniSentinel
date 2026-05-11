#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const db = createClient(url, serviceKey)

function fail(m) {
  console.error(`\n❌ ${m}\n`)
  process.exit(1)
}

async function callFn(name, body) {
  const res = await fetch(`${url}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
    body: JSON.stringify(body),
  })
  const txt = await res.text()
  let data
  try { data = JSON.parse(txt) } catch { data = txt }
  return { ok: res.ok, status: res.status, data }
}

async function main() {
  const { data: district, error: dErr } = await db
    .from('districts')
    .select('id, name')
    .limit(1)
    .maybeSingle()
  if (dErr || !district?.id) fail(`No district found: ${dErr?.message || 'unknown'}`)

  // Deterministic setup so flood event can push to critical.
  await db
    .from('facilities')
    .update({ status: 'damaged', last_serviced: '2023-01-01' })
    .eq('district_id', district.id)

  const { error: cErr } = await db.from('climate_snapshots').insert({
    district_id: district.id,
    flood_risk_score: 100,
    rainfall_mm: 140,
    temperature_celsius: 25,
    humidity_percent: 95,
    wind_speed_kmh: 60,
    weather_condition: 'stormy',
    recorded_at: new Date().toISOString(),
  })
  if (cErr) fail(`Climate insert failed: ${cErr.message}`)

  const run = await callFn('score-risk', { send_sms_alerts: true, sms_test_mode: true })
  if (!run.ok || run.data?.success === false) fail(`score-risk failed: ${JSON.stringify(run.data)}`)

  const criticalCount = Number(run.data?.summary?.risk_distribution?.critical || 0)
  if (criticalCount <= 0) fail('No critical facilities after flood simulation')

  const { data: alerts } = await db
    .from('alerts')
    .select('id')
    .eq('severity', 'critical')
    .eq('resolved', false)
    .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .limit(20)
  if (!alerts?.length) fail('No critical alerts found after flood simulation')

  const { data: smsLogs } = await db
    .from('sms_gateway_logs')
    .select('id')
    .eq('direction', 'outbound')
    .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .limit(20)
  if (!smsLogs?.length) fail('No outbound SMS logs found after flood simulation')

  console.log('✅ Flood-event E2E verified')
  console.log(`   District: ${district.name}`)
  console.log(`   Critical facilities: ${criticalCount}`)
  console.log(`   New critical alerts: ${alerts.length}`)
}

main().catch((e) => fail(e.message || String(e)))
