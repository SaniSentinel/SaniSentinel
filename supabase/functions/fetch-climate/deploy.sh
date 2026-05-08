#!/bin/bash

# Deploy script for fetch-climate Edge Function
# Usage: ./deploy.sh [environment]
# Environment: local (default) or production

set -e

ENVIRONMENT=${1:-local}
FUNCTION_NAME="fetch-climate"

echo "🚀 Deploying $FUNCTION_NAME Edge Function to $ENVIRONMENT..."

if [ "$ENVIRONMENT" = "local" ]; then
    echo "📦 Starting local Supabase..."
    supabase start
    
    echo "🔧 Serving function locally..."
    supabase functions serve $FUNCTION_NAME --no-verify-jwt &
    SERVE_PID=$!
    
    echo "⏳ Waiting for function to start..."
    sleep 3
    
    echo "🧪 Testing function..."
    curl -X POST 'http://localhost:54321/functions/v1/fetch-climate' \
      -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJuXMHSxXpQPSo3kc_lr-kQQx_Aq7Yzs' \
      -H 'Content-Type: application/json' | jq '.'
    
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
echo "1. Set up a cron job to run the function periodically"
echo "2. Monitor the function logs in your Supabase dashboard"
echo "3. Check the climate_snapshots table for new data"
echo "4. Verify that alerts are being generated for high-risk conditions"