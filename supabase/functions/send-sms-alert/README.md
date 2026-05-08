# Send SMS Alert Edge Function

This Edge Function integrates with Africa's Talking SMS API to send automated SMS alerts to field workers when sanitation facilities hit critical risk levels or encounter urgent issues.

## Features

- **Africa's Talking Integration**: Uses Africa's Talking SMS API for reliable SMS delivery across Africa
- **Smart Worker Selection**: Automatically selects appropriate workers based on alert severity and type
- **Template-Based Messages**: Pre-defined SMS templates for different alert types
- **Batch Processing**: Efficiently processes multiple alerts and sends bulk SMS
- **Test Mode**: Safe testing without sending actual SMS messages
- **Cost Tracking**: Monitors SMS costs and delivery status
- **Role-Based Notifications**: Sends alerts to relevant workers based on their roles

## Alert Types and SMS Templates

### Critical Alerts
- **Critical Status**: `🚨 CRITICAL ALERT: [Facility] in [District] requires IMMEDIATE attention. Facility is at critical risk. Please respond urgently.`
- **System Failure**: `🚨 SYSTEM FAILURE: [Facility] in [District] is OUT OF SERVICE. Immediate repair required.`

### High Priority Alerts
- **Overflow Detected**: `⚠️ OVERFLOW ALERT: [Facility] in [District] is overflowing. Cleanup needed immediately.`
- **High Risk**: `⚠️ HIGH RISK: [Facility] in [District] needs urgent maintenance. Please schedule inspection.`

### Medium Priority Alerts
- **Climate Warning**: `🌧️ WEATHER ALERT: [Facility] in [District] at risk due to weather conditions. Monitor closely.`
- **Maintenance Due**: `📅 MAINTENANCE DUE: [Facility] in [District] requires scheduled maintenance. Please arrange service.`

## Worker Role Notification Matrix

| Alert Severity | Notified Roles |
|----------------|----------------|
| **Critical** | District Coordinator, Supervisor, Maintenance Tech, Health Officer |
| **High** | Supervisor, Maintenance Tech, Field Worker |
| **Medium** | Field Worker, Maintenance Tech |
| **Low** | Field Worker |

Special cases:
- **System Failure/Critical Status**: Always includes District Coordinator and Health Officer
- **Climate Warning**: Always includes District Coordinator

## Setup and Configuration

### 1. Africa's Talking Account Setup

1. **Create Account**: Sign up at [Africa's Talking](https://africastalking.com/)
2. **Get API Credentials**:
   - API Key: Found in your dashboard
   - Username: Your Africa's Talking username
3. **Add Credits**: Purchase SMS credits for your account
4. **Test with Sandbox**: Use sandbox mode for testing

### 2. Environment Variables

Set these environment variables in your Supabase project:

```bash
# Required
AFRICAS_TALKING_API_KEY=your_api_key_here
AFRICAS_TALKING_USERNAME=your_username_here

# Optional (defaults to 'sandbox' for testing)
# AFRICAS_TALKING_USERNAME=sandbox
```

### 3. Supabase Environment Variables

In your Supabase dashboard, go to Settings > Edge Functions and add:

- `AFRICAS_TALKING_API_KEY`: Your Africa's Talking API key
- `AFRICAS_TALKING_USERNAME`: Your Africa's Talking username (or 'sandbox' for testing)

## Usage

### Manual SMS Sending

```bash
# Send SMS for recent critical alerts
curl -X POST 'https://your-project.supabase.co/functions/v1/send-sms-alert' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'

# Send SMS for specific alerts
curl -X POST 'https://your-project.supabase.co/functions/v1/send-sms-alert' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "alert_ids": ["alert-uuid-1", "alert-uuid-2"],
    "test_mode": true
  }'

# Send SMS for specific facilities
curl -X POST 'https://your-project.supabase.co/functions/v1/send-sms-alert' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "facility_ids": ["facility-uuid-1", "facility-uuid-2"],
    "severity_filter": ["critical", "high"]
  }'

# Send custom message to specific workers
curl -X POST 'https://your-project.supabase.co/functions/v1/send-sms-alert' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "worker_phones": ["+233241234567", "+233241234568"],
    "custom_message": "Emergency meeting at district office at 2 PM today.",
    "test_mode": false
  }'
```

### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `alert_ids` | string[] | Specific alert IDs to process |
| `facility_ids` | string[] | Send alerts for facilities with unresolved alerts |
| `worker_phones` | string[] | Send to specific phone numbers |
| `custom_message` | string | Override default message templates |
| `severity_filter` | string[] | Filter alerts by severity (default: ["critical", "high"]) |
| `test_mode` | boolean | Test mode - doesn't send actual SMS (default: false) |

### Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "SMS alerts processed for 5 alerts",
  "summary": {
    "alerts_processed": 5,
    "sms_sent": 12,
    "errors": 0,
    "success_rate": 100
  },
  "results": [
    {
      "alert_id": "uuid",
      "facility_name": "Tamale Central Market Toilet",
      "district_name": "Tamale",
      "alert_type": "critical_status",
      "severity": "critical",
      "recipients": 3,
      "success": true,
      "message_id": "ATXid_...",
      "cost": "0.0300",
      "message": "🚨 CRITICAL ALERT: Tamale Central Market Toilet in Tamale requires IMMEDIATE attention..."
    }
  ],
  "test_mode": false,
  "timestamp": "2024-02-16T10:30:00Z"
}
```

## Automated Triggers

### 1. Database Triggers (Recommended)

Create a database function to automatically trigger SMS alerts:

```sql
-- Function to trigger SMS alerts for critical alerts
CREATE OR REPLACE FUNCTION trigger_sms_alert()
RETURNS TRIGGER AS $
BEGIN
    -- Only trigger for critical and high severity alerts
    IF NEW.severity IN ('critical', 'high') AND NOT NEW.resolved THEN
        -- Call the Edge Function (requires pg_net extension)
        PERFORM net.http_post(
            url := 'https://your-project.supabase.co/functions/v1/send-sms-alert',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || 'YOUR_SERVICE_ROLE_KEY'
            ),
            body := jsonb_build_object(
                'alert_ids', ARRAY[NEW.id::text],
                'test_mode', false
            )
        );
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER auto_sms_alert_trigger
    AFTER INSERT ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sms_alert();
```

### 2. Scheduled SMS Alerts

```sql
-- Send SMS for unresolved critical alerts every hour
SELECT cron.schedule(
    'sms-critical-alerts-hourly',
    '0 * * * *',
    'https://your-project.supabase.co/functions/v1/send-sms-alert'
);

-- Send SMS digest of high-priority alerts twice daily
SELECT cron.schedule(
    'sms-high-priority-digest',
    '0 8,18 * * *',
    'https://your-project.supabase.co/functions/v1/send-sms-alert'
);
```

### 3. Integration with Risk Assessment

Trigger SMS alerts after risk assessment updates:

```javascript
// After running risk assessment
const riskResult = await runRiskAssessment()

if (riskResult.success) {
  // Send SMS for any new critical alerts
  await fetch('/functions/v1/send-sms-alert', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      severity_filter: ['critical'],
      test_mode: false
    })
  })
}
```

## Cost Management

### SMS Pricing (Africa's Talking)
- **Ghana**: ~$0.01 per SMS
- **Nigeria**: ~$0.008 per SMS
- **Kenya**: ~$0.005 per SMS
- **Other countries**: Varies by destination

### Cost Control Features
- **Test Mode**: Test without sending actual SMS
- **Severity Filtering**: Only send for critical/high alerts
- **Rate Limiting**: Built-in delays to prevent spam
- **Recipient Limits**: Smart worker selection to minimize recipients

### Monitoring Costs
```javascript
// Track SMS costs in your application
const smsResult = await sendSMSAlert()
if (smsResult.success) {
  const totalCost = smsResult.results.reduce((sum, r) => sum + parseFloat(r.cost || '0'), 0)
  console.log(`SMS campaign cost: $${totalCost.toFixed(4)}`)
}
```

## Error Handling

### Common Issues

1. **"Africa's Talking API key not configured"**
   - Set `AFRICAS_TALKING_API_KEY` environment variable
   - Verify API key is correct in Africa's Talking dashboard

2. **"API error: 401 Unauthorized"**
   - Check API key is valid and active
   - Verify username matches your Africa's Talking account

3. **"No recipients found"**
   - Ensure workers exist in the database for the district
   - Check worker phone numbers are valid
   - Verify workers are marked as active

4. **"Insufficient balance"**
   - Add credits to your Africa's Talking account
   - Check account balance in dashboard

### Debugging

Enable detailed logging:
```typescript
// Add to function for debugging
console.log('Recipients:', recipients)
console.log('Message:', smsMessage)
console.log('API Response:', result)
```

## Security Considerations

### API Key Security
- Store API keys as environment variables, never in code
- Use different API keys for development and production
- Regularly rotate API keys

### Phone Number Validation
- Validate phone numbers are in correct format (+233...)
- Sanitize phone numbers before sending
- Respect opt-out requests

### Rate Limiting
- Built-in delays between SMS sends
- Limit number of alerts processed per execution
- Monitor for unusual activity patterns

## Testing

### Test Mode
Always test with `test_mode: true` first:

```javascript
const testResult = await fetch('/functions/v1/send-sms-alert', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    alert_ids: ['test-alert-id'],
    test_mode: true  // Won't send actual SMS
  })
})
```

### Sandbox Testing
Use Africa's Talking sandbox for testing:
- Set `AFRICAS_TALKING_USERNAME=sandbox`
- SMS will be simulated, not actually sent
- No charges incurred

### Local Testing
```bash
# Start Supabase locally
supabase start

# Serve function locally
supabase functions serve send-sms-alert

# Test with curl
curl -X POST 'http://localhost:54321/functions/v1/send-sms-alert' \
  -H 'Authorization: Bearer YOUR_LOCAL_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"test_mode": true}'
```

## Monitoring and Analytics

### SMS Delivery Tracking
- Monitor delivery status in Africa's Talking dashboard
- Track costs and usage patterns
- Set up alerts for failed deliveries

### Database Logging
Consider creating an SMS log table:
```sql
CREATE TABLE sms_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id UUID REFERENCES alerts(id),
    recipient_phone VARCHAR(20),
    message TEXT,
    status VARCHAR(20),
    cost DECIMAL(10,4),
    message_id VARCHAR(100),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Performance Metrics
- Track SMS delivery success rates
- Monitor response times
- Measure alert resolution times after SMS

## Best Practices

1. **Message Clarity**: Keep SMS messages clear and actionable
2. **Timing**: Avoid sending SMS during night hours unless critical
3. **Frequency**: Limit SMS frequency to prevent alert fatigue
4. **Personalization**: Include facility and district names for context
5. **Follow-up**: Track if alerts are acknowledged and resolved
6. **Backup Channels**: Have alternative communication methods for critical alerts
7. **Training**: Ensure workers understand alert types and required actions

## Customization

### Custom Message Templates
```typescript
const CUSTOM_TEMPLATES = {
  water_shortage: (facilityName: string, districtName: string) => 
    `💧 WATER SHORTAGE: ${facilityName} in ${districtName} has no water supply. Please investigate immediately.`,
  
  power_outage: (facilityName: string, districtName: string) => 
    `⚡ POWER OUTAGE: ${facilityName} in ${districtName} has lost power. Check backup systems.`
}
```

### Custom Worker Selection
```typescript
// Custom logic for worker selection
async function getCustomWorkers(alert: Alert): Promise<Worker[]> {
  // Your custom logic here
  // e.g., select workers based on proximity, availability, expertise
}
```

### Integration with Other Services
```typescript
// Send to multiple channels
await Promise.all([
  sendSMS(recipients, message),
  sendEmail(emailRecipients, emailMessage),
  sendPushNotification(appUsers, pushMessage)
])
```