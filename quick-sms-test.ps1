# Quick SMS test script
Write-Host "📱 Quick SMS Function Test" -ForegroundColor Green

# Check if Supabase is running
Write-Host "🔍 Checking Supabase status..." -ForegroundColor Yellow
try {
    supabase status
    Write-Host "✅ Supabase is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase not running. Starting..." -ForegroundColor Red
    supabase start
}

# Deploy the SMS function
Write-Host "🚀 Deploying SMS function..." -ForegroundColor Yellow
supabase functions deploy send-sms-alert

# Test the function
Write-Host "🧪 Testing SMS function..." -ForegroundColor Yellow
$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJuXMHSxXpQPSo3kc_lr-kQQx_Aq7Yzs'
    'Content-Type' = 'application/json'
}

$testBody = @{
    test_mode = $true
    severity_filter = @("critical", "high")
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:54321/functions/v1/send-sms-alert' -Method Post -Headers $headers -Body $testBody
    Write-Host "✅ SMS function test successful!" -ForegroundColor Green
    Write-Host "📊 Results:" -ForegroundColor Cyan
    Write-Host "   Alerts processed: $($response.summary.alerts_processed)"
    Write-Host "   SMS sent (test): $($response.summary.sms_sent)"
    Write-Host "   Test mode: $($response.test_mode)"
}
catch {
    Write-Host "❌ SMS function test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Cyan
Write-Host "1. Set your Africa's Talking API key in Supabase dashboard"
Write-Host "2. Test with real phone numbers (still in test mode)"
Write-Host "3. Switch to production mode when ready"