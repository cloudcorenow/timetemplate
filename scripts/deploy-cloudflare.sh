#!/bin/bash

# Cloudflare D1 + Workers deployment script
set -e

echo "☁️ Deploying TimeOff Manager to Cloudflare (D1 + Workers)..."

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

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    print_status "Please login to Cloudflare..."
    wrangler login
fi

# Build the application first
print_status "Building application for Cloudflare Workers..."
npm run build

# Check if D1 database exists, create if not
print_status "Setting up Cloudflare D1 database..."
DB_LIST=$(wrangler d1 list 2>/dev/null || echo "")

if [[ $DB_LIST == *"timeoff-manager-db"* ]]; then
    print_success "Database 'timeoff-manager-db' already exists"
    # Extract database ID from list
    DB_ID=$(echo "$DB_LIST" | grep "timeoff-manager-db" | awk '{print $1}')
else
    print_status "Creating new D1 database..."
    DB_OUTPUT=$(wrangler d1 create timeoff-manager-db)
    
    if [[ $DB_OUTPUT == *"database_id"* ]]; then
        # Extract database ID from output
        DB_ID=$(echo "$DB_OUTPUT" | grep -o '"database_id": "[^"]*"' | cut -d'"' -f4)
        print_success "Database created with ID: $DB_ID"
    else
        print_error "Failed to create database"
        exit 1
    fi
fi

# Update wrangler.toml with the database ID if needed
if [[ $DB_ID != "" ]]; then
    if grep -q "your-database-id-will-be-generated" wrangler.toml; then
        sed -i.bak "s/database_id = \"your-database-id-will-be-generated\"/database_id = \"$DB_ID\"/" wrangler.toml
        print_status "Updated wrangler.toml with database ID: $DB_ID"
    fi
fi

# Initialize database schema
print_status "Initializing database schema..."
wrangler d1 execute timeoff-manager-db --file=./schema.sql

# Deploy to Cloudflare Workers
print_status "Deploying to Cloudflare Workers..."
wrangler deploy

# Get the deployment URL
WORKER_URL=$(wrangler deployments list --name timeoff-manager 2>/dev/null | head -2 | tail -1 | awk '{print $4}' || echo "")

print_success "Deployment complete!"
echo ""
echo "🌐 Your TimeOff Manager is now live on Cloudflare!"
echo ""
if [[ $WORKER_URL != "" ]]; then
    echo "🔗 Application URL: $WORKER_URL"
else
    echo "🔗 Application URL: https://timeoff-manager.your-subdomain.workers.dev"
fi
echo "📊 Health Check: Add /health to your URL"
echo "🔧 API Endpoints: Add /api/* to your URL"
echo ""
echo "🗄️ Database: Cloudflare D1 (SQLite-compatible)"
echo "⚡ Runtime: Cloudflare Workers (Global Edge Network)"
echo "🌍 CDN: Automatic worldwide distribution"
echo ""
echo "📋 Demo Accounts:"
echo "   👤 Employee: employee@example.com / password"
echo "   👔 Manager:  manager@example.com / password"
echo "   🔧 Admin:    admin@example.com / password"
echo ""
echo "🛠️ Management Commands:"
echo "   Local dev:    npm run cf:dev"
echo "   View logs:    wrangler tail"
echo "   DB console:   wrangler d1 execute timeoff-manager-db --command='SELECT * FROM users'"
echo "   Redeploy:     npm run cf:deploy"
echo ""
echo "💰 Pricing: Generous free tier (100K requests/day, 5M DB reads/day)"
echo ""
print_success "Your app is running on Cloudflare's global edge network! 🚀"