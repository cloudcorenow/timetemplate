# Cloudflare D1 + Workers Deployment Guide

## 🌟 Full Cloudflare Stack

Your TimeOff Manager can now run entirely on Cloudflare's edge network:

- **Frontend**: Served by Cloudflare Workers
- **Backend API**: Cloudflare Workers (Hono framework)
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Authentication**: JWT tokens
- **Global CDN**: Automatic edge caching

## 🚀 Quick Deployment

```bash
# Deploy everything to Cloudflare
npm run deploy:cloudflare
```

This will:
1. Create a Cloudflare D1 database
2. Build your React application
3. Deploy Workers with integrated API
4. Set up sample data automatically

## 🏗️ Architecture

```
Cloudflare Edge Network
├── Workers (API + Static Files)
├── D1 Database (SQLite)
└── Global CDN Distribution
```

### Benefits

- **⚡ Ultra-fast**: Edge computing worldwide
- **💰 Cost-effective**: Pay-per-request pricing
- **🔒 Secure**: Built-in DDoS protection
- **🌍 Global**: Automatic worldwide distribution
- **📈 Scalable**: Handles millions of requests

## 🛠️ Development Workflow

### Local Development

```bash
# Start local development server
npm run cf:dev
```

This runs:
- Local D1 database
- Workers runtime simulation
- Hot reload for changes

### Database Management

```bash
# Create database
npm run cf:db:create

# Execute SQL locally
npm run cf:db:local

# Execute SQL on production
npm run cf:db:remote

# Interactive console
wrangler d1 execute timeoff-manager-db --command="SELECT * FROM users"
```

### Deployment

```bash
# Deploy to production
npm run cf:deploy

# View live logs
wrangler tail

# Check deployment status
wrangler deployments list
```

## 📊 Database Schema

Your existing SQLite schema works perfectly with D1:

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK(role IN ('employee', 'manager', 'admin')),
  department TEXT NOT NULL,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Time off requests
CREATE TABLE time_off_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  -- ... other fields
);

-- Notifications
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

Set in Cloudflare dashboard or via CLI:

```bash
# Set production variables
wrangler secret put JWT_SECRET
wrangler secret put NODE_ENV
```

### Custom Domain

1. Add domain in Cloudflare dashboard
2. Update Workers route
3. SSL automatically configured

### Rate Limiting

Built into Workers:

```javascript
// Automatic rate limiting per IP
// Configurable in wrangler.toml
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configurable origins
- **DDoS Protection**: Built-in Cloudflare security
- **SQL Injection Prevention**: Prepared statements
- **Rate Limiting**: Automatic per-IP limits

## 📈 Monitoring & Analytics

### Built-in Analytics

- Request volume
- Response times
- Error rates
- Geographic distribution

### Custom Logging

```javascript
// In your worker
console.log('Custom log message')
// View with: wrangler tail
```

### Performance Monitoring

```bash
# View real-time metrics
wrangler analytics

# Historical data
wrangler analytics --since 7d
```

## 💰 Pricing

Cloudflare Workers + D1 pricing:

- **Workers**: 100,000 requests/day free
- **D1**: 5M reads, 100K writes/day free
- **Bandwidth**: Unlimited
- **Storage**: 5GB free

Perfect for small to medium applications!

## 🔄 Migration from Other Platforms

### From Railway/Render

1. Export your SQLite database
2. Import to D1: `wrangler d1 execute --file=backup.sql`
3. Update environment variables
4. Deploy: `npm run cf:deploy`

### From Traditional Hosting

1. Your existing SQLite database works as-is
2. API routes convert to Workers functions
3. Static files served by Workers
4. No server management needed

## 🚨 Troubleshooting

### Common Issues

**Database not found:**
```bash
# Recreate database
wrangler d1 create timeoff-manager-db
# Update wrangler.toml with new database_id
```

**Build errors:**
```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

**Authentication issues:**
```bash
# Check JWT secret
wrangler secret list
wrangler secret put JWT_SECRET
```

### Debug Mode

```bash
# Local development with debugging
wrangler dev --local --persist
```

### Logs

```bash
# Real-time logs
wrangler tail

# Filter logs
wrangler tail --format=pretty --search="error"
```

## 🎯 Production Checklist

- [ ] Database created and configured
- [ ] JWT secret set in production
- [ ] Custom domain configured (optional)
- [ ] Rate limiting configured
- [ ] Analytics enabled
- [ ] Backup strategy in place
- [ ] Monitoring alerts set up

## 🔄 Backup & Recovery

### Database Backup

```bash
# Export database
wrangler d1 export timeoff-manager-db --output=backup.sql

# Restore database
wrangler d1 execute timeoff-manager-db --file=backup.sql
```

### Automated Backups

Set up scheduled Workers for automatic backups:

```javascript
// Scheduled backup worker
export default {
  async scheduled(event, env, ctx) {
    // Backup logic here
  }
}
```

## 🌟 Advanced Features

### Edge Caching

```javascript
// Cache API responses
const cache = caches.default
const cacheKey = new Request(url, request)
let response = await cache.match(cacheKey)

if (!response) {
  response = await fetch(request)
  ctx.waitUntil(cache.put(cacheKey, response.clone()))
}
```

### Geographic Routing

```javascript
// Route based on user location
const country = request.cf.country
if (country === 'US') {
  // US-specific logic
}
```

### A/B Testing

```javascript
// Built-in A/B testing
const variant = Math.random() < 0.5 ? 'A' : 'B'
```

## ✅ Verification

After deployment, verify:

1. **Frontend loads**: Visit your Workers URL
2. **API works**: Check `/health` endpoint
3. **Database connected**: Login with demo accounts
4. **Authentication**: JWT tokens working
5. **CRUD operations**: Create/read/update requests
6. **Real-time updates**: Notifications working

---

**Your TimeOff Manager is now running on Cloudflare's global edge network! 🌍⚡**