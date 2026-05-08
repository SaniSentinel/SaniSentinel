#!/bin/bash

# Edge Function Testing Script using curl
# Works with both local and remote Supabase instances

# Configuration
ENVIRONMENT=${1:-"local"}  # "local" or "remote"
TEST_MODE=${2:-"true"}

if [ "$ENVIRONMENT" = "local" ]; then
    BASE_URL="http://localhost:54321/functions/v1"
    AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
else
    BASE_URL="https://aaxgfnzcbyerjlcftwuo.supabase.co/functions/v1"
    AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFheGdmbnpjYnllcmpsY2Z0d3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxODc4NDgsImV4cCI6MjA5Mzc2Mzg0OH0.rur02SV6Yy0gLjUmkFMwUTB7msz1f3bXzyQPokaWJrk"
fi

echo "🚀 Testing Edge Functions ($ENVIRONMENT environment)"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Test function helper
test_function() {
    local function_name=$1
    local payload=$2
    local content_type=${3:-"application/json"}
    
    echo -e "\n${CYAN}🧪 Testing $function_name...${NC}"
    echo -e "📡 URL: $BASE_URL/$function_name"
    echo -e "📦 Payload: $payload"
    
    local response
    local http_code
    
    if [ "$content_type" = "application/x-www-form-urlencoded" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: $content_type" \
            -d "$payload" \
            "$BASE_URL/$function_name")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$payload" \
            "$BASE_URL/$function_name")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ Success! (HTTP $http_code)${NC}"
        echo -e "${YELLOW}📄 Response:${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
        return 0
    else
        echo -e "${RED}❌ Failed! (HTTP $http_code)${NC}"
        echo -e "${RED}📄 Response:${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
        return 1
    fi
}

# Test results tracking
passed=0
total=0

# Test 1: fetch-climate
echo -e "\n${MAGENTA}📊 TEST 1: FETCH-CLIMATE${NC}"
echo "------------------------------"
if test_function "fetch-climate" "{}"; then
    ((passed++))
fi
((total++))

# Wait for climate data processing
echo -e "${YELLOW}⏳ Waiting 5 seconds for climate data processing...${NC}"
sleep 5

# Test 2: score-risk (all facilities)
echo -e "\n${MAGENTA}🎯 TEST 2: SCORE-RISK (All Facilities)${NC}"
echo "------------------------------"
if test_function "score-risk" "{}"; then
    ((passed++))
fi
((total++))

# Test 3: score-risk (specific facilities)
echo -e "\n${MAGENTA}🎯 TEST 3: SCORE-RISK (Specific Facilities)${NC}"
echo "------------------------------"
payload='{"facility_ids": ["facility-1", "facility-2"]}'
if test_function "score-risk" "$payload"; then
    ((passed++))
fi
((total++))

# Test 4: send-sms-alert (test mode)
echo -e "\n${MAGENTA}📱 TEST 4: SEND-SMS-ALERT (Test Mode)${NC}"
echo "------------------------------"
payload='{"severity_filter": ["critical", "high"], "test_mode": true}'
if test_function "send-sms-alert" "$payload"; then
    ((passed++))
fi
((total++))

# Test 5: send-sms-alert (custom message)
echo -e "\n${MAGENTA}📱 TEST 5: SEND-SMS-ALERT (Custom Message)${NC}"
echo "------------------------------"
payload="{\"worker_phones\": [\"+233123456789\"], \"custom_message\": \"Test from curl script\", \"test_mode\": $TEST_MODE}"
if test_function "send-sms-alert" "$payload"; then
    ((passed++))
fi
((total++))

# Test 6: inbound-sms (valid format)
echo -e "\n${MAGENTA}📥 TEST 6: INBOUND-SMS (Valid Format)${NC}"
echo "------------------------------"
payload='{"text": "F1#A#good", "from": "+233123456789"}'
if test_function "inbound-sms" "$payload"; then
    ((passed++))
fi
((total++))

# Test 7: inbound-sms (invalid format)
echo -e "\n${MAGENTA}📥 TEST 7: INBOUND-SMS (Invalid Format)${NC}"
echo "------------------------------"
payload='{"text": "invalid message", "from": "+233123456789"}'
if test_function "inbound-sms" "$payload"; then
    ((passed++))
fi
((total++))

# Test 8: inbound-sms (condition aliases)
echo -e "\n${MAGENTA}📥 TEST 8: INBOUND-SMS (Condition Aliases)${NC}"
echo "------------------------------"
payload='{"text": "F2#B#broken", "from": "+233987654321"}'
if test_function "inbound-sms" "$payload"; then
    ((passed++))
fi
((total++))

# Test 9: inbound-sms (webhook format)
echo -e "\n${MAGENTA}📥 TEST 9: INBOUND-SMS (Webhook Format)${NC}"
echo "------------------------------"
webhook_payload="id=test-webhook&text=F3%23C%23overflow&from=%2B233555666777&to=12345&date=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)&linkId=test-link&networkCode=63902"
if test_function "inbound-sms" "$webhook_payload" "application/x-www-form-urlencoded"; then
    ((passed++))
fi
((total++))

# Summary
echo -e "\n${GREEN}📊 TEST SUMMARY${NC}"
echo "============================================================"

success_rate=$((passed * 100 / total))

echo -e "${GREEN}📈 Results: $passed/$total tests passed ($success_rate%)${NC}"

if [ $passed -eq $total ]; then
    echo -e "${GREEN}🎉 All tests passed! Your edge functions are working correctly.${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the errors above.${NC}"
fi

echo -e "\n${CYAN}💡 Usage Tips:${NC}"
echo "- Run with 'remote' as first argument to test production"
echo "- Run with 'false' as second argument to send real SMS"
echo "- Example: ./test-functions-curl.sh remote false"
echo "- Check Supabase logs for detailed error information"

exit $((total - passed))