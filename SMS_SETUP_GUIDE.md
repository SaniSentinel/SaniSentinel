# 📱 SMS Alert Setup Guide

## Your Africa's Talking API Key
✅ **API Key**: `atsk_56cc647e4593a9b12d5d85db3d9f2746f4c23a7bd297d9f90e1827a8245520adaaeab07b`

## 🚀 Quick Setup Steps

### 1. Install Supabase CLI (if not already installed)

**Windows (PowerShell):**
```powershell
# Install via npm
npm install -g supabase

# Or via Chocolatey
choco install supabase
```

**Alternative - Download directly:**
- Go to: https://github.com/supabase/cli/releases
- Download the Windows executable
- Add to your PATH

### 2. Set Up Environment Variables in Supabase

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: Your Project → Settings → Edge Functions
3. **Add Environment Variables**:
   - **Key**: `AFRICAS_TALKING_API_KEY`
   - **Value**: `atsk_56cc647e4593a9b12d5d85db3d9f2746f4c23a7bd297d9f90e1827a8245520adaaeab07b`
   
   - **Key**: `AFRICAS_TALKING_USERNAME`
   - **Value**: `sandbox` (for testing) or your actual username

### 3. Deploy the SMS Function

```bash
# Navigate to your project directory
cd your-project-directory

# Start Supabase locally (if testing locally)
supabase start

# Deploy the SMS function
supabase functions deploy send-sms-alert
```

### 4. Test the SMS Function

**Test in Safe Mode (No actual SMS sent):**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/send-sms-alert' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "test_mode": true,
    "severity_filter": ["critical", "high"]
  }'
```

**Or test locally:**
```bash
curl -X POST 'http://localhost:54321/functions/v1/send-sms-alert' \
  -H 'Authorization: Bearer YOUR_LOCAL_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "test_mode": true,
    "custom_message": "Test SMS from sanitation system",
    "worker_phones": ["+233241234567"]
  }'
```

## 🧪 Testing Checklist

- [ ] ✅ API key set in Supabase environment variables
- [ ] ✅ SMS function deployed successfully
- [ ] ✅ Test mode works (no actual SMS sent)
- [ ] ✅ Function returns success response
- [ ] ✅ Workers exist in database with valid phone numbers
- [ ] ✅ Alerts exist in database to trigger SMS

## 📱 Test with Your React App

Add this to your React component:

```jsx
import { SMSAlertManager } from './components'

function App() {
  return (
    <div>
      <h1>Sanitation Management System</h1>
      <SMSAlertManager />
    </div>
  )
}
```

## 🔧 Manual Testing Commands

### Test Recent Critical Alerts
```javascript
// In your browser console or React app
const result = await fetch('/functions/v1/send-sms-alert', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    test_mode: true, // IMPORTANT: Keep true for testing
    severity_filter: ['critical']
  })
})

const data = await result.json()
console.log('SMS Test Result:', data)
```

### Test Custom SMS
```javascript
const result = await fetch('/functions/v1/send-sms-alert', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    test_mode: true,
    worker_phones: ['+233241234567', '+233241234568'],
    custom_message: 'Emergency: All field workers report to district office immediately.'
  })
})
```

## 🎯 Production Deployment

### When Ready for Production:

1. **Verify Test Mode Works**: Ensure all tests pass with `test_mode: true`
2. **Check Phone Numbers**: Verify worker phone numbers in database are correct
3. **Set Production Mode**: Change `test_mode: false` in your calls
4. **Monitor Costs**: Watch your Africa's Talking dashboard for SMS usage
5. **Set Up Automation**: Add database triggers for automatic SMS alerts

### Database Trigger for Automatic SMS (Optional)
```sql
-- Auto-send SMS for critical alerts
CREATE OR REPLACE FUNCTION trigger_sms_alert()
RETURNS TRIGGER AS $
BEGIN
    IF NEW.severity IN ('critical', 'high') AND NOT NEW.resolved THEN
        -- This would require pg_net extension
        PERFORM net.http_post(
            url := 'https://your-project.supabase.co/functions/v1/send-sms-alert',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
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

CREATE TRIGGER auto_sms_alert_trigger
    AFTER INSERT ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sms_alert();
```

## 💰 Cost Management

- **Ghana SMS**: ~$0.01 per SMS
- **Test Mode**: Free (no actual SMS sent)
- **Monitor Usage**: Check Africa's Talking dashboard regularly
- **Set Budgets**: Consider setting up spending alerts

## 🔍 Troubleshooting

### Common Issues:

1. **"API key not configured"**
   - Ensure API key is set in Supabase environment variables
   - Redeploy function after setting environment variables

2. **"No recipients found"**
   - Check workers table has active workers
   - Verify phone numbers are in correct format (+233...)

3. **"Function not found"**
   - Ensure function is deployed: `supabase functions deploy send-sms-alert`
   - Check function name is correct in URL

4. **SMS not delivered (production)**
   - Verify phone numbers are active
   - Check Africa's Talking delivery reports
   - Ensure account has sufficient credits

## 📞 Support

- **Africa's Talking Support**: https://help.africastalking.com/
- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **Your API Dashboard**: https://account.africastalking.com/

---

**🎉 You're all set!** Your SMS alert system is ready to notify workers when facilities need urgent attention.