import React from 'react'

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Dashboard Loading Error
            </h2>
            <p className="text-gray-600 mb-6">
              There was an issue loading the admin dashboard. This is likely due to a realtime subscription conflict.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/legacy-admin-dashboard'}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Use Legacy Dashboard
              </button>
            </div>
            <div className="mt-6 text-xs text-gray-500">
              <details>
                <summary className="cursor-pointer">Technical Details</summary>
                <pre className="mt-2 text-left bg-gray-50 p-2 rounded text-xs overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default DashboardErrorBoundary