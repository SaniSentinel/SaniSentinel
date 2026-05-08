# Deploy script for inbound-sms Edge Function (PowerShell)
# Usage: .\deploy.ps1 [environment]
# Environment: local (default) or production

param(
    [string]$Environment = "local"
)

$FunctionName = "inbound-sms"

Write-Host "📱 Deploying $FunctionName Edge Function to $Environment..." -ForegroundColor Green

if ($Environment -eq "local") {
    Write-Host "📦 Starting local Supabase..." -ForegroundColor Yellow
    supabase start
    
    Write-Host "🔧 Serving function locally..." -ForegroundColor Yellow
    Start-Process -FilePath "supabase" -ArgumentList "functions", "serve", $FunctionName, "--no-verify-jwt" -NoNewWindow
    
    Write-Host "⏳ Waiting for function to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    Write-Host "🧪 Testing function with valid SMS..." -ForegroundColor Yellow
    $headers = @{
        'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJuXMHSxXpQPSo3kc_lr-kQQx_Aq7Yzs'
        'Content-Type' = 'application/json'
    }
    
    $testBody = @{
        text = "F1#A#good"
        from = "+233241234567"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri 'http://localhost:54321/functions/v1/inbound-sms' -Method Post -Headers $headers -Body $testBody
        Write-Host "✅ Valid SMS test successful!" -ForegroundColor Green
        Write-Host "📊 Result:" -ForegroundColor Cyan
        Write-Host "   Success: $($response.success)"
        Write-Host "   Facility: $($response.report.facility_name)"
        Write-Host "   Condition: $($response.report.condition)"
        Write-Host "   Block: $($response.report.block)"
    }
    catch {
        Write-Host "❌ Valid SMS test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "🧪 Testing function with invalid SMS..." -ForegroundColor Yellow
    $invalidTestBody = @{
        text = "invalid message"
        from = "+233241234567"
    } | ConvertTo-Json
    
    try {
        $response2 = Invoke-RestMethod -Uri 'http://localhost:54321/functions/v1/inbound-sms' -Method Post -Headers $headers -Body $invalidTestBody
        Write-Host "⚠️ Invalid SMS test returned success (unexpected)" -ForegroundColor Yellow
    }
    catch {
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "✅ Invalid SMS correctly rejected!" -ForegroundColor Green
        Write-Host "   Error: $($errorResponse.error)"
    }
    
    Write-Host ""
    Write-Host "🧪 Testing webhook format..." -ForegroundColor Yellow
    $webhookHeaders = @{
        'Content-Type' = 'application/x-www-form-urlencoded'
    }
    
    $webhookBody = "text=F2%23B%23overflow&from=%2B233241234568&id=12345"
    
    try {
        $response3 = Invoke-RestMethod -Uri 'http://localhost:54321/functions/v1/inbound-sms' -Method Post -Headers $webhookHeaders -Body $webhookBody
        Write-Host "✅ Webhook format test successful!" -ForegroundColor Green
        Write-Host "   Facility: $($response3.report.facility_name)"
        Write-Host "   Condition: $($response3.report.condition)"
    }
    catch {
        Write-Host "❌ Webhook format test failed: $($_.Exception.Message)" -ForegroundColor Red
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
Write-Host "1. Configure Africa's Talking webhook URL"
Write-Host "2. Test with real SMS messages"
Write-Host "3. Train workers on SMS format: F{ID}#{BLOCK}#{CONDITION}"
Write-Host "4. Monitor function logs for errors"
Write-Host "5. Set up facility ID mapping for your facilities"
Write-Host ""
Write-Host "📱 SMS Format Examples:" -ForegroundColor Cyan
Write-Host "   F123#A#good      - Facility 123, Block A, Good condition"
Write-Host "   F456#B#overflow  - Facility 456, Block B, Overflow detected"
Write-Host "   F789#1#damaged   - Facility 789, Block 1, Damaged"