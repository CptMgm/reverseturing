#!/bin/bash

# Cloud Run deployment script for Reverse Turing Test backend
# This script deploys your Node.js server to Google Cloud Run

set -e  # Exit on error

echo "🚀 Deploying Reverse Turing Test to Cloud Run..."

# Service name
SERVICE_NAME="reverse-turing-server"
REGION="us-central1"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI not installed"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "❌ Error: Not logged in to gcloud"
    echo "Run: gcloud auth login"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No project set"
    echo "Run: gcloud config set project YOUR-PROJECT-ID"
    exit 1
fi

echo "📦 Project: $PROJECT_ID"
echo "🌍 Region: $REGION"
echo "🔧 Service: $SERVICE_NAME"
echo ""

# Prompt for API keys if not set
read -p "Enter your GOOGLE_API_KEY (or press Enter to skip): " GOOGLE_KEY
read -p "Enter your ELEVENLABS_API_KEY (or press Enter to skip): " ELEVENLABS_KEY
read -p "Enter your DAILY_API_KEY (or press Enter to skip): " DAILY_KEY
read -p "Enter your FRONTEND_URL (Lovable domain, or press Enter for wildcard): " FRONTEND_URL

# Build environment variables string
ENV_VARS=""
[ -n "$GOOGLE_KEY" ] && ENV_VARS="GOOGLE_API_KEY=$GOOGLE_KEY"
[ -n "$ELEVENLABS_KEY" ] && ENV_VARS="$ENV_VARS,ELEVENLABS_API_KEY=$ELEVENLABS_KEY"
[ -n "$DAILY_KEY" ] && ENV_VARS="$ENV_VARS,DAILY_API_KEY=$DAILY_KEY"
[ -n "$FRONTEND_URL" ] && ENV_VARS="$ENV_VARS,FRONTEND_URL=$FRONTEND_URL"

# Remove leading comma if present
ENV_VARS="${ENV_VARS#,}"

echo ""
echo "🏗️  Building and deploying..."
echo ""

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 3 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --port 8080 \
  ${ENV_VARS:+--set-env-vars "$ENV_VARS"}

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📡 Your backend URL:"
gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)'
echo ""
echo "💡 WebSocket URL: Replace 'https://' with 'wss://'"
echo ""
echo "Next steps:"
echo "1. Copy the URL above"
echo "2. Use wss://YOUR-URL (not https://) for WebSocket connection in your frontend"
echo "3. Update your Lovable frontend to point to this backend"
