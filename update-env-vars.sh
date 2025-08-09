#!/bin/bash

# Set environment variables for karaoke-rating Cloud Run service

echo "🔧 Setting environment variables for karaoke-rating service..."

gcloud run services update karaoke-rating \
    --region=us-east1 \
    --clear-env-vars

sleep 5

gcloud run services update karaoke-rating \
    --region=us-east1 \
    --set-env-vars="NODE_ENV=production" \
    --set-env-vars="DB_HOST=104.197.113.13" \
    --set-env-vars="DB_PORT=3306" \
    --set-env-vars="DB_USERNAME=karaoke" \
    --set-env-vars="DB_PASSWORD=GC(*g\"\"\\9SH@{vBr" \
    --set-env-vars="DB_DATABASE=karaoke" \
    --set-env-vars="PORT=8080"

echo "✅ Environment variables updated!"

echo "🧪 Testing service..."
sleep 10

curl -I https://karaoke-rating-203453576607.us-east1.run.app

echo "📊 Checking logs..."
gcloud run services logs read karaoke-rating --region=us-east1 --limit=5
