# TimeOff Manager - Single Server Deployment

A complete time-off management system with frontend and backend running on a single server/container.

## 🚀 Quick Start

### Option 1: Docker Deployment (Recommended)

```bash
# Deploy with Docker Compose
npm run deploy:single

# Or manually:
docker-compose -f docker-compose.single.yml up -d
```

### Option 2: Full-Stack Alternative

```bash
# Deploy with full-stack approach
npm run deploy:fullstack

# Or manually:
docker-compose -f docker-compose.fullstack.yml up -d
```

### Option 3: Development Mode

```bash
# Start development server
npm run dev:single
```

### Option 4: Manual Docker

```bash
# Build and run manually
npm run docker:build
npm run docker:run
```

## 📋 Access Information

- **Application**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| 👤 Employee | `employee@example.com` | `password` |
| 👔 Manager | `manager@example.com` | `password` |
| 🔧 Admin | `admin@example.com` | `password` |

## 🏗️ Architecture

```
Single Server/Container
├── Frontend (React + Vite) - Static files served by Express
├── Backend (Express.js + SQLite) - API endpoints
└── Database (SQLite file) - Persistent data storage
```

### Key Features

- **Single Port**: Everything runs on port 3000
- **Unified Deployment**: One container for everything
- **Persistent Data**: SQLite database with volume mounting
- **Health Monitoring**: Built-in health checks
- **Security**: Rate limiting, CORS, and security headers
- **Production Ready**: Optimized builds and error handling

## 🛠️ Management Commands

```bash
# View logs
npm run docker:logs

# Stop application
npm run docker:stop

# Restart application
docker-compose -f docker-compose.single.yml restart

# Access container shell
docker exec -it timeoff-manager sh

# View database
docker exec -it timeoff-manager sqlite3 /app/backend/data/timeoff.db
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### API Status
```bash
curl http://localhost:3000/api/status
```

### Database Status
```bash
# Access database directly
docker exec -it timeoff-manager sqlite3 /app/backend/data/timeoff.db ".tables"
```

## 🔧 Configuration

### Environment Variables

Create `backend/.env` for custom configuration:

```env
# Database
DB_PATH=/app/backend/data/timeoff.db

# Security
JWT_SECRET=your_super_secret_jwt_key_here

# Server
PORT=3000
NODE_ENV=production

# CORS
FRONTEND_URL=http://localhost:3000
```

### Docker Compose Override

Create `docker-compose.override.yml` for custom settings:

```yaml
version: '3.8'
services:
  timeoff-manager:
    ports:
      - "8080:3000"  # Custom port
    environment:
      - JWT_SECRET=your_custom_secret
```

## 📦 Data Persistence

### Database Backup

```bash
# Backup database
docker cp timeoff-manager:/app/backend/data/timeoff.db ./backup-$(date +%Y%m%d).db

# Restore database
docker cp ./backup-20240101.db timeoff-manager:/app/backend/data/timeoff.db
docker-compose -f docker-compose.single.yml restart
```

### Volume Management

```bash
# List volumes
docker volume ls | grep timeoff

# Backup volume
docker run --rm -v timeoff_data:/data -v $(pwd):/backup alpine tar czf /backup/timeoff-data-backup.tar.gz -C /data .

# Restore volume
docker run --rm -v timeoff_data:/data -v $(pwd):/backup alpine tar xzf /backup/timeoff-data-backup.tar.gz -C /data
```

## 🚨 Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker-compose -f docker-compose.single.yml logs

# Check if port is in use
lsof -i :3000
```

**Database issues:**
```bash
# Reset database
docker-compose -f docker-compose.single.yml down
docker volume rm timeoff_data
docker-compose -f docker-compose.single.yml up -d
```

**Permission issues:**
```bash
# Fix permissions
docker exec -it timeoff-manager chown -R node:node /app/backend/data
```

### Debug Mode

Enable debug logging:

```yaml
# In docker-compose.single.yml
environment:
  - NODE_ENV=development
  - DEBUG=true
```

## 🔄 Updates

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and deploy
npm run deploy:single
```

### Update Dependencies

```bash
# Update frontend dependencies
npm update

# Update backend dependencies
cd backend && npm update && cd ..

# Rebuild
npm run docker:build
```

## 🌐 Production Deployment

### Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL/HTTPS Setup

```bash
# Using Let's Encrypt
certbot --nginx -d your-domain.com
```

### Environment Security

```bash
# Generate secure JWT secret
openssl rand -base64 32

# Update production environment
echo "JWT_SECRET=$(openssl rand -base64 32)" >> backend/.env
```

## 📈 Scaling

### Horizontal Scaling

For multiple instances:

```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  timeoff-manager:
    # ... existing config
    deploy:
      replicas: 3
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    # Load balancer configuration
```

### Database Scaling

For high-load scenarios, consider migrating to PostgreSQL:

1. Export SQLite data
2. Set up PostgreSQL container
3. Update backend database configuration
4. Import data to PostgreSQL

## ✅ Verification Checklist

- [ ] Container starts without errors
- [ ] Health check returns 200 OK
- [ ] Frontend loads at http://localhost:3000
- [ ] API responds at http://localhost:3000/api/status
- [ ] Login works with demo accounts
- [ ] Database persists after container restart
- [ ] All features work as expected

---

**Need Help?** Check the logs with `npm run docker:logs` or create an issue for support.