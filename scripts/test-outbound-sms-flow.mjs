#!/usr/bin/env node
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function postJson(functionName, body) {
  const res = await fetch(`${url}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })
  const txt = await res.text()
  try {
    return { status: res.status, data: JSON.parse(txt) }
  } catch {
    return { status: res.status, data: txt }
  }
}

async function main() {
  console.log('Step 1: score-risk with SMS follow-up in test mode')
  const risk = await postJson('score-risk', { send_sms_alerts: true, sms_test_mode: true })
  console.log('HTTP', risk.status)
  console.log(JSON.stringify(risk.data, null, 2))

  console.log('\nStep 2: send-sms-alert directly (critical/high, test mode)')
  const sms = await postJson('send-sms-alert', {
    severity_filter: ['critical', 'high'],
    test_mode: true,
  })
  console.log('HTTP', sms.status)
  console.log(JSON.stringify(sms.data, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
