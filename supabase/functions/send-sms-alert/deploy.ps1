# Deploy script for send-sms-alert Edge Function (PowerShell)
# Usage: .\deploy.ps1 [environment]
# Environment: local (default) or production

param(
    [string]$Environment = "local"
)

$FunctionName = "send-sms-alert"

Write-Host "📱 Deploying $FunctionName Edge Function to $Environment..." -ForegroundColor Green

if ($Environment -eq "local") {
    Write-Host "📦 Starting local Supabase..." -ForegroundColor Yellow
    supabase start
    
    Write-Host "🔧 Serving function locally..." -ForegroundColor Yellow
    Start-Process -FilePath "supabase" -ArgumentList "functions", "serve", $FunctionName, "--no-verify-jwt" -NoNewWindow
    
    Write-Host "⏳ Waiting for function to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    Write-Host "🧪 Testing function in TEST MODE..." -ForegroundColor Yellow
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
        Write-Host "✅ Function test successful!" -ForegroundColor Green
        Write-Host "📊 Summary:" -ForegroundColor Cyan
        Write-Host "   Alerts processed: $($response.summary.alerts_processed)"
        Write-Host "   SMS sent: $($response.summary.sms_sent)"
        Write-Host "   Success rate: $($response.summary.success_rate)%"
        Write-Host "   Test mode: $($response.test_mode)"
        
        if ($response.results -and $response.results.Count -gt 0) {
            Write-Host "📋 Sample results:" -ForegroundColor Cyan
            $response.results | Select-Object -First 3 | ForEach-Object {
                Write-Host "   • $($_.facility_name) ($($_.alert_type)): $($_.recipients) recipients"
            }
        }
    }
    catch {
        Write-Host "❌ Function test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "🧪 Testing with custom message..." -ForegroundColor Yellow
    $customTestBody = @{
        worker_phones = @("+233241234567", "+233241234568")
        custom_message = "Test message from SMS alert system. Please ignore."
        test_mode = $true
    } | ConvertTo-Json
    
    try {
        $response2 = Invoke-RestMethod -Uri 'http://localhost:54321/functions/v1/send-sms-alert' -Method Post -Headers $headers -Body $customTestBody
        Write-Host "✅ Custom message test successful!" -ForegroundColor Green
        Write-Host "   Recipients: $($response2.summary.sms_sent)"
    }
    catch {
        Write-Host "⚠️ Custom message test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    Write-Host "✅ Local deployment complete!" -ForegroundColor Green
    Write-Host "🔗 Function URL: http://localhost:54321/functions/v1/$FunctionName" -ForegroundColor Cyan
    
} elseif ($Environment -eq "production") {
    Write-Host "🌐 Deploying to production..." -ForegroundColor Yellow
    
    # Check if logged in
    try {
        supabase projects list | Out-Null
    }
    catch {
        Write-Host "❌ Not logged in to Supabase. Run: supabase login" -ForegroundColor Red
        exit 1
    }
    
    # Check environment variables
    Write-Host "🔍 Checking environment variables..." -ForegroundColor Yellow
    Write-Host "⚠️  Make sure you have set these in your Supabase dashboard:" -ForegroundColor Yellow
    Write-Host "   • AFRICAS_TALKING_API_KEY" -ForegroundColor Gray
    Write-Host "   • AFRICAS_TALKING_USERNAME" -ForegroundColor Gray
    
    # Deploy function
    supabase functions deploy $FunctionName
    
    Write-Host "✅ Production deployment complete!" -ForegroundColor Green
    Write-Host "🔗 Check your Supabase dashboard for the function URL" -ForegroundColor Cyan
    
} else {
    Write-Host "❌ Invalid environment: $Environment" -ForegroundColor Red
    Write-Host "Usage: .\deploy.ps1 [local|production]" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Cyan
Write-Host "1. Set up Africa's Talking account and get API credentials"
Write-Host "2. Configure environment variables in Supabase dashboard"
Write-Host "3. Test with test_mode: true before sending real SMS"
Write-Host "4. Set up database triggers for automatic SMS alerts"
Write-Host "5. Monitor SMS costs and delivery rates"
Write-Host ""
Write-Host "🔗 Useful links:" -ForegroundColor Cyan
Write-Host "   • Africa's Talking: https://africastalking.com/"
Write-Host "   • SMS API Docs: https://developers.africastalking.com/docs/sms/overview"