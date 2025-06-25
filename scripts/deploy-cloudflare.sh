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

# Login to Cloudflare (if not already logged in)
if ! wrangler whoami &> /dev/null; then
    print_status "Please login to Cloudflare..."
    wrangler login
fi

# Create D1 database if it doesn't exist
print_status "Setting up Cloudflare D1 database..."
DB_OUTPUT=$(wrangler d1 create timeoff-manager-db 2>/dev/null || echo "Database might already exist")

if [[ $DB_OUTPUT == *"database_id"* ]]; then
    # Extract database ID from output
    DB_ID=$(echo "$DB_OUTPUT" | grep -o '"database_id": "[^"]*"' | cut -d'"' -f4)
    print_success "Database created with ID: $DB_ID"
    
    # Update wrangler.toml with the database ID
    sed -i.bak "s/database_id = \"your-database-id-will-be-generated\"/database_id = \"$DB_ID\"/" wrangler.toml
    print_status "Updated wrangler.toml with database ID"
else
    print_warning "Database might already exist or there was an issue creating it"
fi

# Build the application
print_status "Building application for Cloudflare Workers..."
npm run build

# Copy built assets to worker directory
mkdir -p src/assets
cp -r dist/* src/

# Deploy to Cloudflare Workers
print_status "Deploying to Cloudflare Workers..."
wrangler deploy

print_success "Deployment complete!"
echo ""
echo "🌐 Your application should be available at:"
echo "   https://timeoff-manager.your-subdomain.workers.dev"
echo ""
echo "🗄️ Database: Cloudflare D1"
echo "⚡ Runtime: Cloudflare Workers"
echo "🔧 API: Integrated with Workers"
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