#!/bin/bash

# Mobile app setup script for Capacitor
set -e

echo "📱 Setting up TimeOff Manager for mobile development..."

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

# Check if we're in the right directory
if [ ! -f "capacitor.config.ts" ]; then
    print_error "capacitor.config.ts not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
print_status "Installing Capacitor dependencies..."
npm install

# Build the web app
print_status "Building web application..."
npm run build

# Check if iOS platform exists, if not add it
if [ ! -d "ios" ]; then
    print_status "Adding iOS platform..."
    npx cap add ios
    print_success "iOS platform added"
else
    print_status "iOS platform already exists"
fi

# Sync all platforms
print_status "Syncing Capacitor platforms..."
npx cap sync

print_success "Mobile setup completed!"
echo ""
print_status "Next steps:"
echo "  📱 For Android development:"
echo "    1. Install Android Studio"
echo "    2. Run: npm run mobile:android"
echo ""
echo "  🍎 For iOS development:"
echo "    1. Install Xcode (macOS only)"
echo "    2. Run: npm run mobile:ios"
echo ""
echo "  🔄 To rebuild and sync:"
echo "    npm run mobile:build"
echo ""
echo "  📱 To run on device:"
echo "    npm run mobile:run:android"
echo "    npm run mobile:run:ios"
echo ""
print_warning "Note: iOS development requires macOS and Xcode"
print_warning "Android development requires Android Studio"