import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const QuickActionPanel = ({ stats, alertSummary }) => {
  const [selectedAction, setSelectedAction] = useState(null)
  const [isExecuting, setIsExecuting] = useState(false)

  // Quick action definitions
  const quickActions = [
    {
      id: 'emergency-alert',
      title: 'Emergency Broadcast',
      description: 'Send emergency alert to all districts',
      icon: '🚨',
      color: 'red',
      category: 'emergency',
      requiresConfirmation: true,
      estimatedTime: '2-3 minutes',
      action: () => {
        // This would integrate with SMS gateway
        console.log('Emergency broadcast initiated')
      }
    },
    {
      id: 'system-backup',
      title: 'Manual Backup',
      description: 'Trigger immediate system backup',
      icon: '💾',
      color: 'blue',
      category: 'maintenance',
      requiresConfirmation: false,
      estimatedTime: '5-10 minutes',
      action: () => {
        console.log('Manual backup initiated')
      }
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Create comprehensive system report',
      icon: '📊',
      color: 'green',
      category: 'reporting',
      requiresConfirmation: false,
      estimatedTime: '1-2 minutes',
      action: () => {
        console.log('Report generation initiated')
      }
    },
    {
      id: 'sync-climate-data',
      title: 'Sync Climate Data',
      description: 'Update weather and climate information',
      icon: '🌤️',
      color: 'yellow',
      category: 'data',
      requiresConfirmation: false,
      estimatedTime: '30 seconds',
      action: () => {
        console.log('Climate data sync initiated')
      }
    },
    {
      id: 'maintenance-mode',
      title: 'Maintenance Mode',
      description: 'Enable system maintenance mode',
      icon: '🔧',
      color: 'orange',
      category: 'maintenance',
      requiresConfirmation: true,
      estimatedTime: 'Immediate',
      action: () => {
        console.log('Maintenance mode toggled')
      }
    },
    {
      id: 'clear-cache',
      title: 'Clear System Cache',
      description: 'Clear application and database cache',
      icon: '🗑️',
      color: 'purple',
      category: 'performance',
      requiresConfirmation: false,
      estimatedTime: '10-15 seconds',
      action: () => {
        console.log('System cache cleared')
      }
    }
  ]

  // System shortcuts
  const systemShortcuts = [
    {
      title: 'User Management',
      description: 'Manage district officers and permissions',
      icon: '👥',
      link: '/admin/users',
      count: '12 active officers'
    },
    {
      title: 'SMS Gateway Logs',
      description: 'Monitor SMS delivery and errors',
      icon: '📱',
      link: '/admin/sms-logs',
      count: `${Math.round(Math.random() * 50)} messages today`
    },
    {
      title: 'System Configuration',
      description: 'Adjust system settings and parameters',
      icon: '⚙️',
      link: '/admin/system-config',
      count: 'Risk thresholds, alerts'
    },
    {
      title: 'Data Export',
      description: 'Export reports and analytics data',
      icon: '📤',
      link: '/admin/reports-exports',
      count: 'CSV, PDF, Excel formats'
    }
  ]

  // Critical alerts that need immediate attention
  const criticalAlerts = [
    {
      id: 1,
      type: 'facility_critical',
      message: `${stats.facilities?.critical || 0} facilities in critical condition`,
      severity: 'high',
      action: 'View Critical Facilities',
      link: '/facility-map?filter=critical'
    },
    {
      id: 2,
      type: 'system_performance',
      message: 'High system load detected',
      severity: 'medium',
      action: 'Check Performance',
      link: '/admin/system-monitoring'
    },
    {
      id: 3,
      type: 'backup_status',
      message: 'Last backup completed 2 hours ago',
      severity: 'low',
      action: 'View Backup Status',
      link: '/admin/backup-status'
    }
  ]

  const getColorClasses = (color, type = 'bg') => {
    const colorMap = {
      red: type === 'bg' ? 'bg-red-500' : type === 'text' ? 'text-red-700' : type === 'border' ? 'border-red-200' : 'bg-red-50',
      blue: type === 'bg' ? 'bg-blue-500' : type === 'text' ? 'text-blue-700' : type === 'border' ? 'border-blue-200' : 'bg-blue-50',
      green: type === 'bg' ? 'bg-green-500' : type === 'text' ? 'text-green-700' : type === 'border' ? 'border-green-200' : 'bg-green-50',
      yellow: type === 'bg' ? 'bg-yellow-500' : type === 'text' ? 'text-yellow-700' : type === 'border' ? 'border-yellow-200' : 'bg-yellow-50',
      orange: type === 'bg' ? 'bg-orange-500' : type === 'text' ? 'text-orange-700' : type === 'border' ? 'border-orange-200' : 'bg-orange-50',
      purple: type === 'bg' ? 'bg-purple-500' : type === 'text' ? 'text-purple-700' : type === 'border' ? 'border-purple-200' : 'bg-purple-50'
    }
    return colorMap[color] || colorMap.blue
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-100 border-green-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const executeAction = async (action) => {
    if (action.requiresConfirmation && !window.confirm(`Are you sure you want to ${action.title.toLowerCase()}?`)) {
      return
    }

    setIsExecuting(true)
    setSelectedAction(action.id)

    try {
      // Simulate action execution
      await new Promise(resolve => setTimeout(resolve, 2000))
      action.action()
      
      // Show success message (in real app, use toast notification)
      alert(`${action.title} completed successfully!`)
    } catch (error) {
      alert(`Error executing ${action.title}: ${error.message}`)
    } finally {
      setIsExecuting(false)
      setSelectedAction(null)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <p className="text-sm text-gray-600">
            System administration and emergency controls
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-600 font-medium">Ready</span>
        </div>
      </div>

      {/* Critical Alerts Section */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Attention Required</h4>
        <div className="space-y-2">
          {criticalAlerts.map(alert => (
            <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-medium">{alert.message}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border mt-1 ${getSeverityColor(alert.severity)}`}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>
              <Link
                to={alert.link}
                className="ml-3 text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
              >
                {alert.action}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">System Actions</h4>
        <div className="grid grid-cols-1 gap-3">
          {quickActions.map(action => (
            <button
              key={action.id}
              onClick={() => executeAction(action)}
              disabled={isExecuting}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                selectedAction === action.id 
                  ? `${getColorClasses(action.color, 'light')} ${getColorClasses(action.color, 'border')}` 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              } ${isExecuting ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg ${getColorClasses(action.color, 'bg')} bg-opacity-10 flex items-center justify-center`}>
                  <span className="text-lg">{action.icon}</span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">{action.title}</div>
                  <div className="text-xs text-gray-600">{action.description}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {selectedAction === action.id && isExecuting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-xs text-gray-600">Executing...</span>
                  </div>
                ) : (
                  <>
                    <span className="text-xs text-gray-500">{action.estimatedTime}</span>
                    {action.requiresConfirmation && (
                      <span className="text-xs text-orange-600 font-medium">⚠️</span>
                    )}
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* System Shortcuts */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">System Shortcuts</h4>
        <div className="space-y-2">
          {systemShortcuts.map((shortcut, index) => (
            <Link
              key={index}
              to={shortcut.link}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <span className="text-lg">{shortcut.icon}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{shortcut.title}</div>
                  <div className="text-xs text-gray-600">{shortcut.description}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">{shortcut.count}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* System Status Summary */}
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {stats.facilities?.total || 0}
            </div>
            <div className="text-xs text-gray-600">Total Facilities</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-600">
              {alertSummary?.critical || 0}
            </div>
            <div className="text-xs text-gray-600">Critical Alerts</div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <Link
            to="/admin/emergency-procedures"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <span className="mr-2">🚨</span>
            Emergency Procedures
          </Link>
        </div>
      </div>
    </div>
  )
}

export default QuickActionPanel