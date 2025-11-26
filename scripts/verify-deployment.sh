#!/bin/bash

# Deployment Verification Script
# Usage: ./scripts/verify-deployment.sh <deployment-url>

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <deployment-url>"
  echo "Example: $0 https://your-app.vercel.app"
  exit 1
fi

DEPLOYMENT_URL=$1
API_ENDPOINT="${DEPLOYMENT_URL}/api/chat"

echo "🔍 Verifying deployment at: $DEPLOYMENT_URL"
echo ""

# Test 1: Check if frontend is accessible
echo "✅ Test 1: Frontend accessibility"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL")
if [ "$HTTP_CODE" -eq 200 ]; then
  echo "   ✓ Frontend is accessible (HTTP $HTTP_CODE)"
else
  echo "   ✗ Frontend returned HTTP $HTTP_CODE"
  exit 1
fi
echo ""

# Test 2: Check if API endpoint exists
echo "✅ Test 2: API endpoint exists"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_ENDPOINT")
if [ "$HTTP_CODE" -eq 405 ]; then
  echo "   ✓ API endpoint exists (correctly rejects GET with 405)"
else
  echo "   ✗ API endpoint returned unexpected HTTP $HTTP_CODE"
  exit 1
fi
echo ""

# Test 3: Validate request validation (missing prompt)
echo "✅ Test 3: Request validation"
RESPONSE=$(curl -s -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{}')
if echo "$RESPONSE" | grep -q "prompt is required"; then
  echo "   ✓ Request validation works"
else
  echo "   ✗ Request validation failed"
  echo "   Response: $RESPONSE"
  exit 1
fi
echo ""

# Test 4: Validate prompt length limit
echo "✅ Test 4: Prompt length validation"
LONG_PROMPT=$(printf 'a%.0s' {1..1001})
RESPONSE=$(curl -s -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"$LONG_PROMPT\"}")
if echo "$RESPONSE" | grep -q "exceeds maximum length"; then
  echo "   ✓ Prompt length validation works"
else
  echo "   ✗ Prompt length validation failed"
  echo "   Response: $RESPONSE"
  exit 1
fi
echo ""

# Test 5: Test actual AI generation (requires API key to be configured)
echo "✅ Test 5: AI generation (requires configured API key)"
RESPONSE=$(curl -s -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Describe a mysterious artifact in one sentence", "temperature": 0.7}')

if echo "$RESPONSE" | grep -q "text"; then
  echo "   ✓ AI generation works"
  echo "   Sample response: $(echo "$RESPONSE" | head -c 100)..."
elif echo "$RESPONSE" | grep -q "Server configuration error"; then
  echo "   ⚠ API key not configured (expected for first deployment)"
  echo "   Please set FEATHERLESS_API_KEY in Vercel environment variables"
else
  echo "   ✗ Unexpected response"
  echo "   Response: $RESPONSE"
  exit 1
fi
echo ""

echo "🎉 Deployment verification complete!"
echo ""
echo "Next steps:"
echo "1. If API key warning appeared, set FEATHERLESS_API_KEY in Vercel"
echo "2. Test the game by creating a pet at $DEPLOYMENT_URL"
echo "3. Try scavenging and feeding to verify full functionality"
