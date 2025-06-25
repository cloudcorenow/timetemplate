import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign, verify } from 'hono/jwt'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// CORS middleware - updated for custom domain
app.use('*', cors({
  origin: ['https://sapphireapp.site', 'https://www.sapphireapp.site', 'http://localhost:5173', 'https://timeoff-manager.lamado.workers.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Helper function to hash passwords (simple implementation for demo)
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'timeoff-salt-2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password, hash) {
  const hashedInput = await hashPassword(password)
  return hashedInput === hash
}

// JWT secret - hardcoded for easier deployment
const JWT_SECRET = 'Neon6-Animating-Showman-Defeat-Drained'

// Database initialization
async function initDatabase(db) {
  try {
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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Check if users already exist
    const existingUsers = await db.prepare('SELECT COUNT(*) as count FROM users').first()
    
    if (existingUsers.count === 0) {
      const hashedPassword = await hashPassword('password')
      
      const users = [
        ['1', 'Juan Carranza', 'employee@example.com', hashedPassword, 'employee', 'Engineering', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
        ['2', 'Ana Ramirez', 'manager@example.com', hashedPassword, 'manager', 'Engineering', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
        ['3', 'Alissa Pryor', 'alice@example.com', hashedPassword, 'employee', 'Marketing', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
        ['4', 'Charly Osornio', 'bob@example.com', hashedPassword, 'employee', 'Sales', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
        ['5', 'Admin User', 'admin@example.com', hashedPassword, 'admin', 'IT', 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
        ['6', 'Sarah Johnson', 'sarah@example.com', hashedPassword, 'employee', 'Project Management', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
        ['7', 'Mike Rodriguez', 'mike@example.com', hashedPassword, 'employee', 'Shop', 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1']
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
        ['req2', '3', '2025-02-20', '2025-02-21', 'sick leave', 'Flu symptoms, need to recover', 'pending', null],
        ['req3', '4', '2025-03-01', '2025-03-05', 'paid time off', 'Wedding anniversary celebration', 'pending', null],
        ['req4', '6', '2025-01-08', '2025-01-08', 'time edit', 'Forgot to clock out yesterday', 'approved', '2'],
        ['req5', '7', '2025-02-28', '2025-03-01', 'other', 'Personal appointment that cannot be rescheduled', 'rejected', '2']
      ]

      for (const request of requests) {
        await db.prepare(`
          INSERT INTO time_off_requests (id, employee_id, start_date, end_date, type, reason, status, approved_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(...request).run()
      }

      // Update time edit request with time details
      await db.prepare(`
        UPDATE time_off_requests 
        SET original_clock_in = ?, original_clock_out = ?, requested_clock_in = ?, requested_clock_out = ?
        WHERE id = ?
      `).bind('08:00:00', '17:00:00', '08:00:00', '18:00:00', 'req4').run()

      // Update rejected request with rejection reason
      await db.prepare(`
        UPDATE time_off_requests 
        SET rejection_reason = ?
        WHERE id = ?
      `).bind('Insufficient notice period. Please submit requests at least 2 weeks in advance.', 'req5').run()

      // Insert sample notifications
      const notifications = [
        ['notif1', '1', 'success', 'Your time off request for Feb 15-17 has been approved', 0],
        ['notif2', '3', 'info', 'Your sick leave request is pending manager approval', 0],
        ['notif3', '4', 'info', 'Your time off request for March 1-5 is pending approval', 0],
        ['notif4', '6', 'success', 'Your time edit request has been approved', 1],
        ['notif5', '7', 'error', 'Your time off request has been rejected', 0],
        ['notif6', '2', 'info', 'You have 2 pending requests to review', 0]
      ]

      for (const notification of notifications) {
        await db.prepare(`
          INSERT INTO notifications (id, user_id, type, message, is_read)
          VALUES (?, ?, ?, ?, ?)
        `).bind(...notification).run()
      }
    } else {
      // Update existing users with correct password hash if needed
      const hashedPassword = await hashPassword('password')
      await db.prepare(`
        UPDATE users SET password = ? WHERE email IN (
          'employee@example.com', 'manager@example.com', 'admin@example.com',
          'alice@example.com', 'bob@example.com', 'sarah@example.com', 'mike@example.com'
        )
      `).bind(hashedPassword).run()
    }
  } catch (error) {
    console.error('Database initialization error:', error)
  }
}

// Auth middleware
const authMiddleware = async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ message: 'Access token required' }, 401)
    }

    const token = authHeader.split(' ')[1]
    const payload = await verify(token, JWT_SECRET)
    
    // Get user from database
    const user = await c.env.DB.prepare(
      'SELECT id, name, email, role, department, avatar FROM users WHERE id = ?'
    ).bind(payload.userId).first()

    if (!user) {
      return c.json({ message: 'User not found' }, 403)
    }

    c.set('user', user)
    await next()
  } catch (error) {
    return c.json({ message: 'Invalid or expired token' }, 403)
  }
}

// Initialize database middleware
app.use('*', async (c, next) => {
  if (c.env.DB) {
    await initDatabase(c.env.DB)
  }
  await next()
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
    ).bind(email.toLowerCase()).first()

    if (!user) {
      return c.json({ message: 'Invalid credentials' }, 401)
    }

    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return c.json({ message: 'Invalid credentials' }, 401)
    }

    // Generate JWT token
    const token = await sign({ userId: user.id }, JWT_SECRET)

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

app.get('/api/auth/me', authMiddleware, async (c) => {
  const user = c.get('user')
  return c.json({ user })
})

app.patch('/api/auth/avatar', authMiddleware, async (c) => {
  try {
    const { avatar } = await c.req.json()
    const user = c.get('user')

    await c.env.DB.prepare(
      'UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(avatar, user.id).run()

    return c.json({ message: 'Avatar updated successfully' })
  } catch (error) {
    console.error('Avatar update error:', error)
    return c.json({ message: 'Failed to update avatar' }, 500)
  }
})

// Requests routes
app.get('/api/requests', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    
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
    const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all()

    // Transform the data
    const requests = result.results.map(row => ({
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

app.post('/api/requests', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
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
      user.id,
      startDate,
      endDate,
      type,
      reason,
      originalClockIn || null,
      originalClockOut || null,
      requestedClockIn || null,
      requestedClockOut || null
    ).run()

    // Add notification for managers
    if (user.role === 'employee') {
      const managers = await c.env.DB.prepare(
        'SELECT id FROM users WHERE role IN ("manager", "admin") AND department = ?'
      ).bind(user.department).all()

      for (const manager of managers.results) {
        await c.env.DB.prepare(`
          INSERT INTO notifications (id, user_id, type, message)
          VALUES (?, ?, 'info', ?)
        `).bind(
          crypto.randomUUID(),
          manager.id,
          `New ${type} request from ${user.name}`
        ).run()
      }
    }

    return c.json({ message: 'Request created successfully', id: requestId }, 201)
  } catch (error) {
    console.error('Create request error:', error)
    return c.json({ message: 'Failed to create request' }, 500)
  }
})

app.patch('/api/requests/:id/status', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { id } = c.req.param()
    const { status, rejectionReason } = await c.req.json()

    if (!['approved', 'rejected'].includes(status)) {
      return c.json({ message: 'Invalid status' }, 400)
    }

    if (!['manager', 'admin'].includes(user.role)) {
      return c.json({ message: 'Insufficient permissions' }, 403)
    }

    // Get the request to find the employee
    const request = await c.env.DB.prepare(
      'SELECT employee_id, type FROM time_off_requests WHERE id = ?'
    ).bind(id).first()

    if (!request) {
      return c.json({ message: 'Request not found' }, 404)
    }

    // Update request status
    await c.env.DB.prepare(`
      UPDATE time_off_requests 
      SET status = ?, approved_by = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, user.id, rejectionReason || null, id).run()

    // Add notification for employee
    const notificationMessage = status === 'approved' 
      ? `Your ${request.type} request has been approved`
      : `Your ${request.type} request has been rejected`

    await c.env.DB.prepare(`
      INSERT INTO notifications (id, user_id, type, message)
      VALUES (?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      request.employee_id,
      status === 'approved' ? 'success' : 'error',
      notificationMessage
    ).run()

    return c.json({ message: 'Request updated successfully' })
  } catch (error) {
    console.error('Update request error:', error)
    return c.json({ message: 'Failed to update request' }, 500)
  }
})

// Notifications routes
app.get('/api/notifications', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const result = await c.env.DB.prepare(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(user.id).all()

    const notifications = result.results.map(row => ({
      id: row.id,
      type: row.type,
      message: row.message,
      read: row.is_read,
      createdAt: row.created_at
    }))

    return c.json(notifications)
  } catch (error) {
    console.error('Get notifications error:', error)
    return c.json({ message: 'Failed to fetch notifications' }, 500)
  }
})

app.patch('/api/notifications/:id/read', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { id } = c.req.param()

    await c.env.DB.prepare(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
    ).bind(id, user.id).run()

    return c.json({ message: 'Notification marked as read' })
  } catch (error) {
    console.error('Mark notification read error:', error)
    return c.json({ message: 'Failed to mark notification as read' }, 500)
  }
})

app.patch('/api/notifications/read-all', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    await c.env.DB.prepare(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?'
    ).bind(user.id).run()

    return c.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Mark all notifications read error:', error)
    return c.json({ message: 'Failed to mark all notifications as read' }, 500)
  }
})

app.get('/api/notifications/unread-count', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const result = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).bind(user.id).first()

    return c.json({ count: result.count })
  } catch (error) {
    console.error('Get unread count error:', error)
    return c.json({ message: 'Failed to get unread count' }, 500)
  }
})

// Users routes
app.get('/api/users', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    
    if (user.role !== 'admin') {
      return c.json({ message: 'Insufficient permissions' }, 403)
    }

    const result = await c.env.DB.prepare(
      'SELECT id, name, email, role, department, avatar, created_at FROM users ORDER BY name'
    ).all()

    return c.json(result.results)
  } catch (error) {
    console.error('Get users error:', error)
    return c.json({ message: 'Failed to fetch users' }, 500)
  }
})

app.get('/api/users/team', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    
    if (!['manager', 'admin'].includes(user.role)) {
      return c.json({ message: 'Insufficient permissions' }, 403)
    }

    let query = 'SELECT id, name, email, role, department, avatar FROM users'
    let params = []

    if (user.role === 'manager') {
      query += ' WHERE department = ? AND role != "admin"'
      params.push(user.department)
    } else {
      query += ' WHERE role != "admin"'
    }

    query += ' ORDER BY name'

    const stmt = c.env.DB.prepare(query)
    const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all()
    
    return c.json(result.results)
  } catch (error) {
    console.error('Get team error:', error)
    return c.json({ message: 'Failed to fetch team members' }, 500)
  }
})

// Health check
app.get('/health', async (c) => {
  return c.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    platform: 'Cloudflare Workers',
    database: 'Cloudflare D1',
    domain: 'sapphireapp.site'
  })
})

// Serve static files from the dist directory
app.use('/*', serveStatic({ root: './' }))

// SPA fallback - serve index.html for non-API routes
app.get('*', async (c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.json({ message: 'API endpoint not found' }, 404)
  }
  
  // Return the built index.html for SPA routing
  return serveStatic({ path: './index.html' })(c)
})

export default app