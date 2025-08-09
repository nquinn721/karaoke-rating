#!/bin/bash

# Simple Cloud Run deployment for Karaoke Rating App

set -e

echo "🚀 Deploying Karaoke Rating App to Cloud Run..."

# Deploy to Cloud Run with correct environment variables
gcloud run deploy karaoke-rating \
    --image gcr.io/heroic-footing-460117-k8/karaoke-rating \
    --platform managed \
    --region us-east1 \
    --allow-unauthenticated \
    --set-env-vars="NODE_ENV=production,DB_HOST=104.197.113.13,DB_PORT=3306,DB_USERNAME=karaoke,DB_PASSWORD=GC(*g\"\"\\9SH@{vBr,DB_DATABASE=karaoke,PORT=8080" \
    --port=8080 \
    --memory=1Gi \
    --cpu=1 \
    --max-instances=10

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://karaoke-rating-203453576607.us-east1.run.app"

# Test the deployment
echo "🧪 Testing deployment..."
sleep 5  # Give the service a moment to start
curl -I https://karaoke-rating-203453576607.us-east1.run.app || echo "Service might still be starting up"

echo "📊 View logs with: gcloud run services logs read karaoke-rating --region=us-east1"
