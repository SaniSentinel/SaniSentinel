# Professional Workers Administration Page

## Overview
The Professional Workers page provides comprehensive administration capabilities for managing field workers, supervisors, maintenance technicians, health officers, and district coordinators in the climate-resilient sanitation monitoring system.

## Features

### Summary Dashboard
- **Total Workers**: Shows count of all workers in the system
- **Active Workers**: Count and percentage of currently active workers
- **Field Workers**: Count of active field staff (most common role)
- **Inactive Workers**: Count of deactivated workers

### Advanced Filtering
- **Status Filter**: Active, Inactive, or All workers
- **District Filter**: Filter by specific district or view all
- **Role Filter**: Filter by worker role (field worker, supervisor, etc.)
- **Search**: Search by worker name or phone number
- **Clear Filters**: Reset all filters to default state

### Worker Management
- **Add New Worker**: Create new worker with name, phone, district, and role
- **Edit Worker**: Update existing worker information
- **Activate/Deactivate**: Toggle worker status (soft delete)
- **District Assignment**: Assign workers to specific districts
- **Role Management**: Set appropriate roles for workers

### Data Display
- **Comprehensive Table**: Shows name, phone, district, role, and status
- **Pagination**: Handle large datasets with page navigation
- **Real-time Updates**: Data refreshes after any changes
- **Professional Styling**: Clean, government/NGO appropriate design

## Worker Roles

### Field Worker (`field_worker`)
- Primary data collectors in the field
- Submit facility condition reports via SMS
- Most common worker type

### Supervisor (`supervisor`)
- Oversee field workers in their district
- Review and validate reports
- Coordinate field activities

### Maintenance Technician (`maintenance_tech`)
- Handle facility repairs and maintenance
- Respond to maintenance requests
- Technical expertise for facility issues

### Health Officer (`health_officer`)
- Public health oversight
- Health impact assessments
- Policy compliance monitoring

### District Coordinator (`district_coordinator`)
- Overall district management
- Strategic planning and coordination
- Liaison with regional authorities

## Phone Number Format
- **Required Format**: +233XXXXXXXXX (Ghana country code)
- **Automatic Validation**: Ensures proper format for SMS functionality
- **Unique Constraint**: Each phone number can only be used once
- **Display Format**: Shows as 0XXXXXXXXX for user readability

## District Integration
- Workers are assigned to specific districts
- District information includes name and region
- Filtering and organization by district
- Supports all Northern Ghana districts

## Technical Implementation

### Components Used
- `AppLayout`: Professional page wrapper with navigation
- `MetricCard`: Summary statistics display
- `StatusBadge`: Visual status indicators
- `Modal Forms`: Add/edit worker functionality

### Data Management
- `useWorkers` hook: Custom hook for worker operations
- `workers` API: Comprehensive CRUD operations
- Real-time data updates after changes
- Error handling and validation

### State Management
- Form validation with error display
- Loading states for async operations
- Pagination state management
- Filter state persistence

## Usage Examples

### Adding a New Worker
1. Click "Add Worker" button
2. Fill in required information:
   - Full Name
   - Phone Number (+233XXXXXXXXX)
   - District assignment
   - Role selection
3. Submit form
4. Worker appears in table immediately

### Editing Worker Information
1. Click "Edit" button for specific worker
2. Modify information in modal form
3. Save changes
4. Table updates with new information

### Managing Worker Status
1. Use "Activate"/"Deactivate" buttons
2. Inactive workers are visually distinguished
3. Status changes are immediate
4. Maintains worker history (soft delete)

### Filtering Workers
1. Use filter dropdowns and search box
2. Filters work together (AND logic)
3. Results update immediately
4. Clear all filters with one click

## Integration Points

### SMS System
- Phone numbers used for SMS alerts and notifications
- Worker validation for incoming SMS reports
- Role-based message routing

### Reports System
- Workers linked to facility condition reports
- Reporter identification and validation
- Activity tracking and metrics

### Maintenance System
- Maintenance technicians assigned to tasks
- Worker availability and scheduling
- Skill-based task assignment

### Alert System
- Role-based alert distribution
- District-specific notifications
- Escalation hierarchies

## Data Validation

### Form Validation
- Required field checking
- Phone number format validation
- District and role selection validation
- Duplicate phone number prevention

### Business Rules
- Each phone number must be unique
- Workers must be assigned to valid districts
- Role must be from predefined list
- Names and phone numbers are trimmed

## Performance Considerations

### Pagination
- 20 workers per page by default
- Efficient data loading
- Smooth navigation between pages

### Filtering
- Client-side filtering for responsive UI
- Efficient search algorithms
- Minimal re-renders

### Data Loading
- Loading states during API calls
- Error handling with retry options
- Optimistic UI updates

## Security Features

### Data Protection
- Row Level Security (RLS) enabled
- Authenticated user access only
- Audit trail for changes

### Input Validation
- Server-side validation
- SQL injection prevention
- XSS protection

## Future Enhancements

### Planned Features
- Bulk worker import/export
- Worker activity analytics
- Performance metrics dashboard
- Advanced reporting capabilities

### Integration Opportunities
- Integration with HR systems
- Training record management
- Performance evaluation tools
- Mobile app for worker management

## Troubleshooting

### Common Issues
1. **Phone number validation errors**: Ensure +233 format
2. **District not showing**: Check district data is loaded
3. **Worker not saving**: Verify all required fields
4. **Filters not working**: Clear filters and try again

### Error Messages
- Clear, actionable error messages
- Field-specific validation feedback
- Network error handling
- Retry mechanisms for failed operations

## API Dependencies
- `workers.js`: Core worker operations
- `districts.js`: District data for assignments
- `supabase.js`: Database connection and authentication