#!/bin/bash
# Deployment Quick Start Script for Reverse Turing Test
# Run this script to deploy to GCloud Run

set -e  # Exit on error

echo "🚀 Reverse Turing Test - GCloud Run Deployment"
echo "================================================"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "   Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No GCloud project selected"
    echo "   Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📦 Project: $PROJECT_ID"
echo ""

# Prompt for backend URL that will be used
read -p "🔗 Enter your Lovable frontend URL (e.g., https://your-app.lovable.app): " FRONTEND_URL

if [ -z "$FRONTEND_URL" ]; then
    echo "⚠️  No frontend URL provided. Using * (allow all origins)"
    FRONTEND_URL="*"
fi

echo ""
echo "Step 1: Creating secrets..."
echo "----------------------------------------"

# Check if secrets exist, create if not
if ! gcloud secrets describe game-password &>/dev/null; then
    echo "Creating game-password secret..."
    echo -n "keepthefuturehuman" | gcloud secrets create game-password --data-file=-
else
    echo "✅ game-password secret already exists"
fi

# Prompt for API keys
echo ""
read -p "Enter your Gemini API key (or press Enter to skip if already set): " GEMINI_KEY
if [ ! -z "$GEMINI_KEY" ]; then
    if ! gcloud secrets describe gemini-api-key &>/dev/null; then
        echo "Creating gemini-api-key secret..."
        echo -n "$GEMINI_KEY" | gcloud secrets create gemini-api-key --data-file=-
    else
        echo "Updating gemini-api-key secret..."
        echo -n "$GEMINI_KEY" | gcloud secrets versions add gemini-api-key --data-file=-
    fi
fi

read -p "Enter your ElevenLabs API key (or press Enter to skip if already set): " ELEVENLABS_KEY
if [ ! -z "$ELEVENLABS_KEY" ]; then
    if ! gcloud secrets describe elevenlabs-api-key &>/dev/null; then
        echo "Creating elevenlabs-api-key secret..."
        echo -n "$ELEVENLABS_KEY" | gcloud secrets create elevenlabs-api-key --data-file=-
    else
        echo "Updating elevenlabs-api-key secret..."
        echo -n "$ELEVENLABS_KEY" | gcloud secrets versions add elevenlabs-api-key --data-file=-
    fi
fi

echo ""
echo "Step 2: Deploying to GCloud Run..."
echo "----------------------------------------"

gcloud run deploy reverse-turing-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --timeout 600 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-secrets="GAME_PASSWORD=game-password:latest,GEMINI_API_KEY=gemini-api-key:latest,ELEVENLABS_API_KEY=elevenlabs-api-key:latest" \
  --set-env-vars="NODE_ENV=production,PORT=8080,FRONTEND_URL=$FRONTEND_URL"

echo ""
echo "✅ Deployment complete!"
echo ""

# Get the backend URL
BACKEND_URL=$(gcloud run services describe reverse-turing-backend \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)')

echo "================================================"
echo "🎉 Deployment Successful!"
echo "================================================"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Password: keepthefuturehuman"
echo ""
echo "Next steps:"
echo "1. Update your frontend code:"
echo "   - src/components/PasswordModal.jsx (line ~27)"
echo "   - src/contexts/GameContext.jsx (line ~295)"
echo "   - Replace 'wss://your-backend-url.run.app' with:"
echo "     'wss://${BACKEND_URL#https://}'"
echo ""
echo "2. Configure Lovable environment variables:"
echo "   VITE_BACKEND_URL=wss://${BACKEND_URL#https://}"
echo "   VITE_REQUIRE_AUTH=true"
echo ""
echo "3. Deploy frontend to Lovable"
echo ""
echo "4. Test by visiting your Lovable URL and entering password"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
