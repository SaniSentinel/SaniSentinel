# AlertsSidebar Component

A real-time alerts sidebar that uses Supabase Realtime to listen for changes on the 'alerts' table and display live updates.

## Features

### Real-time Updates
- **Live Notifications**: New alerts appear instantly when created in the database
- **Status Changes**: Alert resolution and reopening updates in real-time
- **Visual Feedback**: New alerts are highlighted with animations and notification badges
- **Automatic Reconnection**: Handles connection drops and automatically reconnects

### Alert Management
- **Filter by Status**: All, Active, Critical, High Priority, Resolved
- **One-click Actions**: Resolve or reopen alerts with single button click
- **Live Counters**: Real-time count updates for each filter category
- **Bulk Operations**: Support for multiple alert management (future enhancement)

### Visual Design
- **Color-coded Indicators**: Different colors for alert types and severity levels
- **Responsive Layout**: Works well on different screen sizes
- **Smooth Animations**: Pulse effects for new alerts, smooth transitions
- **Collapsible Interface**: Can be minimized to a notification badge

### Data Integration
- **Supabase Realtime**: Uses postgres_changes events for live updates
- **Error Handling**: Graceful degradation when API calls fail
- **Loading States**: Spinner animations during data fetching
- **Offline Support**: Maintains state during temporary disconnections

## Usage

### Basic Implementation

```jsx
import { AlertsSidebar } from '../components'

function MyPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div>
      {/* Your page content */}
      
      <AlertsSidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
    </div>
  )
}
```

### With Custom Styling

```jsx
<AlertsSidebar 
  isOpen={sidebarOpen}
  onToggle={() => setSidebarOpen(!sidebarOpen)}
  className="custom-alerts-sidebar"
/>
```

### Integration with useAlerts Hook

```jsx
import { AlertsSidebar } from '../components'
import { useAlerts } from '../hooks'

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { summary } = useAlerts({ includeSummary: true })

  return (
    <div>
      {/* Header with alert summary */}
      <div className="header">
        <button onClick={() => setSidebarOpen(true)}>
          Alerts ({summary.total})
        </button>
      </div>
      
      <AlertsSidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
    </div>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | `true` | Controls sidebar visibility |
| `onToggle` | function | - | Callback when toggle button is clicked |
| `className` | string | `''` | Additional CSS classes |

## Alert Types

### Maintenance Due
- **Icon**: 🔧
- **Color**: Yellow
- **Description**: Facilities requiring scheduled maintenance
- **Severity**: Usually medium

### High Risk
- **Icon**: ⚠️
- **Color**: Orange
- **Description**: Facilities with elevated risk scores (60-84)
- **Severity**: High

### Critical Status
- **Icon**: 🚨
- **Color**: Red
- **Description**: Facilities requiring immediate attention (risk ≥85)
- **Severity**: Critical

### Overflow Detected
- **Icon**: 💧
- **Color**: Blue
- **Description**: Facilities experiencing overflow conditions
- **Severity**: High

### System Failure
- **Icon**: ❌
- **Color**: Red
- **Description**: Facilities that are completely out of service
- **Severity**: Critical

### Climate Warning
- **Icon**: 🌧️
- **Color**: Purple
- **Description**: Weather-related alerts and warnings
- **Severity**: Medium

## Severity Levels

| Level | Color | Dot Color | Description |
|-------|-------|-----------|-------------|
| Low | Green | Green | Minor issues, low priority |
| Medium | Yellow | Yellow | Moderate issues, scheduled attention |
| High | Orange | Orange | Urgent issues, prompt attention needed |
| Critical | Red | Red | Emergency issues, immediate action required |

## Filter Categories

### All
Shows all alerts regardless of status or severity

### Active
Shows only unresolved alerts (resolved = false)

### Critical
Shows only active alerts with critical severity

### High
Shows only active alerts with high severity

### Resolved
Shows only resolved alerts (resolved = true)

## Real-time Events

The component listens for these Supabase Realtime events:

### INSERT
- Adds new alert to the top of the list
- Highlights with pulse animation
- Updates counters
- Fetches full alert data with facility information

### UPDATE
- Updates existing alert in place
- Maintains position in list
- Updates counters if status changed

### DELETE
- Removes alert from list
- Updates counters
- Smooth removal animation

## State Management

### Local State
- `allAlerts`: Complete list of alerts
- `filteredAlerts`: Alerts matching current filter
- `loading`: Loading state for initial data fetch
- `error`: Error state for failed operations
- `activeFilter`: Currently selected filter
- `newAlertIds`: Set of recently added alert IDs for animation
- `counts`: Counter object for each filter category

### Actions
- `loadAlerts()`: Fetch initial alerts data
- `handleResolve(id)`: Mark alert as resolved
- `handleReopen(id)`: Mark alert as unresolved
- Filter changes update `filteredAlerts` automatically

## Performance Considerations

### Optimizations
- **Efficient Filtering**: Client-side filtering for responsive UI
- **Debounced Updates**: Prevents excessive re-renders
- **Lazy Loading**: Only fetches data when sidebar opens
- **Memory Management**: Cleans up subscriptions on unmount

### Limitations
- Maximum 100 alerts loaded at once
- Real-time updates require active internet connection
- Supabase Realtime subscription limits apply

## Error Handling

### Connection Issues
- Shows error message with retry button
- Maintains last known state during disconnection
- Automatic reconnection attempts

### API Failures
- Graceful degradation with error messages
- Retry mechanisms for failed operations
- Fallback to cached data when available

### Data Validation
- Validates alert data structure
- Handles missing facility information
- Provides default values for missing fields

## Styling

### CSS Classes
Uses Tailwind CSS for styling with these key classes:

- **Container**: `fixed right-0 top-0 h-full w-96 bg-white shadow-2xl`
- **Alert Items**: Color-coded backgrounds based on type and severity
- **Animations**: `animate-pulse`, `transition-all duration-300`
- **Responsive**: Adapts to different screen sizes

### Customization
Override styles using the `className` prop or CSS modules:

```css
.custom-alerts-sidebar {
  width: 400px;
  background: #f8f9fa;
}

.custom-alerts-sidebar .alert-item {
  border-radius: 12px;
  margin-bottom: 8px;
}
```

## Integration Examples

### With Map Components
```jsx
// In FacilityMap.jsx
import { AlertsSidebar } from '../components'

const FacilityMap = () => {
  const [alertsSidebarOpen, setAlertsSidebarOpen] = useState(false)
  
  return (
    <div>
      {/* Map content */}
      <AlertsSidebar 
        isOpen={alertsSidebarOpen}
        onToggle={() => setAlertsSidebarOpen(!alertsSidebarOpen)}
      />
    </div>
  )
}
```

### With Dashboard
```jsx
// In Dashboard.jsx
import { AlertsSidebar } from '../components'
import { useAlerts } from '../hooks'

const Dashboard = () => {
  const { summary } = useAlerts()
  const [alertsOpen, setAlertsOpen] = useState(false)
  
  return (
    <div>
      <header>
        <button onClick={() => setAlertsOpen(true)}>
          🚨 {summary.total} Alerts
        </button>
      </header>
      
      <AlertsSidebar 
        isOpen={alertsOpen}
        onToggle={() => setAlertsOpen(!alertsOpen)}
      />
    </div>
  )
}
```

## Future Enhancements

### Planned Features
- **Sound Notifications**: Audio alerts for critical issues
- **Push Notifications**: Browser notifications when sidebar is closed
- **Bulk Actions**: Select and resolve multiple alerts
- **Alert History**: View resolved alerts with timestamps
- **Custom Filters**: User-defined filter criteria
- **Export Functionality**: Download alerts as CSV/PDF

### Advanced Features
- **Alert Routing**: Assign alerts to specific users
- **Escalation Rules**: Automatic escalation for unresolved alerts
- **Integration APIs**: Webhook support for external systems
- **Mobile Optimization**: Touch-friendly interface for mobile devices
- **Keyboard Shortcuts**: Quick actions via keyboard
- **Accessibility**: Screen reader support and ARIA labels

## Troubleshooting

### Common Issues

**Alerts not updating in real-time**
- Check Supabase Realtime configuration
- Verify alerts table has realtime enabled
- Check browser console for connection errors

**High memory usage**
- Reduce alert limit in useAlerts hook
- Implement pagination for large datasets
- Clear resolved alerts periodically

**Slow performance**
- Enable database indexes on alerts table
- Optimize filter queries
- Consider server-side filtering for large datasets

**Connection drops**
- Check network stability
- Verify Supabase project status
- Implement retry logic with exponential backoff