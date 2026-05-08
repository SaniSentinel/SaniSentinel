@echo off
echo 📱 Deploying SMS Alert Function...
echo.

REM Check if Supabase CLI is available
supabase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI not found. Please install it first:
    echo    npm install -g supabase
    echo    or download from: https://github.com/supabase/cli/releases
    pause
    exit /b 1
)

echo ✅ Supabase CLI found

REM Start Supabase if not running
echo 🚀 Starting Supabase...
supabase start

REM Deploy the SMS function
echo 📤 Deploying send-sms-alert function...
supabase functions deploy send-sms-alert

if %errorlevel% equ 0 (
    echo ✅ SMS function deployed successfully!
    echo.
    echo 🧪 Testing the function...
    
    REM Test the function
    curl -X POST "http://localhost:54321/functions/v1/send-sms-alert" ^
         -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJuXMHSxXpQPSo3kc_lr-kQQx_Aq7Yzs" ^
         -H "Content-Type: application/json" ^
         -d "{\"test_mode\": true, \"severity_filter\": [\"critical\", \"high\"]}"
    
    echo.
    echo ✅ SMS Alert System is ready!
    echo 💡 Your API key is configured in .env file
    echo 💡 Function is deployed and ready for testing
    echo.
    echo 📚 Next steps:
    echo 1. Test with your React app using SMSAlertManager component
    echo 2. Verify workers have correct phone numbers in database
    echo 3. Switch to production mode when ready (test_mode: false)
    
) else (
    echo ❌ Failed to deploy SMS function
    echo 💡 Check the error messages above
)

echo.
pause