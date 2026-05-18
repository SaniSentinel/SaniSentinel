import React, { useEffect, useMemo, useState } from 'react'
import AppLayout from '../components/Layout/AppLayout'
import { supabase } from '../lib/supabase'

const toCsv = (rows) => {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) => headers.map((key) => escape(row[key])).join(','))
  ]
  return lines.join('\n')
}

const downloadFile = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const printHtml = (title, html) => {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h1, h2 { margin: 0 0 12px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f3f4f6; }
          .meta { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `)
  win.document.close()
  win.focus()
  win.print()
}

const AdminReportsExports = () => {
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Monthly national WASH report controls
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7))
  const [washRows, setWashRows] = useState([])

  // Full export controls
  const [selectedDistrict, setSelectedDistrict] = useState('all')
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [dataset, setDataset] = useState('reports')
  const [exportRows, setExportRows] = useState([])

  useEffect(() => {
    const loadDistricts = async () => {
      const { data, error: districtError } = await supabase
        .from('districts')
        .select('id, name, region')
        .order('name')
      if (!districtError) setDistricts(data || [])
    }
    loadDistricts()
  }, [])

  const fetchMonthlyWash = async () => {
    try {
      setLoading(true)
      setError(null)
      const [year, month] = reportMonth.split('-').map(Number)
      const from = new Date(year, month - 1, 1).toISOString()
      const to = new Date(year, month, 1).toISOString()

      const [districtRes, facilitiesRes, reportsRes, tasksRes] = await Promise.all([
        supabase.from('districts').select('id, name, region').order('name'),
        supabase.from('facilities').select('district_id, risk_score, status'),
        supabase.from('reports').select('facility_id, condition, created_at, facility:facilities(district_id)').gte('created_at', from).lt('created_at', to),
        supabase.from('maintenance_tasks').select('status, created_at, facility:facilities(district_id)').gte('created_at', from).lt('created_at', to)
      ])

      if (districtRes.error || facilitiesRes.error || reportsRes.error || tasksRes.error) {
        throw new Error(districtRes.error?.message || facilitiesRes.error?.message || reportsRes.error?.message || tasksRes.error?.message)
      }

      const facilityByDistrict = {}
      ;(facilitiesRes.data || []).forEach((f) => {
        if (!facilityByDistrict[f.district_id]) {
          facilityByDistrict[f.district_id] = { total: 0, critical: 0, avgRiskSum: 0 }
        }
        facilityByDistrict[f.district_id].total += 1
        facilityByDistrict[f.district_id].avgRiskSum += f.risk_score || 0
        if ((f.risk_score || 0) >= 85) facilityByDistrict[f.district_id].critical += 1
      })

      const reportsByDistrict = {}
      ;(reportsRes.data || []).forEach((r) => {
        const districtId = r.facility?.district_id
        if (!districtId) return
        reportsByDistrict[districtId] = (reportsByDistrict[districtId] || 0) + 1
      })

      const tasksByDistrict = {}
      ;(tasksRes.data || []).forEach((t) => {
        const districtId = t.facility?.district_id
        if (!districtId) return
        if (!tasksByDistrict[districtId]) tasksByDistrict[districtId] = { open: 0, completed: 0 }
        if (t.status === 'completed') tasksByDistrict[districtId].completed += 1
        else tasksByDistrict[districtId].open += 1
      })

      const rows = (districtRes.data || []).map((d) => {
        const f = facilityByDistrict[d.id] || { total: 0, critical: 0, avgRiskSum: 0 }
        const avgRisk = f.total > 0 ? Math.round(f.avgRiskSum / f.total) : 0
        const task = tasksByDistrict[d.id] || { open: 0, completed: 0 }
        return {
          district: d.name,
          region: d.region,
          total_facilities: f.total,
          critical_facilities: f.critical,
          avg_risk_score: avgRisk,
          monthly_reports: reportsByDistrict[d.id] || 0,
          open_tasks: task.open,
          completed_tasks: task.completed
        }
      })

      setWashRows(rows)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportMonthlyWashPdf = () => {
    if (!washRows.length) return
    const tableRows = washRows.map((r) => `
      <tr>
        <td>${r.district}</td><td>${r.region}</td><td>${r.total_facilities}</td>
        <td>${r.critical_facilities}</td><td>${r.avg_risk_score}</td><td>${r.monthly_reports}</td>
        <td>${r.open_tasks}</td><td>${r.completed_tasks}</td>
      </tr>
    `).join('')
    printHtml(
      `National WASH Report ${reportMonth}`,
      `<h1>National WASH Monthly Summary</h1>
       <div class="meta">Month: ${reportMonth} | Generated: ${new Date().toLocaleString()}</div>
       <table>
         <thead><tr><th>District</th><th>Region</th><th>Total Facilities</th><th>Critical</th><th>Avg Risk</th><th>Reports</th><th>Open Tasks</th><th>Completed Tasks</th></tr></thead>
         <tbody>${tableRows}</tbody>
       </table>`
    )
  }

  const fetchDataset = async () => {
    try {
      setLoading(true)
      setError(null)

      if (new Date(startDate) > new Date(endDate)) {
        throw new Error('Start date must be before or equal to end date.')
      }

      const fromIso = new Date(`${startDate}T00:00:00`).toISOString()
      const toIso = new Date(`${endDate}T23:59:59`).toISOString()

      const districtFilter = selectedDistrict !== 'all' ? selectedDistrict : null
      let rows = []

      if (dataset === 'reports') {
        const { data, error: e } = await supabase
          .from('reports')
          .select('id, condition, reported_by, created_at, facility:facilities(name, district:districts(id,name,region))')
          .gte('created_at', fromIso)
          .lte('created_at', toIso)
          .order('created_at', { ascending: false })
        if (e) throw new Error(e.message)
        rows = (data || [])
          .filter((r) => !districtFilter || r.facility?.district?.id === districtFilter)
          .map((r) => {
            // Parse the notes field into a clean readable message
            const rawNotes = r.notes || ''
            let cleanMessage = rawNotes
            // Notes format: "SMS Report from +233... | Block/Section: A | Facility: ... | District: ... | Raw message: ..."
            // Or USSD format: "USSD *384*11082# | Block/location: ... | From: ... | Reporter: ..."
            if (rawNotes.includes(' | ')) {
              const parts = rawNotes.split(' | ')
              const blockPart = parts.find(p => p.startsWith('Block'))
              const block = blockPart ? blockPart.replace(/^Block\/?[Ss]ection:\s*/, '').replace(/^Block\/location:\s*/, '') : ''
              cleanMessage = block ? `Block/Location: ${block}` : parts[0]
            }
            return {
              id: r.id,
              date: r.created_at,
              district: r.facility?.district?.name || '',
              region: r.facility?.district?.region || '',
              facility: r.facility?.name || '',
              condition: r.condition,
              reported_by: r.reported_by?.startsWith('officer:')
                ? r.reported_by.replace('officer:', 'Officer: ')
                : r.reported_by?.startsWith('worker:')
                ? r.reported_by.replace('worker:', 'Worker: ')
                : r.reported_by,
              reporter_type: r.reported_by?.startsWith('officer:') || r.reported_by?.startsWith('worker:')
                ? 'Worker/Officer'
                : 'Community',
              message: cleanMessage,
              raw_notes: rawNotes
            }
          })
      } else if (dataset === 'facilities') {
        const { data, error: e } = await supabase
          .from('facilities')
          .select('id, name, type, status, risk_score, updated_at, district:districts(id,name,region)')
          .order('name')
        if (e) throw new Error(e.message)
        rows = (data || [])
          .filter((f) => !districtFilter || f.district?.id === districtFilter)
          .map((f) => ({
            id: f.id,
            district: f.district?.name || '',
            region: f.district?.region || '',
            name: f.name,
            type: f.type,
            status: f.status,
            risk_score: f.risk_score,
            updated_at: f.updated_at
          }))
      } else if (dataset === 'alerts') {
        const { data, error: e } = await supabase
          .from('alerts')
          .select('id, alert_type, severity, resolved, created_at, facility:facilities(name, district:districts(id,name,region))')
          .gte('created_at', fromIso)
          .lte('created_at', toIso)
          .order('created_at', { ascending: false })
        if (e) throw new Error(e.message)
        rows = (data || [])
          .filter((a) => !districtFilter || a.facility?.district?.id === districtFilter)
          .map((a) => ({
            id: a.id,
            date: a.created_at,
            district: a.facility?.district?.name || '',
            region: a.facility?.district?.region || '',
            facility: a.facility?.name || '',
            alert_type: a.alert_type,
            severity: a.severity,
            resolved: a.resolved
          }))
      } else if (dataset === 'sms_logs') {
        const { data, error: e } = await supabase
          .from('sms_gateway_logs')
          .select('id, direction, status, phone_from, phone_to, message, created_at, district:districts(id,name,region)')
          .gte('created_at', fromIso)
          .lte('created_at', toIso)
          .order('created_at', { ascending: false })
        if (e) throw new Error(e.message)
        rows = (data || [])
          .filter((s) => !districtFilter || s.district?.id === districtFilter)
          .map((s) => ({
            id: s.id,
            date: s.created_at,
            district: s.district?.name || '',
            region: s.district?.region || '',
            direction: s.direction,
            status: s.status,
            phone_from: s.phone_from || '',
            phone_to: s.phone_to || '',
            message: s.message
          }))
      }

      setExportRows(rows)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportCsv = () => {
    if (!exportRows.length) return
    const csv = toCsv(exportRows)
    downloadFile(`${dataset}-${selectedDistrict}-${startDate}-to-${endDate}.csv`, csv, 'text/csv;charset=utf-8')
  }

  const exportPdf = () => {
    if (!exportRows.length) return
    const headers = Object.keys(exportRows[0])
    const headerRow = headers.map((h) => `<th>${h}</th>`).join('')
    const bodyRows = exportRows.map((row) => `
      <tr>${headers.map((h) => `<td>${row[h] ?? ''}</td>`).join('')}</tr>
    `).join('')
    printHtml(
      `Data Export ${dataset}`,
      `<h1>Data Export: ${dataset}</h1>
       <div class="meta">District: ${selectedDistrict === 'all' ? 'All' : districts.find((d) => d.id === selectedDistrict)?.name} | Range: ${startDate} to ${endDate}</div>
       <table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>`
    )
  }

  const washSummary = useMemo(() => ({
    districts: washRows.length,
    facilities: washRows.reduce((sum, r) => sum + r.total_facilities, 0),
    critical: washRows.reduce((sum, r) => sum + r.critical_facilities, 0)
  }), [washRows])

  return (
    <AppLayout
      title="National Reports & Exports"
      subtitle="Monthly national WASH PDF + district/date-range CSV/PDF export"
    >
      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">National WASH Report Generator</h2>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Month</label>
            <input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <button onClick={fetchMonthlyWash} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Generate</button>
          <button onClick={exportMonthlyWashPdf} disabled={!washRows.length} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50">Export PDF</button>
        </div>
        <div className="text-sm text-gray-600">Districts: {washSummary.districts} • Facilities: {washSummary.facilities} • Critical: {washSummary.critical}</div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Full Data Export</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          <select value={dataset} onChange={(e) => setDataset(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2">
            <option value="reports">Reports</option>
            <option value="facilities">Facilities</option>
            <option value="alerts">Alerts</option>
            <option value="sms_logs">SMS Logs</option>
          </select>
          <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2">
            <option value="all">All Districts</option>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2" />
          <button onClick={fetchDataset} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Load</button>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCsv} disabled={!exportRows.length} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50">Export CSV</button>
          <button onClick={exportPdf} disabled={!exportRows.length} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">Export PDF</button>
          <span className="text-sm text-gray-600 self-center">{loading ? 'Loading...' : `${exportRows.length} rows loaded`}</span>
        </div>

        {exportRows.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(exportRows[0])
                    .filter(k => k !== 'raw_notes')
                    .map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">
                        {h.replace(/_/g, ' ')}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {exportRows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {Object.entries(row)
                      .filter(([k]) => k !== 'raw_notes')
                      .map(([k, v]) => (
                        <td key={k} className="px-4 py-2 text-gray-800 max-w-xs">
                          {k === 'message' ? (
                            <span className="text-gray-700 leading-relaxed">{String(v ?? '')}</span>
                          ) : k === 'reporter_type' ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              String(v) === 'Worker/Officer'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}>{String(v ?? '')}</span>
                          ) : (
                            <span className="truncate block max-w-[12rem]" title={String(v ?? '')}>{String(v ?? '')}</span>
                          )}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {exportRows.length > 50 && (
              <p className="text-xs text-gray-500 px-4 py-2 border-t border-gray-200">
                Showing first 50 of {exportRows.length} rows. Export to CSV/PDF to see all.
              </p>
            )}
          </div>
        )}
        <div className="mt-3 text-xs text-gray-500">
          Export scope: {selectedDistrict === 'all' ? 'All areas' : districts.find((d) => d.id === selectedDistrict)?.name} • {startDate} to {endDate}
        </div>
      </div>
    </AppLayout>
  )
}

export default AdminReportsExports
