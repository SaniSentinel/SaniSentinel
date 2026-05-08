# Dashboard Summary Page

A comprehensive dashboard that provides real-time insights into facility management, alerts, and system performance with interactive stat cards and live data updates.

## Features

### Key Metrics Display
- **Total Facilities**: Complete count of all facilities in the system
- **Critical Count**: Number of facilities requiring immediate attention (risk ≥85)
- **Alerts Today**: Count of alerts generated in the current day
- **Districts Covered**: Total number of districts being monitored

### Risk Distribution Analysis
- **Good (0-29)**: Facilities in optimal condition
- **At Risk (30-59)**: Facilities needing attention soon
- **High Risk (60-84)**: Facilities requiring prompt maintenance
- **Critical (85-100)**: Facilities needing immediate intervention

### Performance Metrics
- **Average Risk Score**: System-wide facility health indicator
- **Alert Resolution Rate**: Percentage of alerts successfully resolved
- **Maintenance Completion**: Task completion efficiency metrics

### Real-time Updates
- **Live Data Sync**: Automatic updates when facilities, alerts, or reports change
- **Auto-refresh**: Configurable refresh intervals (default: 30 seconds)
- **Visual Indicators**: Color-coded status and trend indicators
- **Last Updated**: Timestamp showing data freshness

## Components Used

### StatCard Components
- `FacilityStatCard` - Total facilities with critical indicator
- `CriticalStatCard` - Critical facilities count
- `AlertsStatCard` - Today's alerts count
- `DistrictsStatCard` - Districts coverage
- `RiskLevelCard` - Risk distribution breakdown
- `MetricCard` - Performance metrics with targets
- `ActivityCard` - Recent activity summary

### Integration Components
- `AlertsSidebar` - Real-time alerts management
- `useDashboard` - Custom hook for dashboard data
- `dashboard` service - Backend data aggregation

## Data Sources

### Primary Tables
- **facilities** - Facility information and risk scores
- **alerts** - System alerts and notifications
- **districts** - Geographic coverage areas
- **reports** - Community-submitted facility reports
- **maintenance_tasks** - Maintenance activities and completion

### Calculated Metrics
- Risk level percentages
- Alert resolution rates
- Maintenance completion rates
- Activity trends and summaries
- District-wise facility distribution

## Real-time Features

### Live Updates
- **Facility Changes**: Updates when facility status or risk changes
- **New Alerts**: Immediate display of new alerts
- **Report Submissions**: Reflects new community reports
- **Maintenance Updates**: Shows task completion progress

### Auto-refresh Mechanism
- **Supabase Realtime**: Uses postgres_changes events
- **Periodic Refresh**: Fallback timer-based updates
- **Error Recovery**: Automatic retry on connection issues
- **Visual Feedback**: Loading states and update timestamps

## Usage

### Basic Implementation

**Direct Import:**
```jsx
import Dashboard from '../pages/Dashboard'

function App() {
  return <Dashboard />
}
```

**Index Import:**
```jsx
import { Dashboard } from '../pages'

function App() {
  return <Dashboard />
}
```
```

### With Custom Configuration
```jsx
import { useDashboard } from '../hooks'

function CustomDashboard() {
  const { stats, loading, refresh } = useDashboard({
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
    includeActivity: true,
    includeMetrics: true
  })
  
  // Custom dashboard implementation
}
```

## Dashboard Sections

### Header Section
- **Navigation**: Links to other pages
- **Title**: Dashboard with last updated timestamp
- **Actions**: Alerts toggle and refresh button

### Key Metrics Row
Four primary stat cards showing:
- Total facilities (clickable → facility map)
- Critical facilities (clickable → alerts sidebar)
- Today's alerts (clickable → alerts sidebar)
- Districts covered

### Risk Distribution
Visual breakdown of facility risk levels:
- Color-coded cards for each risk category
- Percentage indicators
- Count values with trend information

### Performance Metrics
Three key performance indicators:
- Average risk score (target: <30)
- Alert resolution rate (target: >90%)
- Maintenance completion (target: >85%)

### Activity Summary
Recent activity overview (7 days):
- Reports submitted
- Alerts generated
- Maintenance tasks created/completed
- Tasks pending

### District Overview
Geographic coverage information:
- Districts by region
- Facility distribution
- Coverage statistics

### Alert Types Breakdown
Today's alerts categorized by type:
- Maintenance due
- High risk facilities
- Critical status
- Overflow detected
- System failures
- Climate warnings

### System Health Summary
Overall system status indicators:
- Health percentage (green/yellow/red)
- Critical issues count
- Maintenance completion rate

## Styling and Design

### Color Scheme
- **Green**: Good status, healthy metrics
- **Yellow**: At-risk, medium priority
- **Red**: Critical, high priority
- **Blue**: Information, neutral status
- **Purple**: Special categories (climate)
- **Gray**: Inactive, unknown status

### Responsive Design
- **Mobile**: Single column layout
- **Tablet**: 2-column grid for cards
- **Desktop**: 4-column grid for optimal viewing
- **Large screens**: Full 7xl container width

### Visual Elements
- **Icons**: Emoji-based for universal recognition
- **Cards**: Consistent shadow and border styling
- **Animations**: Smooth transitions and loading states
- **Typography**: Clear hierarchy with Tailwind classes

## Performance Considerations

### Data Loading
- **Parallel Requests**: Multiple API calls executed simultaneously
- **Caching**: Client-side state management
- **Error Boundaries**: Graceful failure handling
- **Loading States**: Progressive content display

### Real-time Efficiency
- **Selective Updates**: Only refresh changed data
- **Debounced Refresh**: Prevents excessive API calls
- **Connection Management**: Automatic subscription cleanup
- **Memory Optimization**: Efficient state updates

## Error Handling

### Network Issues
- **Retry Logic**: Automatic retry with exponential backoff
- **Fallback States**: Show last known data during outages
- **Error Messages**: User-friendly error descriptions
- **Manual Refresh**: User-initiated retry option

### Data Validation
- **Null Checks**: Safe handling of missing data
- **Default Values**: Fallback values for calculations
- **Type Safety**: Proper data type handling
- **Boundary Conditions**: Edge case management

## Integration Points

### Navigation
- **Facility Map**: Direct link from facility stats
- **Alerts Sidebar**: Integrated real-time alerts
- **Home Page**: Navigation breadcrumb
- **Other Pages**: Consistent header navigation

### External Services
- **Supabase**: Primary database connection
- **Realtime**: Live update subscriptions
- **Authentication**: User session management
- **API Services**: Backend data aggregation

## Customization Options

### Dashboard Hook Configuration
```javascript
const options = {
  autoRefresh: true,        // Enable real-time updates
  refreshInterval: 30000,   // Update frequency (ms)
  includeActivity: true,    // Load recent activity data
  includeMetrics: true      // Load performance metrics
}
```

### Stat Card Customization
```javascript
<StatCard
  title="Custom Metric"
  value={customValue}
  icon="📊"
  color="blue"
  trend="up"
  trendValue="5%"
  onClick={handleClick}
/>
```

## Future Enhancements

### Planned Features
- **Historical Trends**: Time-series charts and graphs
- **Predictive Analytics**: Risk forecasting and trends
- **Custom Dashboards**: User-configurable layouts
- **Export Functionality**: PDF/Excel report generation
- **Mobile App**: Native mobile dashboard
- **Notifications**: Push notifications for critical alerts

### Advanced Analytics
- **Facility Clustering**: Geographic analysis
- **Maintenance Optimization**: Predictive maintenance scheduling
- **Resource Allocation**: Optimal resource distribution
- **Performance Benchmarking**: Comparative analysis
- **Cost Analysis**: Budget and expense tracking

## Troubleshooting

### Common Issues

**Dashboard not loading**
- Check network connection
- Verify Supabase configuration
- Check browser console for errors
- Try manual refresh

**Real-time updates not working**
- Verify Supabase Realtime is enabled
- Check subscription status in browser dev tools
- Ensure proper table permissions
- Restart browser if needed

**Slow performance**
- Check data volume in tables
- Optimize database queries
- Reduce refresh frequency
- Clear browser cache

**Incorrect statistics**
- Verify data integrity in database
- Check calculation logic
- Refresh dashboard manually
- Contact system administrator

### Debug Information
- **Browser Console**: Check for JavaScript errors
- **Network Tab**: Monitor API request/response
- **Supabase Logs**: Check database query logs
- **Component State**: Use React DevTools for state inspection