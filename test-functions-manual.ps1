# Manual Edge Function Testing Script (PowerShell)
# Use this if you can't install Supabase CLI or want to test against remote functions

param(
    [string]$Environment = "local",  # "local" or "remote"
    [switch]$TestMode = $true
)

# Configuration
if ($Environment -eq "local") {
    $BaseUrl = "http://localhost:54321/functions/v1"
    $AuthToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
} else {
    $BaseUrl = "https://aaxgfnzcbyerjlcftwuo.supabase.co/functions/v1"
    $AuthToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFheGdmbnpjYnllcmpsY2Z0d3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxODc4NDgsImV4cCI6MjA5Mzc2Mzg0OH0.rur02SV6Yy0gLjUmkFMwUTB7msz1f3bXzyQPokaWJrk"
}

Write-Host "🚀 Testing Edge Functions ($Environment environment)" -ForegroundColor Green
Write-Host "=" * 60

# Test function helper
function Test-EdgeFunction {
    param(
        [string]$FunctionName,
        [hashtable]$Payload = @{},
        [string]$Method = "POST",
        [string]$ContentType = "application/json"
    )
    
    $Url = "$BaseUrl/$FunctionName"
    
    Write-Host "`n🧪 Testing $FunctionName..." -ForegroundColor Cyan
    Write-Host "📡 URL: $Url"
    Write-Host "📦 Payload: $(ConvertTo-Json $Payload -Compress)"
    
    try {
        $Headers = @{
            "Authorization" = "Bearer $AuthToken"
            "Content-Type" = $ContentType
        }
        
        if ($Method -eq "POST" -and $Payload.Count -gt 0) {
            if ($ContentType -eq "application/json") {
                $Body = ConvertTo-Json $Payload -Depth 10
            } else {
                # For form data
                $Body = ($Payload.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
            }
            
            $Response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body $Body -ErrorAction Stop
        } else {
            $Response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -ErrorAction Stop
        }
        
        Write-Host "✅ Success!" -ForegroundColor Green
        Write-Host "📄 Response:" -ForegroundColor Yellow
        Write-Host (ConvertTo-Json $Response -Depth 10) -ForegroundColor White
        
        return @{ Success = $true; Data = $Response }
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $StatusCode = $_.Exception.Response.StatusCode
            Write-Host "📊 Status Code: $StatusCode" -ForegroundColor Red
        }
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# Test 1: fetch-climate
Write-Host "`n📊 TEST 1: FETCH-CLIMATE" -ForegroundColor Magenta
Write-Host "-" * 30
$Result1 = Test-EdgeFunction -FunctionName "fetch-climate"

# Wait for climate data processing
if ($Result1.Success) {
    Write-Host "⏳ Waiting 5 seconds for climate data processing..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Test 2: score-risk (all facilities)
Write-Host "`n🎯 TEST 2: SCORE-RISK (All Facilities)" -ForegroundColor Magenta
Write-Host "-" * 30
$Result2 = Test-EdgeFunction -FunctionName "score-risk"

# Test 3: score-risk (specific facilities)
Write-Host "`n🎯 TEST 3: SCORE-RISK (Specific Facilities)" -ForegroundColor Magenta
Write-Host "-" * 30
$Result3 = Test-EdgeFunction -FunctionName "score-risk" -Payload @{
    facility_ids = @("facility-1", "facility-2")
}

# Test 4: send-sms-alert (test mode)
Write-Host "`n📱 TEST 4: SEND-SMS-ALERT (Test Mode)" -ForegroundColor Magenta
Write-Host "-" * 30
$Result4 = Test-EdgeFunction -FunctionName "send-sms-alert" -Payload @{
    severity_filter = @("critical", "high")
    test_mode = $true
}

# Test 5: send-sms-alert (custom message)
Write-Host "`n📱 TEST 5: SEND-SMS-ALERT (Custom Message)" -ForegroundColor Magenta
Write-Host "-" * 30
$Result5 = Test-EdgeFunction -FunctionName "send-sms-alert" -Payload @{
    worker_phones = @("+233123456789")
    custom_message = "Test message from PowerShell script"
    test_mode = $TestMode
}

# Test 6: inbound-sms (valid format)
Write-Host "`n📥 TEST 6: INBOUND-SMS (Valid Format)" -ForegroundColor Magenta
Write-Host "-" * 30
$Result6 = Test-EdgeFunction -FunctionName "inbound-sms" -Payload @{
    text = "F1#A#good"
    from = "+233123456789"
}

# Test 7: inbound-sms (invalid format)
Write-Host "`n📥 TEST 7: INBOUND-SMS (Invalid Format)" -ForegroundColor Magenta
Write-Host "-" * 30
$Result7 = Test-EdgeFunction -FunctionName "inbound-sms" -Payload @{
    text = "invalid message format"
    from = "+233123456789"
}

# Test 8: inbound-sms (condition aliases)
Write-Host "`n📥 TEST 8: INBOUND-SMS (Condition Aliases)" -ForegroundColor Magenta
Write-Host "-" * 30
$Result8 = Test-EdgeFunction -FunctionName "inbound-sms" -Payload @{
    text = "F2#B#broken"  # 'broken' should map to 'damaged'
    from = "+233987654321"
}

# Test 9: inbound-sms (webhook format)
Write-Host "`n📥 TEST 9: INBOUND-SMS (Webhook Format)" -ForegroundColor Magenta
Write-Host "-" * 30
$Result9 = Test-EdgeFunction -FunctionName "inbound-sms" -Payload @{
    id = "test-webhook-id"
    text = "F3#C#overflow"
    from = "+233555666777"
    to = "12345"
    date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    linkId = "test-link"
    networkCode = "63902"
} -ContentType "application/x-www-form-urlencoded"

# Summary
Write-Host "`n📊 TEST SUMMARY" -ForegroundColor Green
Write-Host "=" * 60

$Tests = @(
    @{ Name = "Fetch Climate Data"; Result = $Result1 }
    @{ Name = "Score Risk (All)"; Result = $Result2 }
    @{ Name = "Score Risk (Specific)"; Result = $Result3 }
    @{ Name = "SMS Alert (Test Mode)"; Result = $Result4 }
    @{ Name = "SMS Alert (Custom)"; Result = $Result5 }
    @{ Name = "Inbound SMS (Valid)"; Result = $Result6 }
    @{ Name = "Inbound SMS (Invalid)"; Result = $Result7 }
    @{ Name = "Inbound SMS (Aliases)"; Result = $Result8 }
    @{ Name = "Inbound SMS (Webhook)"; Result = $Result9 }
)

$Passed = 0
$Total = $Tests.Count

foreach ($Test in $Tests) {
    $Status = if ($Test.Result.Success) { "✅ PASS"; $Passed++ } else { "❌ FAIL" }
    Write-Host "$Status $($Test.Name)"
    
    if (-not $Test.Result.Success -and $Test.Result.Error) {
        Write-Host "    Error: $($Test.Result.Error)" -ForegroundColor Red
    }
}

Write-Host "`n" + "=" * 60
Write-Host "📈 Results: $Passed/$Total tests passed ($([math]::Round($Passed/$Total*100))%)" -ForegroundColor $(if ($Passed -eq $Total) { "Green" } else { "Yellow" })

if ($Passed -eq $Total) {
    Write-Host "🎉 All tests passed! Your edge functions are working correctly." -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests failed. Check the errors above." -ForegroundColor Yellow
}

Write-Host "`n💡 Tips:" -ForegroundColor Cyan
Write-Host "- Run with -Environment remote to test against production"
Write-Host "- Use -TestMode:`$false to send real SMS (be careful!)"
Write-Host "- Check Supabase logs for detailed error information"