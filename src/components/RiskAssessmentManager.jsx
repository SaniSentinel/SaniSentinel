import React, { useState, useEffect } from 'react'
import { 
  runRiskAssessment, 
  getFacilitiesByPriority,
  getHighRiskFacilities,
  getRiskDistribution,
  getPriorityColor,
  getPriorityIcon,
  formatRiskScore
} from '../lib/risk-scoring'

const RiskAssessmentManager = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [lastAssessment, setLastAssessment] = useState(null)
  const [riskDistribution, setRiskDistribution] = useState(null)
  const [highRiskFacilities, setHighRiskFacilities] = useState([])
  const [selectedPriority, setSelectedPriority] = useState('high')
  const [filteredFacilities, setFilteredFacilities] = useState([])
  const [error, setError] = useState(null)
  const [assessmentResults, setAssessmentResults] = useState(null)

  // Load initial data
  useEffect(() => {
    loadRiskData()
  }, [])

  // Load filtered facilities when priority changes
  useEffect(() => {
    if (selectedPriority) {
      loadFacilitiesByPriority(selectedPriority)
    }
  }, [selectedPriority])

  const loadRiskData = async () => {
    try {
      const [distribution, highRisk] = await Promise.all([
        getRiskDistribution(),
        getHighRiskFacilities()
      ])
      
      setRiskDistribution(distribution)
      setHighRiskFacilities(highRisk)
    } catch (error) {
      console.error('Error loading risk data:', error)
      setError('Failed to load risk data')
    }
  }

  const loadFacilitiesByPriority = async (priority) => {
    try {
      const facilities = await getFacilitiesByPriority(priority)
      setFilteredFacilities(facilities)
    } catch (error) {
      console.error('Error loading facilities by priority:', error)
    }
  }

  const handleRunAssessment = async (facilityIds = []) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await runRiskAssessment(facilityIds)
      
      if (result.success) {
        setLastAssessment(new Date())
        setAssessmentResults(result.data)
        await loadRiskData() // Refresh the data
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Failed to run risk assessment: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }

  const getRiskLevelDescription = (level) => {
    const descriptions = {
      critical: 'Immediate action required - facility should be out of service',
      high: 'Urgent attention needed - high risk of failure',
      medium: 'Moderate risk - schedule maintenance soon',
      low: 'Normal operations - continue regular monitoring'
    }
    return descriptions[level] || ''
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Risk Assessment Manager</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleRunAssessment()}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Assessing...
              </>
            ) : (
              <>
                🎯 Run Assessment
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Assessment Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Last Assessment</p>
            <p className="font-semibold">{formatTimestamp(lastAssessment)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Facilities</p>
            <p className="font-semibold">{riskDistribution?.total || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Average Risk Score</p>
            <p className="font-semibold">{riskDistribution?.average || 0}/100</p>
          </div>
        </div>
      </div>

      {/* Assessment Results Summary */}
      {assessmentResults && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            ✅ Latest Assessment Results
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Facilities Processed</p>
              <p className="font-semibold text-blue-800">{assessmentResults.summary?.total_facilities || 0}</p>
            </div>
            <div>
              <p className="text-gray-600">Facilities Updated</p>
              <p className="font-semibold text-blue-800">{assessmentResults.summary?.facilities_updated || 0}</p>
            </div>
            <div>
              <p className="text-gray-600">Need Attention</p>
              <p className="font-semibold text-orange-600">{assessmentResults.summary?.facilities_needing_attention || 0}</p>
            </div>
            <div>
              <p className="text-gray-600">Avg Risk Score</p>
              <p className="font-semibold text-gray-800">{assessmentResults.summary?.average_risk_score || 0}/100</p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Distribution */}
      {riskDistribution && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Critical</p>
                  <p className="text-2xl font-bold text-red-700">{riskDistribution.critical}</p>
                  <p className="text-xs text-red-500">80-100 risk score</p>
                </div>
                <span className="text-3xl">🚨</span>
              </div>
            </div>
            
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">High</p>
                  <p className="text-2xl font-bold text-orange-700">{riskDistribution.high}</p>
                  <p className="text-xs text-orange-500">60-79 risk score</p>
                </div>
                <span className="text-3xl">⚠️</span>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">Medium</p>
                  <p className="text-2xl font-bold text-yellow-700">{riskDistribution.medium}</p>
                  <p className="text-xs text-yellow-500">40-59 risk score</p>
                </div>
                <span className="text-3xl">⚡</span>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Low</p>
                  <p className="text-2xl font-bold text-green-700">{riskDistribution.low}</p>
                  <p className="text-xs text-green-500">0-39 risk score</p>
                </div>
                <span className="text-3xl">✅</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Priority Filter */}
      <div className="mb-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Priority:</label>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="critical">Critical (80-100)</option>
            <option value="high">High (60-79)</option>
            <option value="medium">Medium (40-59)</option>
            <option value="low">Low (0-39)</option>
          </select>
          <span className="text-sm text-gray-500">
            {filteredFacilities.length} facilities
          </span>
        </div>
      </div>

      {/* Facilities List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1)} Priority Facilities
        </h3>
        
        {filteredFacilities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No {selectedPriority} priority facilities found.</p>
            {selectedPriority === 'critical' && (
              <p className="text-sm mt-2">🎉 Great! No facilities require immediate attention.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFacilities.map((facility) => (
              <div key={facility.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-800">{facility.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(facility.risk_score)}`}>
                        {formatRiskScore(facility.risk_score)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Type:</span> {facility.type.replace('_', ' ')}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {facility.status}
                      </div>
                      <div>
                        <span className="font-medium">District:</span> {facility.districts?.name}
                      </div>
                      <div>
                        <span className="font-medium">Last Serviced:</span> {
                          facility.last_serviced 
                            ? new Date(facility.last_serviced).toLocaleDateString()
                            : 'Never'
                        }
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      {getRiskLevelDescription(selectedPriority)}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRunAssessment([facility.id])}
                    disabled={isLoading}
                    className="ml-4 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                  >
                    Re-assess
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RiskAssessmentManager