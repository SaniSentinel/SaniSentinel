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
const officerEmail = process.env.TEST_OFFICER_EMAIL || 'officer@tamale.gov'
const officerPassword = process.env.TEST_OFFICER_PASSWORD || 'Tamale2024!'

function fail(msg) {
  console.error(`\n❌ ${msg}\n`)
  process.exit(1)
}

async function main() {
  if (!url || !anon) fail('Missing SUPABASE_URL/VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  const client = createClient(url, anon)

  const { data: authData, error: authErr } = await client.auth.signInWithPassword({
    email: officerEmail,
    password: officerPassword,
  })
  if (authErr || !authData?.user) fail(authErr?.message || 'Officer sign in failed')

  const districtId = String(authData.user.user_metadata?.district_id || authData.user.app_metadata?.district_id || '')
  if (!districtId) fail('Officer has no district_id in metadata')

  const { data: rows, error: qErr } = await client.from('facilities').select('id, district_id').limit(1000)
  if (qErr) fail(qErr.message)

  const leaks = (rows || []).filter((r) => String(r.district_id) !== districtId)
  if (leaks.length > 0) fail(`RLS leak: officer can read ${leaks.length} out-of-district facilities`)

  console.log('✅ Officer facilities RLS check passed')
  console.log(`   Rows visible: ${(rows || []).length}`)
}

main().catch((e) => fail(e.message || String(e)))
