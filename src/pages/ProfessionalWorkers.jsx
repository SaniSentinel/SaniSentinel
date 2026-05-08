import React, { useState, useEffect, useCallback } from 'react'
import AppLayout from '../components/Layout/AppLayout'
import StatusBadge from '../components/UI/StatusBadge'
import MetricCard from '../components/UI/MetricCard'
import { workers } from '../lib/workers'
import { districts } from '../lib/districts'

const ProfessionalWorkers = () => {
  const [workersData, setWorkersData] = useState([])
  const [filteredWorkers, setFilteredWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    fieldWorkers: 0
  })

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [actionLoading, setActionLoading] = useState({})

  // Filter states
  const [filters, setFilters] = useState({
    district: 'all',
    role: 'all',
    status: 'active',
    search: ''
  })

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    district_id: '',
    role: 'field_worker'
  })
  const [formErrors, setFormErrors] = useState({})

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Available districts and roles
  const [availableDistricts, setAvailableDistricts] = useState([])
  const availableRoles = [
    { value: 'field_worker', label: 'Field Worker' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'maintenance_tech', label: 'Maintenance Tech' },
    { value: 'health_officer', label: 'Health Officer' },
    { value: 'district_coordinator', label: 'District Coordinator' }
  ]

  // Load workers data
  const loadWorkers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get all workers with district information
      const workersResult = await workers.getAll()
      
      if (workersResult.error) {
        throw new Error(workersResult.error)
      }

      const workersWithDistricts = workersResult.data || []
      setWorkersData(workersWithDistricts)

      // Calculate stats
      const newStats = {
        total: workersWithDistricts.length,
        active: workersWithDistricts.filter(w => w.active).length,
        inactive: workersWithDistricts.filter(w => !w.active).length,
        fieldWorkers: workersWithDistricts.filter(w => w.role === 'field_worker' && w.active).length
      }
      setStats(newStats)

      // Extract unique districts
      const districts = new Set()
      workersWithDistricts.forEach(worker => {
        if (worker.district?.name) {
          districts.add(JSON.stringify({
            id: worker.district.id,
            name: worker.district.name,
            region: worker.district.region
          }))
        }
      })
      setAvailableDistricts(
        Array.from(districts)
          .map(d => JSON.parse(d))
          .sort((a, b) => a.name.localeCompare(b.name))
      )

    } catch (err) {
      console.error('Error loading workers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Apply filters to workers
  useEffect(() => {
    let filtered = [...workersData]

    // Status filter
    if (filters.status === 'active') {
      filtered = filtered.filter(worker => worker.active)
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter(worker => !worker.active)
    }

    // District filter
    if (filters.district !== 'all') {
      filtered = filtered.filter(worker => 
        worker.district?.id === filters.district
      )
    }

    // Role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(worker => worker.role === filters.role)
    }

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(worker => 
        worker.name.toLowerCase().includes(searchTerm) ||
        worker.phone.includes(searchTerm)
      )
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name))

    setFilteredWorkers(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [workersData, filters])

  // Load initial data
  useEffect(() => {
    loadWorkers()
  }, [loadWorkers])

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
      district: 'all',
      role: 'all',
      status: 'active',
      search: ''
    })
  }

  // Form validation
  const validateForm = () => {
    const errors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!formData.phone.match(/^\+233\d{9}$/)) {
      errors.phone = 'Invalid phone format. Use +233XXXXXXXXX'
    }
    
    if (!formData.district_id) {
      errors.district_id = 'District is required'
    }
    
    if (!formData.role) {
      errors.role = 'Role is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission for adding worker
  const handleAddWorker = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      setActionLoading(prev => ({ ...prev, add: true }))
      
      const result = await workers.create(formData)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Reset form and close modal
      setFormData({
        name: '',
        phone: '',
        district_id: '',
        role: 'field_worker'
      })
      setFormErrors({})
      setShowAddModal(false)
      
      // Refresh data
      await loadWorkers()
      
    } catch (err) {
      console.error('Error adding worker:', err)
      setFormErrors({ submit: err.message })
    } finally {
      setActionLoading(prev => ({ ...prev, add: false }))
    }
  }

  // Handle form submission for editing worker
  const handleEditWorker = async (e) => {
    e.preventDefault()
    
    if (!validateForm() || !selectedWorker) return
    
    try {
      setActionLoading(prev => ({ ...prev, edit: true }))
      
      const result = await workers.update(selectedWorker.id, formData)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Reset form and close modal
      setFormData({
        name: '',
        phone: '',
        district_id: '',
        role: 'field_worker'
      })
      setFormErrors({})
      setShowEditModal(false)
      setSelectedWorker(null)
      
      // Refresh data
      await loadWorkers()
      
    } catch (err) {
      console.error('Error updating worker:', err)
      setFormErrors({ submit: err.message })
    } finally {
      setActionLoading(prev => ({ ...prev, edit: false }))
    }
  }

  // Open edit modal with worker data
  const openEditModal = (worker) => {
    setSelectedWorker(worker)
    setFormData({
      name: worker.name,
      phone: worker.phone,
      district_id: worker.district?.id || '',
      role: worker.role
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  // Toggle worker active status
  const toggleWorkerStatus = async (workerId, currentStatus) => {
    try {
      setActionLoading(prev => ({ ...prev, [workerId]: true }))
      
      const result = currentStatus 
        ? await workers.deactivate(workerId)
        : await workers.reactivate(workerId)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Refresh data
      await loadWorkers()
      
    } catch (err) {
      console.error('Error toggling worker status:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setActionLoading(prev => ({ ...prev, [workerId]: false }))
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredWorkers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentWorkers = filteredWorkers.slice(startIndex, endIndex)

  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    if (phone.startsWith('+233')) {
      return phone.replace('+233', '0')
    }
    return phone
  }

  // Get role display name
  const getRoleDisplay = (role) => {
    const roleMap = {
      field_worker: 'Field Worker',
      supervisor: 'Supervisor',
      maintenance_tech: 'Maintenance Tech',
      health_officer: 'Health Officer',
      district_coordinator: 'District Coordinator'
    }
    return roleMap[role] || role
  }

  // Get role color
  const getRoleColor = (role) => {
    const colors = {
      field_worker: 'bg-blue-50 text-blue-700',
      supervisor: 'bg-green-50 text-green-700',
      maintenance_tech: 'bg-orange-50 text-orange-700',
      health_officer: 'bg-purple-50 text-purple-700',
      district_coordinator: 'bg-red-50 text-red-700'
    }
    return colors[role] || 'bg-gray-50 text-gray-700'
  }

  const actions = (
    <div className="flex items-center space-x-3">
      <button
        onClick={() => setShowAddModal(true)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span>Add Worker</span>
      </button>
      <button
        onClick={loadWorkers}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
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
      <AppLayout title="Workers" subtitle="Loading workers data..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Workers</h2>
            <p className="text-gray-600">Fetching data from database...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="Workers" subtitle="Error loading data" actions={actions}>
        <div className="text-center py-12">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Workers</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadWorkers}
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
      title="Workers Administration" 
      subtitle={`${filteredWorkers.length} of ${stats.total} workers shown`}
      actions={actions}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Workers"
          value={stats.total}
          subtitle="all workers"
          icon="👥"
          color="blue"
        />
        
        <MetricCard
          title="Active Workers"
          value={stats.active}
          subtitle={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total`}
          icon="✅"
          color="green"
        />
        
        <MetricCard
          title="Field Workers"
          value={stats.fieldWorkers}
          subtitle="active field staff"
          icon="🚶"
          color="yellow"
        />
        
        <MetricCard
          title="Inactive Workers"
          value={stats.inactive}
          subtitle="deactivated"
          icon="⏸️"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select 
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="active">Active Workers</option>
              <option value="inactive">Inactive Workers</option>
              <option value="all">All Workers</option>
            </select>
          </div>

          {/* District Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
            <select 
              value={filters.district}
              onChange={(e) => handleFilterChange('district', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Districts</option>
              {availableDistricts.map(district => (
                <option key={district.id} value={district.id}>
                  {district.name} ({district.region})
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select 
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Roles</option>
              {availableRoles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </div>
      {/* Workers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Workers ({filteredWorkers.length})
            </h3>
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredWorkers.length)} of {filteredWorkers.length}
            </div>
          </div>
        </div>

        {filteredWorkers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Workers Found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      District
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentWorkers.map((worker) => (
                    <tr 
                      key={worker.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        !worker.active ? 'bg-gray-50 opacity-75' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{worker.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatPhoneNumber(worker.phone)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{worker.district?.name || 'Unknown'}</div>
                          <div className="text-gray-500 text-xs">{worker.district?.region || ''}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(worker.role)}`}>
                          {getRoleDisplay(worker.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge 
                          status={worker.active ? 'completed' : 'cancelled'} 
                          size="sm" 
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(worker)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                          
                          <button
                            onClick={() => toggleWorkerStatus(worker.id, worker.active)}
                            disabled={actionLoading[worker.id]}
                            className={`px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              worker.active 
                                ? 'bg-red-600 text-white hover:bg-red-700' 
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {actionLoading[worker.id] 
                              ? 'Loading...' 
                              : worker.active ? 'Deactivate' : 'Activate'
                            }
                          </button>
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
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredWorkers.length)} of {filteredWorkers.length} results
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

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Worker</h3>
            </div>
            
            <form onSubmit={handleAddWorker} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      formErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter worker's full name"
                  />
                  {formErrors.name && (
                    <p className="text-red-600 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      formErrors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+233XXXXXXXXX"
                  />
                  {formErrors.phone && (
                    <p className="text-red-600 text-xs mt-1">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District *
                  </label>
                  <select
                    value={formData.district_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, district_id: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      formErrors.district_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select District</option>
                    {availableDistricts.map(district => (
                      <option key={district.id} value={district.id}>
                        {district.name} ({district.region})
                      </option>
                    ))}
                  </select>
                  {formErrors.district_id && (
                    <p className="text-red-600 text-xs mt-1">{formErrors.district_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      formErrors.role ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    {availableRoles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.role && (
                    <p className="text-red-600 text-xs mt-1">{formErrors.role}</p>
                  )}
                </div>

                {formErrors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{formErrors.submit}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setFormData({ name: '', phone: '', district_id: '', role: 'field_worker' })
                    setFormErrors({})
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading.add}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading.add ? 'Adding...' : 'Add Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Worker Modal */}
      {showEditModal && selectedWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Worker</h3>
            </div>
            
            <form onSubmit={handleEditWorker} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      formErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter worker's full name"
                  />
                  {formErrors.name && (
                    <p className="text-red-600 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      formErrors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+233XXXXXXXXX"
                  />
                  {formErrors.phone && (
                    <p className="text-red-600 text-xs mt-1">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District *
                  </label>
                  <select
                    value={formData.district_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, district_id: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      formErrors.district_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select District</option>
                    {availableDistricts.map(district => (
                      <option key={district.id} value={district.id}>
                        {district.name} ({district.region})
                      </option>
                    ))}
                  </select>
                  {formErrors.district_id && (
                    <p className="text-red-600 text-xs mt-1">{formErrors.district_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      formErrors.role ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    {availableRoles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.role && (
                    <p className="text-red-600 text-xs mt-1">{formErrors.role}</p>
                  )}
                </div>

                {formErrors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{formErrors.submit}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedWorker(null)
                    setFormData({ name: '', phone: '', district_id: '', role: 'field_worker' })
                    setFormErrors({})
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading.edit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading.edit ? 'Updating...' : 'Update Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default ProfessionalWorkers