#!/bin/bash

# Cloudflare Pages deployment script
set -e

echo "☁️ Deploying TimeOff Manager to Cloudflare Pages..."

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

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_status "Installing Wrangler CLI..."
    npm install -g wrangler
fi

# Build the application
print_status "Building application for production..."
npm run build

# Copy redirects file to dist
cp _redirects dist/

print_warning "⚠️  IMPORTANT: This deploys only the frontend to Cloudflare Pages."
print_warning "⚠️  The backend API will NOT be available on Cloudflare Workers."
print_warning "⚠️  You'll need to deploy the backend separately (e.g., Railway, Render, Heroku)."
echo ""

# Deploy to Cloudflare Pages
print_status "Deploying to Cloudflare Pages..."
wrangler pages deploy dist --project-name timeoff-manager

print_success "Frontend deployed to Cloudflare Pages!"
echo ""
echo "🌐 Your application should be available at:"
echo "   https://timeoff-manager.pages.dev"
echo ""
echo "⚠️  Next Steps:"
echo "1. Deploy your backend API to a service like Railway, Render, or Heroku"
echo "2. Update VITE_API_URL in your environment to point to your backend"
echo "3. Rebuild and redeploy the frontend with the correct API URL"