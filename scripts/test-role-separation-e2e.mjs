#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
dotenv.config({ path: path.join(root, '.env') })
dotenv.config({ path: path.join(root, '.env.local') })

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY
const officerEmail = process.env.TEST_OFFICER_EMAIL || 'officer@tamale.gov'
const officerPassword = process.env.TEST_OFFICER_PASSWORD || 'Tamale2024!'
const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@sanisentinel.gov'
const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'Admin2024!'

if (!url || !anon) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

function fail(msg) {
  console.error(`\n❌ ${msg}\n`)
  process.exit(1)
}

async function signIn(email, password) {
  const c = createClient(url, anon)
  const { data, error } = await c.auth.signInWithPassword({ email, password })
  if (error || !data?.user) fail(`Sign in failed for ${email}: ${error?.message || 'unknown'}`)
  return c
}

async function main() {
  const officer = await signIn(officerEmail, officerPassword)
  const admin = await signIn(adminEmail, adminPassword)

  const { data: officerFacilities, error: oErr } = await officer
    .from('facilities')
    .select('id, district_id')
    .limit(1000)
  if (oErr) fail(oErr.message)
  const officerDistricts = [...new Set((officerFacilities || []).map((r) => String(r.district_id)))]
  if (officerDistricts.length > 1) fail(`Officer can access multiple districts: ${officerDistricts.join(', ')}`)

  const { data: adminFacilities, error: aErr } = await admin
    .from('facilities')
    .select('id, district_id')
    .limit(2000)
  if (aErr) fail(aErr.message)
  if ((adminFacilities || []).length < (officerFacilities || []).length) {
    fail('Admin sees fewer facilities than officer (unexpected scope)')
  }

  // Navigation definition sanity check.
  const layout = fs.readFileSync(path.join(root, 'src', 'components', 'Layout', 'AppLayout.jsx'), 'utf8')
  const requiredSnippets = [
    'District operations',
    'System Config',
    "href: '/officer-workers'",
    "href: '/admin/users'",
  ]
  for (const s of requiredSnippets) {
    if (!layout.includes(s)) fail(`AppLayout nav definition missing: ${s}`)
  }

  console.log('✅ Role separation verified')
  console.log(`   Officer facility rows: ${(officerFacilities || []).length} (districts=${officerDistricts.length})`)
  console.log(`   Admin facility rows: ${(adminFacilities || []).length}`)
  console.log('   Admin/officer nav sections found in AppLayout')
}

main().catch((e) => fail(e.message || String(e)))
