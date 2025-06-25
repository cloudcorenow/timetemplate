import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import { serveStatic } from 'hono/cloudflare-workers'
import bcrypt from 'bcryptjs'

const app = new Hono()

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Serve static files (your React app)
app.use('/*', serveStatic({ root: './' }))

// Database initialization
async function initDatabase(db) {
  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('employee', 'manager', 'admin')) NOT NULL DEFAULT 'employee',
      department TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create time_off_requests table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS time_off_requests (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      type TEXT CHECK(type IN ('paid time off', 'sick leave', 'time edit', 'other')) NOT NULL,
      reason TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      approved_by TEXT,
      rejection_reason TEXT,
      original_clock_in TIME,
      original_clock_out TIME,
      requested_clock_in TIME,
      requested_clock_out TIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `)

  // Create notifications table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('info', 'success', 'warning', 'error')) NOT NULL DEFAULT 'info',
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Insert sample users if they don't exist
  const existingUsers = await db.prepare('SELECT COUNT(*) as count FROM users').first()
  
  if (existingUsers.count === 0) {
    const hashedPassword = await bcrypt.hash('password', 10)
    
    const users = [
      ['1', 'Juan Carranza', 'employee@example.com', hashedPassword, 'employee', 'Engineering', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
      ['2', 'Ana Ramirez', 'manager@example.com', hashedPassword, 'manager', 'Engineering', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
      ['5', 'Admin User', 'admin@example.com', hashedPassword, 'admin', 'IT', 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1']
    ]

    for (const user of users) {
      await db.prepare(`
        INSERT INTO users (id, name, email, password, role, department, avatar)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(...user).run()
    }

    // Insert sample requests
    const requests = [
      ['req1', '1', '2025-02-15', '2025-02-17', 'paid time off', 'Family vacation to the mountains', 'approved', '2'],
      ['req2', '1', '2025-02-20', '2025-02-21', 'sick leave', 'Flu symptoms, need to recover', 'pending', null]
    ]

    for (const request of requests) {
      await db.prepare(`
        INSERT INTO time_off_requests (id, employee_id, start_date, end_date, type, reason, status, approved_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(...request).run()
    }
  }
}

// JWT middleware for protected routes
const jwtMiddleware = jwt({
  secret: 'your-jwt-secret-key',
  cookie: 'token'
})

// Auth routes
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ message: 'Email and password are required' }, 400)
    }

    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first()

    if (!user) {
      return c.json({ message: 'Invalid credentials' }, 401)
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return c.json({ message: 'Invalid credentials' }, 401)
    }

    // Generate JWT token
    const token = await sign({ userId: user.id }, 'your-jwt-secret-key')

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return c.json({
      user: userWithoutPassword,
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.get('/api/auth/me', jwtMiddleware, async (c) => {
  const payload = c.get('jwtPayload')
  const user = await c.env.DB.prepare(
    'SELECT id, name, email, role, department, avatar FROM users WHERE id = ?'
  ).bind(payload.userId).first()

  if (!user) {
    return c.json({ message: 'User not found' }, 404)
  }

  return c.json({ user })
})

// Requests routes
app.get('/api/requests', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(payload.userId).first()

    let query = `
      SELECT 
        r.*,
        e.name as employee_name,
        e.email as employee_email,
        e.department as employee_department,
        e.avatar as employee_avatar,
        e.role as employee_role,
        a.name as approved_by_name
      FROM time_off_requests r
      JOIN users e ON r.employee_id = e.id
      LEFT JOIN users a ON r.approved_by = a.id
    `
    
    let params = []

    // Filter based on user role
    if (user.role === 'employee') {
      query += ' WHERE r.employee_id = ?'
      params.push(user.id)
    } else if (user.role === 'manager') {
      query += ' WHERE e.department = ?'
      params.push(user.department)
    }
    // Admin sees all requests (no additional filter)

    query += ' ORDER BY r.created_at DESC'

    const stmt = c.env.DB.prepare(query)
    const rows = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all()

    // Transform the data
    const requests = rows.results.map(row => ({
      id: row.id,
      employee: {
        id: row.employee_id,
        name: row.employee_name,
        email: row.employee_email,
        department: row.employee_department,
        avatar: row.employee_avatar,
        role: row.employee_role
      },
      startDate: row.start_date,
      endDate: row.end_date,
      type: row.type,
      reason: row.reason,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      approvedBy: row.approved_by_name ? {
        name: row.approved_by_name
      } : null,
      rejectionReason: row.rejection_reason,
      originalClockIn: row.original_clock_in,
      originalClockOut: row.original_clock_out,
      requestedClockIn: row.requested_clock_in,
      requestedClockOut: row.requested_clock_out
    }))

    return c.json(requests)
  } catch (error) {
    console.error('Get requests error:', error)
    return c.json({ message: 'Failed to fetch requests' }, 500)
  }
})

app.post('/api/requests', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const {
      startDate,
      endDate,
      type,
      reason,
      originalClockIn,
      originalClockOut,
      requestedClockIn,
      requestedClockOut
    } = await c.req.json()

    if (!startDate || !endDate || !type || !reason) {
      return c.json({ message: 'Missing required fields' }, 400)
    }

    const requestId = crypto.randomUUID()

    await c.env.DB.prepare(`
      INSERT INTO time_off_requests (
        id, employee_id, start_date, end_date, type, reason,
        original_clock_in, original_clock_out, 
        requested_clock_in, requested_clock_out
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      requestId,
      payload.userId,
      startDate,
      endDate,
      type,
      reason,
      originalClockIn || null,
      originalClockOut || null,
      requestedClockIn || null,
      requestedClockOut || null
    ).run()

    return c.json({ message: 'Request created successfully', id: requestId }, 201)
  } catch (error) {
    console.error('Create request error:', error)
    return c.json({ message: 'Failed to create request' }, 500)
  }
})

// Health check
app.get('/health', async (c) => {
  return c.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    platform: 'Cloudflare Workers',
    database: 'Cloudflare D1'
  })
})

// Initialize database on first request
app.use('*', async (c, next) => {
  if (c.env.DB) {
    await initDatabase(c.env.DB)
  }
  await next()
})

// SPA fallback - serve index.html for non-API routes
app.get('*', async (c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.json({ message: 'API endpoint not found' }, 404)
  }
  
  // Serve the React app
  return c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TimeOff Manager - Employee Time Off Request System</title>
    <script type="module" crossorigin src="/assets/index-cNKgz9bw.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/vendor-CRu2tH9_.js">
    <link rel="modulepreload" crossorigin href="/assets/utils-7EvkFMx6.js">
    <link rel="stylesheet" crossorigin href="/assets/index-x30_xaIR.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`)
})

export default app