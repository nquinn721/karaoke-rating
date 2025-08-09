## Environment Variables for Cloud Run Service: karaoke-rating

### To add these manually in the Cloud Console:

1. Go to https://console.cloud.google.com/run/detail/us-east1/karaoke-rating/revisions
2. Click "Edit & Deploy New Revision"
3. Go to the "Variables & Secrets" tab
4. Click "Add variable" for each of the following:

**Environment Variables:**

| Name | Value |
|------|--------|
| NODE_ENV | production |
| DB_HOST | /cloudsql/heroic-footing-460117-k8:us-central1:stocktrader |
| DB_PORT | 3306 |
| DB_USERNAME | karaoke |
| DB_PASSWORD | GC(*g""9SH@{vBr |
| DB_DATABASE | karaoke |

**Cloud SQL Connection:**
- Instance: heroic-footing-460117-k8:us-central1:stocktrader

**Container Port:** 8080

### Alternative: Use gcloud command (all at once)
```bash
gcloud run services update karaoke-rating \
    --region=us-east1 \
    --set-env-vars="NODE_ENV=production,DB_HOST=/cloudsql/heroic-footing-460117-k8:us-central1:stocktrader,DB_PORT=3306,DB_USERNAME=karaoke,DB_PASSWORD=GC(*g\"\"9SH@{vBr,DB_DATABASE=karaoke" \
    --add-cloudsql-instances=heroic-footing-460117-k8:us-central1:stocktrader
```

After setting these variables, the service should be able to connect to the Cloud SQL database and your API endpoints should work properly.
