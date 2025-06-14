# MySQL Database Integration Guide

## 1. Database Setup

### Create Database Schema
```sql
-- Create database
CREATE DATABASE timeoff_manager;
USE timeoff_manager;

-- Users table
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('employee', 'manager', 'admin') NOT NULL,
  department VARCHAR(100) NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Time off requests table
CREATE TABLE time_off_requests (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type ENUM('paid time off', 'sick leave', 'time edit', 'other') NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by VARCHAR(36),
  rejection_reason TEXT,
  original_clock_in TIME,
  original_clock_out TIME,
  requested_clock_in TIME,
  requested_clock_out TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Notifications table
CREATE TABLE notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 2. Backend Setup

### Install Dependencies
```bash
npm install mysql2 express cors dotenv bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken @types/cors
```

### Environment Variables
Create a `.env` file:
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=timeoff_manager
JWT_SECRET=your_jwt_secret_key
PORT=3001
```

## 3. Database Connection

### Create Database Connection
```typescript
// src/config/database.ts
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'timeoff_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export const pool = mysql.createPool(dbConfig);

export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};
```

## 4. API Routes

### User Routes
```typescript
// src/routes/users.ts
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    const users = rows as any[];
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (for admin)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, department, avatar FROM users'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
```

### Request Routes
```typescript
// src/routes/requests.ts
import express from 'express';
import { pool } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all requests
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        r.*,
        u.name as employee_name,
        u.email as employee_email,
        u.department as employee_department,
        u.avatar as employee_avatar,
        a.name as approved_by_name
      FROM time_off_requests r
      JOIN users u ON r.employee_id = u.id
      LEFT JOIN users a ON r.approved_by = a.id
      ORDER BY r.created_at DESC
    `);
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      type,
      reason,
      originalClockIn,
      originalClockOut,
      requestedClockIn,
      requestedClockOut
    } = req.body;
    
    const requestId = generateId();
    
    await pool.execute(`
      INSERT INTO time_off_requests (
        id, employee_id, start_date, end_date, type, reason,
        original_clock_in, original_clock_out, 
        requested_clock_in, requested_clock_out
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      requestId,
      req.user.userId,
      startDate,
      endDate,
      type,
      reason,
      originalClockIn || null,
      originalClockOut || null,
      requestedClockIn || null,
      requestedClockOut || null
    ]);
    
    res.status(201).json({ message: 'Request created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update request status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    
    await pool.execute(`
      UPDATE time_off_requests 
      SET status = ?, approved_by = ?, rejection_reason = ?
      WHERE id = ?
    `, [status, req.user.userId, rejectionReason || null, id]);
    
    res.json({ message: 'Request updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default router;
```

## 5. Authentication Middleware

```typescript
// src/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};
```

## 6. Express Server Setup

```typescript
// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import userRoutes from './routes/users';
import requestRoutes from './routes/requests';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);

// Test database connection
testConnection();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 7. Frontend API Integration

### Update API Service
```typescript
// src/services/api.ts
const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async login(email: string, password: string) {
    const response = await this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.token = response.token;
    localStorage.setItem('token', response.token);
    
    return response;
  }

  async getRequests() {
    return this.request('/requests');
  }

  async createRequest(requestData: any) {
    return this.request('/requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async updateRequestStatus(id: string, status: string, rejectionReason?: string) {
    return this.request(`/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    });
  }
}

export const apiService = new ApiService();
```

## 8. Update Zustand Stores

### Request Store
```typescript
// src/store/requestStore.ts
import { create } from 'zustand';
import { apiService } from '../services/api';
import { TimeOffRequest, RequestStatus } from '../types/request';

interface RequestState {
  requests: TimeOffRequest[];
  isLoading: boolean;
  error: string | null;
  fetchRequests: () => Promise<void>;
  addRequest: (request: any) => Promise<void>;
  updateRequestStatus: (id: string, status: RequestStatus, rejectionReason?: string) => Promise<void>;
}

export const useRequestStore = create<RequestState>((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,

  fetchRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiService.getRequests();
      set({ requests: data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch requests', isLoading: false });
    }
  },

  addRequest: async (requestData) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.createRequest(requestData);
      await get().fetchRequests(); // Refresh the list
    } catch (error) {
      set({ error: 'Failed to create request', isLoading: false });
      throw error;
    }
  },

  updateRequestStatus: async (id, status, rejectionReason) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.updateRequestStatus(id, status, rejectionReason);
      await get().fetchRequests(); // Refresh the list
    } catch (error) {
      set({ error: 'Failed to update request', isLoading: false });
      throw error;
    }
  },
}));
```

## 9. Deployment Considerations

### Production Environment
- Use environment variables for all sensitive data
- Set up SSL/TLS for secure connections
- Use connection pooling for better performance
- Implement proper error handling and logging
- Set up database backups
- Use a process manager like PM2 for the Node.js server

### Security Best Practices
- Hash passwords with bcrypt
- Use JWT tokens with appropriate expiration
- Implement rate limiting
- Validate and sanitize all inputs
- Use HTTPS in production
- Keep dependencies updated

## 10. Testing

### Database Seeding
```sql
-- Insert test users
INSERT INTO users (id, name, email, password, role, department) VALUES
('1', 'John Doe', 'employee@example.com', '$2a$10$...', 'employee', 'Engineering'),
('2', 'Jane Smith', 'manager@example.com', '$2a$10$...', 'manager', 'Engineering'),
('3', 'Admin User', 'admin@example.com', '$2a$10$...', 'admin', 'IT');
```

This guide provides a complete setup for integrating MySQL with your TimeOff Manager application. The key changes involve moving from localStorage to a proper database with API endpoints for data persistence.