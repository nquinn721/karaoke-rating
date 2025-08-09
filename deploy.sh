#!/bin/bash

# Google Cloud Run Deployment Script for Karaoke Rating App
# This script updates the existing Cloud Run service with proper environment variables

set -e

# Configuration
PROJECT_ID="your-project-id-here"  # Replace with your actual project ID
SERVICE_NAME="karaoke-rating"
REGION="us-east1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Karaoke Rating App Deployment Script${NC}"
echo "=========================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud SDK is not installed. Please install it first.${NC}"
    exit 1
fi

# Prompt for Cloud SQL IP if not provided
if [ -z "$CLOUD_SQL_IP" ]; then
    echo -e "${YELLOW}📋 Please enter your Cloud SQL instance IP address:${NC}"
    read -p "DB_HOST (Cloud SQL IP): " CLOUD_SQL_IP
fi

if [ -z "$CLOUD_SQL_IP" ]; then
    echo -e "${RED}❌ Cloud SQL IP is required. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}🔧 Setting up environment variables...${NC}"

# Build and deploy
echo -e "${GREEN}🏗️  Building application...${NC}"
gcloud builds submit --tag $IMAGE_NAME

echo -e "${GREEN}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars="NODE_ENV=production" \
    --set-env-vars="DB_HOST=$CLOUD_SQL_IP" \
    --set-env-vars="DB_PORT=3306" \
    --set-env-vars="DB_USERNAME=karaoke" \
    --set-env-vars="DB_PASSWORD=GC(*g\"\"\\9SH@{vBr" \
    --set-env-vars="DB_DATABASE=karaoke" \
    --port=3000 \
    --memory=1Gi \
    --cpu=1 \
    --max-instances=10 \
    --timeout=300

echo -e "${GREEN}✅ Deployment completed!${NC}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
echo -e "${GREEN}🌐 Service URL: ${SERVICE_URL}${NC}"

# Test the deployment
echo -e "${GREEN}🧪 Testing deployment...${NC}"
if curl -f -s "$SERVICE_URL" > /dev/null; then
    echo -e "${GREEN}✅ Service is responding!${NC}"
else
    echo -e "${YELLOW}⚠️  Service might still be starting up. Check the logs if needed.${NC}"
fi

echo -e "${GREEN}📊 You can view logs with:${NC}"
echo "gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=50"

echo -e "${GREEN}✨ Deployment complete!${NC}"
