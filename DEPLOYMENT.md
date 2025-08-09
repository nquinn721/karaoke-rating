# Google Cloud Run Deployment Guide

## Prerequisites
1. Google Cloud SDK installed and authenticated
2. Docker installed
3. Your Google Cloud project set up with billing enabled
4. Cloud SQL instance created with MySQL

## Step 1: Set up Google Cloud Project
```bash
# Set your project ID
export PROJECT_ID=your-project-id
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

## Step 2: Set up Cloud SQL Database
If you haven't already created your Cloud SQL instance:

```bash
# Create Cloud SQL instance (if not already created)
gcloud sql instances create karaoke-db \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=europe-west1

# Create database
gcloud sql databases create karaoke --instance=karaoke-db

# Create user (if not already created)
gcloud sql users create karaoke \
    --instance=karaoke-db \
    --password='GC(*g""\\9SH@{vBr'
```

## Step 3: Build and Deploy to Cloud Run

### Option A: Using Cloud Build (Recommended)
```bash
# Build using Cloud Build
gcloud builds submit --tag gcr.io/$PROJECT_ID/karaoke-rating

# Deploy to Cloud Run with environment variables
gcloud run deploy karaoke-rating \
    --image gcr.io/$PROJECT_ID/karaoke-rating \
    --platform managed \
    --region europe-west1 \
    --allow-unauthenticated \
    --set-env-vars="NODE_ENV=production" \
    --set-env-vars="DB_HOST=YOUR_CLOUD_SQL_IP" \
    --set-env-vars="DB_PORT=3306" \
    --set-env-vars="DB_USERNAME=karaoke" \
    --set-env-vars="DB_PASSWORD=GC(*g""\\9SH@{vBr" \
    --set-env-vars="DB_DATABASE=karaoke" \
    --port=3000 \
    --memory=1Gi \
    --cpu=1 \
    --max-instances=10
```

### Option B: Using Docker locally then push
```bash
# Build Docker image
docker build -t gcr.io/$PROJECT_ID/karaoke-rating .

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/karaoke-rating

# Deploy (same as above)
```

## Step 4: Set up Cloud SQL Connection

### Option A: Public IP (Current setup)
1. Get your Cloud SQL instance's public IP:
```bash
gcloud sql instances describe karaoke-db --format="value(ipAddresses[0].ipAddress)"
```

2. Update the DB_HOST environment variable with this IP:
```bash
gcloud run services update karaoke-rating \
    --region=europe-west1 \
    --set-env-vars="DB_HOST=YOUR_ACTUAL_IP_HERE"
```

### Option B: Private IP with VPC (More secure, optional)
```bash
# Create VPC connector (optional, for private connection)
gcloud compute networks vpc-access connectors create karaoke-connector \
    --region=europe-west1 \
    --subnet=default \
    --subnet-project=$PROJECT_ID \
    --min-instances=2 \
    --max-instances=3

# Deploy with VPC connector
gcloud run deploy karaoke-rating \
    --image gcr.io/$PROJECT_ID/karaoke-rating \
    --platform managed \
    --region europe-west1 \
    --vpc-connector=karaoke-connector \
    --set-env-vars="DB_HOST=PRIVATE_IP_OF_CLOUD_SQL"
```

## Step 5: Set up Secrets (Alternative to env vars)
For better security, you can use Google Secret Manager:

```bash
# Create secrets
echo -n 'GC(*g""\\9SH@{vBr' | gcloud secrets create db-password --data-file=-

# Deploy with secrets
gcloud run deploy karaoke-rating \
    --image gcr.io/$PROJECT_ID/karaoke-rating \
    --platform managed \
    --region europe-west1 \
    --set-env-vars="NODE_ENV=production,DB_HOST=YOUR_IP,DB_PORT=3306,DB_USERNAME=karaoke,DB_DATABASE=karaoke" \
    --set-secrets="DB_PASSWORD=db-password:latest"
```

## Step 6: Verify Deployment
```bash
# Get service URL
gcloud run services describe karaoke-rating --region=europe-west1 --format="value(status.url)"

# Test the service
curl https://your-service-url.run.app
```

## Environment Variables Summary
For your current deployment at `karaoke-rating-203453576607.europe-west1.run.app`, set these:

- `NODE_ENV=production`
- `DB_HOST=<your-cloud-sql-ip>`
- `DB_PORT=3306`
- `DB_USERNAME=karaoke`
- `DB_PASSWORD=GC(*g""\\9SH@{vBr`
- `DB_DATABASE=karaoke`

## Quick Update Command
To update your existing service with the correct environment variables:

```bash
gcloud run services update karaoke-rating \
    --region=europe-west1 \
    --set-env-vars="NODE_ENV=production,DB_HOST=YOUR_CLOUD_SQL_IP,DB_PORT=3306,DB_USERNAME=karaoke,DB_PASSWORD=GC(*g\"\"\\9SH@{vBr,DB_DATABASE=karaoke"
```

Replace `YOUR_CLOUD_SQL_IP` with your actual Cloud SQL instance IP address.
