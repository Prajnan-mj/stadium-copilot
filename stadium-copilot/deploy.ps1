# Stadium Copilot — Cloud Run deployment script
# Run this after: gcloud auth login && gcloud config set project YOUR_PROJECT_ID

$ErrorActionPreference = "Stop"
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")

$REGION = "asia-south1"
$SERVICE = "stadium-copilot"
# Read the key from the environment — never hardcode secrets in a tracked file.
# Set it first:  $env:NVIDIA_API_KEY = "nvapi-..."   (or load from .env)
$NVIDIA_KEY = $env:NVIDIA_API_KEY
if ([string]::IsNullOrWhiteSpace($NVIDIA_KEY)) {
    Write-Error "NVIDIA_API_KEY env var is not set. Run: `$env:NVIDIA_API_KEY = 'nvapi-...'`"
    exit 1
}

Write-Host "=== Stadium Copilot Deploy ===" -ForegroundColor Cyan

# 1. Ensure Secret Manager has the key
Write-Host "`n[1/3] Storing NVIDIA API key in Secret Manager..." -ForegroundColor Yellow
$existing = gcloud secrets describe NVIDIA_API_KEY 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating new secret NVIDIA_API_KEY"
    $NVIDIA_KEY | gcloud secrets create NVIDIA_API_KEY --data-file=- --replication-policy=automatic
} else {
    Write-Host "Updating existing secret NVIDIA_API_KEY"
    $NVIDIA_KEY | gcloud secrets versions add NVIDIA_API_KEY --data-file=-
}

# 2. Enable required APIs
Write-Host "`n[2/3] Enabling Cloud Run + Cloud Build + Secret Manager APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com

# 3. Deploy
Write-Host "`n[3/3] Deploying to Cloud Run ($REGION)..." -ForegroundColor Yellow
$PROJECT = gcloud config get-value project
Write-Host "Project: $PROJECT"

gcloud run deploy $SERVICE `
    --source . `
    --region $REGION `
    --allow-unauthenticated `
    --min-instances 1 `
    --memory 512Mi `
    --cpu 1 `
    --timeout 60 `
    --set-env-vars "DEMO_MODE=1,SIM_SEED=26" `
    --set-secrets "NVIDIA_API_KEY=NVIDIA_API_KEY:latest"

Write-Host "`n=== Done! ===" -ForegroundColor Green
Write-Host "Get your live URL:"
gcloud run services describe $SERVICE --region $REGION --format "value(status.url)"
