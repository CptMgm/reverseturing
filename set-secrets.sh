#!/bin/bash

# Script to set API keys from .env file to Cloud Run service
# This reads your .env file and sets the environment variables securely

set -e

SERVICE_NAME="reverse-turing-server"
REGION="us-central1"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

echo "📝 Reading API keys from .env file..."

# Source the .env file
set -a
source .env
set +a

# Build the env vars string
ENV_VARS=""

# Add each key if it exists
[ -n "$GOOGLE_API_KEY" ] && ENV_VARS="${ENV_VARS}GOOGLE_API_KEY=$GOOGLE_API_KEY,"
[ -n "$GOOGLE_API_KEY_F3" ] && ENV_VARS="${ENV_VARS}GOOGLE_API_KEY_F3=$GOOGLE_API_KEY_F3,"
[ -n "$GOOGLE_API_KEY_SEL" ] && ENV_VARS="${ENV_VARS}GOOGLE_API_KEY_SEL=$GOOGLE_API_KEY_SEL,"
[ -n "$GOOGLE_API_KEY_AP" ] && ENV_VARS="${ENV_VARS}GOOGLE_API_KEY_AP=$GOOGLE_API_KEY_AP,"
[ -n "$ELEVENLABS_API_KEY" ] && ENV_VARS="${ENV_VARS}ELEVENLABS_API_KEY=$ELEVENLABS_API_KEY,"
[ -n "$DAILY_API_KEY" ] && ENV_VARS="${ENV_VARS}DAILY_API_KEY=$DAILY_API_KEY,"

# Remove trailing comma
ENV_VARS="${ENV_VARS%,}"

if [ -z "$ENV_VARS" ]; then
    echo "❌ Error: No API keys found in .env file"
    exit 1
fi

echo "🔐 Setting API keys in Cloud Run service..."

gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --update-env-vars "$ENV_VARS"

echo "✅ API keys updated successfully!"
echo ""
echo "Verify with:"
echo "gcloud run services describe $SERVICE_NAME --region $REGION --format='get(spec.template.spec.containers[0].env)'"
