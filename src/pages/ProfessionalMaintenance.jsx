import React, { useState, useEffect, useCallback } from 'react'
import AppLayout from '../components/Layout/AppLayout'
import StatusBadge from '../components/UI/StatusBadge'
import MetricCard from '../components/UI/MetricCard'
import { maintenance } from '../lib/maintenance'
import { workers } from '../lib/workers'
import { useAuth } from '../hooks/useAuth'

const ProfessionalMaintenance = () => {
  const { user } = useAuth()
  const isOfficer = user?.role === 'district_officer'

  const [districtWorkers, setDistrictWorkers] = useState([])
  const [notesTask, setNotesTask] = useState(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [tasks, setTasks] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState({})
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    urgent: 0,
    overdue: 0
  })

  // Filter states
  const [filters, setFilters] = useState({
    status: 'open', // 'open', 'all', 'pending', 'assigned', 'in_progress', 'completed'
    priority: 'all',
    taskType: 'all',
    district: 'all',
    worker: 'all',
    overdue: false
  })

  // Available options for filters
  const [availableDistricts, setAvailableDistricts] = useState([])
  const [availableWorkers, setAvailableWorkers] = useState([])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Load maintenance tasks
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get all tasks with related data
      const result = await maintenance.getAll(500)
      
      if (result.error) {
        throw new Error(result.error)
      }

      const tasksData = result.data || []
      setTasks(tasksData)

      // Calculate stats
      const newStats = {
        total: tasksData.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length,
        pending: tasksData.filter(t => t.status === 'pending').length,
        assigned: tasksData.filter(t => t.status === 'assigned').length,
        inProgress: tasksData.filter(t => t.status === 'in_progress').length,
        urgent: tasksData.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
        overdue: tasksData.filter(t => {
          const today = new Date().toISOString().split('T')[0]
          return t.due_date < today && t.status !== 'completed' && t.status !== 'cancelled'
        }).length
      }
      setStats(newStats)

      // Extract unique districts and workers
      const districts = new Set()
      const workers = new Set()
      
      tasksData.forEach(task => {
        if (task.facility?.district?.name) {
          districts.add(task.facility.district.name)
        }
        if (task.worker?.name) {
          workers.add(JSON.stringify({
            id: task.worker.id,
            name: task.worker.name,
            role: task.worker.role
          }))
        }
      })
      
      setAvailableDistricts(Array.from(districts).sort())
      setAvailableWorkers(
        Array.from(workers)
          .map(w => JSON.parse(w))
          .sort((a, b) => a.name.localeCompare(b.name))
      )

    } catch (err) {
      console.error('Error loading maintenance tasks:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Apply filters to tasks
  useEffect(() => {
    let filtered = [...tasks]

    // Status filter
    if (filters.status === 'open') {
      filtered = filtered.filter(task => 
        ['pending', 'assigned', 'in_progress'].includes(task.status)
      )
    } else if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status)
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority)
    }

    // Task type filter
    if (filters.taskType !== 'all') {
      filtered = filtered.filter(task => task.task_type === filters.taskType)
    }

    // District filter
    if (filters.district !== 'all') {
      filtered = filtered.filter(task => 
        task.facility?.district?.name === filters.district
      )
    }

    // Worker filter
    if (filters.worker !== 'all') {
      filtered = filtered.filter(task => task.worker?.id === filters.worker)
    }

    // Overdue filter
    if (filters.overdue) {
      const today = new Date().toISOString().split('T')[0]
      filtered = filtered.filter(task => 
        task.due_date < today && task.status !== 'completed' && task.status !== 'cancelled'
      )
    }

    // Sort by priority and due date
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 1, high: 2, medium: 3, low: 4 }
      const aPriority = priorityOrder[a.priority] || 5
      const bPriority = priorityOrder[b.priority] || 5
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      return new Date(a.due_date) - new Date(b.due_date)
    })

    setFilteredTasks(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [tasks, filters])

  // Load initial data
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  useEffect(() => {
    const loadDistrictWorkers = async () => {
      if (!isOfficer || !user?.district_id) return
      const res = await workers.getForNotification({ district_id: user.district_id })
      if (!res.error) {
        setDistrictWorkers(res.data || [])
      }
    }
    loadDistrictWorkers()
  }, [isOfficer, user?.district_id])

  useEffect(() => {
    if (!isOfficer || !loadTasks) return
    const sub = maintenance.subscribeToTasks(() => {
      loadTasks()
    })
    return () => maintenance.unsubscribe(sub)
  }, [isOfficer, loadTasks])

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: 'open',
      priority: 'all',
      taskType: 'all',
      district: 'all',
      worker: 'all',
      overdue: false
    })
  }

  const handleAssignWorkerChange = async (taskId, workerIdRaw) => {
    const workerId = workerIdRaw || null
    try {
      setActionLoading((prev) => ({ ...prev, [taskId]: true }))
      if (!workerId) {
        const result = await maintenance.update(taskId, { assigned_to: null, status: 'pending' })
        if (result.error) throw new Error(result.error)
      } else {
        const result = await maintenance.assign(taskId, workerId)
        if (result.error) throw new Error(result.error)
      }
      await loadTasks()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Could not assign worker')
    } finally {
      setActionLoading((prev) => ({ ...prev, [taskId]: false }))
    }
  }

  const openNotesModal = (task) => {
    setNotesTask(task)
    setNotesDraft(task.officer_notes || '')
  }

  const closeNotesModal = () => {
    setNotesTask(null)
    setNotesDraft('')
  }

  const saveNotes = async () => {
    if (!notesTask) return
    try {
      setNotesSaving(true)
      const result = await maintenance.update(notesTask.id, { officer_notes: notesDraft || null })
      if (result.error) throw new Error(result.error)
      closeNotesModal()
      await loadTasks()
    } catch (err) {
      alert(err.message || 'Could not save notes')
    } finally {
      setNotesSaving(false)
    }
  }

  // Mark task as resolved (completed)
  const markAsResolved = async (taskId) => {
    try {
      setActionLoading(prev => ({ ...prev, [taskId]: true }))
      
      const result = await maintenance.complete(taskId)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Refresh data
      await loadTasks()
      
    } catch (err) {
      console.error('Error marking task as resolved:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setActionLoading(prev => ({ ...prev, [taskId]: false }))
    }
  }

  // Update task status
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      setActionLoading(prev => ({ ...prev, [taskId]: true }))
      
      const result = await maintenance.update(taskId, { status: newStatus })
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Refresh data
      await loadTasks()
      
    } catch (err) {
      console.error('Error updating task status:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setActionLoading(prev => ({ ...prev, [taskId]: false }))
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTasks = filteredTasks.slice(startIndex, endIndex)

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'text-red-600 bg-red-50',
      high: 'text-orange-600 bg-orange-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-green-600 bg-green-50'
    }
    return colors[priority] || 'text-gray-600 bg-gray-50'
  }

  // Get task type display name
  const getTaskTypeDisplay = (taskType) => {
    const types = {
      routine_cleaning: 'Routine Cleaning',
      emptying: 'Emptying',
      repair: 'Repair',
      inspection: 'Inspection',
      emergency_response: 'Emergency Response',
      preventive_maintenance: 'Preventive Maintenance'
    }
    return types[taskType] || taskType
  }

  // Check if task is overdue
  const isOverdue = (dueDate, status) => {
    const today = new Date().toISOString().split('T')[0]
    return dueDate < today && status !== 'completed' && status !== 'cancelled'
  }

  const actions = (
    <div className="flex items-center space-x-3">
      <button
        onClick={loadTasks}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Refresh</span>
      </button>
    </div>
  )

  if (loading) {
    return (
      <AppLayout title="Maintenance Tasks" subtitle="Loading maintenance data..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Tasks</h2>
            <p className="text-gray-600">Fetching maintenance data...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="Maintenance Tasks" subtitle="Error loading data" actions={actions}>
        <div className="text-center py-12">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Tasks</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadTasks}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout 
      title="Maintenance Tasks" 
      subtitle={
        isOfficer
          ? `${filteredTasks.length} of ${tasks.length} tasks in your district`
          : `${filteredTasks.length} of ${tasks.length} tasks shown`
      }
      actions={actions}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <MetricCard
          title="Open Tasks"
          value={stats.total}
          subtitle="active"
          icon="📋"
          color="blue"
        />
        
        <MetricCard
          title="Pending"
          value={stats.pending}
          subtitle="unassigned"
          icon="⏳"
          color="gray"
        />
        
        <MetricCard
          title="Assigned"
          value={stats.assigned}
          subtitle="to workers"
          icon="👤"
          color="blue"
        />
        
        <MetricCard
          title="In Progress"
          value={stats.inProgress}
          subtitle="active work"
          icon="🔄"
          color="yellow"
        />
        
        <MetricCard
          title="Urgent"
          value={stats.urgent}
          subtitle="high priority"
          icon="🚨"
          color="red"
        />
        
        <MetricCard
          title="Overdue"
          value={stats.overdue}
          subtitle="past due"
          icon="⚠️"
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select 
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="open">Open Tasks</option>
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select 
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Task Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
            <select 
              value={filters.taskType}
              onChange={(e) => handleFilterChange('taskType', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Types</option>
              <option value="routine_cleaning">Routine Cleaning</option>
              <option value="emptying">Emptying</option>
              <option value="repair">Repair</option>
              <option value="inspection">Inspection</option>
              <option value="emergency_response">Emergency Response</option>
              <option value="preventive_maintenance">Preventive Maintenance</option>
            </select>
          </div>

          {/* District Filter — admins see all districts; officers are scoped via RLS */}
          {!isOfficer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
              <select 
                value={filters.district}
                onChange={(e) => handleFilterChange('district', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Districts</option>
                {availableDistricts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          )}

          {/* Worker Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Worker</label>
            <select 
              value={filters.worker}
              onChange={(e) => handleFilterChange('worker', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Workers</option>
              {availableWorkers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name} ({worker.role})
                </option>
              ))}
            </select>
          </div>

          {/* Overdue Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Show Only</label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.overdue}
                onChange={(e) => handleFilterChange('overdue', e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Overdue Tasks</span>
            </label>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Maintenance Tasks ({filteredTasks.length})
            </h3>
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredTasks.length)} of {filteredTasks.length}
            </div>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔧</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentTasks.map((task) => (
                    <tr 
                      key={task.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        isOverdue(task.due_date, task.status) ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{getTaskTypeDisplay(task.task_type)}</div>
                          <div className="text-gray-500 text-xs mt-1 max-w-xs truncate" title={task.description}>
                            {task.description || 'No description'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{task.facility?.name || 'Unknown Facility'}</div>
                          <div className="text-gray-500 text-xs">
                            {task.facility?.district?.name || 'Unknown District'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={task.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 min-w-[10rem]">
                        {isOfficer ? (
                          <select
                            value={task.assigned_to || ''}
                            disabled={Boolean(actionLoading[task.id]) || task.status === 'completed'}
                            onChange={(e) => handleAssignWorkerChange(task.id, e.target.value)}
                            className="w-full max-w-[220px] border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">Unassigned</option>
                            {districtWorkers.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name}
                              </option>
                            ))}
                          </select>
                        ) : task.worker ? (
                          <div>
                            <div className="font-medium">{task.worker.name}</div>
                            <div className="text-gray-500 text-xs">{task.worker.role}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className={isOverdue(task.due_date, task.status) ? 'text-red-600 font-medium' : ''}>
                          {formatDate(task.due_date)}
                          {isOverdue(task.due_date, task.status) && (
                            <div className="text-xs text-red-500">Overdue</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap items-center gap-2">
                          {isOfficer && task.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => openNotesModal(task)}
                              className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded text-xs hover:bg-gray-50"
                            >
                              Notes
                            </button>
                          )}
                          {task.status !== 'completed' && (
                            <button
                              onClick={() => markAsResolved(task.id)}
                              disabled={actionLoading[task.id]}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading[task.id] ? 'Resolving...' : 'Mark complete'}
                            </button>
                          )}
                          
                          {task.status === 'pending' && (
                            <button
                              onClick={() => updateTaskStatus(task.id, 'in_progress')}
                              disabled={actionLoading[task.id]}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Start
                            </button>
                          )}
                          
                          {task.status === 'assigned' && (
                            <button
                              onClick={() => updateTaskStatus(task.id, 'in_progress')}
                              disabled={actionLoading[task.id]}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Start
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredTasks.length)} of {filteredTasks.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-green-600 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {notesTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">Task notes</h3>
            <p className="text-sm text-gray-500 mt-1">
              {getTaskTypeDisplay(notesTask.task_type)} · {notesTask.facility?.name || 'Facility'}
            </p>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={5}
              className="mt-4 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Instructions, follow-ups, or completion details for your team..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeNotesModal}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveNotes}
                disabled={notesSaving}
                className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {notesSaving ? 'Saving…' : 'Save notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default ProfessionalMaintenance