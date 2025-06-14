# TimeOff Manager Backend API

This is the backend API server for the TimeOff Manager application, designed to connect to a MySQL database.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
Copy the example environment file and configure it:
```bash
cp .env.example .env
```

Edit the `.env` file with your MySQL database credentials:
```env
# Database Configuration
DB_HOST=10.0.20.3
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=timeoff_manager

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 3. Database Setup
Make sure your MySQL database is set up with the schema from the migration file. The database should be accessible at `10.0.20.3:3306`.

### 4. Start the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/avatar` - Update user avatar

### Requests
- `GET /api/requests` - Get time off requests (filtered by role)
- `POST /api/requests` - Create new request
- `PATCH /api/requests/:id/status` - Update request status (manager/admin only)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all notifications as read
- `GET /api/notifications/unread-count` - Get unread notification count

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/team` - Get team members (manager/admin)

### Health Check
- `GET /health` - Server health status

## Security Features

- JWT authentication
- Rate limiting (100 requests per 15 minutes per IP)
- CORS protection
- Helmet security headers
- Input validation
- SQL injection prevention (parameterized queries)

## Database Connection

The server automatically tests the database connection on startup. If the connection fails, the server will exit with an error code.

## Error Handling

All endpoints include proper error handling with appropriate HTTP status codes and error messages.