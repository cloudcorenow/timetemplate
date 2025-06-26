# 📧 SMTP Email Setup Guide

This guide shows you how to configure SMTP email notifications for your TimeOff Manager application.

## 🚀 SMTP vs API Services

### SMTP Benefits
- ✅ **Lower cost** - Use your existing email provider
- ✅ **More control** - Direct SMTP connection
- ✅ **Familiar setup** - Standard email configuration
- ✅ **No vendor lock-in** - Works with any SMTP server

### API Services Benefits
- ✅ **Easier setup** - Just API keys
- ✅ **Better deliverability** - Optimized for transactional emails
- ✅ **Built-in analytics** - Tracking and reporting
- ✅ **Higher reliability** - Managed infrastructure

## 🔧 SMTP Configuration Options

### Option 1: Gmail SMTP (Recommended for Testing)

```bash
# Set these as Cloudflare Workers secrets
wrangler secret put SMTP_HOST
# Enter: smtp.gmail.com

wrangler secret put SMTP_PORT
# Enter: 587

wrangler secret put SMTP_USER
# Enter: your-email@gmail.com

wrangler secret put SMTP_PASS
# Enter: your-app-password (not your regular password!)

wrangler secret put SMTP_SECURE
# Enter: false
```

#### Gmail App Password Setup:
1. **Enable 2FA** on your Google account
2. **Go to** [Google App Passwords](https://myaccount.google.com/apppasswords)
3. **Generate** an app password for "Mail"
4. **Use this password** (not your regular Gmail password)

### Option 2: Outlook/Hotmail SMTP

```bash
wrangler secret put SMTP_HOST
# Enter: smtp-mail.outlook.com

wrangler secret put SMTP_PORT
# Enter: 587

wrangler secret put SMTP_USER
# Enter: your-email@outlook.com

wrangler secret put SMTP_PASS
# Enter: your-password

wrangler secret put SMTP_SECURE
# Enter: false
```

### Option 3: Custom SMTP Server

```bash
wrangler secret put SMTP_HOST
# Enter: mail.your-domain.com

wrangler secret put SMTP_PORT
# Enter: 587 (or 465 for SSL)

wrangler secret put SMTP_USER
# Enter: noreply@your-domain.com

wrangler secret put SMTP_PASS
# Enter: your-smtp-password

wrangler secret put SMTP_SECURE
# Enter: false (or true for port 465)
```

### Option 4: SMTP Relay Service

For production use, you can set up an SMTP relay service:

```bash
wrangler secret put SMTP_RELAY_URL
# Enter: https://your-smtp-relay.herokuapp.com/send
```

## 🏗️ SMTP Relay Service (Optional)

If you want to use SMTP in Cloudflare Workers, you'll need an SMTP relay service since Workers can't make direct SMTP connections.

### Simple Node.js SMTP Relay

Create a simple relay service using Node.js and deploy it to Heroku, Railway, or any Node.js hosting:

```javascript
// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const app = express();

app.use(express.json());

app.post('/send', async (req, res) => {
  try {
    const { smtp, message } = req.body;
    
    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.auth.user,
        pass: smtp.auth.pass
      }
    });

    // Send email
    await transporter.sendMail({
      from: `"${message.from.name}" <${message.from.email}>`,
      to: message.to.map(t => t.email).join(', '),
      subject: message.subject,
      html: message.html,
      text: message.text
    });

    res.json({ success: true });
  } catch (error) {
    console.error('SMTP Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3000);
```

```json
// package.json
{
  "name": "smtp-relay",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "nodemailer": "^6.9.1"
  },
  "scripts": {
    "start": "node server.js"
  }
}
```

Deploy this to Heroku or Railway, then set the URL as `SMTP_RELAY_URL`.

## 📋 Complete Setup Steps

### 1. Choose Your SMTP Provider

Pick one of the options above (Gmail recommended for testing).

### 2. Set Environment Variables

```bash
# Basic SMTP configuration
wrangler secret put SMTP_HOST
wrangler secret put SMTP_PORT
wrangler secret put SMTP_USER
wrangler secret put SMTP_PASS
wrangler secret put SMTP_SECURE

# Optional: SMTP relay service
wrangler secret put SMTP_RELAY_URL

# From email address
wrangler secret put FROM_EMAIL
# Enter: noreply@your-domain.com
```

### 3. Test Configuration

```bash
# Check your configuration
curl https://your-app.workers.dev/api/debug/email-config \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 4. Send Test Email

Use the admin interface:
1. **Login as admin**
2. **Go to Employee Management**
3. **Click the 📧 icon** next to any user
4. **Send a test email**

Or use the API:

```bash
curl -X POST https://your-app.workers.dev/api/test-email \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "SMTP Test Email",
    "message": "This is a test email using SMTP configuration",
    "type": "info"
  }'
```

## 🔍 Troubleshooting

### Common SMTP Issues

#### 1. Authentication Failed
```
Error: Invalid login: 535 Authentication failed
```

**Solutions:**
- Check username/password
- Enable "Less secure app access" (Gmail)
- Use app passwords instead of regular passwords
- Check 2FA settings

#### 2. Connection Timeout
```
Error: Connection timeout
```

**Solutions:**
- Check SMTP host and port
- Verify firewall settings
- Try different ports (587, 465, 25)
- Check if your ISP blocks SMTP

#### 3. TLS/SSL Issues
```
Error: unable to verify the first certificate
```

**Solutions:**
- Set `SMTP_SECURE=false` for port 587
- Set `SMTP_SECURE=true` for port 465
- Check TLS/SSL settings

#### 4. Rate Limiting
```
Error: 550 Daily sending quota exceeded
```

**Solutions:**
- Check your email provider's limits
- Implement rate limiting in your app
- Consider upgrading your email plan

### Debug SMTP Configuration

Check your SMTP settings:

```bash
# View configuration (admin only)
curl https://your-app.workers.dev/api/debug/email-config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "hasAPIService": false,
  "hasSMTPService": true,
  "emailService": "Not configured",
  "smtpHost": "Configured",
  "smtpPort": "587",
  "smtpUser": "Configured",
  "smtpSecure": "false",
  "fromEmail": "noreply@timeoff-manager.com",
  "smtpRelayUrl": "Not configured"
}
```

## 📊 SMTP Provider Comparison

| Provider | Free Tier | Setup Difficulty | Reliability | Notes |
|----------|-----------|------------------|-------------|-------|
| **Gmail** | 500 emails/day | Easy | High | Requires app password |
| **Outlook** | 300 emails/day | Easy | High | Good for Microsoft users |
| **SendGrid** | 100 emails/day | Medium | Very High | API + SMTP options |
| **Mailgun** | 5,000 emails/month | Medium | Very High | Developer-friendly |
| **Custom Server** | Unlimited* | Hard | Variable | Requires server management |

*Subject to server resources and ISP limits

## 🔒 Security Best Practices

### 1. Use App Passwords
- **Never use** your main email password
- **Always use** app-specific passwords
- **Enable 2FA** on your email account

### 2. Secure Credentials
- **Store secrets** in Cloudflare Workers secrets
- **Never commit** credentials to code
- **Rotate passwords** regularly

### 3. Rate Limiting
- **Implement** email rate limiting
- **Monitor** sending volumes
- **Respect** provider limits

### 4. Email Authentication
- **Set up SPF** records for your domain
- **Configure DKIM** if possible
- **Use proper** from addresses

## 🎯 Production Recommendations

### For Small Teams (< 50 users)
- **Gmail SMTP** with app password
- **Simple setup** and reliable
- **Monitor usage** to stay within limits

### For Medium Teams (50-500 users)
- **SendGrid** or **Mailgun** SMTP
- **Better deliverability** and analytics
- **Higher limits** and professional features

### For Large Teams (500+ users)
- **Dedicated email service** (SendGrid, Mailgun)
- **Custom SMTP server** with proper infrastructure
- **Email authentication** (SPF, DKIM, DMARC)
- **Monitoring and alerting**

## ✅ Setup Checklist

- [ ] **SMTP provider** chosen and configured
- [ ] **Environment variables** set as secrets
- [ ] **From email** configured
- [ ] **Test email** sent successfully
- [ ] **Error handling** tested
- [ ] **Rate limits** understood
- [ ] **Security** measures in place
- [ ] **Monitoring** set up (optional)

## 🔄 Fallback Strategy

The system automatically tries SMTP first, then falls back to API services:

1. **SMTP configured?** → Try SMTP
2. **SMTP fails?** → Try API service (if configured)
3. **Both fail?** → Log error, continue with in-app notifications

This ensures maximum reliability for your email notifications.

---

**Your TimeOff Manager now supports SMTP email notifications! 📧✨**

Need help? Check the [main README](../README.md) or the [Email Setup Guide](./EMAIL_SETUP_GUIDE.md).