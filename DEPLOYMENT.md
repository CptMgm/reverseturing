# Cloud Run Deployment Guide

## ✅ What's Been Deployed

Your backend is deploying to Google Cloud Run with:
- **Service Name:** reverse-turing-server
- **Region:** us-central1
- **Min Instances:** 1 (no cold starts)
- **Max Instances:** 3 (handles 3 concurrent sessions)
- **Memory:** 512Mi
- **Timeout:** 300s (5 minutes for WebSockets)

## 🔑 Setting API Keys (Do This After Deployment)

You need to set your API keys as environment variables in Cloud Run:

```bash
# Set all API keys at once
gcloud run services update reverse-turing-server \
  --region us-central1 \
  --update-env-vars "\
GOOGLE_API_KEY=YOUR_GOOGLE_KEY,\
GOOGLE_API_KEY_F3=YOUR_F3_KEY,\
GOOGLE_API_KEY_SEL=YOUR_SEL_KEY,\
GOOGLE_API_KEY_AP=YOUR_AP_KEY,\
ELEVENLABS_API_KEY=YOUR_ELEVENLABS_KEY,\
DAILY_API_KEY=YOUR_DAILY_KEY"
```

Or set them in the Cloud Console:
1. Go to: https://console.cloud.google.com/run
2. Click on `reverse-turing-server`
3. Click "Edit & Deploy New Revision"
4. Scroll to "Variables & Secrets"
5. Add your API keys as environment variables
6. Click "Deploy"

## 🌐 Get Your Backend URL

```bash
gcloud run services describe reverse-turing-server \
  --region us-central1 \
  --format='value(status.url)'
```

Example output: `https://reverse-turing-server-xxxxx-uc.a.run.app`

## 🔌 Connect Lovable Frontend

### 1. Update Frontend WebSocket URL

In your Lovable project, update the WebSocket connection to use your Cloud Run URL:

**Find:** `src/contexts/GameContext.jsx`

**Change:**
```javascript
// OLD (localhost)
const wsUrl = 'ws://localhost:3001';

// NEW (Cloud Run)
const wsUrl = 'wss://reverse-turing-server-xxxxx-uc.a.run.app';
```

⚠️ **Important:** Use `wss://` (WebSocket Secure), NOT `https://`

### 2. Update CORS (Optional)

Once you have your Lovable frontend URL, update CORS for better security:

```bash
gcloud run services update reverse-turing-server \
  --region us-central1 \
  --update-env-vars "FRONTEND_URL=https://your-lovable-app.lovable.app"
```

## 📊 Monitor Your Deployment

### View Logs
```bash
gcloud run services logs read reverse-turing-server --region us-central1
```

Or in the Console:
https://console.cloud.google.com/run/detail/us-central1/reverse-turing-server/logs

### Check Service Status
```bash
gcloud run services describe reverse-turing-server --region us-central1
```

### View Metrics (requests, latency, etc.)
https://console.cloud.google.com/run/detail/us-central1/reverse-turing-server/metrics

## 💰 Cost Tracking

With `--min-instances 1`:
- **Expected cost:** $7-9/month
- **Your $200 credit:** ~20-25 months free

Check current usage:
```bash
# View billing
gcloud billing accounts list

# See project costs
# https://console.cloud.google.com/billing
```

## 🔄 Redeploy After Changes

If you make changes to your backend code:

```bash
# Quick redeploy (keeps existing env vars)
gcloud run deploy reverse-turing-server \
  --source . \
  --region us-central1

# Or use the script
./deploy-cloudrun.sh
```

## 🐛 Troubleshooting

### WebSocket Connection Fails
1. Make sure you're using `wss://` not `https://`
2. Check that `--timeout 300` is set (5 minutes)
3. Verify CORS is allowing your frontend domain

### API Keys Not Working
1. Check they're set: `gcloud run services describe reverse-turing-server --region us-central1 --format='get(spec.template.spec.containers[0].env)'`
2. Make sure there are no extra quotes or spaces
3. Redeploy after setting: Service needs to restart

### Cold Starts Still Happening
1. Verify `--min-instances 1` is set
2. Check: `gcloud run services describe reverse-turing-server --region us-central1 --format='get(spec.template.metadata.annotations)'`

## 📝 Useful Commands

```bash
# Get service URL
gcloud run services describe reverse-turing-server --region us-central1 --format='value(status.url)'

# View all environment variables
gcloud run services describe reverse-turing-server --region us-central1 --format='get(spec.template.spec.containers[0].env)'

# Update single env var
gcloud run services update reverse-turing-server --region us-central1 --update-env-vars "KEY=VALUE"

# View recent logs
gcloud run services logs read reverse-turing-server --region us-central1 --limit 50

# Delete service (if needed)
gcloud run services delete reverse-turing-server --region us-central1
```
