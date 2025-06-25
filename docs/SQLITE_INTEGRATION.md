# SQLite Backend Integration Guide

This guide will walk you through connecting your frontend to the SQLite backend when you're ready to move from mock data to a real database.

## 🚀 Quick Start

### 1. Start the Backend Server

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Initialize the database with sample data
npm run init-db

# Start the development server
npm run dev
```

The backend will be running at `http://localhost:3001`

### 2. Update Frontend Environment

Create or update your frontend `.env` file:

```env
# Frontend Environment Variables
VITE_API_URL=http://localhost:3001/api
```

### 3. Switch Authentication System

Update `src/context/AuthContext.tsx` to use the real API:

```typescript
// Replace the mock login function with:
const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await apiService.login(email, password);
    setUser(response.user);
    return true;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
};
```

### 4. Switch Request Store to API

Update `src/store/requestStore.ts` to use real API calls:

```typescript
// Replace the mock functions with API calls:
fetchRequests: async () => {
  set({ isLoading: true, error: null });
  try {
    const requests = await apiService.getRequests();
    const transformedRequests = requests.map((request: any) => ({
      ...request,
      startDate: new Date(request.startDate),
      endDate: new Date(request.endDate),
      createdAt: new Date(request.createdAt),
      updatedAt: new Date(request.updatedAt)
    }));
    set({ requests: transformedRequests, isLoading: false });
  } catch (error) {
    console.error('Error fetching requests:', error);
    set({ error: 'Failed to fetch requests', isLoading: false });
  }
},
```

### 5. Switch Notification Store to API

Update `src/store/notificationStore.ts` to use real API calls:

```typescript
// Replace the mock functions with API calls:
fetchNotifications: async () => {
  set({ isLoading: true });
  try {
    const notifications = await apiService.getNotifications();
    const transformedNotifications = notifications.map((notification: any) => ({
      ...notification,
      createdAt: new Date(notification.createdAt)
    }));
    set({ 
      notifications: transformedNotifications,
      unreadCount: transformedNotifications.filter((n: Notification) => !n.read).length,
      isLoading: false 
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    set({ isLoading: false });
  }
},
```

## 📋 Demo Accounts

The backend comes with the same demo accounts as your mock data:

| Role | Email | Password |
|------|-------|----------|
| Employee | `employee@example.com` | `password` |
| Manager | `manager@example.com` | `password` |
| Admin | `admin@example.com` | `password` |

## 🔄 Step-by-Step Migration

### Phase 1: Backend Setup (5 minutes)
1. Install backend dependencies
2. Initialize database
3. Start backend server
4. Test API endpoints

### Phase 2: Authentication (10 minutes)
1. Update AuthContext to use real API
2. Test login with demo accounts
3. Verify JWT token handling
4. Test avatar updates

### Phase 3: Requests (15 minutes)
1. Update RequestStore to use API
2. Test fetching requests
3. Test creating new requests
4. Test status updates (manager/admin)

### Phase 4: Notifications (10 minutes)
1. Update NotificationStore to use API
2. Test notification fetching
3. Test marking as read
4. Test real-time updates

### Phase 5: Testing & Cleanup (10 minutes)
1. Test all user roles
2. Test all request types
3. Remove localStorage fallbacks
4. Clean up mock data imports

## 🛠 API Endpoints Reference

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/avatar` - Update avatar

### Requests
- `GET /api/requests` - Get requests (filtered by role)
- `POST /api/requests` - Create new request
- `PATCH /api/requests/:id/status` - Update status

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/unread-count` - Get unread count

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/team` - Get team members

## 🔧 Configuration Options

### Environment Variables

**Backend (.env):**
```env
DB_PATH=./data/timeoff.db
JWT_SECRET=your_super_secret_jwt_key_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001/api
```

### CORS Configuration

The backend is pre-configured for development. For production:

```javascript
// In backend/server.js
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://your-production-domain.com',
  credentials: true,
  optionsSuccessStatus: 200
};
```

## 🚨 Troubleshooting

### Common Issues

**1. CORS Errors**
- Ensure backend FRONTEND_URL matches your frontend URL
- Check that credentials are included in requests

**2. Authentication Failures**
- Verify JWT_SECRET is set in backend .env
- Check token storage in localStorage
- Ensure API service is setting Authorization headers

**3. Database Issues**
- Run `npm run init-db` to reset database
- Check that data directory exists and is writable
- Verify SQLite3 is properly installed

**4. API Connection Issues**
- Ensure backend server is running on correct port
- Check VITE_API_URL in frontend .env
- Verify network connectivity

### Debug Mode

Enable debug logging in the backend:

```env
NODE_ENV=development
DEBUG=true
```

### Reset Everything

To start fresh:

```bash
# Backend
cd backend
rm -f ./data/timeoff.db
npm run init-db

# Frontend
# Clear localStorage in browser dev tools
localStorage.clear()
```

## 📊 Data Migration

If you have custom data in localStorage:

```javascript
// Export current localStorage data
const requests = JSON.parse(localStorage.getItem('timeoff_requests') || '[]');
const notifications = JSON.parse(localStorage.getItem('timeoff_notifications') || '[]');

// Save to file for manual import if needed
console.log('Requests:', JSON.stringify(requests, null, 2));
console.log('Notifications:', JSON.stringify(notifications, null, 2));
```

## 🎯 Production Deployment

### Backend Deployment
1. Set production environment variables
2. Use a process manager (PM2)
3. Set up SSL/HTTPS
4. Configure proper CORS origins
5. Set up database backups

### Frontend Deployment
1. Update VITE_API_URL to production backend
2. Build with `npm run build`
3. Deploy static files
4. Configure reverse proxy if needed

## ✅ Verification Checklist

- [ ] Backend server starts without errors
- [ ] Database initializes with sample data
- [ ] Login works with demo accounts
- [ ] Requests load and display correctly
- [ ] New requests can be created
- [ ] Manager/admin can approve/reject requests
- [ ] Notifications work properly
- [ ] Avatar updates work
- [ ] All user roles function correctly
- [ ] No console errors in browser
- [ ] API responses match expected format

## 🔄 Rollback Plan

If you need to rollback to mock data:

1. Stop the backend server
2. Revert the store files to use localStorage
3. Revert AuthContext to use mock authentication
4. Clear any API tokens from localStorage

The mock data system will continue working as before.

---

**Need Help?** Check the backend README.md for additional details or create an issue if you encounter problems during integration.