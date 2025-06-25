#!/bin/bash

# Full-stack deployment script
echo "🚀 Deploying TimeOff Manager (Full-Stack)..."

# Build the full-stack image
echo "📦 Building full-stack Docker image..."
docker build -f Dockerfile.fullstack -t timeoff-fullstack:latest .

# Stop existing container
echo "🛑 Stopping existing container..."
docker stop timeoff-fullstack 2>/dev/null || true
docker rm timeoff-fullstack 2>/dev/null || true

# Start new container
echo "▶️ Starting new container..."
docker-compose -f docker-compose.fullstack.yml up -d

# Show status
echo "✅ Deployment complete!"
echo "🌐 Application available at: http://localhost:3000"
echo "📊 Health check: http://localhost:3000/health"
echo "🔧 API endpoints: http://localhost:3000/api/*"

# Show logs
echo "📋 Container logs:"
docker logs timeoff-fullstack --tail 20