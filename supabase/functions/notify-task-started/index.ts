import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer'
import { sendAtSms } from '../_shared/africasTalking.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

async function logSmsGateway(
  supabase: ReturnType<typeof createClient>,
  payload: {
    taskId: string
    phone: string
    message: string
    facilityId?: string
    districtId?: string
    providerMessageId?: string
    success: boolean
    error?: string
  },
) {
  try {
    await supabase.from('sms_gateway_logs').insert({
      direction: 'outbound',
      status: payload.success ? 'sent' : 'failed',
      phone_to: payload.phone,
      message: payload.message,
      facility_id: payload.facilityId || null,
      district_id: payload.districtId || null,
      provider_message_id: payload.providerMessageId || null,
      error_message: payload.error || null,
      metadata: {
        source: 'notify-task-started',
        task_id: payload.taskId,
      },
    })
  } catch (logError) {
    console.error('Failed to write sms_gateway_logs:', logError)
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

    const smsResult = await sendAtSms(task.worker.phone, smsMessage)

    await logSmsGateway(supabase, {
      taskId: task.id,
      phone: task.worker.phone,
      message: smsMessage,
      facilityId: task.facility?.id,
      districtId: task.facility?.district?.id,
      providerMessageId: smsResult.ok ? smsResult.providerMessageId : undefined,
      success: smsResult.ok,
      error: smsResult.ok ? undefined : smsResult.error,
    })

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

    const allNotificationsOk = smsResult.ok && (!task.worker.email || emailResult.ok)

    return new Response(
      JSON.stringify({
        success: allNotificationsOk,
        task_id: task.id,
        worker: {
          id: task.worker.id,
          name: workerName,
          phone: task.worker.phone,
          email: task.worker.email || null,
        },
        sms: smsResult.ok ? { ok: true } : { ok: false, error: smsResult.error },
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
