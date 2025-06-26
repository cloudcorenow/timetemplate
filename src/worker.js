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

// Email notification system with Mailgun support
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

// Mailgun email sending function (WORKING SOLUTION)
async function sendMailgunEmail(env, to, subject, htmlContent) {
  try {
    console.log('📧 Sending email via Mailgun...')
    
    // Check if Mailgun is configured
    if (!env.MAILGUN_API_KEY || !env.MAILGUN_DOMAIN) {
      console.log('⚠️ Mailgun not configured (missing API key or domain)')
      return false
    }

    console.log('📧 Mailgun Config:')
    console.log('  Domain:', env.MAILGUN_DOMAIN)
    console.log('  From:', env.FROM_EMAIL || `noreply@${env.MAILGUN_DOMAIN}`)
    console.log('  To:', to)
    console.log('  Subject:', subject)

    // Construct the email body with both HTML and plain text
    const plainTextContent = htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

    // Mailgun API endpoint
    const url = `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`
    
    // Prepare form data for Mailgun
    const formData = new URLSearchParams({
      from: `TimeOff Manager <${env.FROM_EMAIL || `noreply@${env.MAILGUN_DOMAIN}`}>`,
      to: to,
      subject: subject,
      text: plainTextContent,
      html: htmlContent
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa('api:' + env.MAILGUN_API_KEY)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Mailgun API error:', response.status, errorText)
      return false
    }

    const responseData = await response.json()
    console.log('✅ Email sent successfully via Mailgun')
    console.log('📧 Mailgun response:', responseData)
    
    return true
  } catch (error) {
    console.error('❌ Mailgun email failed:', error)
    return false
  }
}

// Office 365 Graph API email sending (Alternative method)
async function sendOffice365GraphEmail(env, to, subject, htmlContent) {
  try {
    console.log('🔐 Attempting Office 365 Graph API...')
    
    if (!env.OFFICE365_CLIENT_ID || !env.OFFICE365_CLIENT_SECRET || !env.OFFICE365_TENANT_ID) {
      console.log('⚠️ Office 365 Graph API credentials not configured')
      return false
    }
    
    // Get access token
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${env.OFFICE365_TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: env.OFFICE365_CLIENT_ID,
        client_secret: env.OFFICE365_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      })
    })

    if (!tokenResponse.ok) {
      console.error('❌ Failed to get Office 365 token:', tokenResponse.status)
      return false
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Send email via Graph API
    const emailData = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: htmlContent
        },
        toRecipients: [
          {
            emailAddress: {
              address: to
            }
          }
        ]
      }
    }

    const emailResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${env.SMTP_USER}/sendMail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    })

    if (!emailResponse.ok) {
      console.error('❌ Failed to send email via Graph API:', emailResponse.status)
      return false
    }

    console.log('✅ Email sent successfully via Office 365 Graph API')
    return true
  } catch (error) {
    console.error('❌ Office 365 Graph API error:', error)
    return false
  }
}

// API-based email sending (Resend, SendGrid, etc.)
async function sendAPIEmail(env, to, subject, htmlContent) {
  try {
    console.log('📡 Using API email service...')
    
    let emailData, apiUrl, headers

    // Resend API
    if (env.EMAIL_SERVICE && env.EMAIL_SERVICE.includes('resend')) {
      apiUrl = 'https://api.resend.com/emails'
      headers = {
        'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      }
      emailData = {
        from: `TimeOff Manager <${env.FROM_EMAIL || 'noreply@timeoff-manager.com'}>`,
        to: [to],
        subject: subject,
        html: htmlContent
      }
    }
    // SendGrid API
    else if (env.EMAIL_SERVICE && env.EMAIL_SERVICE.includes('sendgrid')) {
      apiUrl = 'https://api.sendgrid.com/v3/mail/send'
      headers = {
        'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      }
      emailData = {
        personalizations: [{ to: [{ email: to }] }],
        from: { 
          email: env.FROM_EMAIL || 'noreply@timeoff-manager.com',
          name: 'TimeOff Manager'
        },
        subject: subject,
        content: [{ type: 'text/html', value: htmlContent }]
      }
    }
    // Generic API service
    else {
      console.log('⚠️ No specific API service configured')
      return false
    }

    console.log('📧 Sending to API:', apiUrl)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(emailData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Email API error:', response.status, errorText)
      return false
    }

    console.log('✅ API email sent successfully to', to)
    return true
  } catch (error) {
    console.error('❌ API email failed:', error)
    return false
  }
}

// Main email sending function with Mailgun priority
async function sendEmailNotification(env, to, subject, message, type = 'info', actionUrl = null) {
  try {
    console.log('📧 === EMAIL NOTIFICATION DEBUG ===')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('Type:', type)
    
    // Check if any email service is configured
    const hasMailgun = env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN
    const hasAPIService = env.EMAIL_SERVICE && env.EMAIL_API_KEY
    const hasOffice365API = env.OFFICE365_CLIENT_ID && env.OFFICE365_CLIENT_SECRET && env.OFFICE365_TENANT_ID

    console.log('📊 Email Service Status:')
    console.log('  Mailgun:', hasMailgun ? '✅ Configured' : '❌ Not configured')
    console.log('  API Service:', hasAPIService ? '✅ Configured' : '❌ Not configured')
    console.log('  Office 365 API:', hasOffice365API ? '✅ Configured' : '❌ Not configured')

    if (!hasMailgun && !hasAPIService && !hasOffice365API) {
      console.log('⚠️ No email service configured')
      return false
    }

    const htmlContent = await generateEmailTemplate(subject, message, type, actionUrl)
    
    // Try Mailgun first (most reliable and proven working)
    if (hasMailgun) {
      console.log('🔄 Attempting Mailgun...')
      const mailgunSuccess = await sendMailgunEmail(env, to, subject, htmlContent)
      if (mailgunSuccess) return true
      console.log('⚠️ Mailgun failed, trying next method...')
    }

    // Try Office 365 Graph API second
    if (hasOffice365API) {
      console.log('🔄 Attempting Office 365 Graph API...')
      const office365Success = await sendOffice365GraphEmail(env, to, subject, htmlContent)
      if (office365Success) return true
      console.log('⚠️ Office 365 Graph API failed, trying next method...')
    }

    // Try API service third
    if (hasAPIService) {
      console.log('🔄 Attempting API service...')
      const apiSuccess = await sendAPIEmail(env, to, subject, htmlContent)
      if (apiSuccess) return true
      console.log('⚠️ API service failed...')
    }

    console.log('❌ All email methods failed')
    return false
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    return false
  }
}

// Enhanced notification creation with email support - FIXED VERSION
async function createNotification(env, userId, type, message, emailSubject = null, actionUrl = null) {
  try {
    console.log('🔔 === CREATING NOTIFICATION ===')
    console.log('User ID:', userId)
    console.log('Type:', type)
    console.log('Message:', message)
    console.log('Email Subject:', emailSubject)
    
    // Create in-app notification
    const notificationId = crypto.randomUUID()
    const notificationResult = await env.DB.prepare(`
      INSERT INTO notifications (id, user_id, type, message)
      VALUES (?, ?, ?, ?)
    `).bind(notificationId, userId, type, message).run()

    console.log('✅ In-app notification created:', notificationResult)

    // Get user email preferences and info
    const user = await env.DB.prepare(
      'SELECT email, name, email_notifications FROM users WHERE id = ?'
    ).bind(userId).first()

    console.log('👤 User found:', user ? `${user.name} (${user.email})` : 'Not found')
    console.log('📧 Email notifications enabled:', user?.email_notifications !== false)

    // Send email if user exists and has email notifications enabled (default to true)
    if (user && user.email && (user.email_notifications !== false)) {
      console.log('📧 Attempting to send email notification...')
      
      const subject = emailSubject || getEmailSubject(type, message)
      const enhancedMessage = `Hi ${user.name},\n\n${message}\n\nBest regards,\nTimeOff Manager Team`
      
      console.log('📧 Email details:')
      console.log('  To:', user.email)
      console.log('  Subject:', subject)
      console.log('  Enhanced Message:', enhancedMessage)
      
      const emailSent = await sendEmailNotification(
        env,
        user.email,
        subject,
        enhancedMessage,
        type,
        actionUrl || env.APP_URL || 'https://timeoff-manager.lamado.workers.dev'
      )

      if (emailSent) {
        console.log(`✅ Email notification sent successfully to ${user.email}`)
      } else {
        console.log(`⚠️ Email notification failed for ${user.email}`)
      }
    } else {
      if (!user) {
        console.log('⚠️ User not found, skipping email')
      } else if (!user.email) {
        console.log('⚠️ User has no email address, skipping email')
      } else {
        console.log('⚠️ User has email notifications disabled, skipping email')
      }
    }

    return notificationId
  } catch (error) {
    console.error('❌ Error creating notification:', error)
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
  } else {
    return '📬 TimeOff Manager Notification'
  }
}

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
        email_notifications BOOLEAN DEFAULT TRUE,
        email_verified BOOLEAN DEFAULT FALSE,
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
      console.log('Inserting sample users...')
      
      // For demo, we'll use simple password storage
      const users = [
        ['1', 'Juan Carranza', 'employee@example.com', 'password', 'employee', 'Engineering', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', true, true],
        ['2', 'Ana Ramirez', 'manager@example.com', 'password', 'manager', 'Engineering', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', true, true],
        ['3', 'Alissa Pryor', 'alice@example.com', 'password', 'employee', 'Marketing', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', true, true],
        ['4', 'Charly Osornio', 'bob@example.com', 'password', 'employee', 'Sales', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', true, true],
        ['5', 'Admin User', 'admin@example.com', 'password', 'admin', 'IT', 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', true, true],
        ['6', 'Sarah Johnson', 'sarah@example.com', 'password', 'employee', 'Project Management', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', true, true],
        ['7', 'Mike Rodriguez', 'mike@example.com', 'password', 'employee', 'Shop', 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', true, true]
      ]

      for (const user of users) {
        await db.prepare(`
          INSERT OR REPLACE INTO users (id, name, email, password, role, department, avatar, email_notifications, email_verified)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          INSERT OR REPLACE INTO time_off_requests (id, employee_id, start_date, end_date, type, reason, status, approved_by)
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
          INSERT OR REPLACE INTO notifications (id, user_id, type, message, is_read)
          VALUES (?, ?, ?, ?, ?)
        `).bind(...notification).run()
      }

      console.log('Sample data inserted successfully')
    } else {
      // Update existing users to have email preferences
      await db.prepare(`
        UPDATE users SET 
          email_notifications = COALESCE(email_notifications, TRUE),
          email_verified = COALESCE(email_verified, FALSE)
        WHERE email_notifications IS NULL OR email_verified IS NULL
      `).run()
      console.log('Updated existing users with email preferences')
    }
  } catch (error) {
    console.error('Database initialization error:', error)
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

// Initialize database middleware
app.use('*', async (c, next) => {
  if (c.env.DB) {
    await initDatabase(c.env.DB)
  }
  await next()
})

// Debug endpoint to check users
app.get('/api/debug/users', async (c) => {
  try {
    const users = await c.env.DB.prepare('SELECT email, role, password FROM users').all()
    return c.json(users.results)
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// Enhanced email configuration debug endpoint
app.get('/api/debug/email-config', authMiddleware, adminMiddleware, async (c) => {
  try {
    const config = {
      hasMailgun: !!(c.env.MAILGUN_API_KEY && c.env.MAILGUN_DOMAIN),
      hasAPIService: !!(c.env.EMAIL_SERVICE && c.env.EMAIL_API_KEY),
      hasOffice365API: !!(c.env.OFFICE365_CLIENT_ID && c.env.OFFICE365_CLIENT_SECRET && c.env.OFFICE365_TENANT_ID),
      mailgunDomain: c.env.MAILGUN_DOMAIN || 'Not configured',
      emailService: c.env.EMAIL_SERVICE || 'Not configured',
      fromEmail: c.env.FROM_EMAIL || 'Not configured',
      office365ClientId: c.env.OFFICE365_CLIENT_ID ? 'Configured' : 'Not configured',
      office365TenantId: c.env.OFFICE365_TENANT_ID ? 'Configured' : 'Not configured',
      recommendation: getEmailRecommendation(c.env)
    }
    
    return c.json(config)
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

function getEmailRecommendation(env) {
  if (env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN) {
    return 'Mailgun configured - this is a proven working solution!'
  } else if (env.OFFICE365_CLIENT_ID && env.OFFICE365_CLIENT_SECRET && env.OFFICE365_TENANT_ID) {
    return 'Office 365 Graph API configured - good option for Office 365'
  } else if (env.EMAIL_SERVICE && env.EMAIL_API_KEY) {
    return 'API service configured - good option'
  } else {
    return 'No email service configured. Recommend setting up Mailgun for reliable email delivery.'
  }
}

// Auth routes
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    console.log('Login attempt:', { email, password })
    
    if (!email || !password) {
      return c.json({ message: 'Email and password are required' }, 400)
    }

    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first()

    console.log('User found:', user ? 'Yes' : 'No')

    if (!user) {
      return c.json({ message: 'Invalid credentials' }, 401)
    }

    console.log('Stored password:', user.password)
    console.log('Input password:', password)

    const isValidPassword = await verifyPassword(password, user.password)
    console.log('Password valid:', isValidPassword)
    
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
      'SELECT email_notifications, email_verified FROM users WHERE id = ?'
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
      `Welcome to TimeOff Manager! Your account has been created. Your default password is "password" - please change it after your first login.`,
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

// Reset user password - FIXED VERSION WITH ENHANCED DEBUGGING
app.patch('/api/users/:id/password', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { id } = c.req.param()
    const { password } = await c.req.json()

    console.log('🔑 === PASSWORD RESET DEBUG ===')
    console.log('🔑 Password reset request for user:', id)
    console.log('🔑 New password:', password)
    console.log('🔑 Admin user:', c.get('user').name)

    if (!password || password.length < 4) {
      console.log('❌ Password validation failed')
      return c.json({ message: 'Password must be at least 4 characters long' }, 400)
    }

    // Check if user exists and get their info
    const existingUser = await c.env.DB.prepare(
      'SELECT id, name, email FROM users WHERE id = ?'
    ).bind(id).first()

    if (!existingUser) {
      console.log('❌ User not found:', id)
      return c.json({ message: 'User not found' }, 404)
    }

    console.log('✅ User found:', existingUser.name, existingUser.email)

    // Store password as plain text for simplicity in demo
    // In production, you would hash this password
    const updateResult = await c.env.DB.prepare(`
      UPDATE users 
      SET password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(password, id).run()

    console.log('🔄 Database update result:', updateResult)

    if (updateResult.changes === 0) {
      console.log('❌ No rows updated')
      return c.json({ message: 'Failed to update password' }, 500)
    }

    console.log('✅ Password updated successfully in database')

    // Create enhanced notification message with the new password
    const notificationMessage = `Your password has been reset by an administrator. Your new password is: "${password}". Please log in with this password and consider changing it to something more secure.`
    
    console.log('🔔 Creating notification with message:', notificationMessage)

    // Add notification for the user with email
    try {
      const notificationId = await createNotification(
        c.env,
        id,
        'warning',
        notificationMessage,
        '🔑 Your Password Has Been Reset'
      )
      console.log('✅ Notification created with ID:', notificationId)
    } catch (notificationError) {
      console.error('⚠️ Failed to send notification:', notificationError)
      // Don't fail the password reset if notification fails
    }

    return c.json({ 
      message: 'Password reset successfully',
      details: {
        userId: id,
        userName: existingUser.name,
        userEmail: existingUser.email,
        newPassword: password,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Reset password error:', error)
    return c.json({ 
      message: 'Failed to reset password', 
      error: error.message,
      stack: error.stack 
    }, 500)
  }
})

// Delete user - ENHANCED VERSION WITH BETTER ERROR HANDLING
app.delete('/api/users/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { id } = c.req.param()
    const currentUser = c.get('user')

    console.log('🗑️ Delete user request for ID:', id)
    console.log('🗑️ Current user:', currentUser.id, currentUser.name)

    // Prevent admin from deleting themselves
    if (id === currentUser.id) {
      console.log('❌ Cannot delete own account')
      return c.json({ message: 'Cannot delete your own account' }, 400)
    }

    // Check if user exists and get their info
    const existingUser = await c.env.DB.prepare(
      'SELECT id, name, email, role FROM users WHERE id = ?'
    ).bind(id).first()

    if (!existingUser) {
      console.log('❌ User not found:', id)
      return c.json({ message: 'User not found' }, 404)
    }

    console.log('✅ User found:', existingUser.name, existingUser.email, existingUser.role)

    // Prevent deleting other admin users
    if (existingUser.role === 'admin') {
      console.log('❌ Cannot delete admin users')
      return c.json({ message: 'Cannot delete admin users' }, 400)
    }

    // Start transaction-like operations
    console.log('🔄 Starting deletion process...')

    try {
      // First, delete related notifications
      const notificationDeleteResult = await c.env.DB.prepare(
        'DELETE FROM notifications WHERE user_id = ?'
      ).bind(id).run()
      console.log('🗑️ Deleted notifications:', notificationDeleteResult.changes)

      // Then, delete related time off requests
      const requestDeleteResult = await c.env.DB.prepare(
        'DELETE FROM time_off_requests WHERE employee_id = ?'
      ).bind(id).run()
      console.log('🗑️ Deleted requests:', requestDeleteResult.changes)

      // Finally, delete the user
      const userDeleteResult = await c.env.DB.prepare(
        'DELETE FROM users WHERE id = ?'
      ).bind(id).run()
      console.log('🗑️ User deletion result:', userDeleteResult)

      if (userDeleteResult.changes === 0) {
        console.log('❌ No user rows deleted')
        return c.json({ message: 'Failed to delete user - no changes made' }, 500)
      }

      console.log('✅ User deleted successfully')

      return c.json({ 
        message: 'User deleted successfully',
        details: {
          deletedUser: {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email
          },
          deletedNotifications: notificationDeleteResult.changes,
          deletedRequests: requestDeleteResult.changes
        }
      })
    } catch (deleteError) {
      console.error('❌ Error during deletion:', deleteError)
      return c.json({ 
        message: 'Failed to delete user due to database error',
        error: deleteError.message 
      }, 500)
    }
  } catch (error) {
    console.error('❌ Delete user error:', error)
    return c.json({ 
      message: 'Failed to delete user', 
      error: error.message,
      stack: error.stack 
    }, 500)
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

// Enhanced test email endpoint with better debugging
app.post('/api/test-email', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { to, subject, message, type = 'info' } = await c.req.json()
    
    if (!to || !subject || !message) {
      return c.json({ message: 'Missing required fields: to, subject, message' }, 400)
    }

    console.log('📧 === TEST EMAIL DEBUG ===')
    console.log('📧 Test email request:', { to, subject, type })
    console.log('📧 Message:', message)

    const success = await sendEmailNotification(
      c.env,
      to,
      subject,
      message,
      type
    )

    if (success) {
      return c.json({ 
        message: 'Test email sent successfully',
        details: {
          to,
          subject,
          type,
          timestamp: new Date().toISOString()
        }
      })
    } else {
      return c.json({ 
        message: 'Failed to send test email',
        details: {
          to,
          subject,
          type,
          timestamp: new Date().toISOString(),
          suggestion: 'Check email configuration and logs'
        }
      }, 500)
    }
  } catch (error) {
    console.error('Test email error:', error)
    return c.json({ message: 'Failed to send test email', error: error.message }, 500)
  }
})

// Health check with enhanced email status
app.get('/health', async (c) => {
  const hasMailgun = !!(c.env.MAILGUN_API_KEY && c.env.MAILGUN_DOMAIN)
  const hasAPIService = !!(c.env.EMAIL_SERVICE && c.env.EMAIL_API_KEY)
  const hasOffice365API = !!(c.env.OFFICE365_CLIENT_ID && c.env.OFFICE365_CLIENT_SECRET && c.env.OFFICE365_TENANT_ID)
  
  return c.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    platform: 'Cloudflare Workers',
    database: 'Cloudflare D1',
    features: {
      email_mailgun: hasMailgun,
      email_api: hasAPIService,
      email_office365: hasOffice365API,
      email_configured: hasMailgun || hasAPIService || hasOffice365API,
      database: !!c.env.DB
    },
    email_status: {
      primary_method: hasMailgun ? 'Mailgun' : 
                     hasOffice365API ? 'Office 365 Graph API' : 
                     hasAPIService ? 'API Service' : 'None',
      fallback_available: (hasMailgun && hasOffice365API) || 
                         (hasMailgun && hasAPIService) || 
                         (hasOffice365API && hasAPIService)
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