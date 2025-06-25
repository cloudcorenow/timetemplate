#!/bin/bash

# Development script for single-server setup
set -e

echo "🔧 Starting TimeOff Manager in Development Mode..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[DEV]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if backend directory exists
if [ ! -d "backend" ]; then
    print_error "Backend directory not found. This appears to be a frontend-only project."
    print_status "Starting frontend development server instead..."
    
    # Check if frontend dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    print_status "Starting Vite development server..."
    print_success "Server will be available at http://localhost:5173"
    print_status "Press Ctrl+C to stop the server"
    
    npm run dev
    exit 0
fi

# Original backend logic (kept for projects that do have a backend)
# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    print_status "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
fi

# Initialize database if it doesn't exist
if [ ! -f "backend/data/timeoff.db" ]; then
    print_status "Initializing database..."
    cd backend && npm run init-db && cd ..
fi

# Build frontend
print_status "Building frontend..."
npm run build

# Create development server script
cat > dev-server.js << 'EOF'
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: './backend/.env' });

// Import backend routes
const authRoutes = require('./backend/routes/auth');
const requestRoutes = require('./backend/routes/requests');
const notificationRoutes = require('./backend/routes/notifications');
const userRoutes = require('./backend/routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS for development
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK (Development)', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Development server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
EOF

print_status "Starting development server..."
print_success "Server will be available at http://localhost:3000"
print_status "Press Ctrl+C to stop the server"

node dev-server.js