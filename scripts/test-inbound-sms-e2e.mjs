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
const fnPath = process.env.INBOUND_SMS_FUNCTION_PATH || '/functions/v1/inbound-sms'

function fail(m) {
  console.error(`\n❌ ${m}\n`)
  process.exit(1)
}

async function main() {
  if (!url || !anon) fail('Set SUPABASE_URL/VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  const db = createClient(url, anon)

  const { data: fac, error: facErr } = await db
    .from('facilities')
    .select('id, name')
    .limit(1)
    .maybeSingle()
  if (facErr) fail(facErr.message)
  if (!fac?.id) fail('No facilities found')

  const endpoint = `${url.replace(/\/$/, '')}${fnPath}`
  const phone = '+233241239999'
  const text = `F${fac.id}#E2E#overflow`

  const { data: before } = await db
    .from('reports')
    .select('id')
    .eq('facility_id', fac.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anon}`,
    },
    body: JSON.stringify({ from: phone, text }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.success) fail(`Inbound function failed: HTTP ${res.status} ${JSON.stringify(json)}`)

  const { data: latest, error: rowErr } = await db
    .from('reports')
    .select('id, condition, notes')
    .eq('facility_id', fac.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (rowErr) fail(rowErr.message)
  if (!latest || latest.id === before?.id) fail('No new report row inserted')
  if (latest.condition !== 'overflow') fail(`Expected overflow, got ${latest.condition}`)

  console.log('✅ Inbound SMS report inserted')
  console.log(`   Facility: ${fac.name}`)
  console.log(`   Report ID: ${latest.id}`)
}

main().catch((e) => fail(e.message || String(e)))
