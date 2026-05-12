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

if (!url || !anon || !serviceKey) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const tabA = createClient(url, anon)
const tabB = createClient(url, anon)
const svc = createClient(url, serviceKey)

function fail(msg) {
  console.error(`\n❌ ${msg}\n`)
  process.exit(1)
}

function waitForEvent(registerFn, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for realtime event')), timeoutMs)
    registerFn((payload) => {
      clearTimeout(timer)
      resolve(payload)
    })
  })
}

async function main() {
  const { data: fac, error: facErr } = await svc
    .from('facilities')
    .select('id, name')
    .limit(1)
    .maybeSingle()
  if (facErr || !fac?.id) fail(`No facility found: ${facErr?.message || 'unknown'}`)

  await svc.from('facilities').update({ status: 'good' }).eq('id', fac.id)

  const reportPromise = waitForEvent((done) => {
    tabB
      .channel(`e2e-reports-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, (p) => done(p))
      .subscribe()
  })
  const alertPromise = waitForEvent((done) => {
    tabB
      .channel(`e2e-alerts-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (p) => done(p))
      .subscribe()
  })

  const { error: insErr } = await tabA.from('reports').insert({
    facility_id: fac.id,
    reported_by: '+233241237777',
    condition: 'overflow',
    notes: `Realtime e2e ${new Date().toISOString()}`,
  })
  if (insErr) fail(`Report insert failed: ${insErr.message}`)

  await reportPromise
  await alertPromise

  console.log('✅ Realtime verified across two clients ("tabs")')
  console.log(`   Facility: ${fac.name}`)
}

main().catch((e) => fail(e.message || String(e)))
