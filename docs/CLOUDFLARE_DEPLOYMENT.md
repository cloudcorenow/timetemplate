# Cloudflare Deployment Guide

## ⚠️ Important Limitation

**Cloudflare Workers/Pages cannot run your full-stack application directly** because:

1. **No Database Support**: Cloudflare Workers don't support SQLite or traditional databases
2. **No File System**: Cannot persist data to local files
3. **Serverless Only**: Designed for stateless functions, not full applications

## 🎯 Recommended Deployment Strategy

### Option 1: Split Deployment (Recommended)

**Frontend**: Cloudflare Pages
**Backend**: Railway, Render, or Heroku

#### Step 1: Deploy Backend to Railway

1. Create account at [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy only the `backend` folder
4. Set environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your_secure_secret_here
   PORT=3001
   ```

#### Step 2: Deploy Frontend to Cloudflare Pages

1. Update your environment:
   ```bash
   # Create .env.production
   echo "VITE_API_URL=https://your-backend.railway.app/api" > .env.production
   ```

2. Deploy to Cloudflare:
   ```bash
   npm run deploy:cloudflare
   ```

### Option 2: Alternative Platforms

Instead of Cloudflare, consider these full-stack friendly platforms:

#### Railway (Recommended)
```bash
# Deploy entire application
npm run deploy:railway
```

#### Render
```bash
# Deploy with Docker
npm run deploy:render
```

#### Heroku
```bash
# Deploy with buildpacks
npm run deploy:heroku
```

## 🔧 Cloudflare Pages Setup (Frontend Only)

If you want to use Cloudflare Pages for the frontend:

### 1. Build Configuration

```bash
# Build command
npm run build

# Output directory
dist

# Environment variables
VITE_API_URL=https://your-backend-api.com/api
```

### 2. Deploy Script

```bash
npm run deploy:cloudflare
```

### 3. Custom Domain (Optional)

1. Go to Cloudflare Pages dashboard
2. Add custom domain
3. Update DNS records

## 🚀 Full-Stack Alternatives

### Railway Deployment

```yaml
# railway.json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.single"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/health"
  }
}
```

### Render Deployment

```yaml
# render.yaml
services:
  - type: web
    name: timeoff-manager
    env: docker
    dockerfilePath: ./Dockerfile.single
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
```

### Heroku Deployment

```json
// package.json
{
  "scripts": {
    "start": "node server.js",
    "heroku-postbuild": "npm run build"
  }
}
```

## 🔄 Migration from Cloudflare

If you started with Cloudflare and want to move to a full-stack platform:

1. **Export your data** (if any was created)
2. **Choose a new platform** (Railway recommended)
3. **Update environment variables**
4. **Deploy using single-server approach**

## 💡 Why Not Cloudflare Workers?

Cloudflare Workers are excellent for:
- ✅ API endpoints
- ✅ Edge functions
- ✅ Static site generation
- ✅ Serverless functions

But not suitable for:
- ❌ Database applications
- ❌ File system operations
- ❌ Long-running processes
- ❌ Traditional web servers

## 🎯 Recommended Next Steps

1. **Stop the Cloudflare deployment**
2. **Choose Railway for full-stack deployment**:
   ```bash
   npm run deploy:railway
   ```
3. **Or split the deployment**:
   - Backend → Railway/Render/Heroku
   - Frontend → Cloudflare Pages

Would you like me to help you set up deployment for Railway or another platform instead?