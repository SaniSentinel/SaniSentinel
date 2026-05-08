import { supabase } from './supabase'
import { facilities } from './facilities'
import { alerts } from './alerts'
import { districts } from './districts'

// Dashboard statistics API functions
export const dashboard = {
  // Get comprehensive dashboard statistics
  getStats: async () => {
    try {
      const [
        facilitiesResult,
        alertsResult,
        districtsResult,
        todayAlertsResult
      ] = await Promise.all([
        facilities.getStats(),
        alerts.getSummary(),
        districts.getAll(),
        dashboard.getTodayAlerts()
      ])

      if (facilitiesResult.error) throw new Error(`Facilities: ${facilitiesResult.error}`)
      if (alertsResult.error) throw new Error(`Alerts: ${alertsResult.error}`)
      if (districtsResult.error) throw new Error(`Districts: ${districtsResult.error}`)
      if (todayAlertsResult.error) throw new Error(`Today Alerts: ${todayAlertsResult.error}`)

      const stats = {
        facilities: {
          total: facilitiesResult.data?.total || 0,
          byStatus: facilitiesResult.data?.byStatus || {},
          byType: facilitiesResult.data?.byType || {},
          byRiskLevel: facilitiesResult.data?.byRiskLevel || {},
          averageRiskScore: facilitiesResult.data?.averageRiskScore || 0,
          critical: facilitiesResult.data?.byRiskLevel?.critical || 0,
          highRisk: facilitiesResult.data?.byRiskLevel?.high_risk || 0,
          atRisk: facilitiesResult.data?.byRiskLevel?.at_risk || 0,
          good: facilitiesResult.data?.byRiskLevel?.good || 0
        },
        alerts: {
          total: alertsResult.data?.total || 0,
          critical: alertsResult.data?.critical || 0,
          high: alertsResult.data?.high || 0,
          medium: alertsResult.data?.medium || 0,
          low: alertsResult.data?.low || 0,
          today: todayAlertsResult.data?.count || 0,
          todayByType: todayAlertsResult.data?.byType || {},
          todayBySeverity: todayAlertsResult.data?.bySeverity || {}
        },
        districts: {
          total: districtsResult.data?.length || 0,
          byRegion: {},
          regions: []
        }
      }

      // Process districts data
      if (districtsResult.data) {
        const regionCounts = {}
        const regions = new Set()
        
        districtsResult.data.forEach(district => {
          regionCounts[district.region] = (regionCounts[district.region] || 0) + 1
          regions.add(district.region)
        })
        
        stats.districts.byRegion = regionCounts
        stats.districts.regions = Array.from(regions)
      }

      return { data: stats, error: null }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return { data: null, error: error.message }
    }
  },

  // Get today's alerts
  getTodayAlerts: async () => {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      const { data, error } = await supabase
        .from('alerts')
        .select('alert_type, severity, created_at')
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString())

      if (error) throw error

      const stats = {
        count: data.length,
        byType: {},
        bySeverity: {}
      }

      data.forEach(alert => {
        stats.byType[alert.alert_type] = (stats.byType[alert.alert_type] || 0) + 1
        stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1
      })

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get facility distribution by district
  getFacilityDistribution: async () => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select(`
          district_id,
          status,
          risk_score,
          district:districts(name, region)
        `)

      if (error) throw error

      const distribution = {}
      
      data.forEach(facility => {
        const districtName = facility.district?.name || 'Unknown'
        if (!distribution[districtName]) {
          distribution[districtName] = {
            total: 0,
            good: 0,
            atRisk: 0,
            highRisk: 0,
            critical: 0,
            region: facility.district?.region || 'Unknown'
          }
        }
        
        distribution[districtName].total++
        
        const risk = facility.risk_score || 0
        if (risk >= 85) distribution[districtName].critical++
        else if (risk >= 60) distribution[districtName].highRisk++
        else if (risk >= 30) distribution[districtName].atRisk++
        else distribution[districtName].good++
      })

      return { data: distribution, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get recent activity summary
  getRecentActivity: async (daysBack = 7) => {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)

      const [reportsResult, alertsResult, maintenanceResult] = await Promise.all([
        supabase
          .from('reports')
          .select('created_at, condition')
          .gte('created_at', cutoffDate.toISOString()),
        supabase
          .from('alerts')
          .select('created_at, alert_type, severity')
          .gte('created_at', cutoffDate.toISOString()),
        supabase
          .from('maintenance_tasks')
          .select('created_at, status, completed_at')
          .gte('created_at', cutoffDate.toISOString())
      ])

      if (reportsResult.error) throw new Error(`Reports: ${reportsResult.error.message}`)
      if (alertsResult.error) throw new Error(`Alerts: ${alertsResult.error.message}`)
      if (maintenanceResult.error) throw new Error(`Maintenance: ${maintenanceResult.error.message}`)

      const activity = {
        reports: {
          total: reportsResult.data.length,
          byCondition: {},
          byDay: {}
        },
        alerts: {
          total: alertsResult.data.length,
          byType: {},
          bySeverity: {},
          byDay: {}
        },
        maintenance: {
          total: maintenanceResult.data.length,
          completed: maintenanceResult.data.filter(task => task.status === 'completed').length,
          pending: maintenanceResult.data.filter(task => task.status === 'pending').length,
          inProgress: maintenanceResult.data.filter(task => task.status === 'in_progress').length
        }
      }

      // Process reports
      reportsResult.data.forEach(report => {
        activity.reports.byCondition[report.condition] = 
          (activity.reports.byCondition[report.condition] || 0) + 1
        
        const day = report.created_at.split('T')[0]
        activity.reports.byDay[day] = (activity.reports.byDay[day] || 0) + 1
      })

      // Process alerts
      alertsResult.data.forEach(alert => {
        activity.alerts.byType[alert.alert_type] = 
          (activity.alerts.byType[alert.alert_type] || 0) + 1
        activity.alerts.bySeverity[alert.severity] = 
          (activity.alerts.bySeverity[alert.severity] || 0) + 1
        
        const day = alert.created_at.split('T')[0]
        activity.alerts.byDay[day] = (activity.alerts.byDay[day] || 0) + 1
      })

      return { data: activity, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get performance metrics
  getPerformanceMetrics: async () => {
    try {
      const [facilitiesResult, alertsResult, maintenanceResult] = await Promise.all([
        supabase
          .from('facilities')
          .select('risk_score, status, last_serviced'),
        supabase
          .from('alerts')
          .select('resolved, created_at'),
        supabase
          .from('maintenance_tasks')
          .select('status, created_at, completed_at, due_date')
      ])

      if (facilitiesResult.error) throw new Error(`Facilities: ${facilitiesResult.error.message}`)
      if (alertsResult.error) throw new Error(`Alerts: ${alertsResult.error.message}`)
      if (maintenanceResult.error) throw new Error(`Maintenance: ${maintenanceResult.error.message}`)

      const metrics = {
        facilityHealth: {
          averageRiskScore: 0,
          healthyFacilities: 0,
          facilitiesNeedingService: 0
        },
        alertResolution: {
          totalAlerts: alertsResult.data.length,
          resolvedAlerts: alertsResult.data.filter(alert => alert.resolved).length,
          resolutionRate: 0,
          averageResolutionTime: 0
        },
        maintenanceEfficiency: {
          totalTasks: maintenanceResult.data.length,
          completedTasks: maintenanceResult.data.filter(task => task.status === 'completed').length,
          onTimeCompletion: 0,
          completionRate: 0
        }
      }

      // Calculate facility health metrics
      if (facilitiesResult.data.length > 0) {
        const totalRisk = facilitiesResult.data.reduce((sum, facility) => 
          sum + (facility.risk_score || 0), 0)
        metrics.facilityHealth.averageRiskScore = Math.round(totalRisk / facilitiesResult.data.length)
        
        metrics.facilityHealth.healthyFacilities = facilitiesResult.data.filter(
          facility => (facility.risk_score || 0) < 30
        ).length

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        metrics.facilityHealth.facilitiesNeedingService = facilitiesResult.data.filter(
          facility => !facility.last_serviced || new Date(facility.last_serviced) < thirtyDaysAgo
        ).length
      }

      // Calculate alert resolution metrics
      if (alertsResult.data.length > 0) {
        metrics.alertResolution.resolutionRate = Math.round(
          (metrics.alertResolution.resolvedAlerts / metrics.alertResolution.totalAlerts) * 100
        )
      }

      // Calculate maintenance efficiency metrics
      if (maintenanceResult.data.length > 0) {
        metrics.maintenanceEfficiency.completionRate = Math.round(
          (metrics.maintenanceEfficiency.completedTasks / metrics.maintenanceEfficiency.totalTasks) * 100
        )

        const completedOnTime = maintenanceResult.data.filter(task => {
          if (task.status !== 'completed' || !task.completed_at || !task.due_date) return false
          return new Date(task.completed_at) <= new Date(task.due_date)
        }).length

        metrics.maintenanceEfficiency.onTimeCompletion = Math.round(
          (completedOnTime / metrics.maintenanceEfficiency.completedTasks) * 100
        )
      }

      return { data: metrics, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }
}

// Export individual functions for convenience
export const {
  getStats: getDashboardStats,
  getTodayAlerts,
  getFacilityDistribution,
  getRecentActivity,
  getPerformanceMetrics
} = dashboard