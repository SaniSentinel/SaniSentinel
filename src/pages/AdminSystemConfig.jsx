import React from 'react'
import AppLayout from '../components/Layout/AppLayout'
import { supabase } from '../lib/supabase'

const AdminSystemConfig = () => {
  const [riskConfig, setRiskConfig] = React.useState({
    climate_weight: 0.3,
    condition_weight: 1,
    maintenance_weight: 1,
    reports_weight: 1,
    location_weight: 1,
    critical_threshold: 80,
    high_threshold: 60,
    medium_threshold: 40,
    low_threshold: 20
  })
  const [savingConfig, setSavingConfig] = React.useState(false)
  const [riskConfigMessage, setRiskConfigMessage] = React.useState('')

  React.useEffect(() => {
    const loadRiskConfig = async () => {
      const { data, error } = await supabase.rpc('get_active_risk_scoring_config').single()
      if (!error && data) {
        setRiskConfig({
          climate_weight: Number(data.climate_weight ?? 0.3),
          condition_weight: Number(data.condition_weight ?? 1),
          maintenance_weight: Number(data.maintenance_weight ?? 1),
          reports_weight: Number(data.reports_weight ?? 1),
          location_weight: Number(data.location_weight ?? 1),
          critical_threshold: Number(data.critical_threshold ?? 80),
          high_threshold: Number(data.high_threshold ?? 60),
          medium_threshold: Number(data.medium_threshold ?? 40),
          low_threshold: Number(data.low_threshold ?? 20)
        })
      }
    }

    loadRiskConfig()
  }, [])

  const saveRiskConfig = async () => {
    try {
      setSavingConfig(true)
      setRiskConfigMessage('')
      const { error } = await supabase.rpc('upsert_risk_scoring_config', {
        p_climate_weight: riskConfig.climate_weight,
        p_condition_weight: riskConfig.condition_weight,
        p_maintenance_weight: riskConfig.maintenance_weight,
        p_reports_weight: riskConfig.reports_weight,
        p_location_weight: riskConfig.location_weight,
        p_critical_threshold: riskConfig.critical_threshold,
        p_high_threshold: riskConfig.high_threshold,
        p_medium_threshold: riskConfig.medium_threshold,
        p_low_threshold: riskConfig.low_threshold
      })
      if (error) throw error
      setRiskConfigMessage('Risk scoring config saved.')
    } catch (err) {
      setRiskConfigMessage(`Failed to save config: ${err.message}`)
    } finally {
      setSavingConfig(false)
    }
  }

  return (
    <AppLayout
      title="System Config"
      subtitle="Adjust risk scoring formula weights and thresholds"
      actions={(
        <button
          onClick={saveRiskConfig}
          disabled={savingConfig}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60"
        >
          {savingConfig ? 'Saving...' : 'Save Config'}
        </button>
      )}
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {riskConfigMessage && (
          <p className="text-sm text-gray-600 mb-4">{riskConfigMessage}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="text-sm text-gray-700">Climate Weight
            <input type="number" min="0" max="3" step="0.05" value={riskConfig.climate_weight}
              onChange={(e) => setRiskConfig({ ...riskConfig, climate_weight: Number(e.target.value) })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
          </label>
          <label className="text-sm text-gray-700">Condition Weight
            <input type="number" min="0" max="3" step="0.05" value={riskConfig.condition_weight}
              onChange={(e) => setRiskConfig({ ...riskConfig, condition_weight: Number(e.target.value) })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
          </label>
          <label className="text-sm text-gray-700">Maintenance Weight
            <input type="number" min="0" max="3" step="0.05" value={riskConfig.maintenance_weight}
              onChange={(e) => setRiskConfig({ ...riskConfig, maintenance_weight: Number(e.target.value) })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
          </label>
          <label className="text-sm text-gray-700">Reports Weight
            <input type="number" min="0" max="3" step="0.05" value={riskConfig.reports_weight}
              onChange={(e) => setRiskConfig({ ...riskConfig, reports_weight: Number(e.target.value) })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
          </label>
          <label className="text-sm text-gray-700">Location Weight
            <input type="number" min="0" max="3" step="0.05" value={riskConfig.location_weight}
              onChange={(e) => setRiskConfig({ ...riskConfig, location_weight: Number(e.target.value) })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
          </label>
          <label className="text-sm text-gray-700">Critical Threshold
            <input type="number" min="1" max="100" step="1" value={riskConfig.critical_threshold}
              onChange={(e) => setRiskConfig({ ...riskConfig, critical_threshold: Number(e.target.value) })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
          </label>
        </div>
      </div>
    </AppLayout>
  )
}

export default AdminSystemConfig
