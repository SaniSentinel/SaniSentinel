/**
 * Applies migration 033 to the Supabase database.
 * Run: node scripts/apply-migration-033.js <SERVICE_ROLE_KEY>
 *
 * Get your service role key from:
 * Supabase Dashboard → Project Settings → API → service_role (secret)
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = 'https://aaxgfnzcbyerjlcftwuo.supabase.co'
const SERVICE_ROLE_KEY = process.argv[2]

if (!SERVICE_ROLE_KEY) {
  console.error('❌  Usage: node scripts/apply-migration-033.js <SERVICE_ROLE_KEY>')
  console.error('')
  console.error('   Get your service role key from:')
  console.error('   Supabase Dashboard → Project Settings → API → service_role (secret)')
  process.exit(1)
}

const sql = readFileSync(
  join(__dirname, '../database/migrations/033_allow_officer_delete_workers.sql'),
  'utf8'
)

async function run() {
  console.log('🔄  Applying migration 033...')

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql_query: sql }),
  })

  if (!res.ok) {
    // exec_sql RPC may not exist — fall back to the pg endpoint
    const pgRes = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    })

    if (!pgRes.ok) {
      const text = await pgRes.text()
      console.error('❌  Migration failed via pg endpoint:', text)
      console.error('')
      console.error('👉  Please run the SQL manually in the Supabase SQL Editor:')
      console.error('    https://supabase.com/dashboard/project/aaxgfnzcbyerjlcftwuo/sql/new')
      process.exit(1)
    }

    const pgData = await pgRes.json()
    console.log('✅  Migration applied via pg endpoint:', pgData)
    return
  }

  const data = await res.json()
  console.log('✅  Migration 033 applied successfully:', data)
}

run().catch((err) => {
  console.error('❌  Unexpected error:', err.message)
  process.exit(1)
})
