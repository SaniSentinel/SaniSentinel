import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const SMSConnectionTest = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [error, setError] = useState(null)

  const testSMSConnection = async () => {
    setIsLoading(true)
    setError(null)
    setTestResult(null)

    try {
      console.log('🧪 Testing SMS connection...')
      
      const { data, error } = await supabase.functions.invoke('send-sms-alert', {
        body: {
          test_mode: true, // SAFE: No actual SMS sent
          severity_filter: ['critical', 'high'],
          custom_message: 'Test connection from SaniSentinel React app'
        }
      })

      if (error) {
        setError(`SMS function error: ${error.message}`)
        return
      }

      if (data.success) {
        setTestResult(data)
        console.log('✅ SMS connection test successful!', data)
      } else {
        setError(data.error || 'SMS function returned error')
      }

    } catch (err) {
      setError(`Connection error: ${err.message}`)
      console.error('SMS connection test failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const testCustomSMS = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.functions.invoke('send-sms-alert', {
        body: {
          test_mode: true,
          worker_phones: ['+233241234567', '+233241234568'],
          custom_message: 'Test SMS from SaniSentinel system. This is a test message - please ignore.'
        }
      })

      if (error) {
        setError(`Custom SMS test error: ${error.message}`)
        return
      }

      if (data.success) {
        setTestResult(data)
        console.log('✅ Custom SMS test successful!', data)
      } else {
        setError(data.error || 'Custom SMS test failed')
      }

    } catch (err) {
      setError(`Custom SMS test error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📱 SMS Connection Test</h2>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">🔑 API Configuration</h3>
        <p className="text-sm text-blue-700">
          ✅ Africa's Talking API Key: Configured in .env file<br/>
          ✅ Username: sandbox (test mode)<br/>
          ✅ Supabase URL: {import.meta.env.VITE_SUPABASE_URL}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
          <div className="mt-2 text-sm">
            <p>💡 Troubleshooting tips:</p>
            <ul className="list-disc list-inside mt-1">
              <li>Make sure SMS function is deployed: <code>supabase functions deploy send-sms-alert</code></li>
              <li>Check that Supabase is running locally or function is deployed to production</li>
              <li>Verify API key is set in environment variables</li>
            </ul>
          </div>
        </div>
      )}

      {testResult && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-3">✅ SMS Test Results</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <p className="text-gray-600">Alerts Processed</p>
              <p className="font-semibold text-green-800">{testResult.summary?.alerts_processed || 0}</p>
            </div>
            <div>
              <p className="text-gray-600">SMS (Test Mode)</p>
              <p className="font-semibold text-green-800">{testResult.summary?.sms_sent || 0}</p>
            </div>
            <div>
              <p className="text-gray-600">Success Rate</p>
              <p className="font-semibold text-green-800">{testResult.summary?.success_rate || 0}%</p>
            </div>
            <div>
              <p className="text-gray-600">Test Mode</p>
              <p className="font-semibold text-blue-600">{testResult.test_mode ? 'ON' : 'OFF'}</p>
            </div>
          </div>

          {testResult.results && testResult.results.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">📋 Sample SMS Messages:</h4>
              <div className="space-y-2">
                {testResult.results.slice(0, 3).map((result, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800">
                        {result.facility_name || 'Custom Message'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {result.recipients} recipients
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {result.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <button
          onClick={testSMSConnection}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Testing...
            </>
          ) : (
            <>
              🧪 Test Alert-Based SMS
            </>
          )}
        </button>

        <button
          onClick={testCustomSMS}
          disabled={isLoading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Testing...
            </>
          ) : (
            <>
              📱 Test Custom SMS
            </>
          )}
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">📚 Next Steps</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✅ Test the connection with the buttons above</li>
          <li>✅ Verify SMS messages look correct in test mode</li>
          <li>✅ Check that workers have valid phone numbers in database</li>
          <li>✅ When ready, switch to production mode (test_mode: false)</li>
          <li>✅ Set up automatic triggers for critical alerts</li>
        </ul>
      </div>
    </div>
  )
}

export default SMSConnectionTest