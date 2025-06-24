# TimeOff Manager Backend API

This is the backend API server for the TimeOff Manager application, now using SQLite for easy setup and development.

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

Edit the `.env` file with your configuration:
```env
# Database Configuration
DB_PATH=./data/timeoff.db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 3. Initialize Database
Run the database initialization script to create tables and sample data:
```bash
npm run init-db
```

This will:
- Create the SQLite database file
- Set up all required tables
- Insert sample users and data
- Display available test accounts

### 4. Start the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

## Database

### SQLite Benefits
- **Zero Setup**: No database server installation required
- **File-based**: Database stored in a single file (`./data/timeoff.db`)
- **Portable**: Easy to backup, copy, or reset
- **Production Ready**: Used by major applications

### Sample Accounts
After running `npm run init-db`, you can use these test accounts:

- **Employee**: `employee@example.com` / `password`
- **Manager**: `manager@example.com` / `password`  
- **Admin**: `admin@example.com` / `password`

### Database Location
The SQLite database file is stored at `./data/timeoff.db` by default. You can change this by setting the `DB_PATH` environment variable.

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

## Database Management

### Reset Database
To reset the database and start fresh:
```bash
rm -f ./data/timeoff.db
npm run init-db
```

### Backup Database
Simply copy the database file:
```bash
cp ./data/timeoff.db ./data/timeoff-backup.db
```

### View Database
You can use any SQLite browser or command line tool:
```bash
sqlite3 ./data/timeoff.db
.tables
.schema users
SELECT * FROM users;
```

## Migration from MySQL

This version has been converted from MySQL to SQLite with the following changes:
- Replaced `mysql2` with `sqlite3`
- Updated SQL syntax for SQLite compatibility
- Simplified database connection (no server required)
- Maintained all existing functionality

The API endpoints and frontend remain unchanged, making this a drop-in replacement.