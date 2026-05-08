# Inbound SMS Edge Function - Complete Implementation Guide

## 📱 Overview

The `inbound-sms` Edge Function processes incoming SMS messages from field workers reporting facility conditions. It parses structured messages in the format `F{id}#{block}#{CONDITION}` and automatically creates reports in the database, updating facility status in real-time.

## 📁 Files Created

### Edge Function Core
- `supabase/functions/inbound-sms/index.ts` - Main SMS parsing and processing function
- `supabase/functions/inbound-sms/deno.json` - Deno configuration
- `supabase/functions/inbound-sms/README.md` - Detailed technical documentation

### Deployment & Testing
- `supabase/functions/inbound-sms/deploy.sh` - Bash deployment script
- `supabase/functions/inbound-sms/deploy.ps1` - PowerShell deployment script
- `supabase/functions/inbound-sms/test.ts` - Comprehensive test script with validation

### Client Integration
- `src/lib/inbound-sms.js` - Client utilities for SMS testing and management
- `src/components/InboundSMSManager.jsx` - React component for SMS testing and monitoring

## 🚀 Quick Start

### 1. Deploy the Edge Function

**Windows:**
```powershell
cd supabase/functions/inbound-sms
.\deploy.ps1 local
```

**Linux/Mac:**
```bash
cd supabase/functions/inbound-sms
./deploy.sh local
```

### 2. Test the Function

```bash
# Test with valid SMS
curl -X POST 'http://localhost:54321/functions/v1/inbound-sms' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"text": "F1#A#good", "from": "+233241234567"}'

# Test with invalid SMS
curl -X POST 'http://localhost:54321/functions/v1/inbound-sms' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"text": "invalid message", "from": "+233241234567"}'
```

### 3. Configure Africa's Talking Webhook

1. **Login to Africa's Talking Dashboard**
2. **Go to SMS → Callback URLs**
3. **Set Delivery Reports URL**:
   ```
   https://your-project.supabase.co/functions/v1/inbound-sms
   ```

## 📋 SMS Message Format

### Standard Format
```
F{facility_id}#{block}#{condition}
```

### Components Explained

**F{facility_id}**
- Must start with capital 'F'
- Followed by facility identifier (numeric or UUID)
- Examples: `F1`, `F123`, `F550e8400-e29b-41d4-a716-446655440000`

**#{block}**
- Block, section, or area identifier
- Can be letters, numbers, or words
- Examples: `A`, `B`, `1`, `2`, `MAIN`, `BLOCK1`

**#{condition}**
- Facility condition (see valid conditions below)
- Case-insensitive
- Supports aliases for user-friendly input

### Valid Conditions

**Primary Conditions:**
- `good` - Facility working properly
- `damaged` - Has damage but partially functional
- `overflow` - Facility is overflowing
- `dry` - No water supply
- `blocked` - Blocked/clogged
- `out_of_service` - Completely non-functional

**User-Friendly Aliases:**
- **Good**: `ok`, `fine`, `working`, `clean`, `operational`
- **Damaged**: `broken`, `cracked`, `leaking`, `faulty`
- **Overflow**: `overflowing`, `full`, `spilling`
- **Dry**: `empty`, `no_water`, `nowater`
- **Blocked**: `clogged`, `stuck`, `jammed`
- **Out of Service**: `broken_down`, `not_working`, `unusable`

### SMS Examples

```
F123#A#good          ✅ Facility 123, Block A, Good condition
F456#B#overflow      ✅ Facility 456, Block B, Overflow detected
F789#1#broken        ✅ Facility 789, Block 1, Damaged (alias)
F101#MAIN#clogged    ✅ Facility 101, Main block, Blocked (alias)
F202#C#ok            ✅ Facility 202, Block C, Good (alias)

123#A#good           ❌ Missing F prefix
F123-A-good          ❌ Wrong delimiter (use #)
F123#good            ❌ Missing block number
F123#A#invalid       ❌ Invalid condition
```

## 🔧 Function Features

### Smart Parsing
- **Flexible Format**: Handles various facility ID formats
- **Case Insensitive**: Accepts uppercase/lowercase conditions
- **Alias Support**: Converts user-friendly terms to standard conditions
- **Validation**: Comprehensive format and content validation

### Phone Number Handling
- **Auto-formatting**: Converts local numbers to international format
- **Ghana Support**: Handles 0241234567 → +233241234567
- **Validation**: Ensures proper phone number format

### Database Integration
- **Automatic Reports**: Creates reports in the database
- **Facility Updates**: Updates facility status via database triggers
- **Alert Generation**: Triggers alerts for critical conditions
- **Real-time Updates**: Integrates with Supabase Realtime

### Error Handling
- **Detailed Errors**: Provides specific error messages
- **Helpful Suggestions**: Offers correction suggestions
- **Graceful Failures**: Handles invalid input gracefully

## 📊 Response Formats

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
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Message must have exactly 3 parts separated by #",
  "help": "Send SMS in format: F{facility_id}#{block}#{condition}. Example: F123#A#good",
  "valid_conditions": ["good", "damaged", "overflow", "dry", "blocked", "out_of_service"],
  "parsed": {
    "facility_id": "",
    "block_number": "",
    "condition": "",
    "phone_number": "+233241234567",
    "raw_message": "invalid message",
    "is_valid": false,
    "error": "Message must have exactly 3 parts separated by #"
  }
}
```

## 🔄 Automation and Integration

### Database Triggers
The function integrates with existing database triggers:

1. **Facility Status Update**: `update_facility_status_from_report` trigger automatically updates facility status
2. **Alert Generation**: `generate_facility_alerts` trigger creates alerts for critical conditions
3. **Real-time Updates**: Changes broadcast via Supabase Realtime

### Webhook Integration
**Africa's Talking Webhook Format:**
```
POST /functions/v1/inbound-sms
Content-Type: application/x-www-form-urlencoded

id=12345&text=F123%23A%23good&from=%2B233241234567&to=12345&date=2024-02-16T10:30:00Z
```

**Manual/API Format:**
```json
POST /functions/v1/inbound-sms
Content-Type: application/json

{
  "text": "F123#A#good",
  "from": "+233241234567"
}
```

## 📱 React Component Usage

### InboundSMSManager Component
```jsx
import { InboundSMSManager } from './components'

function App() {
  return (
    <div>
      <h1>SMS Reporting System</h1>
      <InboundSMSManager />
    </div>
  )
}
```

### Component Features
- **SMS Testing**: Test SMS parsing with real-time validation
- **Recent Reports**: View and monitor incoming SMS reports
- **Format Guide**: Reference for workers on SMS format
- **Facility Reference**: List of facilities with SMS IDs
- **Condition Aliases**: Reference for valid conditions and aliases

## 🏗️ Facility ID Mapping

### Current Implementation
The function supports both numeric and UUID facility IDs:

**Numeric IDs** (for user convenience):
```
F1#A#good    → Maps to first facility in database
F2#B#overflow → Maps to second facility in database
```

**UUID IDs** (for precision):
```
F550e8400-e29b-41d4-a716-446655440000#A#good
```

### Recommended Enhancement
For production use, consider adding a `facility_code` field:

```sql
-- Add facility code field
ALTER TABLE facilities ADD COLUMN facility_code VARCHAR(20) UNIQUE;

-- Update with simple codes
UPDATE facilities SET facility_code = 'TMC001' WHERE name = 'Tamale Central Market Toilet';
UPDATE facilities SET facility_code = 'YMT002' WHERE name = 'Yendi Market Toilet Complex';
```

Then workers can use:
```
FTMC001#A#good    → Tamale Central Market Toilet
FYMT002#B#overflow → Yendi Market Toilet Complex
```

## 📈 Monitoring and Analytics

### Key Metrics
- **SMS Processing Success Rate**: Percentage of valid SMS processed
- **Common Error Types**: Most frequent parsing errors
- **Response Time**: SMS processing speed
- **Report Volume**: SMS reports per day/hour
- **Worker Engagement**: Active SMS reporters

### Client-Side Analytics
```javascript
import { getSMSReportingStats } from './lib/inbound-sms'

const stats = await getSMSReportingStats(7) // Last 7 days
console.log('SMS Reports:', stats.sms_reports)
console.log('Unique Reporters:', stats.unique_reporters)
console.log('Condition Breakdown:', stats.condition_breakdown)
```

### Database Queries
```sql
-- SMS reports in last 24 hours
SELECT COUNT(*) FROM reports 
WHERE notes LIKE '%SMS Report%' 
AND created_at > NOW() - INTERVAL '24 hours';

-- Most active SMS reporters
SELECT reported_by, COUNT(*) as report_count
FROM reports 
WHERE notes LIKE '%SMS Report%'
GROUP BY reported_by 
ORDER BY report_count DESC;

-- Condition distribution from SMS
SELECT condition, COUNT(*) as count
FROM reports 
WHERE notes LIKE '%SMS Report%'
GROUP BY condition 
ORDER BY count DESC;
```

## 🔧 Customization Options

### Custom Condition Aliases
```typescript
// Add more aliases in the Edge Function
const CUSTOM_ALIASES = {
  'needs_cleaning': 'damaged',
  'water_low': 'dry',
  'door_broken': 'damaged',
  'smell_bad': 'damaged'
}
```

### Custom Facility Lookup
```typescript
// Implement custom facility mapping
async function findFacilityByCode(code: string) {
  const { data, error } = await supabase
    .from('facilities')
    .select('*')
    .eq('facility_code', code)
    .single()
  
  return error ? null : data
}
```

### SMS Reply System
```typescript
// Send confirmation SMS back to reporter
async function sendConfirmationSMS(phone: string, facilityName: string, condition: string) {
  await supabase.functions.invoke('send-sms-alert', {
    body: {
      worker_phones: [phone],
      custom_message: `Thank you! Report received for ${facilityName}. Condition: ${condition}. Report ID: ${reportId}`,
      test_mode: false
    }
  })
}
```

## 🛠️ Development and Testing

### Local Testing
```bash
# Start Supabase
supabase start

# Deploy function
supabase functions deploy inbound-sms

# Test with various formats
curl -X POST 'http://localhost:54321/functions/v1/inbound-sms' \
  -H 'Content-Type: application/json' \
  -d '{"text": "F1#A#good", "from": "+233241234567"}'
```

### Test Cases
```javascript
const testCases = [
  { sms: "F1#A#good", expected: true },
  { sms: "F2#B#overflow", expected: true },
  { sms: "F3#1#broken", expected: true },      // alias
  { sms: "F4#MAIN#clogged", expected: true },  // alias
  { sms: "123#A#good", expected: false },      // missing F
  { sms: "F123#good", expected: false },       // missing block
  { sms: "F123#A#invalid", expected: false }   // invalid condition
]
```

### Debug Mode
Enable detailed logging in the function:
```typescript
console.log('📱 Received SMS:', { from: incomingSMS.from, text: incomingSMS.text })
console.log('📋 Parsed SMS:', parsed)
console.log('🏢 Found facility:', facility?.name)
```

## 🔐 Security Considerations

### Input Validation
- **SQL Injection Protection**: Uses parameterized queries
- **Content Sanitization**: Validates and sanitizes all SMS content
- **Phone Number Validation**: Ensures proper phone number format

### Access Control
- **Service Role Access**: Uses service role for database operations
- **RLS Compliance**: Respects Row Level Security policies
- **Facility Validation**: Verifies facility exists before creating reports

### Rate Limiting
Consider implementing:
- **Per-phone Rate Limits**: Prevent spam from single numbers
- **Global Rate Limits**: Protect against DoS attacks
- **Validation Limits**: Limit invalid message attempts

## 🚨 Troubleshooting

### Common Issues

1. **"Message must start with F"**
   - Ensure SMS starts with capital F
   - Check for extra spaces or characters

2. **"Facility not found"**
   - Verify facility ID exists in database
   - Check facility ID mapping logic
   - Ensure facilities table has data

3. **"Invalid condition"**
   - Use valid condition values or aliases
   - Check spelling of condition
   - Refer to condition reference guide

4. **"Failed to save report"**
   - Check database connectivity
   - Verify reports table permissions
   - Check for constraint violations

### Debug Steps
1. **Check Function Logs**: View logs in Supabase dashboard
2. **Test SMS Format**: Use validation function to check format
3. **Verify Database**: Ensure facilities and reports tables exist
4. **Test Manually**: Use React component to test SMS processing
5. **Check Webhooks**: Verify Africa's Talking webhook configuration

## 📚 Training Materials

### Worker Training Guide
Create training materials covering:

1. **SMS Format**: `F{ID}#{BLOCK}#{CONDITION}`
2. **Facility IDs**: Reference cards with facility codes
3. **Conditions**: List of valid conditions and aliases
4. **Examples**: Common scenarios and correct SMS format
5. **Troubleshooting**: What to do if SMS fails

### Sample Training SMS
```
Good morning! Here's how to report facility conditions via SMS:

Format: F{ID}#{BLOCK}#{CONDITION}

Examples:
- F123#A#good (everything working)
- F456#B#overflow (toilet overflowing)
- F789#1#broken (facility damaged)

Your facility IDs:
- Tamale Market: F1
- Health Center: F2
- School Block: F3

Questions? Call supervisor.
```

## 🎯 Best Practices

1. **Clear Instructions**: Provide workers with simple, clear SMS format guide
2. **Facility Reference**: Give workers cards with facility IDs
3. **Regular Training**: Conduct periodic SMS reporting training
4. **Error Monitoring**: Monitor and address common SMS format errors
5. **Feedback Loop**: Send confirmation SMS for successful reports
6. **Data Quality**: Regularly review and validate SMS report data
7. **Performance Monitoring**: Track SMS processing performance
8. **User Experience**: Make SMS format as simple as possible

## 🔮 Future Enhancements

### Planned Features
- **Multi-language Support**: SMS parsing in local languages
- **Voice-to-SMS**: Convert voice messages to SMS format
- **Photo Attachments**: Handle MMS with facility photos
- **Automated Responses**: Send confirmation and follow-up SMS
- **Smart Suggestions**: AI-powered condition suggestions
- **Bulk Processing**: Handle multiple facility reports in one SMS

### Integration Opportunities
- **WhatsApp Integration**: Support WhatsApp messages
- **USSD Integration**: Interactive USSD menus for reporting
- **Mobile App**: Dedicated mobile app with SMS fallback
- **IoT Sensors**: Automatic condition reporting from sensors

---

**🎉 Your inbound SMS system is ready!** Field workers can now report facility conditions via simple SMS messages, automatically creating reports and updating facility status in real-time.