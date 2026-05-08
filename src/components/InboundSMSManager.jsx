import React, { useState, useEffect } from 'react'
import { 
  testInboundSMS,
  getRecentSMSReports,
  getSMSReportingStats,
  validateSMSFormat,
  getSMSFormatExamples,
  getConditionAliases,
  formatPhoneForDisplay,
  extractSMSInfo,
  getFacilitiesForSMS
} from '../lib/inbound-sms'

const InboundSMSManager = () => {
  const [testSMS, setTestSMS] = useState('F1#A#good')
  const [testPhone, setTestPhone] = useState('+233241234567')
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [recentReports, setRecentReports] = useState([])
  const [smsStats, setSmsStats] = useState(null)
  const [facilities, setFacilities] = useState([])
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('test')
  const [validationResult, setValidationResult] = useState(null)

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  // Validate SMS format when test SMS changes
  useEffect(() => {
    if (testSMS) {
      const validation = validateSMSFormat(testSMS)
      setValidationResult(validation)
    }
  }, [testSMS])

  const loadData = async () => {
    try {
      const [reports, stats, facilitiesList] = await Promise.all([
        getRecentSMSReports(20),
        getSMSReportingStats(7),
        getFacilitiesForSMS()
      ])
      
      setRecentReports(reports)
      setSmsStats(stats)
      setFacilities(facilitiesList)
    } catch (error) {
      console.error('Error loading SMS data:', error)
      setError('Failed to load SMS data')
    }
  }

  const handleTestSMS = async () => {
    setIsLoading(true)
    setError(null)
    setTestResult(null)
    
    try {
      const result = await testInboundSMS(testSMS, testPhone)
      setTestResult(result)
      
      if (result.success) {
        // Refresh data to show new report
        await loadData()
      }
    } catch (error) {
      setError('Failed to test SMS: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleClick = (example) => {
    setTestSMS(example.message)
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const getConditionColor = (condition) => {
    const colors = {
      good: 'text-green-600 bg-green-100',
      damaged: 'text-yellow-600 bg-yellow-100',
      overflow: 'text-red-600 bg-red-100',
      dry: 'text-orange-600 bg-orange-100',
      blocked: 'text-purple-600 bg-purple-100',
      out_of_service: 'text-gray-600 bg-gray-100'
    }
    return colors[condition] || 'text-gray-600 bg-gray-100'
  }

  const examples = getSMSFormatExamples()
  const conditionAliases = getConditionAliases()

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inbound SMS Manager</h2>
        <div className="text-sm text-gray-600">
          📱 SMS Format: F{'{ID}'}#{'{BLOCK}'}#{'{CONDITION}'}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* SMS Statistics */}
      {smsStats && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 SMS Reporting Statistics (Last 7 Days)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{smsStats.total_reports}</p>
              <p className="text-sm text-gray-600">Total Reports</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{smsStats.sms_reports}</p>
              <p className="text-sm text-gray-600">SMS Reports</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{smsStats.unique_reporters}</p>
              <p className="text-sm text-gray-600">Unique Reporters</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{smsStats.reports_per_day}</p>
              <p className="text-sm text-gray-600">Reports/Day</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('test')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'test'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Test SMS
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recent Reports
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'guide'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              SMS Guide
            </button>
          </nav>
        </div>
      </div>

      {/* Test SMS Tab */}
      {activeTab === 'test' && (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SMS Testing */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Test SMS Processing</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMS Message
                  </label>
                  <input
                    type="text"
                    value={testSMS}
                    onChange={(e) => setTestSMS(e.target.value)}
                    placeholder="F123#A#good"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+233241234567"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Validation Result */}
                {validationResult && (
                  <div className={`p-3 rounded-lg border ${
                    validationResult.is_valid 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {validationResult.is_valid ? '✅' : '❌'}
                      </span>
                      <span className={`font-medium ${
                        validationResult.is_valid ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {validationResult.is_valid ? 'Valid SMS Format' : 'Invalid SMS Format'}
                      </span>
                    </div>
                    
                    {validationResult.is_valid ? (
                      <div className="text-sm text-green-700">
                        <p>Facility ID: {validationResult.facility_id}</p>
                        <p>Block: {validationResult.block_number}</p>
                        <p>Condition: {validationResult.condition}</p>
                      </div>
                    ) : (
                      <div className="text-sm text-red-700">
                        <p className="mb-2">Error: {validationResult.error}</p>
                        {validationResult.suggestions.length > 0 && (
                          <div>
                            <p className="font-medium">Suggestions:</p>
                            <ul className="list-disc list-inside">
                              {validationResult.suggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleTestSMS}
                  disabled={isLoading || !validationResult?.is_valid}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing SMS...
                    </>
                  ) : (
                    <>
                      📱 Test SMS Processing
                    </>
                  )}
                </button>
              </div>

              {/* Test Result */}
              {testResult && (
                <div className={`mt-4 p-4 rounded-lg border ${
                  testResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.success ? '✅ SMS Processed Successfully' : '❌ SMS Processing Failed'}
                  </h4>
                  
                  {testResult.success ? (
                    <div className="text-sm text-green-700">
                      <p><strong>Message:</strong> {testResult.data.message}</p>
                      <p><strong>Facility:</strong> {testResult.data.report.facility_name}</p>
                      <p><strong>District:</strong> {testResult.data.report.district}</p>
                      <p><strong>Block:</strong> {testResult.data.report.block}</p>
                      <p><strong>Condition:</strong> {testResult.data.report.condition}</p>
                      <p><strong>Report ID:</strong> {testResult.data.report.id}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-red-700">
                      <p><strong>Error:</strong> {testResult.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Examples */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">SMS Format Examples</h3>
              
              <div className="space-y-2">
                {examples.map((example, index) => (
                  <div 
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="font-mono text-blue-600 font-medium">
                      {example.message}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {example.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Recent SMS Reports ({recentReports.length})
            </h3>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
            >
              🔄 Refresh
            </button>
          </div>

          {recentReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No SMS reports found.</p>
              <p className="text-sm mt-2">Test the SMS function or wait for incoming messages.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report) => {
                const smsInfo = extractSMSInfo(report.notes)
                
                return (
                  <div key={report.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-800">{report.facilities.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getConditionColor(report.condition)}`}>
                            {report.condition.toUpperCase()}
                          </span>
                          {smsInfo.is_sms_report && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              📱 SMS
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                          <div>
                            <span className="font-medium">Reporter:</span> {formatPhoneForDisplay(report.reported_by)}
                          </div>
                          <div>
                            <span className="font-medium">District:</span> {report.facilities.districts.name}
                          </div>
                          {smsInfo.block && (
                            <div>
                              <span className="font-medium">Block:</span> {smsInfo.block}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Time:</span> {formatTimestamp(report.created_at)}
                          </div>
                        </div>
                        
                        {smsInfo.raw_message && (
                          <div className="bg-gray-50 p-2 rounded text-sm">
                            <span className="font-medium text-gray-700">Original SMS:</span> 
                            <span className="font-mono ml-2">{smsInfo.raw_message}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* SMS Guide Tab */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📱 SMS Reporting Guide</h3>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">SMS Format</h4>
              <p className="text-blue-700 font-mono text-lg">F{'{facility_id}'}#{'{block}'}#{'{condition}'}</p>
              <p className="text-blue-600 text-sm mt-2">
                Send SMS in this exact format to report facility conditions
              </p>
            </div>
          </div>

          {/* Facility Reference */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">🏢 Facility Reference</h4>
            <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
              {facilities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {facilities.slice(0, 10).map((facility) => (
                    <div key={facility.id} className="bg-white p-3 rounded border">
                      <div className="font-medium text-gray-800">{facility.name}</div>
                      <div className="text-sm text-gray-600">{facility.districts.name}</div>
                      <div className="font-mono text-blue-600 text-sm mt-1">
                        SMS ID: F{facility.sms_id}
                      </div>
                      <div className="font-mono text-xs text-gray-500">
                        Example: {facility.sms_example}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Loading facilities...</p>
              )}
            </div>
          </div>

          {/* Condition Reference */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">📋 Condition Reference</h4>
            <div className="space-y-3">
              {Object.entries(conditionAliases).map(([category, conditions]) => (
                <div key={category} className="bg-gray-50 p-3 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-2">{category}</h5>
                  <div className="flex flex-wrap gap-2">
                    {conditions.map((condition) => (
                      <span 
                        key={condition}
                        className="px-2 py-1 bg-white text-gray-700 text-sm rounded border"
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Examples */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">💡 Examples</h4>
            <div className="space-y-2">
              {examples.map((example, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-mono text-blue-600 font-medium">
                    {example.message}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {example.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InboundSMSManager