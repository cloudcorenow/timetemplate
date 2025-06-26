import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: ['https://sapphireapp.site', 'https://timeoff-manager.lamado.workers.dev', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Serve static files
app.use('/*', serveStatic({ root: './' }));

// Utility functions
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function generateResetToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const hashedPassword = await hashPassword(password);
  return hashedPassword === hash;
}

function generateJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa(`${encodedHeader}.${encodedPayload}.${secret}`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJWT(token, secret) {
  try {
    const [header, payload, signature] = token.split('.');
    const expectedSignature = btoa(`${header}.${payload}.${secret}`);
    if (signature !== expectedSignature) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// Email templates
function getEmailTemplate(type, data) {
  const baseStyle = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
      .container { max-width: 600px; margin: 0 auto; background-color: white; }
      .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center; }
      .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
      .content { padding: 40px 20px; }
      .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
      .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
    </style>
  `;

  const templates = {
    'password-reset': `
      ${baseStyle}
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>Hello ${data.name},</p>
          <p>We received a request to reset your password for your TimeOff Manager account. Click the button below to create a new password:</p>
          <a href="${data.resetUrl}" class="button">Reset Password</a>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${data.resetUrl}">${data.resetUrl}</a>
          </p>
        </div>
        <div class="footer">
          <p>© 2025 TimeOff Manager. This email was sent to ${data.email}</p>
        </div>
      </div>
    `,
    'password-changed': `
      ${baseStyle}
      <div class="container">
        <div class="header">
          <h1>✅ Password Changed</h1>
        </div>
        <div class="content">
          <h2>Password Successfully Changed</h2>
          <p>Hello ${data.name},</p>
          <p>Your password has been successfully changed for your TimeOff Manager account.</p>
          <p><strong>Changed on:</strong> ${new Date().toLocaleString()}</p>
          <p>If you didn't make this change, please contact your administrator immediately.</p>
        </div>
        <div class="footer">
          <p>© 2025 TimeOff Manager. This email was sent to ${data.email}</p>
        </div>
      </div>
    `
  };

  return templates[type] || '';
}

// Email sending function
async function sendEmail(env, to, subject, htmlContent) {
  try {
    // Try API-based email service first (Resend, SendGrid, etc.)
    if (env.EMAIL_SERVICE && env.EMAIL_API_KEY) {
      const emailData = {
        from: env.FROM_EMAIL || 'noreply@sapphireapp.site',
        to: [to],
        subject: subject,
        html: htmlContent
      };

      const response = await fetch(`${env.EMAIL_SERVICE}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        console.log('✅ Email sent via API service');
        return true;
      }
    }

    // Try SMTP relay service
    if (env.SMTP_RELAY_URL) {
      const smtpData = {
        smtp: {
          host: env.SMTP_HOST,
          port: parseInt(env.SMTP_PORT || '587'),
          secure: env.SMTP_SECURE === 'true',
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS
          }
        },
        message: {
          from: {
            name: 'TimeOff Manager',
            email: env.FROM_EMAIL || 'noreply@sapphireapp.site'
          },
          to: [{ email: to }],
          subject: subject,
          html: htmlContent,
          text: htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
        }
      };

      const response = await fetch(env.SMTP_RELAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpData)
      });

      if (response.ok) {
        console.log('✅ Email sent via SMTP relay');
        return true;
      }
    }

    console.log('⚠️ No email service configured, email not sent');
    return false;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
}

// Authentication middleware
async function authenticateUser(c, env) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = verifyJWT(token, env.JWT_SECRET || 'default-secret');
  
  if (!payload || !payload.userId) {
    return null;
  }

  // Get user from database
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.userId).first();
  return user;
}

// API Routes

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    features: {
      email_api: !!(c.env?.EMAIL_SERVICE && c.env?.EMAIL_API_KEY),
      email_smtp: !!(c.env?.SMTP_HOST && c.env?.SMTP_USER),
      email_configured: !!(c.env?.EMAIL_SERVICE || c.env?.SMTP_HOST || c.env?.SMTP_RELAY_URL)
    }
  });
});

// Auth routes
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ message: 'Email and password are required' }, 400);
    }
    
    console.log(`Login attempt for email: ${email}`);
    
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    
    if (!user) {
      console.log(`User not found: ${email}`);
      return c.json({ message: 'Invalid credentials' }, 401);
    }
    
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      console.log(`Invalid password for user: ${email}`);
      return c.json({ message: 'Invalid credentials' }, 401);
    }
    
    console.log(`Successful login for user: ${email}`);
    const token = generateJWT({ userId: user.id }, c.env.JWT_SECRET || 'default-secret');
    
    const { password: _, ...userWithoutPassword } = user;
    return c.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ message: 'Server error' }, 500);
  }
});

app.get('/api/auth/me', async (c) => {
  const user = await authenticateUser(c, c.env);
  if (!user) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  
  const { password: _, ...userWithoutPassword } = user;
  return c.json({ user: userWithoutPassword });
});

app.patch('/api/auth/avatar', async (c) => {
  const user = await authenticateUser(c, c.env);
  if (!user) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  
  try {
    const { avatar } = await c.req.json();
    
    await c.env.DB.prepare('UPDATE users SET avatar = ? WHERE id = ?')
      .bind(avatar, user.id)
      .run();
    
    return c.json({ message: 'Avatar updated successfully' });
  } catch (error) {
    console.error('Avatar update error:', error);
    return c.json({ message: 'Server error' }, 500);
  }
});

// Password reset routes
app.post('/api/auth/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ message: 'Email is required' }, 400);
    }
    
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return c.json({ message: 'If an account with that email exists, we have sent a password reset link.' });
    }
    
    // Generate reset token
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    // Store reset token in database
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO password_resets (user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(user.id, resetToken, expiresAt.toISOString(), new Date().toISOString()).run();
    
    // Send reset email
    const resetUrl = `${c.env.APP_URL || 'https://sapphireapp.site'}/reset-password?token=${resetToken}`;
    const emailHtml = getEmailTemplate('password-reset', {
      name: user.name,
      email: user.email,
      resetUrl: resetUrl
    });
    
    const emailSent = await sendEmail(c.env, user.email, 'Reset Your Password - TimeOff Manager', emailHtml);
    
    if (!emailSent) {
      console.log('⚠️ Email not sent, but continuing for security');
    }
    
    return c.json({ message: 'If an account with that email exists, we have sent a password reset link.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({ message: 'Server error' }, 500);
  }
});

app.post('/api/auth/reset-password', async (c) => {
  try {
    const { token, password } = await c.req.json();
    
    if (!token || !password) {
      return c.json({ message: 'Token and password are required' }, 400);
    }
    
    if (password.length < 4) {
      return c.json({ message: 'Password must be at least 4 characters long' }, 400);
    }
    
    // Find valid reset token
    const resetRecord = await c.env.DB.prepare(`
      SELECT pr.*, u.name, u.email 
      FROM password_resets pr 
      JOIN users u ON pr.user_id = u.id 
      WHERE pr.token = ? AND pr.expires_at > ? AND pr.used_at IS NULL
    `).bind(token, new Date().toISOString()).first();
    
    if (!resetRecord) {
      return c.json({ message: 'Invalid or expired reset token' }, 400);
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(password);
    
    // Update user password
    await c.env.DB.prepare('UPDATE users SET password = ? WHERE id = ?')
      .bind(hashedPassword, resetRecord.user_id)
      .run();
    
    // Mark reset token as used
    await c.env.DB.prepare('UPDATE password_resets SET used_at = ? WHERE token = ?')
      .bind(new Date().toISOString(), token)
      .run();
    
    // Send confirmation email
    const emailHtml = getEmailTemplate('password-changed', {
      name: resetRecord.name,
      email: resetRecord.email
    });
    
    await sendEmail(c.env, resetRecord.email, 'Password Changed - TimeOff Manager', emailHtml);
    
    return c.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ message: 'Server error' }, 500);
  }
});

app.get('/api/auth/validate-reset-token', async (c) => {
  try {
    const token = c.req.query('token');
    
    if (!token) {
      return c.json({ valid: false, message: 'Token is required' }, 400);
    }
    
    const resetRecord = await c.env.DB.prepare(`
      SELECT * FROM password_resets 
      WHERE token = ? AND expires_at > ? AND used_at IS NULL
    `).bind(token, new Date().toISOString()).first();
    
    if (!resetRecord) {
      return c.json({ valid: false, message: 'Invalid or expired token' });
    }
    
    return c.json({ valid: true });
  } catch (error) {
    console.error('Validate token error:', error);
    return c.json({ valid: false, message: 'Server error' }, 500);
  }
});

// Request routes
app.get('/api/requests', async (c) => {
  const user = await authenticateUser(c, c.env);
  if (!user) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  
  try {
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
    `;
    
    let params = [];
    
    if (user.role === 'employee') {
      query += ' WHERE r.employee_id = ?';
      params.push(user.id);
    }
    
    query += ' ORDER BY r.created_at DESC';
    
    const requests = await c.env.DB.prepare(query).bind(...params).all();
    
    const transformedRequests = requests.results.map(request => ({
      id: request.id,
      employee: {
        id: request.employee_id,
        name: request.employee_name,
        email: request.employee_email,
        department: request.employee_department,
        avatar: request.employee_avatar,
        role: request.employee_role
      },
      startDate: request.start_date,
      endDate: request.end_date,
      type: request.type,
      reason: request.reason,
      status: request.status,
      approvedBy: request.approved_by_name ? { name: request.approved_by_name } : null,
      rejectionReason: request.rejection_reason,
      originalClockIn: request.original_clock_in,
      originalClockOut: request.original_clock_out,
      requestedClockIn: request.requested_clock_in,
      requestedClockOut: request.requested_clock_out,
      createdAt: request.created_at,
      updatedAt: request.updated_at
    }));
    
    return c.json(transformedRequests);
  } catch (error) {
    console.error('Get requests error:', error);
    return c.json({ message: 'Server error' }, 500);
  }
});

app.post('/api/requests', async (c) => {
  const user = await authenticateUser(c, c.env);
  if (!user) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  
  try {
    const requestData = await c.req.json();
    const requestId = generateId();
    
    await c.env.DB.prepare(`
      INSERT INTO time_off_requests (
        id, employee_id, start_date, end_date, type, reason,
        original_clock_in, original_clock_out, 
        requested_clock_in, requested_clock_out,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      requestId,
      user.id,
      requestData.startDate,
      requestData.endDate,
      requestData.type,
      requestData.reason,
      requestData.originalClockIn || null,
      requestData.originalClockOut || null,
      requestData.requestedClockIn || null,
      requestData.requestedClockOut || null,
      new Date().toISOString(),
      new Date().toISOString()
    ).run();
    
    // Create notification for managers
    const managers = await c.env.DB.prepare('SELECT * FROM users WHERE role IN (?, ?)').bind('manager', 'admin').all();
    
    for (const manager of managers.results) {
      const notificationId = generateId();
      await c.env.DB.prepare(`
        INSERT INTO notifications (id, user_id, type, message, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        notificationId,
        manager.id,
        'info',
        `New ${requestData.type} request from ${user.name}`,
        new Date().toISOString()
      ).run();
    }
    
    return c.json({ message: 'Request created successfully' }, 201);
  } catch (error) {
    console.error('Create request error:', error);
    return c.json({ message: 'Server error' }, 500);
  }
});

app.patch('/api/requests/:id/status', async (c) => {
  const user = await authenticateUser(c, c.env);
  if (!user || !['manager', 'admin'].includes(user.role)) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  
  try {
    const { id } = c.req.param();
    const { status, rejectionReason } = await c.req.json();
    
    await c.env.DB.prepare(`
      UPDATE time_off_requests 
      SET status = ?, approved_by = ?, rejection_reason = ?, updated_at = ?
      WHERE id = ?
    `).bind(status, user.id, rejectionReason || null, new Date().toISOString(), id).run();
    
    // Get request details for notification
    const request = await c.env.DB.prepare(`
      SELECT r.*, u.name as employee_name 
      FROM time_off_requests r 
      JOIN users u ON r.employee_id = u.id 
      WHERE r.id = ?
    `).bind(id).first();
    
    if (request) {
      // Create notification for employee
      const notificationId = generateId();
      const message = status === 'approved' 
        ? `Your ${request.type} request has been approved`
        : `Your ${request.type} request has been rejected`;
      
      await c.env.DB.prepare(`
        INSERT INTO notifications (id, user_id, type, message, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        notificationId,
        request.employee_id,
        status === 'approved' ? 'success' : 'error',
        message,
        new Date().toISOString()
      ).run();
    }
    
    return c.json({ message: 'Request updated successfully' });
  } catch (error) {
    console.error('Update request status error:', error);
    return c.json({ message: 'Server error' }, 500);
  }
});

// Notification routes
app.get('/api/notifications', async (c) => {
  const user = await authenticateUser(c, c.env);
  if (!user) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  
  try {
    const notifications = await c.env.DB.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).bind(user.id).all();
    
    const transformedNotifications = notifications.results.map(notification => ({
      id: notification.id,
      type: notification.type,
      message: notification.message,
      read: !!notification.is_read,
      createdAt: notification.created_at
    }));
    
    return c.json(transformedNotifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ message: 'Server error' }, 500);
  }
});

app.patch('/api/notifications/:id/read', async (c) => {
  const user = await authenticateUser(c, c.env);
  if (!user) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  
  try {
    const { id } = c.req.param();
    
    await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
      .bind(id, user.id)
      .run();
    
    return c.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return c.json({ message: 'Server error' }, 500);
  }
});

app.patch('/api/notifications/read-all', async (c) => {
  const user = await authenticateUser(c, c.env);
  if (!user) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  
  try {
    await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')
      .bind(user.id)
      .run();
    
    return c.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return c.json({ message: 'Server error' }, 500);
  }
});

app.get('/api/notifications/unread-count', async (c) => {
  const user = await authenticateUser(c, c.env);
  if (!user) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  
  try {
    const result = await c.env.DB.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0')
      .bind(user.id)
      .first();
    
    return c.json({ count: result.count });
  } catch (error) {
    console.error('Get unread count error:', error);
    return c.json({ message: 'Server error' }, 500);
  }
});

// User routes
app.get('/api/users', async (c) => {
  const user = await authenticateUser(c, c.env);
  if (!user || user.role !== 'admin') {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  
  try {
    const users = await c.env.DB.prepare('SELECT id, name, email, role, department, avatar FROM users').all();
    return c.json(users.results);
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ message: 'Server error' }, 500);
  }
});

app.get('/api/users/team', async (c) => {
  const user = await authenticateUser(c, c.env);
  if (!user) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  
  try {
    const users = await c.env.DB.prepare('SELECT id, name, email, role, department, avatar FROM users WHERE role != ?').bind('admin').all();
    return c.json(users.results);
  } catch (error) {
    console.error('Get team members error:', error);
    return c.json({ message: 'Server error' }, 500);
  }
});

// Debug route for email configuration (admin only)
app.get('/api/debug/email-config', async (c) => {
  const user = await authenticateUser(c, c.env);
  if (!user || user.role !== 'admin') {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  
  return c.json({
    hasAPIService: !!(c.env.EMAIL_SERVICE && c.env.EMAIL_API_KEY),
    hasSMTPService: !!(c.env.SMTP_HOST && c.env.SMTP_USER),
    emailService: c.env.EMAIL_SERVICE ? 'Configured' : 'Not configured',
    smtpHost: c.env.SMTP_HOST ? 'Configured' : 'Not configured',
    smtpPort: c.env.SMTP_PORT || 'Not configured',
    smtpUser: c.env.SMTP_USER ? 'Configured' : 'Not configured',
    smtpSecure: c.env.SMTP_SECURE || 'Not configured',
    fromEmail: c.env.FROM_EMAIL || 'Not configured',
    smtpRelayUrl: c.env.SMTP_RELAY_URL ? 'Configured' : 'Not configured'
  });
});

// Test email route (admin only)
app.post('/api/test-email', async (c) => {
  const user = await authenticateUser(c, c.env);
  if (!user || user.role !== 'admin') {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  
  try {
    const { to, subject, message, type = 'info' } = await c.req.json();
    
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">📧 Test Email</h1>
        </div>
        <div style="padding: 40px 20px;">
          <h2>Test Email from TimeOff Manager</h2>
          <p><strong>Type:</strong> ${type}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p>This is a test email sent from the TimeOff Manager admin panel.</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px;">
          <p>© 2025 TimeOff Manager. This is a test email.</p>
        </div>
      </div>
    `;
    
    const emailSent = await sendEmail(c.env, to, subject, emailHtml);
    
    if (emailSent) {
      return c.json({ message: 'Test email sent successfully' });
    } else {
      return c.json({ message: 'Failed to send test email. Check email configuration.' }, 500);
    }
  } catch (error) {
    console.error('Test email error:', error);
    return c.json({ message: 'Server error' }, 500);
  }
});

// Debug login route for testing
app.post('/api/debug/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    console.log(`Debug login attempt for: ${email}`);
    
    // For testing purposes, allow login with any of the sample accounts
    if (email === 'employee@example.com' && password === 'password') {
      const user = {
        id: '1',
        name: 'Juan Carranza',
        email: 'employee@example.com',
        role: 'employee',
        department: 'Engineering',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
      };
      
      const token = generateJWT({ userId: user.id }, c.env.JWT_SECRET || 'default-secret');
      return c.json({ user, token });
    }
    
    if (email === 'manager@example.com' && password === 'password') {
      const user = {
        id: '2',
        name: 'Ana Ramirez',
        email: 'manager@example.com',
        role: 'manager',
        department: 'Engineering',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
      };
      
      const token = generateJWT({ userId: user.id }, c.env.JWT_SECRET || 'default-secret');
      return c.json({ user, token });
    }
    
    if (email === 'admin@example.com' && password === 'password') {
      const user = {
        id: '5',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        department: 'IT',
        avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
      };
      
      const token = generateJWT({ userId: user.id }, c.env.JWT_SECRET || 'default-secret');
      return c.json({ user, token });
    }
    
    return c.json({ message: 'Invalid credentials' }, 401);
  } catch (error) {
    console.error('Debug login error:', error);
    return c.json({ message: 'Server error' }, 500);
  }
});

// Fallback for SPA routing
app.get('*', serveStatic({ path: './index.html' }));

export default {
  async fetch(request, env, ctx) {
    // Create password_resets table if it doesn't exist
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS password_resets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          used_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();
    } catch (error) {
      console.error('Failed to create password_resets table:', error);
    }

    return app.fetch(request, env, ctx);
  }
};