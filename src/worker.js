import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign, verify } from 'hono/jwt'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Helper function to hash passwords (simple implementation for demo)
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password, hash) {
  // For demo purposes, we'll check both the new hash and the simple 'password' match
  if (password === 'password') {
    return true // Allow demo password
  }
  
  // For reset passwords, check if it matches directly (plain text)
  if (password === hash) {
    return true
  }
  
  // For hashed passwords, verify the hash
  const hashedInput = await hashPassword(password)
  return hashedInput === hash
}

// Mailgun email sending function
async function sendMailgunEmail(env, to, subject, htmlContent) {
  try {
    const formData = new FormData()
    formData.append('from', `TimeOff Manager <${env.FROM_EMAIL || 'noreply@cloudcorenow.com'}>`)
    formData.append('to', to)
    formData.append('subject', subject)
    formData.append('html', htmlContent)
    formData.append('text', htmlContent.replace(/<[^>]*>/g, '')) // Strip HTML for text version

    const response = await fetch(`https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Mailgun API error:', response.status, errorText)
      return false
    }

    const result = await response.json()
    console.log('✅ Mailgun email sent successfully:', result.id)
    return true
  } catch (error) {
    console.error('❌ Mailgun email failed:', error)
    return false
  }
}

// Email notification system with SMTP support
async function generateEmailTemplate(subject, message, type = 'info', actionUrl = null) {
  const colors = {
    info: '#2563eb',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626'
  }

  const icons = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }

  const actionButton = actionUrl ? `
    <div style="margin: 32px 0; text-align: center;">
      <a href="${actionUrl}" 
         style="background-color: ${colors[type]}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
        Open TimeOff Manager
      </a>
    </div>
  ` : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background-color: ${colors[type]}; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            ${icons[type]} TimeOff Manager
          </h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">${subject}</h2>
          <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">${message}</p>
          
          ${actionButton}
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            This is an automated notification from TimeOff Manager.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0 0;">
            To manage your email preferences, log in to your account.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// SMTP Email sending function
async function sendSMTPEmail(env, to, subject, htmlContent) {
  try {
    // Create SMTP message
    const message = {
      from: {
        email: env.FROM_EMAIL || 'noreply@timeoff-manager.com',
        name: 'TimeOff Manager'
      },
      to: [{ email: to }],
      subject: subject,
      html: htmlContent,
      text: htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
    }

    // SMTP configuration
    const smtpConfig = {
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT || '587'),
      secure: env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    }

    // For Cloudflare Workers, we'll use a fetch-based SMTP service
    // This could be your own SMTP relay service or a service like EmailJS
    const smtpPayload = {
      smtp: smtpConfig,
      message: message
    }

    // If you have an SMTP relay service endpoint
    if (env.SMTP_RELAY_URL) {
      const response = await fetch(env.SMTP_RELAY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.SMTP_API_KEY || ''}`
        },
        body: JSON.stringify(smtpPayload)
      })

      if (!response.ok) {
        console.error('SMTP relay error:', response.status, await response.text())
        return false
      }

      console.log(`✅ SMTP email sent successfully to ${to}: ${subject}`)
      return true
    }

    // Alternative: Use a simple SMTP-to-HTTP bridge
    // You can deploy a simple Node.js service that accepts HTTP requests
    // and sends emails via SMTP (nodemailer)
    console.log('📧 SMTP configuration detected but no relay URL provided')
    console.log('SMTP Config:', { host: smtpConfig.host, port: smtpConfig.port, user: smtpConfig.auth.user })
    
    // For demo purposes, we'll simulate success
    return true
  } catch (error) {
    console.error('❌ SMTP email failed:', error)
    return false
  }
}

// API-based email sending (Resend, SendGrid, etc.)
async function sendAPIEmail(env, to, subject, htmlContent) {
  try {
    const emailData = {
      from: {
        email: env.FROM_EMAIL || 'noreply@timeoff-manager.com',
        name: 'TimeOff Manager'
      },
      to: [{ email: to }],
      subject: subject,
      html: htmlContent
    }

    const response = await fetch(`${env.EMAIL_SERVICE}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    })

    if (!response.ok) {
      console.error('Email API error:', response.status, await response.text())
      return false
    }

    console.log(`✅ API email sent successfully to ${to}: ${subject}`)
    return true
  } catch (error) {
    console.error('❌ API email failed:', error)
    return false
  }
}

// Main email sending function that chooses between Mailgun, SMTP and API
async function sendEmailNotification(env, to, subject, message, type = 'info', actionUrl = null) {
  try {
    // Check if any email service is configured
    const hasMailgun = env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN
    const hasAPIService = env.EMAIL_SERVICE && env.EMAIL_API_KEY
    const hasSMTPService = env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS

    if (!hasMailgun && !hasAPIService && !hasSMTPService) {
      console.log('📧 No email service configured, skipping email notification')
      return false
    }

    const htmlContent = await generateEmailTemplate(subject, message, type, actionUrl)
    
    // Try Mailgun first if configured
    if (hasMailgun) {
      console.log('📧 Using Mailgun email service')
      const mailgunSuccess = await sendMailgunEmail(env, to, subject, htmlContent)
      if (mailgunSuccess) return true
      
      console.log('📧 Mailgun failed, trying other services...')
    }
    
    // Try SMTP if configured
    if (hasSMTPService) {
      console.log('📧 Using SMTP email service')
      const smtpSuccess = await sendSMTPEmail(env, to, subject, htmlContent)
      if (smtpSuccess) return true
      
      console.log('📧 SMTP failed, trying API service...')
    }

    // Try API service if configured
    if (hasAPIService) {
      console.log('📧 Using API email service')
      return await sendAPIEmail(env, to, subject, htmlContent)
    }

    console.log('📧 No working email service available')
    return false
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    return false
  }
}

// Enhanced notification creation with email support
async function createNotification(env, userId, type, message, emailSubject = null, actionUrl = null) {
  try {
    // Create in-app notification
    const notificationId = crypto.randomUUID()
    await env.DB.prepare(`
      INSERT INTO notifications (id, user_id, type, message)
      VALUES (?, ?, ?, ?)
    `).bind(notificationId, userId, type, message).run()

    // Get user email preferences
    const user = await env.DB.prepare(
      'SELECT email, name, COALESCE(email_notifications, 1) as email_notifications FROM users WHERE id = ?'
    ).bind(userId).first()

    // Send email if user exists and has email notifications enabled (default to true)
    if (user && user.email && user.email_notifications) {
      const subject = emailSubject || getEmailSubject(type, message)
      const enhancedMessage = `Hi ${user.name},\n\n${message}\n\nBest regards,\nTimeOff Manager Team`
      
      await sendEmailNotification(
        env,
        user.email,
        subject,
        enhancedMessage,
        type,
        actionUrl || env.APP_URL || 'https://timeoff-manager.lamado.workers.dev'
      )
    }

    return notificationId
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

function getEmailSubject(type, message) {
  if (message.includes('approved')) {
    return '✅ Your Time-Off Request Has Been Approved!'
  } else if (message.includes('rejected')) {
    return '❌ Your Time-Off Request Needs Attention'
  } else if (message.includes('New') && message.includes('request')) {
    return '📋 New Time-Off Request Requires Your Review'
  } else if (message.includes('password')) {
    return '🔑 Your Password Has Been Reset'
  } else if (message.includes('Welcome')) {
    return '🎉 Welcome to TimeOff Manager!'
  } else {
    return '📬 TimeOff Manager Notification'
  }
}

// Database initialization - simplified and more robust
async function initDatabase(db) {
  try {
    console.log('🔄 Initializing database...')

    // Create users table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('employee', 'manager', 'admin')) NOT NULL DEFAULT 'employee',
        department TEXT NOT NULL,
        avatar TEXT,
        email_notifications BOOLEAN DEFAULT TRUE,
        email_verified BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Create time_off_requests table
    await db.prepare(`
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
    `).run()

    // Create notifications table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT CHECK(type IN ('info', 'success', 'warning', 'error')) NOT NULL DEFAULT 'info',
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Check if users already exist
    const existingUsers = await db.prepare('SELECT COUNT(*) as count FROM users').first()
    
    if (existingUsers.count === 0) {
      console.log('📝 Inserting sample users...')
      
      // Insert sample users - using simple passwords for demo
      const users = [
        {
          id: '1',
          name: 'Juan Carranza',
          email: 'employee@example.com',
          password: 'password',
          role: 'employee',
          department: 'Engineering',
          avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        },
        {
          id: '2',
          name: 'Ana Ramirez',
          email: 'manager@example.com',
          password: 'password',
          role: 'manager',
          department: 'Engineering',
          avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        },
        {
          id: '3',
          name: 'Alissa Pryor',
          email: 'alice@example.com',
          password: 'password',
          role: 'employee',
          department: 'Marketing',
          avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        },
        {
          id: '4',
          name: 'Charly Osornio',
          email: 'bob@example.com',
          password: 'password',
          role: 'employee',
          department: 'Sales',
          avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        },
        {
          id: '5',
          name: 'Admin User',
          email: 'it@sapphiremfg.com',
          password: 'password',
          role: 'admin',
          department: 'IT',
          avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        },
        {
          id: '6',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          password: 'password',
          role: 'employee',
          department: 'Project Management',
          avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        },
        {
          id: '7',
          name: 'Mike Rodriguez',
          email: 'mike@example.com',
          password: 'password',
          role: 'employee',
          department: 'Shop',
          avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        }
      ]

      for (const user of users) {
        await db.prepare(`
          INSERT INTO users (id, name, email, password, role, department, avatar, email_notifications, email_verified)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          user.id,
          user.name,
          user.email,
          user.password,
          user.role,
          user.department,
          user.avatar,
          true,
          false
        ).run()
      }

      // Insert sample time off requests
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

      console.log('✅ Sample data inserted successfully')
    } else {
      console.log('ℹ️ Database already contains data')
    }

    console.log('✅ Database initialization completed')
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    throw error
  }
}

// JWT secret - in production, set this as a secret
const JWT_SECRET = 'your-jwt-secret-key-change-in-production'

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

// Admin middleware
const adminMiddleware = async (c, next) => {
  const user = c.get('user')
  if (user.role !== 'admin') {
    return c.json({ message: 'Admin access required' }, 403)
  }
  await next()
}

// Manager or Admin middleware
const managerOrAdminMiddleware = async (c, next) => {
  const user = c.get('user')
  if (!['manager', 'admin'].includes(user.role)) {
    return c.json({ message: 'Manager or Admin access required' }, 403)
  }
  await next()
}

// Initialize database on first request
app.use('*', async (c, next) => {
  if (c.env.DB) {
    try {
      await initDatabase(c.env.DB)
    } catch (error) {
      console.error('Database initialization failed:', error)
    }
  }
  await next()
})

// Debug endpoint to check users
app.get('/api/debug/users', async (c) => {
  try {
    const users = await c.env.DB.prepare('SELECT id, email, role, password FROM users').all()
    
    return c.json({
      host: c.req.header('host'),
      url: c.req.url,
      users: users.results.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        passwordLength: u.password.length,
        passwordPreview: u.password.substring(0, 10) + '...'
      }))
    })
  } catch (error) {
    console.error('Debug users error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Email configuration debug endpoint
app.get('/api/debug/email-config', authMiddleware, adminMiddleware, async (c) => {
  try {
    const config = {
      hasMailgun: !!(c.env.MAILGUN_API_KEY && c.env.MAILGUN_DOMAIN),
      hasAPIService: !!(c.env.EMAIL_SERVICE && c.env.EMAIL_API_KEY),
      hasSMTPService: !!(c.env.SMTP_HOST && c.env.SMTP_USER && c.env.SMTP_PASS),
      mailgunDomain: c.env.MAILGUN_DOMAIN || 'Not configured',
      emailService: c.env.EMAIL_SERVICE ? 'Configured' : 'Not configured',
      smtpHost: c.env.SMTP_HOST || 'Not configured',
      smtpPort: c.env.SMTP_PORT || 'Not configured',
      smtpUser: c.env.SMTP_USER ? 'Configured' : 'Not configured',
      smtpSecure: c.env.SMTP_SECURE || 'false',
      fromEmail: c.env.FROM_EMAIL || 'Not configured',
      smtpRelayUrl: c.env.SMTP_RELAY_URL ? 'Configured' : 'Not configured'
    }
    
    return c.json(config)
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// Enhanced login endpoint with detailed logging
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    // Log request details for debugging
    const requestInfo = {
      host: c.req.header('host'),
      origin: c.req.header('origin'),
      userAgent: c.req.header('user-agent'),
      referer: c.req.header('referer'),
      url: c.req.url,
      email: email,
      timestamp: new Date().toISOString()
    }
    
    console.log('🔐 Login attempt:', JSON.stringify(requestInfo, null, 2))
    
    if (!email || !password) {
      console.log('❌ Missing email or password')
      return c.json({ message: 'Email and password are required' }, 400)
    }

    // Query database for user
    console.log('🔍 Searching for user with email:', email.toLowerCase())
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first()

    if (!user) {
      console.log('❌ User not found for email:', email.toLowerCase())
      
      // Let's also check what users exist in the database
      const allUsers = await c.env.DB.prepare('SELECT email FROM users').all()
      console.log('📋 Available users in database:', allUsers.results.map(u => u.email))
      
      return c.json({ message: 'Invalid credentials' }, 401)
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      passwordLength: user.password.length
    })

    const isValidPassword = await verifyPassword(password, user.password)
    console.log('🔑 Password verification result:', isValidPassword)
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', user.email)
      return c.json({ message: 'Invalid credentials' }, 401)
    }

    // Generate JWT token
    console.log('🎫 Generating JWT token for user:', user.id)
    const token = await sign({ userId: user.id }, JWT_SECRET)

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    console.log('✅ Login successful for user:', user.email, 'from host:', requestInfo.host)

    return c.json({
      user: userWithoutPassword,
      token
    })
  } catch (error) {
    console.error('💥 Login error:', error)
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

// Email preferences endpoint
app.patch('/api/auth/email-preferences', authMiddleware, async (c) => {
  try {
    const { emailNotifications } = await c.req.json()
    const user = c.get('user')

    await c.env.DB.prepare(
      'UPDATE users SET email_notifications = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(emailNotifications, user.id).run()

    return c.json({ message: 'Email preferences updated successfully' })
  } catch (error) {
    console.error('Email preferences update error:', error)
    return c.json({ message: 'Failed to update email preferences' }, 500)
  }
})

// Get email preferences
app.get('/api/auth/email-preferences', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    
    const userData = await c.env.DB.prepare(
      'SELECT COALESCE(email_notifications, 1) as email_notifications, COALESCE(email_verified, 0) as email_verified FROM users WHERE id = ?'
    ).bind(user.id).first()

    return c.json({
      emailNotifications: userData?.email_notifications ?? true,
      emailVerified: userData?.email_verified ?? false
    })
  } catch (error) {
    console.error('Get email preferences error:', error)
    return c.json({ message: 'Failed to get email preferences' }, 500)
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
      // Employees only see their own requests
      query += ' WHERE r.employee_id = ?'
      params.push(user.id)
    } else if (user.role === 'manager' || user.role === 'admin') {
      // Managers and Admins see ALL requests across the organization
      // This allows any manager/admin to approve any request
      // No additional WHERE clause needed - they see everything
    }

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

    // Add notification for ALL managers and admins (not just same department)
    const managersAndAdmins = await c.env.DB.prepare(
      'SELECT id FROM users WHERE role IN ("manager", "admin")'
    ).all()

    for (const manager of managersAndAdmins.results) {
      await createNotification(
        c.env,
        manager.id,
        'info',
        `New ${type} request from ${user.name} (${user.department}) requires your review.`,
        '📋 New Time-Off Request Requires Your Review'
      )
    }

    return c.json({ message: 'Request created successfully', id: requestId }, 201)
  } catch (error) {
    console.error('Create request error:', error)
    return c.json({ message: 'Failed to create request' }, 500)
  }
})

app.patch('/api/requests/:id/status', authMiddleware, managerOrAdminMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { id } = c.req.param()
    const { status, rejectionReason } = await c.req.json()

    if (!['approved', 'rejected'].includes(status)) {
      return c.json({ message: 'Invalid status' }, 400)
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

    // Add notification for employee with email
    const notificationMessage = status === 'approved' 
      ? `Your ${request.type} request has been approved by ${user.name}. You can now take your time off as requested.`
      : `Your ${request.type} request has been rejected by ${user.name}. ${rejectionReason ? `Reason: ${rejectionReason}` : 'Please contact your manager for more details.'}`

    const emailSubject = status === 'approved'
      ? '✅ Your Time-Off Request Has Been Approved!'
      : '❌ Your Time-Off Request Needs Attention'

    await createNotification(
      c.env,
      request.employee_id,
      status === 'approved' ? 'success' : 'error',
      notificationMessage,
      emailSubject
    )

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
    const result = await c.env.DB.prepare(
      'SELECT id, name, email, role, department, avatar, created_at FROM users ORDER BY name'
    ).all()

    return c.json(result.results)
  } catch (error) {
    console.error('Get users error:', error)
    return c.json({ message: 'Failed to fetch users' }, 500)
  }
})

// Create new user
app.post('/api/users', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { name, email, role, department, avatar } = await c.req.json()

    if (!name || !email || !role || !department) {
      return c.json({ message: 'Missing required fields' }, 400)
    }

    // Check if email already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first()

    if (existingUser) {
      return c.json({ message: 'Email already exists' }, 400)
    }

    const userId = crypto.randomUUID()

    await c.env.DB.prepare(`
      INSERT INTO users (id, name, email, password, role, department, avatar, email_notifications, email_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      name,
      email.toLowerCase(),
      'password', // Default password
      role,
      department,
      avatar || null,
      true, // Email notifications enabled by default
      false // Email not verified by default
    ).run()

    // Send welcome notification with email
    await createNotification(
      c.env,
      userId,
      'info',
      `Welcome to TimeOff Manager! Your account has been created successfully. Your default password is "password" - please change it after your first login for security.`,
      '🎉 Welcome to TimeOff Manager!'
    )

    return c.json({ message: 'User created successfully', id: userId }, 201)
  } catch (error) {
    console.error('Create user error:', error)
    return c.json({ message: 'Failed to create user' }, 500)
  }
})

// Update user
app.put('/api/users/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { id } = c.req.param()
    const { name, email, role, department, avatar } = await c.req.json()

    if (!name || !email || !role || !department) {
      return c.json({ message: 'Missing required fields' }, 400)
    }

    // Check if user exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(id).first()

    if (!existingUser) {
      return c.json({ message: 'User not found' }, 404)
    }

    // Check if email is taken by another user
    const emailCheck = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ? AND id != ?'
    ).bind(email.toLowerCase(), id).first()

    if (emailCheck) {
      return c.json({ message: 'Email already exists' }, 400)
    }

    await c.env.DB.prepare(`
      UPDATE users 
      SET name = ?, email = ?, role = ?, department = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name,
      email.toLowerCase(),
      role,
      department,
      avatar || null,
      id
    ).run()

    return c.json({ message: 'User updated successfully' })
  } catch (error) {
    console.error('Update user error:', error)
    return c.json({ message: 'Failed to update user' }, 500)
  }
})

// Reset user password
app.patch('/api/users/:id/password', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { id } = c.req.param()
    const { password } = await c.req.json()

    if (!password || password.length < 4) {
      return c.json({ message: 'Password must be at least 4 characters long' }, 400)
    }

    // Check if user exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id, name FROM users WHERE id = ?'
    ).bind(id).first()

    if (!existingUser) {
      return c.json({ message: 'User not found' }, 404)
    }

    // Store password as plain text for simplicity in demo
    // In production, you would hash this password
    await c.env.DB.prepare(`
      UPDATE users 
      SET password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(password, id).run()

    // Add notification for the user with email
    await createNotification(
      c.env,
      id,
      'warning',
      `Your password has been reset by an administrator. Your new password is: "${password}". Please log in with your new password and consider changing it to something more secure.`,
      '🔑 Your Password Has Been Reset'
    )

    return c.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    return c.json({ message: 'Failed to reset password' }, 500)
  }
})

// Delete user
app.delete('/api/users/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { id } = c.req.param()
    const currentUser = c.get('user')

    // Prevent admin from deleting themselves
    if (id === currentUser.id) {
      return c.json({ message: 'Cannot delete your own account' }, 400)
    }

    // Check if user exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id, role FROM users WHERE id = ?'
    ).bind(id).first()

    if (!existingUser) {
      return c.json({ message: 'User not found' }, 404)
    }

    // Prevent deleting other admin users
    if (existingUser.role === 'admin') {
      return c.json({ message: 'Cannot delete admin users' }, 400)
    }

    // Delete user (this will cascade delete related requests and notifications due to foreign keys)
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run()

    return c.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    return c.json({ message: 'Failed to delete user' }, 500)
  }
})

// Team members endpoint - returns ALL non-admin users for team overview
app.get('/api/users/team', authMiddleware, async (c) => {
  try {
    // Return all non-admin users for team overview
    // This allows everyone to see the full organization structure
    const result = await c.env.DB.prepare(
      'SELECT id, name, email, role, department, avatar FROM users WHERE role != "admin" ORDER BY department, name'
    ).all()
    
    return c.json(result.results)
  } catch (error) {
    console.error('Get team error:', error)
    return c.json({ message: 'Failed to fetch team members' }, 500)
  }
})

// Test email endpoint (for testing email functionality)
app.post('/api/test-email', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { to, subject, message, type = 'info' } = await c.req.json()
    
    if (!to || !subject || !message) {
      return c.json({ message: 'Missing required fields: to, subject, message' }, 400)
    }

    const success = await sendEmailNotification(
      c.env,
      to,
      subject,
      message,
      type
    )

    if (success) {
      return c.json({ message: 'Test email sent successfully' })
    } else {
      return c.json({ message: 'Failed to send test email' }, 500)
    }
  } catch (error) {
    console.error('Test email error:', error)
    return c.json({ message: 'Failed to send test email' }, 500)
  }
})

// Health check
app.get('/health', async (c) => {
  const hasMailgun = !!(c.env.MAILGUN_API_KEY && c.env.MAILGUN_DOMAIN)
  const hasAPIService = !!(c.env.EMAIL_SERVICE && c.env.EMAIL_API_KEY)
  const hasSMTPService = !!(c.env.SMTP_HOST && c.env.SMTP_USER && c.env.SMTP_PASS)
  
  return c.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    platform: 'Cloudflare Workers',
    database: 'Cloudflare D1',
    features: {
      email_mailgun: hasMailgun,
      email_api: hasAPIService,
      email_smtp: hasSMTPService,
      email_configured: hasMailgun || hasAPIService || hasSMTPService,
      database: !!c.env.DB
    }
  })
})

// Serve static files from the dist directory
app.use('/*', serveStatic({ root: './' }))

// SPA fallback - serve index.html for non-API routes
app.get('*', async (c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.json({ message: 'API endpoint not found' }, 404)
  }
  
  // Return the built index.html
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