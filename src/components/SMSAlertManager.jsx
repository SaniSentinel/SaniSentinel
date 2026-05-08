import React, { useState, useEffect } from 'react'
import { 
  sendSMSForAlerts,
  sendSMSForFacilities,
  sendCustomSMS,
  sendSMSForRecentCriticalAlerts,
  getAlertsNeedingSMS,
  getSMSAlertStats,
  getWorkersByRole,
  getSMSTemplate,
  calculateSMSCost,
  formatPhoneNumber,
  isValidPhoneNumber
} from '../lib/sms-alerts'

const SMSAlertManager = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [alertStats, setAlertStats] = useState(null)
  const [alertsNeedingSMS, setAlertsNeedingSMS] = useState([])
  const [selectedAlerts, setSelectedAlerts] = useState([])
  const [workers, setWorkers] = useState([])
  const [selectedWorkers, setSelectedWorkers] = useState([])
  const [customMessage, setCustomMessage] = useState('')
  const [testMode, setTestMode] = useState(true)
  const [error, setError] = useState(null)
  const [smsResults, setSmsResults] = useState(null)
  const [activeTab, setActiveTab] = useState('alerts')

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [stats, alerts, allWorkers] = await Promise.all([
        getSMSAlertStats(),
        getAlertsNeedingSMS(['critical', 'high'], 24),
        getWorkersByRole('field_worker') // Start with field workers
      ])
      
      setAlertStats(stats)
      setAlertsNeedingSMS(alerts)
      setWorkers(allWorkers)
    } catch (error) {
      console.error('Error loading SMS data:', error)
      setError('Failed to load SMS data')
    }
  }

  const handleSendSMSForAlerts = async () => {
    if (selectedAlerts.length === 0) {
      setError('Please select at least one alert')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const result = await sendSMSForAlerts(selectedAlerts, testMode)
      
      if (result.success) {
        setSmsResults(result.data)
        setSelectedAlerts([])
        await loadData() // Refresh data
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Failed to send SMS alerts: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendCriticalAlerts = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await sendSMSForRecentCriticalAlerts(testMode)
      
      if (result.success) {
        setSmsResults(result.data)
        await loadData() // Refresh data
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Failed to send critical alerts: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendCustomSMS = async () => {
    if (selectedWorkers.length === 0) {
      setError('Please select at least one worker')
      return
    }

    if (!customMessage.trim()) {
      setError('Please enter a custom message')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const workerPhones = selectedWorkers.map(workerId => {
        const worker = workers.find(w => w.id === workerId)
        return worker ? formatPhoneNumber(worker.phone) : null
      }).filter(Boolean)

      const result = await sendCustomSMS(workerPhones, customMessage, testMode)
      
      if (result.success) {
        setSmsResults(result.data)
        setSelectedWorkers([])
        setCustomMessage('')
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Failed to send custom SMS: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAlertSelection = (alertId) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    )
  }

  const handleWorkerSelection = (workerId) => {
    setSelectedWorkers(prev => 
      prev.includes(workerId) 
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    )
  }

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'text-red-600 bg-red-100 border-red-200',
      high: 'text-orange-600 bg-orange-100 border-orange-200',
      medium: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      low: 'text-green-600 bg-green-100 border-green-200'
    }
    return colors[severity] || 'text-gray-600 bg-gray-100 border-gray-200'
  }

  const getSeverityIcon = (severity) => {
    const icons = {
      critical: '🚨',
      high: '⚠️',
      medium: '⚡',
      low: '📋'
    }
    return icons[severity] || '📋'
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const estimatedCost = selectedAlerts.length * 0.01 // Rough estimate

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">SMS Alert Manager</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium">Test Mode</span>
          </label>
          {testMode && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              No SMS will be sent
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* SMS Statistics */}
      {alertStats && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">SMS Alert Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{alertStats.total_unresolved}</p>
              <p className="text-sm text-gray-600">Total Unresolved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{alertStats.critical}</p>
              <p className="text-sm text-gray-600">Critical</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{alertStats.high}</p>
              <p className="text-sm text-gray-600">High</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{alertStats.medium}</p>
              <p className="text-sm text-gray-600">Medium</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{alertStats.active_workers}</p>
              <p className="text-sm text-gray-600">Active Workers</p>
            </div>
          </div>
        </div>
      )}

      {/* SMS Results */}
      {smsResults && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            ✅ SMS Results
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Alerts Processed</p>
              <p className="font-semibold text-blue-800">{smsResults.summary?.alerts_processed || 0}</p>
            </div>
            <div>
              <p className="text-gray-600">SMS Sent</p>
              <p className="font-semibold text-blue-800">{smsResults.summary?.sms_sent || 0}</p>
            </div>
            <div>
              <p className="text-gray-600">Success Rate</p>
              <p className="font-semibold text-green-600">{smsResults.summary?.success_rate || 0}%</p>
            </div>
            <div>
              <p className="text-gray-600">Errors</p>
              <p className="font-semibold text-red-600">{smsResults.summary?.errors || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alert-Based SMS
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'custom'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Custom SMS
            </button>
          </nav>
        </div>
      </div>

      {/* Alert-Based SMS Tab */}
      {activeTab === 'alerts' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Alerts Needing SMS ({alertsNeedingSMS.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleSendCriticalAlerts}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    🚨 Send Critical Alerts
                  </>
                )}
              </button>
              
              <button
                onClick={handleSendSMSForAlerts}
                disabled={isLoading || selectedAlerts.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    📱 Send Selected ({selectedAlerts.length})
                  </>
                )}
              </button>
            </div>
          </div>

          {selectedAlerts.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Selected {selectedAlerts.length} alerts • Estimated cost: ${calculateSMSCost(selectedAlerts.length).toFixed(4)}
              </p>
            </div>
          )}

          {alertsNeedingSMS.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>🎉 No critical or high-priority alerts need SMS notification!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertsNeedingSMS.map((alert) => (
                <div key={alert.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.includes(alert.id)}
                      onChange={() => handleAlertSelection(alert.id)}
                      className="mt-1 rounded"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                        <h4 className="font-semibold text-gray-800">{alert.facilities.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">{alert.alert_type.replace('_', ' ')}</span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {alert.facilities.districts.name} District • {formatTimestamp(alert.created_at)}
                      </p>
                      
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <p className="font-medium text-gray-700 mb-1">SMS Preview:</p>
                        <p className="text-gray-600">
                          {getSMSTemplate(alert.alert_type, alert.facilities.name, alert.facilities.districts.name)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom SMS Tab */}
      {activeTab === 'custom' && (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Worker Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Select Workers ({selectedWorkers.length} selected)
              </h3>
              
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                {workers.map((worker) => (
                  <div key={worker.id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedWorkers.includes(worker.id)}
                        onChange={() => handleWorkerSelection(worker.id)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{worker.name}</p>
                        <p className="text-sm text-gray-600">
                          {formatPhoneNumber(worker.phone)} • {worker.role.replace('_', ' ')} • {worker.districts.name}
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Composition */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Custom Message</h3>
              
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your custom SMS message..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={160}
              />
              
              <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                <span>{customMessage.length}/160 characters</span>
                <span>Est. cost: ${calculateSMSCost(selectedWorkers.length).toFixed(4)}</span>
              </div>
              
              <button
                onClick={handleSendCustomSMS}
                disabled={isLoading || selectedWorkers.length === 0 || !customMessage.trim()}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending Custom SMS...
                  </>
                ) : (
                  <>
                    📱 Send Custom SMS to {selectedWorkers.length} Workers
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SMSAlertManager