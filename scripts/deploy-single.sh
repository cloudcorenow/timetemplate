#!/bin/bash

# Single-server deployment script
set -e

echo "🚀 Deploying TimeOff Manager (Single Server)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install it and try again."
    exit 1
fi

print_status "Building TimeOff Manager image..."
docker build -f Dockerfile.single -t timeoff-manager:latest . || {
    print_error "Failed to build Docker image"
    exit 1
}

print_status "Stopping existing container..."
docker-compose -f docker-compose.single.yml down 2>/dev/null || true

print_status "Starting new container..."
docker-compose -f docker-compose.single.yml up -d || {
    print_error "Failed to start container"
    exit 1
}

# Wait for container to be ready
print_status "Waiting for container to be ready..."
sleep 10

# Check if container is running
if docker-compose -f docker-compose.single.yml ps | grep -q "Up"; then
    print_success "Container is running!"
else
    print_error "Container failed to start"
    print_status "Container logs:"
    docker-compose -f docker-compose.single.yml logs
    exit 1
fi

# Test health endpoint
print_status "Testing health endpoint..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "Health check passed!"
else
    print_warning "Health check failed, but container is running. It might still be starting up."
fi

print_success "Deployment complete!"
echo ""
echo "🌐 Application URL: http://localhost:3000"
echo "📡 API Base URL: http://localhost:3000/api"
echo "📊 Health Check: http://localhost:3000/health"
echo "🔧 API Status: http://localhost:3000/api/status"
echo ""
echo "📋 Demo Accounts:"
echo "   👤 Employee: employee@example.com / password"
echo "   👔 Manager:  manager@example.com / password"
echo "   🔧 Admin:    admin@example.com / password"
echo ""
echo "🛠️ Management Commands:"
echo "   View logs:    docker-compose -f docker-compose.single.yml logs -f"
echo "   Stop:         docker-compose -f docker-compose.single.yml down"
echo "   Restart:      docker-compose -f docker-compose.single.yml restart"
echo "   Shell access: docker exec -it timeoff-manager sh"
echo ""

# Show recent logs
print_status "Recent container logs:"
docker-compose -f docker-compose.single.yml logs --tail 20