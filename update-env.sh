#!/bin/bash

# Quick Environment Variables Update Script
# Updates the existing Cloud Run service with correct database environment variables

set -e

# Configuration
SERVICE_NAME="karaoke-rating"
REGION="us-east1"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Updating Cloud Run Environment Variables${NC}"
echo "=============================================="

# Prompt for Cloud SQL IP
echo -e "${YELLOW}📋 Please enter your Cloud SQL instance IP address:${NC}"
echo -e "${YELLOW}   (You can find this with: gcloud sql instances describe karaoke-db --format=\"value(ipAddresses[0].ipAddress)\")${NC}"
read -p "DB_HOST (Cloud SQL IP): " CLOUD_SQL_IP

if [ -z "$CLOUD_SQL_IP" ]; then
    echo -e "${RED}❌ Cloud SQL IP is required. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}🚀 Updating service environment variables...${NC}"

# Update the existing service with environment variables
gcloud run services update $SERVICE_NAME \
    --region=$REGION \
    --set-env-vars="NODE_ENV=production,DB_HOST=$CLOUD_SQL_IP,DB_PORT=3306,DB_USERNAME=karaoke,DB_PASSWORD=GC(*g\"\"\\9SH@{vBr,DB_DATABASE=karaoke"

echo -e "${GREEN}✅ Environment variables updated successfully!${NC}"

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
echo -e "${GREEN}🌐 Service URL: ${SERVICE_URL}${NC}"

echo -e "${GREEN}📊 View logs with:${NC}"
echo "gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=50"

echo -e "${GREEN}✨ Update complete! Your app should now be connected to the production database.${NC}"
