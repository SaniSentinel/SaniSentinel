/** Shared Africa's Talking SMS helpers for Supabase edge functions. */

export function readEnv(...keys: string[]): string | null {
  for (const key of keys) {
    const v = Deno.env.get(key)
    if (v && v.trim() !== '') return v.trim()
  }
  return null
}

export function getAtCredentials() {
  const apiKey = readEnv('AFRICAS_TALKING_API_KEY', 'AFRICAS_TALKING_APIKEY', 'AT_API_KEY')
  const username = readEnv('AFRICAS_TALKING_USERNAME', 'AT_USERNAME') || 'sandbox'
  return { apiKey, username }
}

/** Sandbox keys only work against api.sandbox.africastalking.com. */
export function getAtMessagingUrl(username: string): string {
  const override = readEnv('AFRICAS_TALKING_BASE_URL', 'AT_BASE_URL')
  if (override) {
    const base = override.replace(/\/$/, '')
    return base.includes('/messaging') ? base : `${base}/version1/messaging`
  }

  const isSandbox = username.toLowerCase() === 'sandbox'
  const host = isSandbox
    ? 'https://api.sandbox.africastalking.com'
    : 'https://api.africastalking.com'
  return `${host}/version1/messaging`
}

export type AtSmsResult =
  | { ok: true; raw: string; providerMessageId?: string }
  | { ok: false; error: string }

export async function sendAtSms(to: string, message: string): Promise<AtSmsResult> {
  const { apiKey, username } = getAtCredentials()

  if (!apiKey) {
    return { ok: false, error: 'AFRICAS_TALKING_API_KEY not configured (or empty)' }
  }

  const formData = new FormData()
  formData.append('username', username)
  formData.append('to', to)
  formData.append('message', message)

  const res = await fetch(getAtMessagingUrl(username), {
    method: 'POST',
    headers: {
      apiKey: apiKey,
      Apikey: apiKey,
      Accept: 'application/json',
    },
    body: formData,
  })

  const text = await res.text()
  if (!res.ok) {
    const hint =
      username.toLowerCase() === 'sandbox'
        ? ' Use a sandbox API key from the AT sandbox dashboard and add the recipient phone under Sandbox > Phone numbers.'
        : ' Verify AFRICAS_TALKING_USERNAME matches your production app username.'
    return {
      ok: false,
      error:
        `AT API ${res.status}: ${text}` +
        ` (username="${username}", key_present=${apiKey.length > 8})` +
        hint,
    }
  }

  let providerMessageId: string | undefined
  try {
    const parsed = JSON.parse(text)
    providerMessageId = parsed?.SMSMessageData?.Recipients?.[0]?.messageId
  } catch {
    // non-JSON success body is fine
  }

  return { ok: true, raw: text, providerMessageId }
}
