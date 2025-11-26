# Deployment Guide: GCloud Run + Lovable Frontend

This guide will walk you through deploying the Reverse Turing Test game to production with GCloud Run backend and Lovable frontend.

## Prerequisites

- Google Cloud account with billing enabled
- GCloud CLI installed and authenticated (`gcloud auth login`)
- Access to your Lovable project
- API keys for Gemini and ElevenLabs

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐
│  Lovable        │         │  GCloud Run      │
│  Frontend       │◄───WS───┤  Backend         │
│  (React + Vite) │         │  (Node.js)       │
└─────────────────┘         └──────────────────┘
        │                            │
        │                            ├─────► Gemini API
        │                            └─────► ElevenLabs TTS
        │
        └─── HTTPS ─────► /api/auth/login (Backend)
```

## Part 1: Deploy Backend to GCloud Run

### Step 1: Configure GCloud Project

```bash
# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### Step 2: Create Secrets for API Keys

```bash
# Create secrets for sensitive data
echo -n "keepthefuturehuman" | gcloud secrets create game-password --data-file=-
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
echo -n "YOUR_ELEVENLABS_API_KEY" | gcloud secrets create elevenlabs-api-key --data-file=-
```

### Step 3: Deploy to GCloud Run

```bash
# Deploy the backend
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
  --set-env-vars="NODE_ENV=production,PORT=8080,FRONTEND_URL=https://YOUR_LOVABLE_URL.lovable.app"
```

**Important Notes:**
- Replace `YOUR_LOVABLE_URL` with your actual Lovable frontend URL
- The deployment will take 3-5 minutes
- Note the service URL that's output (e.g., `https://reverse-turing-backend-xxx.run.app`)

### Step 4: Verify Backend Deployment

```bash
# Get the backend URL
gcloud run services describe reverse-turing-backend \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'

# Test the auth endpoint
curl -X POST https://YOUR_BACKEND_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"keepthefuturehuman"}'

# Should return: {"success":true,"token":"..."}
```

## Part 2: Configure Lovable Frontend

### Step 1: Update Environment Variables

In your Lovable project, add these environment variables:

1. Go to your Lovable project settings
2. Add environment variables:

```bash
VITE_BACKEND_URL=wss://YOUR_BACKEND_URL.run.app
VITE_REQUIRE_AUTH=true
```

**Important:**
- Use `wss://` (WebSocket Secure) for the backend URL, not `https://`
- Remove the trailing `/` from the URL
- Example: `wss://reverse-turing-backend-abc123.run.app`

### Step 2: Update Backend URL in Code

If you hardcoded the backend URL in `PasswordModal.jsx` or `GameContext.jsx`, update it:

```javascript
// In src/components/PasswordModal.jsx (line ~27)
// In src/contexts/GameContext.jsx (line ~295)

// Replace:
(isProduction ? 'wss://your-backend-url.run.app' : 'ws://localhost:3001')

// With your actual URL:
(isProduction ? 'wss://reverse-turing-backend-xxx.run.app' : 'ws://localhost:3001')
```

### Step 3: Deploy Frontend

1. Commit your changes to Lovable
2. Lovable will automatically deploy the updated frontend
3. Wait for deployment to complete (check Lovable dashboard)

## Part 3: Testing the Deployment

### Step 1: Test Authentication

1. Visit your Lovable frontend URL
2. You should see the password entry modal
3. Enter password: `keepthefuturehuman`
4. Click "Enter Game"
5. You should be redirected to the game lobby

### Step 2: Test Game Flow

1. Enter your name
2. Click "Start Game"
3. Wait for President intro
4. Select voice or text mode
5. Play through Round 1

### Step 3: Monitor Logs

```bash
# Watch backend logs in real-time
gcloud run services logs tail reverse-turing-backend \
  --region us-central1

# Look for:
# - [SYSTEM] New session authenticated
# - [SYSTEM] Phase transition: LOBBY → CALL_CONNECTING
# - [AUDIO] player2: STARTED speaking
```

## Part 4: Troubleshooting

### Issue: WebSocket Connection Fails

**Symptoms:** Console shows "WebSocket Disconnected" immediately

**Solutions:**
1. Verify backend URL uses `wss://` not `https://`
2. Check CORS configuration allows your Lovable domain:
   ```bash
   # Update backend environment variable
   gcloud run services update reverse-turing-backend \
     --region us-central1 \
     --set-env-vars="FRONTEND_URL=https://YOUR_EXACT_LOVABLE_URL.lovable.app"
   ```

3. Check if authentication token is present:
   ```javascript
   // In browser console
   localStorage.getItem('gameAuthToken')
   ```

### Issue: Authentication Fails

**Symptoms:** Password modal shows "Invalid password"

**Solutions:**
1. Verify secret is set correctly:
   ```bash
   gcloud secrets versions access latest --secret=game-password
   ```

2. Check backend logs for authentication attempts:
   ```bash
   gcloud run services logs tail reverse-turing-backend --region us-central1 | grep "authentication"
   ```

### Issue: Audio Not Playing

**Symptoms:** Game progresses but no audio

**Solutions:**
1. Check ElevenLabs API key is set:
   ```bash
   gcloud secrets versions access latest --secret=elevenlabs-api-key
   ```

2. Verify ElevenLabs credits are available (check your ElevenLabs dashboard)

3. Check browser console for audio errors

### Issue: High Latency

**Symptoms:** Long delays between messages

**Solutions:**
1. Increase GCloud Run memory:
   ```bash
   gcloud run services update reverse-turing-backend \
     --region us-central1 \
     --memory 2Gi \
     --cpu 2
   ```

2. Change region closer to your users

3. Check if Gemini API is rate limiting (see logs)

## Part 5: Cost Optimization

### Monitor Usage

```bash
# Check GCloud Run metrics
gcloud run services describe reverse-turing-backend \
  --region us-central1 \
  --format='value(status.traffic)'

# View billing report
gcloud billing budgets list
```

### Reduce Costs

1. **Set min-instances to 0** (already set)
   - Cold starts are ~5s, acceptable for a game

2. **Lower memory if not needed**
   ```bash
   gcloud run services update reverse-turing-backend \
     --region us-central1 \
     --memory 512Mi
   ```

3. **Set maximum instances**
   ```bash
   gcloud run services update reverse-turing-backend \
     --region us-central1 \
     --max-instances 5
   ```

4. **Use cheaper TTS (Google instead of ElevenLabs)**
   - Update backend env var: `TTS_PROVIDER=google`
   - Saves ~$11/month on ElevenLabs

### Expected Costs

**Baseline (10 games/day, ~300 games/month):**
- GCloud Run: ~$5-10/month
- ElevenLabs: $11/month (Creator Plan)
- Gemini API: FREE
- **Total: ~$16-21/month**

**Heavy Usage (50 games/day):**
- GCloud Run: ~$20-30/month
- ElevenLabs: $22/month (Independent Creator)
- Gemini API: FREE
- **Total: ~$42-52/month**

## Part 6: Updating the Deployment

### Update Backend

```bash
# Make code changes, then redeploy
gcloud run deploy reverse-turing-backend \
  --source . \
  --platform managed \
  --region us-central1
```

### Update Secrets

```bash
# Update password
echo -n "newpassword123" | gcloud secrets versions add game-password --data-file=-

# Update API keys
echo -n "NEW_API_KEY" | gcloud secrets versions add gemini-api-key --data-file=-
```

### Update Environment Variables

```bash
gcloud run services update reverse-turing-backend \
  --region us-central1 \
  --set-env-vars="FRONTEND_URL=https://new-url.lovable.app"
```

## Part 7: Security Checklist

- [x] API keys stored in Secret Manager (not in code)
- [x] Password authentication enabled
- [x] CORS restricted to specific frontend domain
- [x] WebSocket connections authenticated
- [x] HTTPS/WSS encryption for all connections
- [ ] Consider adding rate limiting for API endpoints
- [ ] Consider adding IP whitelisting if needed
- [ ] Set up monitoring alerts for suspicious activity

## Part 8: Monitoring and Alerts

### Set Up Cloud Monitoring

```bash
# Create alert for high error rate
gcloud monitoring policies create \
  --notification-channels=YOUR_NOTIFICATION_CHANNEL \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 10%" \
  --condition-threshold-value=0.1
```

### Useful Monitoring Queries

```bash
# Total requests in last hour
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=reverse-turing-backend" \
  --limit 100 \
  --freshness=1h

# Authentication failures
gcloud logging read "resource.type=cloud_run_revision AND textPayload:\"Failed authentication\"" \
  --limit 50

# WebSocket connections
gcloud logging read "resource.type=cloud_run_revision AND textPayload:\"New client connected\"" \
  --limit 20
```

## Support

If you encounter issues:

1. Check logs: `gcloud run services logs tail reverse-turing-backend --region us-central1`
2. Verify secrets: `gcloud secrets list`
3. Test endpoints: Use `curl` to test authentication
4. Review this guide's troubleshooting section

## Next Steps

- Set up custom domain (optional)
- Configure Cloud CDN for better performance
- Add monitoring dashboards
- Implement session persistence with Redis (for multi-instance scaling)
- Add rate limiting middleware

---

**Congratulations!** Your Reverse Turing Test game is now deployed to production! 🎉🤖
