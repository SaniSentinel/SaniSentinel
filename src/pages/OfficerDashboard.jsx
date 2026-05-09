import React, { useEffect, useMemo, useState } from 'react'
import AppLayout from '../components/Layout/AppLayout'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const OfficerDashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [districtName, setDistrictName] = useState('')
  const [stats, setStats] = useState({
    totalFacilities: 0,
    criticalFacilities: 0,
    openTasks: 0
  })

  const districtId = user?.district_id || null

  useEffect(() => {
    const loadDistrictSummary = async () => {
      if (!districtId) {
        setLoading(false)
        setError('No district assigned to this officer account.')
        return
      }

      try {
        setLoading(true)
        setError(null)

        const [districtRes, facilitiesRes, tasksRes] = await Promise.all([
          supabase.from('districts').select('name').eq('id', districtId).single(),
          supabase
            .from('facilities')
            .select('id, risk_score')
            .eq('district_id', districtId),
          supabase
            .from('maintenance_tasks')
            .select('id, status, facility:facilities!inner(district_id)')
            .eq('facility.district_id', districtId)
            .in('status', ['pending', 'in_progress'])
        ])

        if (districtRes.error) throw new Error(districtRes.error.message)
        if (facilitiesRes.error) throw new Error(facilitiesRes.error.message)
        if (tasksRes.error) throw new Error(tasksRes.error.message)

        const facilityRows = facilitiesRes.data || []
        const criticalCount = facilityRows.filter((f) => (f.risk_score || 0) >= 85).length

        setDistrictName(districtRes.data?.name || '')
        setStats({
          totalFacilities: facilityRows.length,
          criticalFacilities: criticalCount,
          openTasks: (tasksRes.data || []).length
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadDistrictSummary()
  }, [districtId])

  if (user?.role !== 'district_officer') {
    return null
  }

  const cards = [
    { title: 'Facilities in My District', value: stats.totalFacilities, icon: '🏢', color: 'text-blue-700' },
    { title: 'My Critical Count', value: stats.criticalFacilities, icon: '🚨', color: 'text-red-700' },
    { title: 'My Open Tasks', value: stats.openTasks, icon: '🔧', color: 'text-amber-700' }
  ]

  return (
    <AppLayout
      title="Officer Dashboard"
      subtitle={districtName ? `${districtName} District overview` : 'District overview'}
    >
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">{card.title}</p>
              <span className="text-xl">{card.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${card.color}`}>{loading ? '...' : card.value}</p>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}

export default OfficerDashboard
