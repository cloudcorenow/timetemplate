# 📧 Email Notifications Setup Guide

This guide will help you configure email notifications for your TimeOff Manager application using either **SMTP** or **API-based services**.

## 🚀 Quick Setup Options

### Option 1: SMTP (Recommended for Cost)
Use your existing email provider (Gmail, Outlook, etc.) via SMTP.

### Option 2: API Services (Recommended for Reliability)
Use dedicated email services like Resend, SendGrid, etc.

## 📧 SMTP Configuration

### Gmail SMTP Setup

1. **Enable 2FA** on your Google account
2. **Generate App Password**:
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Generate password for "Mail"
3. **Set Cloudflare secrets**:

```bash
wrangler secret put SMTP_HOST
# Enter: smtp.gmail.com

wrangler secret put SMTP_PORT
# Enter: 587

wrangler secret put SMTP_USER
# Enter: your-email@gmail.com

wrangler secret put SMTP_PASS
# Enter: your-16-character-app-password

wrangler secret put SMTP_SECURE
# Enter: false

wrangler secret put FROM_EMAIL
# Enter: your-email@gmail.com
```

### Outlook SMTP Setup

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

wrangler secret put FROM_EMAIL
# Enter: your-email@outlook.com
```

### Custom SMTP Server

```bash
wrangler secret put SMTP_HOST
# Enter: mail.your-domain.com

wrangler secret put SMTP_PORT
# Enter: 587

wrangler secret put SMTP_USER
# Enter: noreply@your-domain.com

wrangler secret put SMTP_PASS
# Enter: your-smtp-password

wrangler secret put SMTP_SECURE
# Enter: false

wrangler secret put FROM_EMAIL
# Enter: noreply@your-domain.com
```

## 🌐 API Services Configuration

### Resend Setup (Recommended)

1. **Sign up** at [resend.com](https://resend.com)
2. **Verify your domain** (optional but recommended)
3. **Get API key** from dashboard
4. **Set secrets**:

```bash
wrangler secret put EMAIL_SERVICE
# Enter: https://api.resend.com

wrangler secret put EMAIL_API_KEY
# Enter: re_xxxxxxxxxx

wrangler secret put FROM_EMAIL
# Enter: noreply@your-domain.com
```

### SendGrid Setup

1. **Sign up** at [sendgrid.com](https://sendgrid.com)
2. **Verify sender** email/domain
3. **Create API key** with mail send permissions
4. **Set secrets**:

```bash
wrangler secret put EMAIL_SERVICE
# Enter: https://api.sendgrid.com/v3

wrangler secret put EMAIL_API_KEY
# Enter: SG.xxxxxxxxxx

wrangler secret put FROM_EMAIL
# Enter: noreply@your-domain.com
```

## 🔧 SMTP Relay Service (Advanced)

Since Cloudflare Workers can't make direct SMTP connections, you can optionally set up an SMTP relay service:

### Simple Node.js SMTP Relay

Deploy this to Heroku, Railway, or any Node.js hosting:

```javascript
// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const app = express();

app.use(express.json());

app.post('/send', async (req, res) => {
  try {
    const { smtp, message } = req.body;
    
    const transporter = nodemailer.createTransporter({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.auth
    });

    await transporter.sendMail({
      from: `"${message.from.name}" <${message.from.email}>`,
      to: message.to.map(t => t.email).join(', '),
      subject: message.subject,
      html: message.html,
      text: message.text
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3000);
```

Then set the relay URL:

```bash
wrangler secret put SMTP_RELAY_URL
# Enter: https://your-smtp-relay.herokuapp.com/send
```

## 🧪 Testing Email Configuration

### 1. Check Configuration

```bash
curl https://your-app.workers.dev/api/debug/email-config \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 2. Send Test Email

**Via Admin Interface:**
1. Login as admin
2. Go to Employee Management
3. Click 📧 icon next to any user
4. Send test email

**Via API:**
```bash
curl -X POST https://your-app.workers.dev/api/test-email \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "message": "This is a test email from TimeOff Manager",
    "type": "info"
  }'
```

### 3. Trigger Real Notifications

1. **Submit a request** as an employee
2. **Check manager email** for notification
3. **Approve/reject** as manager
4. **Check employee email** for status update

## 🎨 Email Templates

The system includes beautiful, responsive email templates:

### Template Features
- **Responsive design** for all devices
- **Color-coded by type** (info, success, warning, error)
- **Professional branding**
- **Call-to-action buttons**
- **Clean typography**

### Email Types
- ✅ **Request Approved** - Green theme with celebration
- ❌ **Request Rejected** - Red theme with explanation
- 📋 **New Request** - Blue theme for managers
- 🔑 **Password Reset** - Amber theme for security
- 🎉 **Welcome** - Purple theme for new users

## 🔍 Troubleshooting

### Common SMTP Issues

**Authentication Failed:**
- Use app passwords, not regular passwords
- Enable 2FA and generate app-specific password
- Check username/password spelling

**Connection Timeout:**
- Verify SMTP host and port
- Check firewall settings
- Try different ports (587, 465)

**TLS/SSL Issues:**
- Use `SMTP_SECURE=false` for port 587
- Use `SMTP_SECURE=true` for port 465

### Common API Issues

**Invalid API Key:**
- Regenerate API key in service dashboard
- Check key format and permissions

**Domain Not Verified:**
- Verify your domain with the email service
- Check DNS records
- Wait for propagation (up to 24 hours)

**Rate Limiting:**
- Check your service's sending limits
- Upgrade plan if needed
- Implement rate limiting in app

### Debug Information

Check the health endpoint:
```bash
curl https://your-app.workers.dev/health
```

Response shows email configuration status:
```json
{
  "status": "OK",
  "features": {
    "email_api": true,
    "email_smtp": false,
    "email_configured": true
  }
}
```

## 📊 Service Comparison

| Service | Free Tier | Setup | Reliability | Best For |
|---------|-----------|-------|-------------|----------|
| **Gmail SMTP** | 500/day | Easy | High | Testing, small teams |
| **Outlook SMTP** | 300/day | Easy | High | Microsoft users |
| **Resend** | 3,000/month | Easy | Very High | Modern apps |
| **SendGrid** | 100/day | Medium | Very High | Enterprise |
| **Custom SMTP** | Varies | Hard | Variable | Full control |

## 🔒 Security Best Practices

### Email Security
- **Use app passwords** for Gmail/Outlook
- **Store secrets** in Cloudflare Workers secrets
- **Never commit** credentials to code
- **Enable 2FA** on email accounts

### Domain Authentication
- **Set up SPF** records: `v=spf1 include:_spf.google.com ~all`
- **Configure DKIM** if supported
- **Add DMARC** policy for advanced protection

### Rate Limiting
- **Monitor** sending volumes
- **Respect** provider limits
- **Implement** app-level rate limiting

## 🎯 Production Recommendations

### Small Teams (< 50 users)
- **Gmail SMTP** with app password
- **Simple and reliable**
- **Monitor daily limits**

### Medium Teams (50-500 users)
- **Resend** or **SendGrid**
- **Better deliverability**
- **Professional features**

### Large Teams (500+ users)
- **Dedicated email service**
- **Custom domain setup**
- **Advanced authentication**
- **Monitoring and analytics**

## 🔄 Fallback Strategy

The system automatically tries multiple methods:

1. **SMTP configured?** → Try SMTP first
2. **SMTP fails?** → Fall back to API service
3. **Both fail?** → Continue with in-app notifications only

This ensures maximum reliability for your notifications.

## ✅ Setup Checklist

- [ ] **Email service** chosen and configured
- [ ] **Environment variables** set as secrets
- [ ] **From email** configured properly
- [ ] **Test email** sent successfully
- [ ] **Real notifications** working
- [ ] **Error handling** tested
- [ ] **Rate limits** understood
- [ ] **Security measures** in place

## 📈 Monitoring

### Email Analytics
- **Track delivery rates** in service dashboard
- **Monitor bounce rates**
- **Check spam reports**
- **Review engagement metrics**

### Application Logs
```bash
# View real-time logs
wrangler tail

# Filter for email events
wrangler tail --search="email"
```

### Health Monitoring
```bash
# Regular health checks
curl https://your-app.workers.dev/health
```

---

**Your TimeOff Manager now has professional email notifications! 📧✨**

Choose SMTP for cost-effectiveness or API services for maximum reliability. Both options provide beautiful, responsive email templates that enhance your users' experience.

Need help? Check the [SMTP Setup Guide](./SMTP_SETUP_GUIDE.md) for detailed SMTP configuration.