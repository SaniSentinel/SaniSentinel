# Deploy script for fetch-climate Edge Function (PowerShell)
# Usage: .\deploy.ps1 [environment]
# Environment: local (default) or production

param(
    [string]$Environment = "local"
)

$FunctionName = "fetch-climate"

Write-Host "🚀 Deploying $FunctionName Edge Function to $Environment..." -ForegroundColor Green

if ($Environment -eq "local") {
    Write-Host "📦 Starting local Supabase..." -ForegroundColor Yellow
    supabase start
    
    Write-Host "🔧 Serving function locally..." -ForegroundColor Yellow
    Start-Process -FilePath "supabase" -ArgumentList "functions", "serve", $FunctionName, "--no-verify-jwt" -NoNewWindow
    
    Write-Host "⏳ Waiting for function to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    Write-Host "🧪 Testing function..." -ForegroundColor Yellow
    $headers = @{
        'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJuXMHSxXpQPSo3kc_lr-kQQx_Aq7Yzs'
        'Content-Type' = 'application/json'
    }
    
    try {
        $response = Invoke-RestMethod -Uri 'http://localhost:54321/functions/v1/fetch-climate' -Method Post -Headers $headers
        Write-Host "✅ Function test successful!" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 10
    }
    catch {
        Write-Host "❌ Function test failed: $($_.Exception.Message)" -ForegroundColor Red
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
Write-Host "1. Set up a cron job to run the function periodically"
Write-Host "2. Monitor the function logs in your Supabase dashboard"
Write-Host "3. Check the climate_snapshots table for new data"
Write-Host "4. Verify that alerts are being generated for high-risk conditions"