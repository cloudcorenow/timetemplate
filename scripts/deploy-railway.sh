#!/bin/bash

# Railway deployment script
set -e

echo "🚂 Deploying TimeOff Manager to Railway..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_status "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
if ! railway whoami &> /dev/null; then
    print_status "Please login to Railway..."
    railway login
fi

# Create railway.json configuration
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.single"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

# Create .railwayignore
cat > .railwayignore << 'EOF'
node_modules
.git
.env
*.log
coverage
.nyc_output
docs/
*.md
.vscode
.idea
EOF

print_status "Deploying to Railway..."
railway up

print_success "Deployment initiated!"
echo ""
print_warning "⚠️  Important: Set these environment variables in Railway dashboard:"
echo "   NODE_ENV=production"
echo "   JWT_SECRET=your_secure_secret_here"
echo "   PORT=3000"
echo ""
print_status "Visit Railway dashboard to:"
echo "1. Set environment variables"
echo "2. Get your deployment URL"
echo "3. Monitor deployment progress"
echo ""
print_status "Railway dashboard: https://railway.app/dashboard"