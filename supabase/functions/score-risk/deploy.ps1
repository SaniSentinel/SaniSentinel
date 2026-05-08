# Deploy script for score-risk Edge Function (PowerShell)
# Usage: .\deploy.ps1 [environment]
# Environment: local (default) or production

param(
    [string]$Environment = "local"
)

$FunctionName = "score-risk"

Write-Host "🎯 Deploying $FunctionName Edge Function to $Environment..." -ForegroundColor Green

if ($Environment -eq "local") {
    Write-Host "📦 Starting local Supabase..." -ForegroundColor Yellow
    supabase start
    
    Write-Host "🔧 Serving function locally..." -ForegroundColor Yellow
    Start-Process -FilePath "supabase" -ArgumentList "functions", "serve", $FunctionName, "--no-verify-jwt" -NoNewWindow
    
    Write-Host "⏳ Waiting for function to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    Write-Host "🧪 Testing function with all facilities..." -ForegroundColor Yellow
    $headers = @{
        'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJuXMHSxXpQPSo3kc_lr-kQQx_Aq7Yzs'
        'Content-Type' = 'application/json'
    }
    
    try {
        $response = Invoke-RestMethod -Uri 'http://localhost:54321/functions/v1/score-risk' -Method Post -Headers $headers
        Write-Host "✅ Function test successful!" -ForegroundColor Green
        Write-Host "📊 Summary:" -ForegroundColor Cyan
        Write-Host "   Total facilities: $($response.summary.total_facilities)"
        Write-Host "   Facilities updated: $($response.summary.facilities_updated)"
        Write-Host "   Average risk score: $($response.summary.average_risk_score)"
        Write-Host "   Critical priority: $($response.summary.risk_distribution.critical)"
        Write-Host "   High priority: $($response.summary.risk_distribution.high)"
        Write-Host "   Medium priority: $($response.summary.risk_distribution.medium)"
        Write-Host "   Low priority: $($response.summary.risk_distribution.low)"
    }
    catch {
        Write-Host "❌ Function test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "🧪 Testing with specific facility IDs..." -ForegroundColor Yellow
    $testBody = @{
        facility_ids = @("test-id-1", "test-id-2")
    } | ConvertTo-Json
    
    try {
        $response2 = Invoke-RestMethod -Uri 'http://localhost:54321/functions/v1/score-risk' -Method Post -Headers $headers -Body $testBody
        Write-Host "✅ Filtered test successful!" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ Filtered test failed (expected if test IDs don't exist): $($_.Exception.Message)" -ForegroundColor Yellow
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
Write-Host "1. Set up a cron job to run risk assessment every 6 hours"
Write-Host "2. Monitor facility risk scores and status updates"
Write-Host "3. Review action recommendations for high-risk facilities"
Write-Host "4. Integrate with your alert system for critical facilities"
Write-Host "5. Schedule to run after climate data updates"