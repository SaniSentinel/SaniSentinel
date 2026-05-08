# SMS Alert Edge Function - Complete Implementation Guide

## 📱 Overview

The `send-sms-alert` Edge Function integrates with Africa's Talking SMS API to automatically send SMS notifications to field workers when sanitation facilities hit critical risk levels or encounter urgent issues. It provides intelligent worker selection, template-based messaging, and comprehensive cost management.

## 📁 Files Created

### Edge Function Core
- `supabase/functions/send-sms-alert/index.ts` - Main Edge Function with Africa's Talking integration
- `supabase/functions/send-sms-alert/deno.json` - Deno configuration
- `supabase/functions/send-sms-alert/README.md` - Detailed technical documentation

### Deployment & Testing
- `supabase/functions/send-sms-alert/deploy.sh` - Bash deployment script
- `supabase/functions/send-sms-alert/deploy.ps1` - PowerShell deployment script
- `supabase/functions/send-sms-alert/test.ts` - Comprehensive test script with API validation

### Client Integration
- `src/lib/sms-alerts.js` - Client utilities for SMS operations
- `src/components/SMSAlertManager.jsx` - Full-featured React component for SMS management

## 🚀 Quick Setup

### 1. Africa's Talking Account Setup

1. **Create Account**: Sign up at [Africa's Talking](https://africastalking.com/)
2. **Get API Credentials**:
   - API Key: Found in your dashboard under "API Keys"
   - Username: Your Africa's Talking username
3. **Add Credits**: Purchase SMS credits for your account
4. **Test with Sandbox**: Use sandbox mode for testing (free)

### 2. Environment Variables

Set these in your Supabase project (Settings > Edge Functions):

```bash
AFRICAS_TALKING_API_KEY=your_api_key_here
AFRICAS_TALKING_USERNAME=your_username_here
```

For testing, you can use:
```bash
AFRICAS_TALKING_USERNAME=sandbox
```

### 3. Deploy the Function

**Windows:**
```powershell
cd supabase/functions/send-sms-alert
.\deploy.ps1 local
```

**Linux/Mac:**
```bash
cd supabase/functions/send-sms-alert
./deploy.sh local
```

### 4. Test the Function

```bash
# Test in safe mode (no actual SMS sent)
curl -X POST 'http://localhost:54321/functions/v1/send-sms-alert' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"test_mode": true}'
```

## 📋 SMS Templates and Alert Types

### Critical Alerts (🚨)
- **Critical Status**: "🚨 CRITICAL ALERT: [Facility] in [District] requires IMMEDIATE attention. Facility is at critical risk. Please respond urgently."
- **System Failure**: "🚨 SYSTEM FAILURE: [Facility] in [District] is OUT OF SERVICE. Immediate repair required."

### High Priority Alerts (⚠️)
- **Overflow Detected**: "⚠️ OVERFLOW ALERT: [Facility] in [District] is overflowing. Cleanup needed immediately."
- **High Risk**: "⚠️ HIGH RISK: [Facility] in [District] needs urgent maintenance. Please schedule inspection."

### Medium Priority Alerts (📅)
- **Climate Warning**: "🌧️ WEATHER ALERT: [Facility] in [District] at risk due to weather conditions. Monitor closely."
- **Maintenance Due**: "📅 MAINTENANCE DUE: [Facility] in [District] requires scheduled maintenance. Please arrange service."

## 👥 Smart Worker Selection

The function automatically selects appropriate workers based on alert severity and type:

| Alert Severity | Notified Worker Roles |
|----------------|----------------------|
| **Critical** | District Coordinator, Supervisor, Maintenance Tech, Health Officer |
| **High** | Supervisor, Maintenance Tech, Field Worker |
| **Medium** | Field Worker, Maintenance Tech |
| **Low** | Field Worker |

**Special Cases:**
- **System Failure/Critical Status**: Always includes District Coordinator and Health Officer
- **Climate Warning**: Always includes District Coordinator for coordination

## 🔧 Usage Examples

### Automatic SMS for Recent Critical Alerts
```javascript
import { sendSMSForRecentCriticalAlerts } from './lib/sms-alerts'

// Send SMS for all recent critical alerts
const result = await sendSMSForRecentCriticalAlerts(false) // false = production mode
```

### SMS for Specific Alerts
```javascript
import { sendSMSForAlerts } from './lib/sms-alerts'

const alertIds = ['alert-uuid-1', 'alert-uuid-2']
const result = await sendSMSForAlerts(alertIds, true) // true = test mode
```

### Custom SMS to Workers
```javascript
import { sendCustomSMS } from './lib/sms-alerts'

const phones = ['+233241234567', '+233241234568']
const message = 'Emergency meeting at district office at 2 PM today.'
const result = await sendCustomSMS(phones, message, false)
```

### React Component Usage
```jsx
import { SMSAlertManager } from './components'

function App() {
  return (
    <div>
      <SMSAlertManager />
    </div>
  )
}
```

## ⚙️ Automation Strategies

### 1. Database Triggers (Recommended)

Create automatic SMS triggers for critical alerts:

```sql
-- Function to trigger SMS alerts for critical alerts
CREATE OR REPLACE FUNCTION trigger_sms_alert()
RETURNS TRIGGER AS $
BEGIN
    -- Only trigger for critical and high severity alerts
    IF NEW.severity IN ('critical', 'high') AND NOT NEW.resolved THEN
        -- Call the Edge Function using pg_net extension
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

-- Send SMS digest twice daily
SELECT cron.schedule(
    'sms-daily-digest',
    '0 8,18 * * *',
    'https://your-project.supabase.co/functions/v1/send-sms-alert'
);
```

### 3. Integration with Risk Assessment

Automatically send SMS after risk assessment identifies critical facilities:

```javascript
// After running risk assessment
const riskResult = await runRiskAssessment()

if (riskResult.success) {
  // Send SMS for any new critical alerts
  const smsResult = await sendSMSForRecentCriticalAlerts(false)
  
  if (smsResult.success) {
    console.log(`SMS sent to ${smsResult.data.summary.sms_sent} workers`)
  }
}
```

## 💰 Cost Management

### SMS Pricing (Africa's Talking)
- **Ghana**: ~$0.01 per SMS
- **Nigeria**: ~$0.008 per SMS  
- **Kenya**: ~$0.005 per SMS
- **Other African countries**: Varies by destination

### Cost Control Features
- **Test Mode**: Test without sending actual SMS (always use first!)
- **Severity Filtering**: Only send for critical/high alerts
- **Smart Worker Selection**: Minimizes recipients while ensuring coverage
- **Rate Limiting**: Built-in delays to prevent spam
- **Cost Tracking**: Monitor costs per SMS campaign

### Example Cost Calculation
```javascript
import { calculateSMSCost } from './lib/sms-alerts'

// Estimate cost for 50 SMS recipients
const estimatedCost = calculateSMSCost(50, 0.01) // $0.50
console.log(`Estimated cost: $${estimatedCost.toFixed(2)}`)
```

## 🔒 Security and Best Practices

### API Key Security
- Store API keys as environment variables, never in code
- Use different API keys for development and production
- Regularly rotate API keys
- Monitor API usage for unusual patterns

### Phone Number Validation
```javascript
import { isValidPhoneNumber, formatPhoneNumber } from './lib/sms-alerts'

const phone = '0241234567'
const formatted = formatPhoneNumber(phone) // +233241234567
const isValid = isValidPhoneNumber(formatted) // true
```

### Rate Limiting and Spam Prevention
- Built-in delays between SMS sends (100ms)
- Limit alerts processed per execution (50 max)
- Severity filtering to reduce unnecessary SMS
- Test mode for safe testing

## 🧪 Testing

### Always Test First!
```javascript
// ALWAYS start with test mode
const result = await sendSMSForRecentCriticalAlerts(true) // test_mode: true

// Only switch to production after testing
if (result.success) {
  const prodResult = await sendSMSForRecentCriticalAlerts(false) // production
}
```

### Sandbox Testing
Use Africa's Talking sandbox for safe testing:
```bash
# Set environment variable
AFRICAS_TALKING_USERNAME=sandbox

# SMS will be simulated, not actually sent
# No charges incurred
```

### Local Testing
```bash
# Start local Supabase
supabase start

# Test the function
curl -X POST 'http://localhost:54321/functions/v1/send-sms-alert' \
  -H 'Authorization: Bearer YOUR_LOCAL_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"test_mode": true, "severity_filter": ["critical"]}'
```

## 📊 Monitoring and Analytics

### SMS Delivery Tracking
- Monitor delivery status in Africa's Talking dashboard
- Track costs and usage patterns
- Set up alerts for failed deliveries
- Review SMS logs for optimization

### Performance Metrics
```javascript
// Track SMS campaign performance
const smsResult = await sendSMSForAlerts(alertIds, false)

if (smsResult.success) {
  console.log(`Campaign Results:`)
  console.log(`- Alerts processed: ${smsResult.data.summary.alerts_processed}`)
  console.log(`- SMS sent: ${smsResult.data.summary.sms_sent}`)
  console.log(`- Success rate: ${smsResult.data.summary.success_rate}%`)
  console.log(`- Errors: ${smsResult.data.summary.errors}`)
}
```

### Database Monitoring
```sql
-- Monitor alert resolution after SMS
SELECT 
  alert_type,
  severity,
  COUNT(*) as total_alerts,
  COUNT(*) FILTER (WHERE resolved = true) as resolved_alerts,
  ROUND(COUNT(*) FILTER (WHERE resolved = true) * 100.0 / COUNT(*), 2) as resolution_rate
FROM alerts 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY alert_type, severity
ORDER BY severity DESC, total_alerts DESC;
```

## 🛠️ Customization

### Custom SMS Templates
```javascript
// Add custom templates in the Edge Function
const CUSTOM_TEMPLATES = {
  water_shortage: (facilityName, districtName) => 
    `💧 WATER SHORTAGE: ${facilityName} in ${districtName} has no water supply. Please investigate immediately.`,
  
  power_outage: (facilityName, districtName) => 
    `⚡ POWER OUTAGE: ${facilityName} in ${districtName} has lost power. Check backup systems.`
}
```

### Custom Worker Selection Logic
```javascript
// Modify worker selection in the Edge Function
async function getCustomWorkers(alert) {
  // Your custom logic here
  // e.g., select workers based on proximity, availability, expertise
  
  if (alert.alert_type === 'climate_warning') {
    // Get all supervisors and coordinators for weather alerts
    return await getWorkersByRoles(['supervisor', 'district_coordinator'])
  }
  
  // Default logic...
}
```

### Multi-Channel Notifications
```javascript
// Send to multiple channels
await Promise.all([
  sendSMSForAlerts(alertIds, false),
  sendEmailAlerts(alertIds), // Your email function
  sendPushNotifications(alertIds) // Your push notification function
])
```

## 🔧 Troubleshooting

### Common Issues

1. **"Africa's Talking API key not configured"**
   - Set `AFRICAS_TALKING_API_KEY` environment variable in Supabase
   - Verify API key is correct and active

2. **"API error: 401 Unauthorized"**
   - Check API key is valid
   - Verify username matches your Africa's Talking account
   - Ensure account is active and has credits

3. **"No recipients found"**
   - Check workers exist in database for the district
   - Verify workers are marked as `active = true`
   - Ensure phone numbers are in correct format

4. **"Insufficient balance"**
   - Add credits to your Africa's Talking account
   - Check account balance in dashboard

5. **SMS not delivered**
   - Verify phone numbers are correct and active
   - Check Africa's Talking delivery reports
   - Ensure recipients haven't opted out

### Debug Mode
Enable detailed logging in the function:
```typescript
console.log('Recipients:', recipients)
console.log('Message:', smsMessage)
console.log('API Response:', result)
```

## 📚 Integration Examples

### With Risk Assessment
```javascript
// Trigger SMS after risk assessment
const riskResult = await runRiskAssessment()

if (riskResult.success) {
  const criticalFacilities = riskResult.data.assessments
    .filter(a => a.priority_level === 'critical')
    .map(a => a.facility_id)
  
  if (criticalFacilities.length > 0) {
    await sendSMSForFacilities(criticalFacilities, ['critical'], false)
  }
}
```

### With Climate Data
```javascript
// Send SMS after climate data update shows high risk
const climateResult = await fetchClimateData()

if (climateResult.success) {
  const highRiskDistricts = climateResult.data.snapshots
    .filter(s => s.flood_risk_score >= 80)
    .map(s => s.district_id)
  
  // Send climate warnings for high-risk districts
  // Implementation depends on your alert generation logic
}
```

### With Report Submissions
```javascript
// Send SMS when critical reports are submitted
const reportResult = await submitReport(reportData)

if (reportResult.success && reportData.condition === 'overflow') {
  // Get the generated alert and send SMS
  const alerts = await getAlertsForFacility(reportData.facility_id)
  const criticalAlerts = alerts.filter(a => a.severity === 'critical')
  
  if (criticalAlerts.length > 0) {
    await sendSMSForAlerts(criticalAlerts.map(a => a.id), false)
  }
}
```

## 🎯 Best Practices

1. **Always Test First**: Use test mode before sending production SMS
2. **Monitor Costs**: Track SMS usage and set budget alerts
3. **Validate Phone Numbers**: Ensure phone numbers are correct format
4. **Respect Opt-outs**: Honor worker preferences for SMS notifications
5. **Time Awareness**: Avoid sending SMS during night hours unless critical
6. **Message Clarity**: Keep messages clear, actionable, and informative
7. **Follow-up**: Track if alerts are acknowledged and resolved
8. **Backup Channels**: Have alternative communication methods for critical alerts
9. **Regular Review**: Periodically review and optimize SMS templates and worker selection
10. **Training**: Ensure workers understand alert types and required actions

## 📈 Success Metrics

Track these metrics to measure SMS alert effectiveness:

- **Delivery Rate**: Percentage of SMS successfully delivered
- **Response Time**: Time from SMS sent to alert resolution
- **Resolution Rate**: Percentage of alerts resolved after SMS notification
- **Cost per Resolution**: SMS cost divided by resolved alerts
- **Worker Engagement**: Response rates from different worker roles
- **Alert Escalation**: Frequency of alerts requiring multiple SMS

---

**🎉 Your SMS alert system is ready!** The function will automatically notify the right workers when facilities need attention, helping ensure rapid response to critical sanitation issues across all districts.