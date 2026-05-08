#!/bin/bash

# Deploy script for send-sms-alert Edge Function
# Usage: ./deploy.sh [environment]
# Environment: local (default) or production

set -e

ENVIRONMENT=${1:-local}
FUNCTION_NAME="send-sms-alert"

echo "📱 Deploying $FUNCTION_NAME Edge Function to $ENVIRONMENT..."

if [ "$ENVIRONMENT" = "local" ]; then
    echo "📦 Starting local Supabase..."
    supabase start
    
    echo "🔧 Serving function locally..."
    supabase functions serve $FUNCTION_NAME --no-verify-jwt &
    SERVE_PID=$!
    
    echo "⏳ Waiting for function to start..."
    sleep 3
    
    echo "🧪 Testing function in TEST MODE..."
    curl -X POST 'http://localhost:54321/functions/v1/send-sms-alert' \
      -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJuXMHSxXpQPSo3kc_lr-kQQx_Aq7Yzs' \
      -H 'Content-Type: application/json' \
      -d '{"test_mode": true, "severity_filter": ["critical", "high"]}' | jq '.'
    
    echo ""
    echo "🧪 Testing with custom message..."
    curl -X POST 'http://localhost:54321/functions/v1/send-sms-alert' \
      -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJuXMHSxXpQPSo3kc_lr-kQQx_Aq7Yzs' \
      -H 'Content-Type: application/json' \
      -d '{
        "worker_phones": ["+233241234567", "+233241234568"],
        "custom_message": "Test message from SMS alert system. Please ignore.",
        "test_mode": true
      }' | jq '.'
    
    echo "✅ Local deployment complete!"
    echo "🔗 Function URL: http://localhost:54321/functions/v1/$FUNCTION_NAME"
    echo "🛑 To stop: kill $SERVE_PID"
    
elif [ "$ENVIRONMENT" = "production" ]; then
    echo "🌐 Deploying to production..."
    
    # Check if logged in
    if ! supabase projects list > /dev/null 2>&1; then
        echo "❌ Not logged in to Supabase. Run: supabase login"
        exit 1
    fi
    
    # Check environment variables
    echo "🔍 Checking environment variables..."
    echo "⚠️  Make sure you have set these in your Supabase dashboard:"
    echo "   • AFRICAS_TALKING_API_KEY"
    echo "   • AFRICAS_TALKING_USERNAME"
    
    # Deploy function
    supabase functions deploy $FUNCTION_NAME
    
    echo "✅ Production deployment complete!"
    echo "🔗 Check your Supabase dashboard for the function URL"
    
else
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [local|production]"
    exit 1
fi

echo ""
echo "📚 Next steps:"
echo "1. Set up Africa's Talking account and get API credentials"
echo "2. Configure environment variables in Supabase dashboard"
echo "3. Test with test_mode: true before sending real SMS"
echo "4. Set up database triggers for automatic SMS alerts"
echo "5. Monitor SMS costs and delivery rates"
echo ""
echo "🔗 Useful links:"
echo "   • Africa's Talking: https://africastalking.com/"
echo "   • SMS API Docs: https://developers.africastalking.com/docs/sms/overview"