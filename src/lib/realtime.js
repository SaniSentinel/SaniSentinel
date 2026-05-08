import { supabase } from './supabase'

// Realtime subscription management for SaniSentinel
export const realtime = {
  // Subscribe to alerts changes
  subscribeToAlerts: (callback) => {
    const subscription = supabase
      .channel('alerts_realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'alerts' 
        }, 
        (payload) => {
          console.log('Alert change detected:', payload)
          callback(payload)
        }
      )
      .subscribe()

    return subscription
  },

  // Subscribe to reports changes
  subscribeToReports: (callback) => {
    const subscription = supabase
      .channel('reports_realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'reports' 
        }, 
        (payload) => {
          console.log('Report change detected:', payload)
          callback(payload)
        }
      )
      .subscribe()

    return subscription
  },

  // Subscribe to new alerts only
  subscribeToNewAlerts: (callback) => {
    const subscription = supabase
      .channel('new_alerts')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'alerts' 
        }, 
        (payload) => {
          console.log('New alert created:', payload.new)
          callback(payload.new)
        }
      )
      .subscribe()

    return subscription
  },

  // Subscribe to new reports only (for SMS notifications)
  subscribeToNewReports: (callback) => {
    const subscription = supabase
      .channel('new_reports')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'reports' 
        }, 
        (payload) => {
          console.log('New report submitted:', payload.new)
          callback(payload.new)
        }
      )
      .subscribe()

    return subscription
  },

  // Subscribe to alert resolutions
  subscribeToAlertResolutions: (callback) => {
    const subscription = supabase
      .channel('alert_resolutions')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'alerts',
          filter: 'resolved=eq.true'
        }, 
        (payload) => {
          console.log('Alert resolved:', payload.new)
          callback(payload.new)
        }
      )
      .subscribe()

    return subscription
  },

  // Subscribe to critical alerts only
  subscribeToCriticalAlerts: (callback) => {
    const subscription = supabase
      .channel('critical_alerts')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'alerts',
          filter: 'severity=eq.critical'
        }, 
        (payload) => {
          console.log('CRITICAL ALERT:', payload.new)
          callback(payload.new)
        }
      )
      .subscribe()

    return subscription
  },

  // Subscribe to problem reports (non-good conditions)
  subscribeToProblemReports: (callback) => {
    const subscription = supabase
      .channel('problem_reports')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'reports',
          filter: 'condition=neq.good'
        }, 
        (payload) => {
          console.log('Problem report:', payload.new)
          callback(payload.new)
        }
      )
      .subscribe()

    return subscription
  },

  // Subscribe to combined critical updates (alerts + problem reports)
  subscribeToCriticalUpdates: (onAlert, onReport) => {
    const subscription = supabase
      .channel('critical_updates')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'alerts',
          filter: 'severity=in.(high,critical)'
        }, 
        (payload) => {
          console.log('High/Critical alert:', payload.new)
          onAlert(payload.new)
        }
      )
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'reports',
          filter: 'condition=in.(overflow,blocked,out_of_service)'
        }, 
        (payload) => {
          console.log('Critical condition report:', payload.new)
          onReport(payload.new)
        }
      )
      .subscribe()

    return subscription
  },

  // Unsubscribe from a channel
  unsubscribe: (subscription) => {
    if (subscription) {
      supabase.removeChannel(subscription)
      console.log('Unsubscribed from realtime channel')
    }
  },

  // Unsubscribe from all channels
  unsubscribeAll: () => {
    supabase.removeAllChannels()
    console.log('Unsubscribed from all realtime channels')
  },

  // Get current subscription status
  getSubscriptionStatus: () => {
    const channels = supabase.getChannels()
    return {
      totalChannels: channels.length,
      channels: channels.map(channel => ({
        topic: channel.topic,
        state: channel.state,
        joinedAt: channel.joinedAt
      }))
    }
  }
}

// Export individual functions for convenience
export const {
  subscribeToAlerts,
  subscribeToReports,
  subscribeToNewAlerts,
  subscribeToNewReports,
  subscribeToAlertResolutions,
  subscribeToCriticalAlerts,
  subscribeToProblemReports,
  subscribeToCriticalUpdates,
  unsubscribe,
  unsubscribeAll,
  getSubscriptionStatus
} = realtime