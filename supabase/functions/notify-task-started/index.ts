import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function readEnv(...keys: string[]): string | null {
  for (const key of keys) {
    const v = Deno.env.get(key)
    if (v && v.trim() !== '') return v.trim()
  }
  return null
}

const AT_API_KEY = readEnv('AFRICAS_TALKING_API_KEY', 'AFRICAS_TALKING_APIKEY', 'AT_API_KEY')
const AT_USERNAME = readEnv('AFRICAS_TALKING_USERNAME', 'AT_USERNAME') || 'sandbox'
const AT_BASE_URL = 'https://api.africastalking.com/version1/messaging'

const TASK_NOTIFICATION_FROM_EMAIL =
  Deno.env.get('TASK_NOTIFICATION_FROM_EMAIL') || 'SaniSentinel <no-reply@sanisentinel.local>'
const SMTP_HOST = Deno.env.get('SMTP_HOST')
const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') || '587')
const SMTP_SECURE = Deno.env.get('SMTP_SECURE') === 'true'
const SMTP_USER = Deno.env.get('SMTP_USER')
const SMTP_PASS = Deno.env.get('SMTP_PASS')

type TaskRow = {
  id: string
  status: string
  priority: string
  task_type: string
  description: string | null
  due_date: string
  worker: { id: string; name: string; phone: string; email?: string | null } | null
  facility: {
    id: string
    name: string
    district: { id: string; name: string; region: string } | null
  } | null
}

function labelTaskType(taskType: string): string {
  const map: Record<string, string> = {
    routine_cleaning: 'Routine Cleaning',
    emptying: 'Emptying',
    repair: 'Repair',
    inspection: 'Inspection',
    emergency_response: 'Emergency Response',
    preventive_maintenance: 'Preventive Maintenance',
  }
  return map[taskType] || taskType
}

async function sendSMS(to: string, message: string) {
  if (!AT_API_KEY) {
    return { ok: false, error: 'AFRICAS_TALKING_API_KEY not configured (or empty)' }
  }

  const formData = new FormData()
  formData.append('username', AT_USERNAME)
  formData.append('to', to)
  formData.append('message', message)

  const res = await fetch(AT_BASE_URL, {
    method: 'POST',
    headers: {
      apiKey: AT_API_KEY,
      Accept: 'application/json',
    },
    body: formData,
  })

  const text = await res.text()
  if (!res.ok) {
    return {
      ok: false,
      error:
        `AT API ${res.status}: ${text}` +
        ` (username="${AT_USERNAME}", key_present=${AT_API_KEY.length > 8})`,
    }
  }
  return { ok: true, raw: text }
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return { ok: false, error: 'SMTP_HOST/SMTP_USER/SMTP_PASS not configured' }
  }

  try {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })

    const info = await transport.sendMail({
      from: TASK_NOTIFICATION_FROM_EMAIL,
      to,
      subject,
      html,
    })

    return { ok: true, raw: JSON.stringify({ messageId: info.messageId }) }
  } catch (error) {
    return { ok: false, error: `Nodemailer SMTP error: ${error.message}` }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json().catch(() => ({}))
    const taskId = body.task_id as string | undefined
    if (!taskId) {
      return new Response(
        JSON.stringify({ success: false, error: 'task_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: task, error: taskError } = await supabase
      .from('maintenance_tasks')
      .select(`
        id,
        status,
        priority,
        task_type,
        description,
        due_date,
        worker:workers(id, name, phone, email),
        facility:facilities(
          id,
          name,
          district:districts(id, name, region)
        )
      `)
      .eq('id', taskId)
      .single<TaskRow>()

    if (taskError || !task) {
      return new Response(
        JSON.stringify({ success: false, error: taskError?.message || 'Task not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (task.status !== 'in_progress') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Task is not in in_progress state; notification skipped',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!task.worker?.phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Assigned worker has no phone number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const workerName = task.worker.name || 'Worker'
    const facilityName = task.facility?.name || 'Assigned facility'
    const districtName = task.facility?.district?.name || 'Unknown district'
    const taskType = labelTaskType(task.task_type)

    const smsMessage =
      `Task started: ${taskType} at ${facilityName} (${districtName}). ` +
      `Priority: ${task.priority}. Due: ${task.due_date}.`

    // SMS notifications are temporarily disabled.
    const smsResult: { ok: boolean; error?: string } = {
      ok: false,
      error: 'SMS notifications are currently disabled',
    }

    let emailResult: { ok: boolean; error?: string; raw?: string } = {
      ok: false,
      error: 'Worker email not set',
    }
    if (task.worker.email) {
      const subject = `Task started: ${taskType} - ${facilityName}`
      const html =
        `<p>Hello ${workerName},</p>` +
        `<p>You have started the following maintenance task:</p>` +
        `<ul>` +
        `<li><strong>Facility:</strong> ${facilityName}</li>` +
        `<li><strong>District:</strong> ${districtName}</li>` +
        `<li><strong>Task type:</strong> ${taskType}</li>` +
        `<li><strong>Priority:</strong> ${task.priority}</li>` +
        `<li><strong>Due date:</strong> ${task.due_date}</li>` +
        `${task.description ? `<li><strong>Description:</strong> ${task.description}</li>` : ''}` +
        `</ul>` +
        `<p>Please proceed with execution and update status when done.</p>` +
        `<p>SaniSentinel</p>`

      emailResult = await sendEmail(task.worker.email, subject, html)
    }

    // SMS is disabled — success is determined by email only.
    const allNotificationsOk = emailResult.ok

    // Record SMS outcome for admin observability.
    await supabase.from('sms_gateway_logs').insert({
      direction: 'outbound',
      status: smsResult.ok ? 'sent' : 'failed',
      phone_to: task.worker.phone,
      message: smsMessage,
      facility_id: task.facility?.id || null,
      district_id: task.facility?.district?.id || null,
      error_message: smsResult.ok ? null : smsResult.error || null,
      metadata: {
        notification_type: 'task_started',
        task_id: task.id,
        worker_id: task.worker.id,
        sms_sent: smsResult.ok,
        sms_error: smsResult.ok ? null : smsResult.error || null,
        email_sent: emailResult.ok,
        email_error: emailResult.ok ? null : emailResult.error || null,
      },
    })

    return new Response(
      JSON.stringify({
        success: allNotificationsOk,
        task_id: task.id,
        worker: { id: task.worker.id, name: workerName, phone: task.worker.phone, email: task.worker.email || null },
        sms: smsResult,
        email: emailResult,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
