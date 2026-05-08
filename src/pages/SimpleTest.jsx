import React from 'react'
import { Link } from 'react-router-dom'

const SimpleTest = () => {
  console.log('🧪 SimpleTest component rendered')
  
  return (
    <div className="fixed inset-0 bg-blue-100 flex flex-col">
      <div className="bg-white shadow p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Simple Test Page</h1>
          <nav className="flex space-x-4">
            <Link to="/" className="text-blue-600 hover:underline">Home</Link>
            <Link to="/simple-test" className="text-gray-900 font-bold">Test</Link>
          </nav>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-green-600 mb-4">✅ Success!</h2>
          <p className="text-lg text-gray-700 mb-4">
            This simple test page is working correctly.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            If you can see this, React routing and basic rendering are functional.
          </p>
          <div className="space-y-2 text-left">
            <div>✅ React component rendered</div>
            <div>✅ CSS classes applied</div>
            <div>✅ Navigation working</div>
            <div>✅ Fixed positioning working</div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <div className="text-sm text-left">
              <div>Current URL: {window.location.pathname}</div>
              <div>Timestamp: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleTest