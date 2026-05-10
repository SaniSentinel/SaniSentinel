/**
 * RLS smoke test: district officer must not read facilities outside their district.
 *
 * Uses the public anon key + officer credentials (same as the app). No service role.
 *
 * Prerequisites:
 * - .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * - Optional: TEST_OFFICER_EMAIL, TEST_OFFICER_PASSWORD (defaults: officer@tamale.gov / Tamale2024!)
 * - Optional: TEST_OTHER_DISTRICT_ID — if set, used as the "foreign" district (skips anon districts list)
 *
 * Run: npm run test:rls-officer-facilities
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY

const officerEmail =
  process.env.TEST_OFFICER_EMAIL || 'officer@tamale.gov'
const officerPassword =
  process.env.TEST_OFFICER_PASSWORD || 'Tamale2024!'

function fail(msg) {
  console.error(`\n❌ RLS test failed: ${msg}\n`)
  process.exit(1)
}

function pass(msg) {
  console.log(`✅ ${msg}`)
}

async function main() {
  if (!url || !anonKey) {
    fail('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  }

  const anonClient = createClient(url, anonKey)

  /** District UUID in another region than the officer — anon can list districts (policy). */
  let otherDistrictId = process.env.TEST_OTHER_DISTRICT_ID?.trim() || null

  if (!otherDistrictId) {
    const { data: districts, error: dErr } = await anonClient
      .from('districts')
      .select('id, name')
      .limit(50)

    if (dErr) {
      fail(`Could not list districts as anon: ${dErr.message}`)
    }
    if (!districts?.length) {
      fail('No districts in database; cannot pick a foreign district.')
    }
    console.log(`ℹ️  Found ${districts.length} districts (anon read).`)
  }

  const scoped = createClient(url, anonKey)

  const { data: signInData, error: signErr } =
    await scoped.auth.signInWithPassword({
      email: officerEmail,
      password: officerPassword
    })

  if (signErr || !signInData?.user) {
    fail(
      `Officer sign-in failed: ${signErr?.message || 'no user'} (check TEST_OFFICER_EMAIL / TEST_OFFICER_PASSWORD)`
    )
  }

  const user = signInData.user
  const officerDistrictRaw =
    user.user_metadata?.district_id ||
    user.app_metadata?.district_id ||
    null

  if (!officerDistrictRaw) {
    fail(
      'Officer user has no district_id in JWT metadata. Assign district in auth.users raw_user_meta_data.'
    )
  }

  const officerDistrictId = String(officerDistrictRaw)
  console.log(`ℹ️  Signed in as officer: ${user.email}`)
  console.log(`ℹ️  Officer district_id: ${officerDistrictId}`)

  if (!otherDistrictId) {
    const { data: districts } = await anonClient
      .from('districts')
      .select('id')
      .limit(50)

    const foreign = districts?.find((d) => String(d.id) !== officerDistrictId)
    if (!foreign) {
      fail('Only one district exists or none different from officer — cannot test cross-district denial.')
    }
    otherDistrictId = String(foreign.id)
  }

  if (otherDistrictId === officerDistrictId) {
    fail('TEST_OTHER_DISTRICT_ID equals officer district — pick another district.')
  }

  console.log(`ℹ️  Probing foreign district_id: ${otherDistrictId}`)

  const { data: allVisible, error: allErr } = await scoped
    .from('facilities')
    .select('id, district_id')
    .limit(500)

  if (allErr) {
    fail(`Facilities select failed: ${allErr.message}`)
  }

  const visible = allVisible || []
  const wrongDistrict = visible.filter(
    (f) => String(f.district_id) !== officerDistrictId
  )

  if (wrongDistrict.length > 0) {
    console.error('Leaked rows (sample):', wrongDistrict.slice(0, 5))
    fail(
      `Officer sees ${wrongDistrict.length} facility row(s) from another district without filter.`
    )
  }

  pass(
    `Unfiltered facilities: ${visible.length} row(s), all in officer district (${officerDistrictId}).`
  )

  const { data: targeted, error: tErr } = await scoped
    .from('facilities')
    .select('id, name, district_id')
    .eq('district_id', otherDistrictId)
    .limit(50)

  if (tErr) {
    fail(`Filtered query failed: ${tErr.message}`)
  }

  if ((targeted || []).length > 0) {
    console.error('Unexpected rows:', targeted)
    fail(
      `Direct API misuse: .eq('district_id', foreign) returned ${targeted.length} row(s); RLS should return 0.`
    )
  }

  pass(
    `Forced foreign district filter: 0 rows (RLS enforced for district ${otherDistrictId}).`
  )

  const { count, error: cErr } = await scoped
    .from('facilities')
    .select('*', { count: 'exact', head: true })
    .eq('district_id', otherDistrictId)

  if (cErr) {
    fail(`Head count failed: ${cErr.message}`)
  }

  if (count !== 0) {
    fail(`Head count for foreign district is ${count}, expected 0.`)
  }

  pass('Head count confirms 0 accessible rows for foreign district.')

  const accessToken = signInData.session?.access_token
  if (!accessToken) {
    fail('No access_token on session (cannot run raw REST check).')
  }

  const restBase = url.replace(/\/$/, '')
  const restUrl = `${restBase}/rest/v1/facilities?district_id=eq.${otherDistrictId}&select=id&limit=10`
  const restRes = await fetch(restUrl, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  })

  if (!restRes.ok) {
    const text = await restRes.text()
    fail(`Raw PostgREST GET ${restRes.status}: ${text}`)
  }

  const restJson = await restRes.json()
  if (!Array.isArray(restJson) || restJson.length !== 0) {
    fail(
      `Raw PostgREST call returned ${Array.isArray(restJson) ? restJson.length : '?'} row(s); expected [].`
    )
  }

  pass('Raw PostgREST GET with officer Bearer token: 0 rows for foreign district.')

  await scoped.auth.signOut()

  console.log(
    '\n✅ RLS enforcement check passed: officer cannot read other-district facilities via Supabase REST.\n'
  )
}

main().catch((e) => {
  console.error(e)
  fail(e.message || String(e))
})
