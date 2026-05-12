import React, { useEffect, useState } from 'react'
import AppLayout from '../components/Layout/AppLayout'
import { supabase } from '../lib/supabase'

const AdminSmsGatewayLog = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const [smsLogsRes, reportsRes] = await Promise.all([
        supabase
          .from('sms_gateway_logs')
          .select(`
            id,
            direction,
            status,
            phone_from,
            phone_to,
            message,
            error_message,
            created_at,
            district:districts(name, region),
            facility:facilities(name)
          `)
          .order('created_at', { ascending: false })
          .limit(500),
        // Safety net: show inbound SMS/USSD reports even if log writes were missed.
        supabase
          .from('reports')
          .select(`
            id,
            reported_by,
            notes,
            created_at,
            condition,
            facility:facilities(name, district:districts(name, region))
          `)
          .or('notes.ilike.%SMS Report%,notes.ilike.%USSD%')
          .order('created_at', { ascending: false })
          .limit(300)
      ])

      if (smsLogsRes.error) throw new Error(smsLogsRes.error.message)
      if (reportsRes.error) throw new Error(reportsRes.error.message)

      const reportBackfill = (reportsRes.data || []).map((r) => ({
        id: `report-${r.id}`,
        direction: 'inbound',
        status: 'processed',
        phone_from: r.reported_by,
        phone_to: null,
        message: `Report condition=${r.condition}${r.notes ? ` | ${r.notes}` : ''}`,
        error_message: null,
        created_at: r.created_at,
        district: r.facility?.district || null,
        facility: { name: r.facility?.name || '-' },
        source: 'reports'
      }))

      const combined = [...(smsLogsRes.data || []), ...reportBackfill]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setLogs(combined)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const stats = {
    total: logs.length,
    inbound: logs.filter((log) => log.direction === 'inbound').length,
    outbound: logs.filter((log) => log.direction === 'outbound').length,
    failed: logs.filter((log) => log.status === 'failed').length
  }

  return (
    <AppLayout
      title="SMS Gateway Log"
      subtitle="Full inbound/outbound SMS history across all districts"
      actions={(
        <button
          onClick={fetchLogs}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Refresh
        </button>
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Inbound</p>
          <p className="text-2xl font-bold text-blue-700">{stats.inbound}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Outbound</p>
          <p className="text-2xl font-bold text-green-700">{stats.outbound}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Failed</p>
          <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-500">
          Loading SMS logs...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Time</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Direction</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Source</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">District</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Facility</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 align-top">
                    <td className="px-4 py-3 text-gray-600">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        log.direction === 'inbound' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {log.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        log.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{log.source || 'sms_gateway_logs'}</td>
                    <td className="px-4 py-3 text-gray-700">{log.phone_from || log.phone_to || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {log.district?.name ? `${log.district.name} (${log.district.region})` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{log.facility?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="max-w-md">
                        <p>{log.message}</p>
                        {log.error_message && (
                          <p className="text-xs text-red-600 mt-1">Error: {log.error_message}</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default AdminSmsGatewayLog
