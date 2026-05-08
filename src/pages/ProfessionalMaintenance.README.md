# Professional Maintenance Page

## Overview

The Professional Maintenance page provides a comprehensive interface for managing maintenance tasks across the SaniSentinel system. This page is designed for District Officers, Maintenance Coordinators, and Field Workers who need to track, assign, and resolve facility maintenance tasks.

## Features

### 📊 Task Summary Dashboard
- **Open Tasks**: Count of all active maintenance tasks
- **Pending**: Tasks awaiting assignment
- **Assigned**: Tasks assigned to workers
- **In Progress**: Tasks currently being worked on
- **Urgent**: High-priority tasks requiring immediate attention
- **Overdue**: Tasks past their due date

### 🔍 Advanced Filtering System
- **Status Filter**: Open tasks, all tasks, or specific status (pending, assigned, in_progress, completed)
- **Priority Filter**: Filter by urgency (urgent, high, medium, low)
- **Task Type Filter**: Filter by maintenance type (routine cleaning, emptying, repair, inspection, emergency response, preventive maintenance)
- **District Filter**: Filter by facility district
- **Worker Filter**: Filter by assigned worker
- **Overdue Filter**: Show only overdue tasks

### 📋 Comprehensive Task Table
- **Task Details**: Type, description, and priority
- **Facility Information**: Name and district
- **Priority Indicators**: Color-coded priority badges
- **Status Badges**: Visual status indicators
- **Worker Assignment**: Assigned worker details
- **Due Date**: With overdue highlighting
- **Action Buttons**: Mark as resolved, start task

### ⚡ Task Actions
- **Mark as Resolved**: Complete tasks with one click
- **Start Task**: Move pending/assigned tasks to in-progress
- **Real-time Updates**: Live updates when tasks change
- **Bulk Operations**: Future enhancement for multiple task actions

### 🎨 Professional UI/UX
- **Color-Coded Rows**: Overdue tasks highlighted in red
- **Priority Badges**: Visual priority indicators
- **Status Integration**: Consistent StatusBadge components
- **Responsive Design**: Works on all screen sizes
- **Loading States**: Professional feedback during actions

## Technical Implementation

### Component Architecture
```
ProfessionalMaintenance.jsx (Main Component)
├── AppLayout (Professional layout wrapper)
├── MetricCard (Summary statistics)
├── Filters Section (Advanced filtering)
├── Tasks Table (Maintenance tasks display)
├── StatusBadge (Status indicators)
└── Action Buttons (Task management)
```

### Custom Hook
```
useMaintenance.js (Data management hook)
├── Data Loading (Multiple query strategies)
├── Real-time Updates (Supabase subscriptions)
├── Task Actions (Complete, start, assign, cancel)
├── Statistics Calculation (Task analytics)
├── Utility Functions (Formatting, filtering)
└── Error Handling (Comprehensive error management)
```

### State Management
- **Tasks Data**: All maintenance tasks with facility, worker, and district information
- **Filtered Data**: Client-side filtered results for responsive UX
- **Filter State**: All filter options and values
- **Action Loading**: Individual task action loading states
- **Statistics**: Summary metrics for dashboard cards

### Database Integration
- **Comprehensive Queries**: Includes facility, worker, and district relationships
- **Real-time Subscriptions**: Live updates when tasks are created/updated
- **Task Actions**: Complete, start, assign, cancel operations
- **Auto-creation**: Tasks automatically created from critical facility alerts

## Task Management Features

### Task Status Flow
1. **Pending**: Newly created, awaiting assignment
2. **Assigned**: Assigned to a worker
3. **In Progress**: Worker has started the task
4. **Completed**: Task finished successfully
5. **Cancelled**: Task cancelled or no longer needed

### Priority Levels
- **Urgent**: Critical issues requiring immediate attention (red)
- **High**: Important tasks needing prompt action (orange)
- **Medium**: Standard maintenance tasks (yellow)
- **Low**: Routine or preventive maintenance (green)

### Task Types
- **Routine Cleaning**: Regular facility cleaning and maintenance
- **Emptying**: Pit emptying and waste removal
- **Repair**: Fixing damaged or broken components
- **Inspection**: Health and safety inspections
- **Emergency Response**: Critical issues requiring immediate action
- **Preventive Maintenance**: Proactive maintenance to prevent issues

### Auto-Task Creation
The system automatically creates maintenance tasks when:
- Facility status changes to critical conditions (out_of_service, overflow, damaged)
- Facility risk score reaches 80 or higher
- Alerts are generated for critical facility conditions

## Filter Capabilities

### Status Filtering
- **Open Tasks**: Shows pending, assigned, and in-progress tasks (default)
- **All Tasks**: Shows all tasks including completed and cancelled
- **Specific Status**: Filter by exact status (pending, assigned, etc.)

### Priority Filtering
- **All Priorities**: Shows tasks of all priority levels
- **Urgent**: Critical tasks requiring immediate attention
- **High**: Important tasks needing prompt action
- **Medium/Low**: Standard and routine maintenance tasks

### Advanced Filtering
- **District**: Filter by facility location
- **Worker**: Filter by assigned worker
- **Task Type**: Filter by maintenance category
- **Overdue**: Show only tasks past their due date

## User Experience Features

### Visual Design
- **Professional Color Scheme**: Consistent with system branding
- **Priority Colors**: Red (urgent), orange (high), yellow (medium), green (low)
- **Status Colors**: Semantic colors for different task statuses
- **Overdue Highlighting**: Red background for overdue tasks

### Interaction Patterns
- **One-Click Actions**: Mark as resolved with single button click
- **Immediate Feedback**: Loading states during task actions
- **Clear Visual Hierarchy**: Important information prominently displayed
- **Responsive Layout**: Adapts to different screen sizes

### Accessibility
- **WCAG Compliance**: Color contrast and semantic HTML
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Clear focus indicators for interactive elements

## Performance Optimizations

### Data Management
- **Client-side Filtering**: Fast response for filter changes
- **Efficient Queries**: Single query includes all related data
- **Pagination**: Limits DOM elements for better performance (20 tasks per page)
- **Real-time Updates**: Only updates when data actually changes

### Action Optimization
- **Individual Loading States**: Per-task loading indicators
- **Optimistic Updates**: UI updates before server confirmation
- **Error Handling**: Graceful error recovery with user feedback
- **Batch Operations**: Future enhancement for bulk actions

## Integration Points

### Navigation Integration
- **AppLayout**: Consistent navigation with other professional pages
- **Route Configuration**: Integrated into main application routing
- **Breadcrumb Support**: Clear navigation context

### Component Integration
- **MetricCard**: Reused from professional UI components
- **StatusBadge**: Consistent status indicators across system
- **AppLayout**: Professional layout wrapper with alerts sidebar

### Data Integration
- **Maintenance Library**: Uses existing maintenance API functions
- **Real-time Updates**: Integrates with Supabase Realtime
- **Auto-creation**: Triggered by facility status changes and alerts

## API Integration

### Database Schema
The page integrates with the `maintenance_tasks` table:
```sql
CREATE TABLE maintenance_tasks (
  id UUID PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id),
  assigned_to UUID REFERENCES workers(id),
  status VARCHAR(20) CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  task_type VARCHAR(50) CHECK (task_type IN ('routine_cleaning', 'emptying', 'repair', 'inspection', 'emergency_response', 'preventive_maintenance')),
  description TEXT,
  due_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Supabase Operations
- **Get All Tasks**: `maintenance.getAll(limit)`
- **Filter by Status**: `maintenance.getByStatus(status, limit)`
- **Complete Task**: `maintenance.complete(taskId)`
- **Update Status**: `maintenance.update(taskId, updates)`
- **Real-time Updates**: Supabase Realtime subscription

## Task Actions

### Mark as Resolved
- **Function**: Marks task as completed
- **Trigger**: "Mark Resolved" button click
- **Effect**: Updates task status to 'completed', sets completed_at timestamp
- **Side Effects**: Updates facility last_serviced date
- **Feedback**: Loading state during action, success/error messages

### Start Task
- **Function**: Moves task from pending/assigned to in-progress
- **Trigger**: "Start" button click
- **Effect**: Updates task status to 'in_progress'
- **Availability**: Only shown for pending and assigned tasks
- **Feedback**: Button text changes, loading state

### Status Updates
- **Automatic**: Tasks auto-assigned based on district and worker role
- **Manual**: Workers can update task status through actions
- **Real-time**: Status changes reflected immediately across all users
- **Audit Trail**: All status changes tracked with timestamps

## Error Handling

### Error States
- **Network Errors**: Connection issues with database
- **Permission Errors**: Insufficient user permissions
- **Validation Errors**: Invalid task data or status transitions
- **Action Errors**: Failed task operations (complete, start, etc.)

### Recovery Options
- **Retry Button**: Manual retry for failed operations
- **Refresh Data**: Force data reload
- **Clear Filters**: Reset to default state
- **Error Messages**: Clear, actionable error descriptions

## Future Enhancements

### Immediate Opportunities
1. **Task Details Modal**: Detailed view with full description and history
2. **Bulk Actions**: Select and act on multiple tasks
3. **Task Assignment**: Assign/reassign tasks to different workers
4. **Task Creation**: Create new maintenance tasks manually
5. **Comments/Notes**: Add progress notes to tasks

### Advanced Features
1. **Task Scheduling**: Calendar view for task planning
2. **Worker Workload**: View worker capacity and assignments
3. **Task Templates**: Predefined task templates for common issues
4. **Photo Attachments**: Before/after photos for completed tasks
5. **Time Tracking**: Track time spent on tasks

### Analytics & Reporting
1. **Performance Metrics**: Task completion rates and times
2. **Worker Performance**: Individual worker statistics
3. **Facility Trends**: Maintenance patterns by facility
4. **Predictive Maintenance**: AI-powered maintenance scheduling

## Testing

### Unit Tests
- Filter logic validation
- Task action functions
- Date calculations and formatting
- Priority and status color mapping

### Integration Tests
- Database query validation
- Real-time update handling
- Task action workflows
- Error state management

### User Acceptance Tests
- Task filtering and searching
- Mark as resolved functionality
- Status update workflows
- Mobile responsiveness

## Deployment

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup
- Maintenance tasks table with proper indexes
- Row Level Security (RLS) policies
- Real-time subscriptions enabled
- Auto-creation triggers configured

## Support

### Common Issues
1. **Tasks Not Loading**: Check network connection and Supabase configuration
2. **Actions Not Working**: Verify user permissions and database connectivity
3. **Filters Not Applying**: Clear browser cache and refresh
4. **Real-time Updates Missing**: Check Supabase Realtime configuration

### Troubleshooting
1. Check browser console for JavaScript errors
2. Verify Supabase connection in Network tab
3. Test with different filter combinations
4. Validate user permissions in Supabase dashboard

## Conclusion

The Professional Maintenance page provides a comprehensive solution for managing facility maintenance tasks in the SaniSentinel system. With its advanced filtering, real-time updates, and intuitive task management features, it serves as a critical tool for maintaining Northern Ghana's sanitation infrastructure.

The page successfully addresses the need for:
- **Task Visibility**: Clear presentation of all maintenance tasks
- **Efficient Management**: Quick actions for task resolution
- **Real-time Monitoring**: Live updates as tasks are created and completed
- **Professional Interface**: Government/NGO-ready design
- **Performance**: Handles large task lists efficiently

This implementation provides a solid foundation for maintenance task management while maintaining the flexibility to evolve with user needs and operational requirements.