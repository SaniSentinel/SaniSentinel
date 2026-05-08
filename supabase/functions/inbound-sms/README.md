# Inbound SMS Edge Function

This Edge Function processes incoming SMS messages from field workers reporting facility conditions. It parses messages in the format `F{id}#{block}#{CONDITION}` and automatically creates reports in the database.

## Features

- **SMS Message Parsing**: Parses structured SMS messages with facility ID, block/section, and condition
- **Flexible Facility Lookup**: Supports both numeric IDs and UUIDs for facility identification
- **Condition Validation**: Validates conditions against database schema with user-friendly aliases
- **Automatic Report Creation**: Creates reports in the database and updates facility status
- **Phone Number Validation**: Normalizes phone numbers to international format
- **Error Handling**: Provides helpful error messages for invalid SMS formats
- **Webhook Support**: Compatible with Africa's Talking SMS webhooks
- **Manual Testing**: Supports JSON input for testing and debugging

## SMS Message Format

### Standard Format
```
F{facility_id}#{block}#{condition}
```

### Examples
```
F123#A#good          - Facility 123, Block A, Good condition
F456#B#overflow      - Facility 456, Block B, Overflow detected
F789#1#damaged       - Facility 789, Block 1, Damaged
F101#MAIN#blocked    - Facility 101, Main block, Blocked
```

### Supported Conditions

**Primary Conditions** (exact database values):
- `good` - Facility is working properly
- `damaged` - Facility has damage but is partially functional
- `overflow` - Facility is overflowing
- `dry` - Facility has no water supply
- `blocked` - Facility is blocked/clogged
- `out_of_service` - Facility is completely non-functional

**User-Friendly Aliases** (automatically converted):
- `ok`, `fine`, `working`, `clean`, `operational` → `good`
- `broken`, `cracked`, `leaking`, `faulty` → `damaged`
- `overflowing`, `full`, `spilling` → `overflow`
- `empty`, `no_water`, `nowater` → `dry`
- `clogged`, `stuck`, `jammed` → `blocked`
- `broken_down`, `not_working`, `notworking`, `unusable` → `out_of_service`

## Setup and Configuration

### 1. Deploy the Function

```bash
supabase functions deploy inbound-sms
```

### 2. Configure Africa's Talking Webhook

1. **Login to Africa's Talking Dashboard**
2. **Go to SMS → Callback URLs**
3. **Set Delivery Reports URL**:
   ```
   https://your-project.supabase.co/functions/v1/inbound-sms
   ```

### 3. Test the Function

**Manual Testing (JSON):**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/inbound-sms' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "F123#A#good",
    "from": "+233241234567"
  }'
```

**Webhook Testing (Form Data):**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/inbound-sms' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'text=F123#A#overflow&from=%2B233241234567&id=12345'
```

## Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Report received and saved for Tamale Central Market Toilet",
  "report": {
    "id": "report-uuid",
    "facility_name": "Tamale Central Market Toilet",
    "facility_id": "facility-uuid",
    "district": "Tamale",
    "block": "A",
    "condition": "good",
    "reported_by": "+233241234567",
    "created_at": "2024-02-16T10:30:00Z"
  },
  "parsed": {
    "facility_id": "123",
    "block_number": "A",
    "condition": "good",
    "phone_number": "+233241234567",
    "raw_message": "F123#A#good",
    "is_valid": true
  },
  "sms_id": "12345"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Message must have exactly 3 parts separated by # (e.g., F123#A#good)",
  "help": "Send SMS in format: F{facility_id}#{block}#{condition}. Example: F123#A#good",
  "valid_conditions": ["good", "damaged", "overflow", "dry", "blocked", "out_of_service"],
  "parsed": {
    "facility_id": "",
    "block_number": "",
    "condition": "",
    "phone_number": "+233241234567",
    "raw_message": "invalid message",
    "is_valid": false,
    "error": "Message must have exactly 3 parts separated by # (e.g., F123#A#good)"
  }
}
```

## Database Integration

### Reports Table
The function creates records in the `reports` table with:
- `facility_id`: UUID of the facility (looked up from SMS facility ID)
- `reported_by`: Normalized phone number of the reporter
- `condition`: Validated condition value
- `notes`: Generated notes including block, facility name, district, and raw message

### Automatic Facility Updates
The database trigger `update_facility_status_from_report` automatically:
- Updates the facility's `status` field to match the reported condition
- Updates the facility's `updated_at` timestamp
- Triggers any alert generation based on the new status

### Alert Generation
Existing database triggers will automatically generate alerts for:
- Critical conditions (overflow, out_of_service)
- High-risk conditions (blocked, damaged)
- Status changes that require attention

## Facility ID Mapping

### UUID Support
If your facilities use UUIDs, workers can send the full UUID:
```
F550e8400-e29b-41d4-a716-446655440000#A#good
```

### Numeric ID Support
For user-friendly numeric IDs, the function attempts to map them to facilities:
```
F1#A#good    - Maps to first facility
F2#B#overflow - Maps to second facility
```

**Note**: For production use, consider adding a `facility_code` field to your facilities table for more reliable numeric ID mapping.

## Phone Number Handling

The function automatically normalizes phone numbers:
- `0241234567` → `+233241234567`
- `233241234567` → `+233241234567`
- `+233241234567` → `+233241234567` (no change)

## Error Handling and Validation

### Message Format Validation
- Must start with 'F'
- Must have exactly 3 parts separated by '#'
- Facility ID must be alphanumeric
- Block number cannot be empty
- Condition must be valid or have a recognized alias

### Facility Validation
- Facility must exist in the database
- Returns helpful error if facility not found

### Database Validation
- Validates against reports table constraints
- Handles database connection errors gracefully

## Testing and Development

### Local Testing
```bash
# Start Supabase locally
supabase start

# Deploy function locally
supabase functions serve inbound-sms

# Test with curl
curl -X POST 'http://localhost:54321/functions/v1/inbound-sms' \
  -H 'Content-Type: application/json' \
  -d '{"text": "F1#A#good", "from": "+233241234567"}'
```

### Test Cases
```bash
# Valid messages
F123#A#good
F456#B#overflow
F789#1#damaged
F101#MAIN#blocked

# Invalid messages (for error testing)
123#A#good          # Missing F prefix
F123#good           # Missing block
F123#A#             # Missing condition
F123#A#invalid      # Invalid condition
```

### Debug Mode
Enable detailed logging by checking the function logs in Supabase dashboard.

## Integration with Other Systems

### SMS Reply System
You can extend this function to send confirmation SMS back to users:
```typescript
// After successful report creation
await sendConfirmationSMS(parsed.phone_number, facility.name, parsed.condition)
```

### Real-time Updates
The function integrates with Supabase Realtime:
- Reports table has realtime enabled
- Dashboard updates automatically when new reports arrive
- Alerts are generated in real-time

### Webhook Chaining
The function can trigger other webhooks or functions:
- Send notifications to supervisors for critical conditions
- Update external monitoring systems
- Generate automatic work orders

## Security Considerations

### Input Validation
- All SMS content is sanitized and validated
- SQL injection protection through parameterized queries
- Phone number format validation

### Access Control
- Uses service role key for database access
- Validates facility existence before creating reports
- Respects RLS policies on reports table

### Rate Limiting
Consider implementing rate limiting for:
- Multiple reports from same phone number
- Rapid-fire SMS submissions
- Invalid message attempts

## Monitoring and Analytics

### Key Metrics to Track
- SMS processing success rate
- Most common error types
- Response time for SMS processing
- Report volume by district/facility
- Condition distribution over time

### Logging
The function logs:
- Incoming SMS details
- Parsing results
- Database operations
- Error conditions

### Alerts
Set up monitoring for:
- Function execution failures
- High error rates
- Unusual SMS patterns
- Database connection issues

## Customization

### Custom Facility ID Mapping
```typescript
// Add custom facility lookup logic
async function findFacilityByCode(code: string) {
  // Your custom mapping logic
  return await supabase
    .from('facilities')
    .select('*')
    .eq('facility_code', code)
    .single()
}
```

### Custom Condition Aliases
```typescript
// Add more condition aliases
const CUSTOM_ALIASES = {
  'needs_cleaning': 'damaged',
  'water_low': 'dry',
  'door_broken': 'damaged'
}
```

### Custom Response Messages
```typescript
// Customize success/error messages
const RESPONSE_MESSAGES = {
  success: 'Thank you! Your report has been received.',
  invalid_format: 'Please send: F{ID}#{BLOCK}#{CONDITION}',
  facility_not_found: 'Facility not found. Check ID and try again.'
}
```

## Best Practices

1. **Clear Instructions**: Provide workers with clear SMS format instructions
2. **Facility ID Cards**: Give workers cards with facility IDs for reference
3. **Regular Training**: Train workers on proper SMS reporting format
4. **Error Monitoring**: Monitor and address common SMS format errors
5. **Feedback Loop**: Send confirmation SMS for successful reports
6. **Data Quality**: Regularly review and clean up report data
7. **Performance**: Monitor function performance and optimize as needed

## Troubleshooting

### Common Issues

1. **"Message must start with F"**
   - Ensure SMS starts with capital F
   - Check for extra spaces or characters

2. **"Facility not found"**
   - Verify facility ID exists in database
   - Check facility ID mapping logic

3. **"Invalid condition"**
   - Use valid condition values or aliases
   - Check spelling of condition

4. **"Failed to save report"**
   - Check database connectivity
   - Verify reports table permissions
   - Check for constraint violations

### Debug Steps
1. Check function logs in Supabase dashboard
2. Verify SMS format matches expected pattern
3. Test facility lookup manually
4. Check database table structure and permissions
5. Validate phone number format