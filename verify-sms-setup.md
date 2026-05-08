# ✅ SMS Setup Verification

## 🔑 API Key Configuration
Your Africa's Talking API key has been added to your `.env` file:

```env
AFRICAS_TALKING_API_KEY=atsk_56cc647e4593a9b12d5d85db3d9f2746f4c23a7bd297d9f90e1827a8245520adaaeab07b
AFRICAS_TALKING_USERNAME=sandbox
```

## 🚀 Quick Deployment Steps

### 1. Deploy SMS Function
```bash
# Make sure Supabase CLI is installed
npm install -g supabase

# Start Supabase locally
supabase start

# Deploy the SMS function
supabase functions deploy send-sms-alert
```

**Or use the batch file:**
```bash
# Windows
deploy-sms.bat
```

### 2. Test in Your React App

Add this to your `App.jsx` to test the connection:

```jsx
import { SMSConnectionTest } from './components'

function App() {
  return (
    <div>
      <h1>SaniSentinel - SMS Test</h1>
      <SMSConnectionTest />
    </div>
  )
}
```

### 3. Test with curl (Alternative)

```bash
# Test locally
curl -X POST "http://localhost:54321/functions/v1/send-sms-alert" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJuXMHSxXpQPSo3kc_lr-kQQx_Aq7Yzs" \
  -H "Content-Type: application/json" \
  -d '{"test_mode": true, "custom_message": "Test from SaniSentinel", "worker_phones": ["+233241234567"]}'
```

## 🧪 Testing Checklist

- [ ] ✅ API key added to .env file
- [ ] ✅ Supabase CLI installed and working
- [ ] ✅ SMS function deployed successfully
- [ ] ✅ Test mode works (no actual SMS sent)
- [ ] ✅ Function finds alerts and workers in database
- [ ] ✅ SMS messages look correct
- [ ] ✅ Ready for production mode

## 📱 Expected Test Results

When you test, you should see:
```json
{
  "success": true,
  "message": "SMS alerts processed for X alerts",
  "summary": {
    "alerts_processed": 5,
    "sms_sent": 12,
    "success_rate": 100
  },
  "test_mode": true
}
```

## 🔧 Troubleshooting

### If SMS function fails to deploy:
1. Check Supabase CLI is installed: `supabase --version`
2. Make sure you're in the project directory
3. Try: `supabase login` if authentication fails

### If test returns errors:
1. Verify .env file has the API key
2. Check database has workers and alerts
3. Ensure function is deployed: `supabase functions list`

### If no SMS recipients found:
1. Check workers table has active workers
2. Verify phone numbers are in format: +233XXXXXXXXX
3. Ensure alerts exist in database

## 🎯 Production Deployment

When tests pass and you're ready for production:

1. **Deploy to Supabase Cloud:**
   ```bash
   supabase functions deploy send-sms-alert --project-ref your-project-ref
   ```

2. **Set Environment Variables in Supabase Dashboard:**
   - Go to: Project Settings → Edge Functions
   - Add: `AFRICAS_TALKING_API_KEY` and `AFRICAS_TALKING_USERNAME`

3. **Switch to Production Mode:**
   ```javascript
   // Change test_mode to false
   const result = await sendSMSForRecentCriticalAlerts(false)
   ```

4. **Monitor Costs:**
   - Check Africa's Talking dashboard for SMS usage
   - Ghana SMS cost: ~$0.01 per message

## 🎉 You're All Set!

Your SMS alert system is now configured and ready to notify workers when facilities need urgent attention!

**Next:** Test the connection, then integrate with your risk assessment system for automatic alerts.