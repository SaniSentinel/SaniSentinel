/**
 * Africa's Talking USSD: *384*11082#
 * Webhook: POST application/x-www-form-urlencoded (sessionId, phoneNumber, text, serviceCode)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
)

interface FacilityLookup {
  id: string
  name: string
  type: string
  district_id: string
  districts: { name: string; region: string }
}

interface WorkerLookup {
  id: string
  name: string
  district_id: string
}

interface TaskLookup {
  id: string
  status: string
  priority: string
  task_type: string
  due_date: string
  officer_notes?: string | null
  facility: { id: string; name: string } | null
}

const CON = (msg: string) =>
  new Response(`CON ${msg}`, { headers: { "Content-Type": "text/plain" } })

const END = (msg: string) =>
  new Response(`END ${msg}`, { headers: { "Content-Type": "text/plain" } })

const FACILITY_TYPE_LABELS: Record<string, string> = {
  "1": "School",
  "2": "Public toilet",
  "3": "Household",
  "4": "Healthcare",
}

/** Maps menu key → DB `reports.condition` (lowercase) */
const CONDITIONS: Record<string, string> = {
  "1": "good",
  "2": "damaged",
  "3": "overflow",
  "4": "dry",
  "5": "blocked",
}

const TASK_STATUS_OPTIONS: Record<string, { label: string; status: string; severity: "low" | "medium" | "high" | "critical" }> = {
  "1": { label: "Started", status: "in_progress", severity: "low" },
  "2": { label: "Completed", status: "completed", severity: "low" },
  "3": { label: "Blocked/Delayed", status: "in_progress", severity: "high" },
}

function normalizeGhPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("233") && digits.length >= 12) return "+" + digits
  if (digits.startsWith("0") && digits.length === 10) return "+233" + digits.slice(1)
  if (raw.startsWith("+")) return raw
  return "+" + digits
}

function parseDate(input: string): string | null {
  if (input === "0000" || input.length !== 4) return null
  const day = parseInt(input.slice(0, 2))
  const month = parseInt(input.slice(2, 4))
  if (
    isNaN(day) ||
    isNaN(month) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null
  }
  const year = new Date().getFullYear()
  const d = new Date(year, month - 1, day)
  return d.toISOString().split("T")[0]
}

async function getWorkerFirstName(phone: string): Promise<string> {
  const p = normalizeGhPhone(phone)
  const { data } = await supabase
    .from("workers")
    .select("name")
    .in("phone", [...new Set([p, phone.trim()])])
    .limit(1)
    .maybeSingle()
  return data?.name?.split(" ")[0] ?? "Worker"
}

async function getWorkerByPhone(phone: string, phoneRaw: string): Promise<WorkerLookup | null> {
  const { data } = await supabase
    .from("workers")
    .select("id, name, district_id")
    .in("phone", [...new Set([phone, phoneRaw.trim()])])
    .eq("active", true)
    .maybeSingle()

  return (data as WorkerLookup | null) || null
}

async function getWorkerOpenTasks(workerId: string): Promise<TaskLookup[]> {
  const { data, error } = await supabase
    .from("maintenance_tasks")
    .select(`
      id,
      status,
      priority,
      task_type,
      due_date,
      officer_notes,
      facility:facilities(id, name)
    `)
    .eq("assigned_to", workerId)
    .in("status", ["pending", "assigned", "in_progress"])
    .order("due_date", { ascending: true })
    .limit(5)

  if (error || !data) return []
  return data as unknown as TaskLookup[]
}

async function createOfficerTaskAlert(params: {
  task: TaskLookup
  workerName: string
  statusLabel: string
  note: string
  severity: "low" | "medium" | "high" | "critical"
}) {
  const { task, workerName, statusLabel, note, severity } = params
  if (!task.facility?.id) return

  const message =
    `Worker update from ${workerName}: Task "${task.task_type}" at ${task.facility.name} marked "${statusLabel}".` +
    (note ? ` Note: ${note}` : "")

  await supabase.from("alerts").insert({
    facility_id: task.facility.id,
    alert_type: "worker_task_update",
    severity,
    message,
    resolved: false,
  })
}

async function findFacility(facilityId: string): Promise<FacilityLookup | null> {
  try {
    const baseSelect = `
      id,
      name,
      type,
      district_id,
      districts (
        name,
        region
      )
    `
    if (facilityId.includes("-") && facilityId.length > 20) {
      const { data, error } = await supabase
        .from("facilities")
        .select(baseSelect)
        .eq("id", facilityId)
        .single()
      if (error) return null
      return data as FacilityLookup
    }

    const { data: allFacilities, error } = await supabase
      .from("facilities")
      .select(baseSelect)
      .order("name")
      .limit(500)

    if (error || !allFacilities?.length) return null

    const numericId = parseInt(facilityId, 10)
    if (!isNaN(numericId) && numericId > 0 && numericId <= allFacilities.length) {
      return allFacilities[numericId - 1] as FacilityLookup
    }

    return null
  } catch {
    return null
  }
}

serve(async (req) => {
  const body = await req.formData()
  const text = body.get("text")?.toString() ?? ""
  const phoneRaw = body.get("phoneNumber")?.toString() ?? ""
  const phone = normalizeGhPhone(phoneRaw)

  const parts = text === "" ? [] : text.split("*")
  const level = parts.length

  // Determine if caller is a registered worker
  const worker = await getWorkerByPhone(phone, phoneRaw)
  const isWorker = !!worker?.id

  if (level === 0) {
    if (isWorker) {
      return CON(
        "SaniSentinel WASH (*384*11082#)\n\n" +
          "1. Report facility\n" +
          "2. My assignments\n\n" +
          "Select option:",
      )
    } else {
      return CON(
        "SaniSentinel WASH (*384*11082#)\n\n" +
          "1. Report facility\n\n" +
          "Select option:",
      )
    }
  }

  const mainChoice = parts[0]

  if (level === 1) {
    if (mainChoice === "1") {
      return CON(
        "Select facility type:\n\n" +
          "1. School\n" +
          "2. Public toilet\n" +
          "3. Household\n" +
          "4. Healthcare\n\n" +
          "Enter choice:",
      )
    }

    if (mainChoice === "2") {
      if (!isWorker) {
        return CON(
          "Invalid choice.\n\n1. Report facility\n\nSelect option:",
        )
      }
      return CON(
        "Assignments menu:\n\n" +
          "1. View my assignments\n" +
          "2. Report back task status\n\n" +
          "Enter choice:",
      )
    }

    if (isWorker) {
      return CON(
        "Invalid choice.\n\n1. Report facility\n2. My assignments\n\nSelect option:",
      )
    }
    return CON(
      "Invalid choice.\n\n1. Report facility\n\nSelect option:",
    )
  }

  if (mainChoice === "2") {
    const worker = await getWorkerByPhone(phone, phoneRaw)
    if (!worker?.id) {
      return END("No worker profile found. Contact district officer.")
    }

    const assignmentsChoice = parts[1]
    if (level === 2) {
      if (assignmentsChoice === "1") {
        const tasks = await getWorkerOpenTasks(worker.id)
        if (!tasks.length) return END("No open assignments.\nThank you.")
        const list = tasks
          .map((t, i) => `${i + 1}. ${t.facility?.name ?? "Facility"} — ${t.status} (due: ${t.due_date || "N/A"})`)
          .join("\n")
        return END(`Your open assignments:\n\n${list}\n\nUse option 2 to report status.`)
      }

      if (assignmentsChoice === "2") {
        const tasks = await getWorkerOpenTasks(worker.id)
        if (!tasks.length) return END("No open assignments to report.\nThank you.")
        const list = tasks
          .map((t, i) => `${i + 1}. ${t.facility?.name ?? "Facility"} (${t.status})`)
          .join("\n")
        return CON(
          "Select task number:\n\n" +
            `${list}\n\n` +
            "Task #:",
        )
      }

      return CON(
        "Invalid choice.\n\n1. View my assignments\n2. Report back task status\n\nEnter choice:",
      )
    }

    if (assignmentsChoice !== "2") {
      return END("Session ended. Dial *384*11082# to restart.")
    }

    if (level === 3) {
      const tasks = await getWorkerOpenTasks(worker.id)
      const taskIndex = Number(parts[2]) - 1
      if (Number.isNaN(taskIndex) || taskIndex < 0 || taskIndex >= tasks.length) {
        return CON("Invalid task number.\nEnter task # again:")
      }

      const task = tasks[taskIndex]
      return CON(
        `Task: ${task.facility?.name ?? "Facility"}\n\n` +
          "Report status:\n" +
          "1. Started\n" +
          "2. Completed\n" +
          "3. Blocked/Delayed\n\n" +
          "Enter choice:",
      )
    }

    if (level === 4) {
      const statusChoice = parts[3]
      const statusMeta = TASK_STATUS_OPTIONS[statusChoice]
      if (!statusMeta) {
        return CON(
          "Invalid status.\n1.Started 2.Completed 3.Blocked/Delayed\n\nEnter choice:",
        )
      }

      return CON(
        `Status: ${statusMeta.label}\n\n` +
          "Add short note (or 0 for none):\n\n" +
          "Note:",
      )
    }

    if (level === 5) {
      const tasks = await getWorkerOpenTasks(worker.id)
      const taskIndex = Number(parts[2]) - 1
      const statusMeta = TASK_STATUS_OPTIONS[parts[3] ?? ""]
      if (Number.isNaN(taskIndex) || taskIndex < 0 || taskIndex >= tasks.length || !statusMeta) {
        return END("Invalid report flow. Dial again.")
      }

      const task = tasks[taskIndex]
      const noteInput = (parts[4] ?? "").trim()
      const note = noteInput === "0" ? "" : noteInput

      const notePrefix = `[USSD Worker Update ${new Date().toISOString()}] ${statusMeta.label}`
      const existingNotes = task.officer_notes || ""
      const updatedNotes = note
        ? `${existingNotes}${existingNotes ? "\n" : ""}${notePrefix} - ${note}`
        : `${existingNotes}${existingNotes ? "\n" : ""}${notePrefix}`

      const { error: updateError } = await supabase
        .from("maintenance_tasks")
        .update({
          status: statusMeta.status,
          officer_notes: updatedNotes,
        })
        .eq("id", task.id)
        .eq("assigned_to", worker.id)

      if (updateError) {
        return END("Could not submit update now. Try again later.")
      }

      await createOfficerTaskAlert({
        task,
        workerName: worker.name || "Worker",
        statusLabel: statusMeta.label,
        note,
        severity: statusMeta.severity,
      })

      return END(
        "Update sent!\n\n" +
          `Task: ${task.facility?.name ?? "Facility"}\n` +
          `Status: ${statusMeta.label}\n\n` +
          "District officer has been notified.",
      )
    }

    return END("Session expired.\nDial *384*11082# to restart.")
  }

  if (mainChoice !== "1") {
    return END("Session ended. Dial *384*11082# to restart.")
  }

  if (level === 2) {
    const typeChoice = parts[1]
    if (!FACILITY_TYPE_LABELS[typeChoice]) {
      return CON(
        "Invalid choice.\n\n" +
          "1. School\n2. Public toilet\n3. Household\n4. Healthcare\n\n" +
          "Enter choice:",
      )
    }
    const typeLabel = FACILITY_TYPE_LABELS[typeChoice]
    return CON(
      `Type: ${typeLabel}\n\n` +
        "Enter facility ID\n(from your reference card)\n\n" +
        "Use list number or full UUID.\n\n" +
        "Facility ID:",
    )
  }

  if (level === 3) {
    const rawId = parts[2]?.trim() ?? ""
    const facility = await findFacility(rawId)
    if (!facility) {
      return CON(
        "Facility ID not found.\n\n" +
          "Re-enter ID (reference card):\n\n" +
          "Facility ID:",
      )
    }
    return CON(
      `Facility found:\n${facility.name}\n\n` +
        "Select condition:\n" +
        "1. Good\n" +
        "2. Damaged\n" +
        "3. Overflow\n" +
        "4. Dry\n" +
        "5. Blocked\n\n" +
        "Enter choice:",
    )
  }

  if (level === 4) {
    const condChoice = parts[3]
    const condition = CONDITIONS[condChoice]
    if (!condition) {
      return CON(
        "Invalid choice.\n" +
          "1.Good 2.Damaged 3.Overflow\n" +
          "4.Dry  5.Blocked\n\n" +
          "Enter choice:",
      )
    }
    return CON(
      `Condition: ${condition}\n\n` +
        "Enter block or location:\n" +
        "(e.g. Block A, Unit 2)\n\n" +
        "Location:",
    )
  }

  if (level === 5) {
    return CON(
      "When was it last serviced?\n\n" +
        "Enter date as DDMM:\n" +
        "Example: 0105 = 1 May\n" +
        "Enter 0000 if unknown\n\n" +
        "Date (DDMM):",
    )
  }

  if (level === 6) {
    const typeLabel = FACILITY_TYPE_LABELS[parts[1]] ?? "Unknown"
    const rawFacility = parts[2] ?? ""
    const condKey = parts[3] ?? ""
    const location = parts[4] ?? ""
    const dateInput = parts[5] ?? ""
    const parsedDate = parseDate(dateInput)
    const dateDisplay = parsedDate ?? "Unknown"
    const facility = await findFacility(rawFacility.trim())
    const condLabel = CONDITIONS[condKey] ?? "Unknown"

    return CON(
      "Confirm your report:\n\n" +
        `Facility: ${facility?.name ?? rawFacility}\n` +
        `Type hint: ${typeLabel}\n` +
        `Location: ${location}\n` +
        `Condition: ${condLabel}\n` +
        `Last service: ${dateDisplay}\n\n` +
        "1. Yes, submit\n" +
        "2. No, cancel\n\n" +
        "Enter choice:",
    )
  }

  if (level === 7) {
    const confirmChoice = parts[6]

    if (confirmChoice === "2") {
      return CON(
        "SaniSentinel WASH\n\n" +
          "1. Report facility\n" +
          "2. My assignments\n\n" +
          "Select option:",
      )
    }

    if (confirmChoice !== "1") {
      return CON("Invalid. Enter 1 to submit or 2 to cancel:")
    }

    const rawFacility = parts[2]?.trim() ?? ""
    const condKey = parts[3] ?? ""
    const location = parts[4] ?? ""
    const dateInput = parts[5] ?? ""
    const parsedDate = parseDate(dateInput)
    const condition = CONDITIONS[condKey]

    const facility = await findFacility(rawFacility)
    if (!facility || !condition) {
      return END("Could not save: invalid facility or condition. Start again.")
    }

    const notes =
      `USSD *384*11082# | Block/location: ${location} | From: ${phone} | Reporter: ${isWorker ? "worker" : "community"}`

    const { error: reportError } = await supabase.from("reports").insert({
      facility_id: facility.id,
      reported_by: isWorker ? `worker:${phone}` : phone,
      condition,
      notes,
    })

    if (reportError) {
      return END(
        "Sorry, report failed.\n" +
          "Try SMS format:\n" +
          `F${rawFacility}#${location}#${condition}`,
      )
    }

    if (parsedDate) {
      await supabase
        .from("facilities")
        .update({ last_serviced: parsedDate })
        .eq("id", facility.id)
    }

    const now = new Date().toLocaleTimeString("en-GH", {
      hour: "2-digit",
      minute: "2-digit",
    })
    const workerName = await getWorkerFirstName(phone)

    return END(
      "Report submitted!\n\n" +
        `Condition: ${condition}\n` +
        `Saved: ${now}\n\n` +
        `Thank you, ${workerName}.\n` +
        "Your team has been notified.",
    )
  }

  return END("Session expired.\nDial *384*11082# to restart.")
})
