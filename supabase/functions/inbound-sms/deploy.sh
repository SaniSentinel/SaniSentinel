#!/bin/bash

# Deploy script for inbound-sms Edge Function
# Usage: ./deploy.sh [environment]
# Environment: local (default) or production

set -e

ENVIRONMENT=${1:-local}
FUNCTION_NAME="inbound-sms"

echo "📱 Deploying $FUNCTION_NAME Edge Function to $ENVIRONMENT..."

if [ "$ENVIRONMENT" = "local" ]; then
    echo "📦 Starting local Supabase..."
    supabase start
    
    echo "🔧 Serving function locally..."
    supabase functions serve $FUNCTION_NAME --no-verify-jwt &
    SERVE_PID=$!
    
    echo "⏳ Waiting for function to start..."
    sleep 3
    
    echo "🧪 Testing function with valid SMS..."
    curl -X POST 'http://localhost:54321/functions/v1/inbound-sms' \
      -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJuXMHSxXpQPSo3kc_lr-kQQx_Aq7Yzs' \
      -H 'Content-Type: application/json' \
      -d '{"text": "F1#A#good", "from": "+233241234567"}' | jq '.'
    
    echo ""
    echo "🧪 Testing function with invalid SMS..."
    curl -X POST 'http://localhost:54321/functions/v1/inbound-sms' \
      -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJuXMHSxXpQPSo3kc_lr-kQQx_Aq7Yzs' \
      -H 'Content-Type: application/json' \
      -d '{"text": "invalid message", "from": "+233241234567"}' | jq '.'
    
    echo ""
    echo "🧪 Testing webhook format..."
    curl -X POST 'http://localhost:54321/functions/v1/inbound-sms' \
      -H 'Content-Type: application/x-www-form-urlencoded' \
      -d 'text=F2%23B%23overflow&from=%2B233241234568&id=12345' | jq '.'
    
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
echo "1. Configure Africa's Talking webhook URL"
echo "2. Test with real SMS messages"
echo "3. Train workers on SMS format: F{ID}#{BLOCK}#{CONDITION}"
echo "4. Monitor function logs for errors"
echo "5. Set up facility ID mapping for your facilities"
echo ""
echo "📱 SMS Format Examples:"
echo "   F123#A#good      - Facility 123, Block A, Good condition"
echo "   F456#B#overflow  - Facility 456, Block B, Overflow detected"
echo "   F789#1#damaged   - Facility 789, Block 1, Damaged"