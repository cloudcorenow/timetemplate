# 📧 Email Notifications Setup Guide

This guide will help you configure email notifications for your TimeOff Manager application using Cloudflare Email Workers.

## 🚀 Quick Setup

### 1. Choose Your Email Service

#### Option A: Resend (Recommended)
```bash
# Sign up at https://resend.com
# Get your API key from the dashboard
```

#### Option B: SendGrid
```bash
# Sign up at https://sendgrid.com
# Get your API key from the dashboard
```

#### Option C: Cloudflare Email Routing
```bash
# Set up email routing in Cloudflare dashboard
# Configure your domain for email
```

### 2. Set Environment Variables

In your Cloudflare Workers dashboard, add these secrets:

```bash
# Using Wrangler CLI
wrangler secret put EMAIL_SERVICE
# Enter: https://api.resend.com (or your email service URL)

wrangler secret put EMAIL_API_KEY
# Enter: your-email-api-key-here

wrangler secret put FROM_EMAIL
# Enter: noreply@your-domain.com
```

### 3. Update wrangler.toml

```toml
[vars]
NODE_ENV = "production"
APP_URL = "https://your-timeoff-app.workers.dev"
FROM_EMAIL = "noreply@your-domain.com"

# These should be set as secrets (not in vars)
# EMAIL_SERVICE = "https://api.resend.com"
# EMAIL_API_KEY = "your-api-key"
```

### 4. Deploy

```bash
npm run cf:deploy
```

## 📋 Email Service Configuration

### Resend Setup

1. **Sign up**: Go to [resend.com](https://resend.com)
2. **Verify domain**: Add your domain and verify DNS records
3. **Get API key**: Copy your API key from the dashboard
4. **Set secrets**:
   ```bash
   wrangler secret put EMAIL_SERVICE
   # Enter: https://api.resend.com
   
   wrangler secret put EMAIL_API_KEY
   # Enter: re_xxxxxxxxxx
   ```

### SendGrid Setup

1. **Sign up**: Go to [sendgrid.com](https://sendgrid.com)
2. **Verify sender**: Add and verify your sender email
3. **Create API key**: Generate an API key with mail send permissions
4. **Set secrets**:
   ```bash
   wrangler secret put EMAIL_SERVICE
   # Enter: https://api.sendgrid.com/v3
   
   wrangler secret put EMAIL_API_KEY
   # Enter: SG.xxxxxxxxxx
   ```

### Custom Email Service

For other email services, update the `sendEmailNotification` function in `src/worker.js`:

```javascript
async function sendEmailNotification(env, to, subject, message, type = 'info', actionUrl = null) {
  try {
    // Your custom email service implementation
    const response = await fetch(`${env.EMAIL_SERVICE}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Your email service's expected format
        from: env.FROM_EMAIL,
        to: to,
        subject: subject,
        html: await generateEmailTemplate(subject, message, type, actionUrl)
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}
```

## 🎨 Email Templates

The system includes beautiful, responsive email templates:

### Template Features
- **Responsive design** for mobile and desktop
- **Color-coded by type** (info, success, warning, error)
- **Professional branding** with TimeOff Manager logo
- **Call-to-action buttons** linking back to the app
- **Clean typography** and proper spacing

### Template Types

#### 1. Request Notifications
```html
✅ Your Time-Off Request Has Been Approved!
📋 New Time-Off Request Requires Your Review
❌ Your Time-Off Request Needs Attention
```

#### 2. System Notifications
```html
🔑 Your Password Has Been Reset
🎉 Welcome to TimeOff Manager!
⚠️ Important Account Update
```

### Customizing Templates

Edit the `generateEmailTemplate` function in `src/worker.js`:

```javascript
async function generateEmailTemplate(subject, message, type = 'info', actionUrl = null) {
  const colors = {
    info: '#2563eb',      // Blue
    success: '#059669',   // Green
    warning: '#d97706',   // Amber
    error: '#dc2626'      // Red
  }

  // Your custom template HTML here
  return `<!DOCTYPE html>...`
}
```

## 🔧 Testing Email Functionality

### 1. Test Email Endpoint

Send a test email via the API:

```bash
curl -X POST https://your-app.workers.dev/api/test-email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "message": "This is a test email from TimeOff Manager",
    "type": "info"
  }'
```

### 2. Admin Test Interface

Use the Employee Management page to send test emails:

1. Go to **Employee Management** (admin only)
2. Click the **📧 Mail** icon next to any employee
3. Fill in test email details
4. Click **Send Test Email**

### 3. Trigger Real Notifications

Test the full flow:

1. **Submit a request** as an employee
2. **Check manager email** for new request notification
3. **Approve/reject** the request as a manager
4. **Check employee email** for status update

## 📊 Email Analytics

### Tracking Email Delivery

Most email services provide delivery analytics:

#### Resend Analytics
- Open rates
- Click rates
- Bounce rates
- Delivery status

#### SendGrid Analytics
- Detailed delivery reports
- Real-time event webhooks
- Engagement tracking

### Custom Analytics

Add tracking to your emails:

```javascript
// Add tracking parameters to action URLs
const actionUrl = `${env.APP_URL}?utm_source=email&utm_campaign=timeoff_notification`

// Log email events
console.log(`📧 Email sent: ${type} to ${to} - ${subject}`)
```

## 🔒 Security & Privacy

### Email Security
- **SPF/DKIM**: Configure proper email authentication
- **Rate limiting**: Prevent email spam
- **Unsubscribe**: Include unsubscribe options
- **Data privacy**: Follow GDPR/privacy regulations

### User Preferences
Users can control email notifications:

1. **Header menu** → **Email Settings**
2. **Toggle notifications** on/off
3. **Preferences saved** to database

## 🚨 Troubleshooting

### Common Issues

#### 1. Emails Not Sending
```bash
# Check environment variables
wrangler secret list

# Check logs
wrangler tail

# Test API endpoint
curl https://your-app.workers.dev/health
```

#### 2. Invalid API Key
```bash
# Update the secret
wrangler secret put EMAIL_API_KEY
```

#### 3. Domain Not Verified
- Verify your domain with your email service
- Check DNS records
- Wait for propagation (up to 24 hours)

#### 4. Emails Going to Spam
- Set up SPF/DKIM records
- Use a verified domain
- Avoid spam trigger words
- Include unsubscribe links

### Debug Mode

Enable detailed logging:

```javascript
// In worker.js
console.log('📧 Email debug:', {
  to,
  subject,
  service: env.EMAIL_SERVICE,
  hasApiKey: !!env.EMAIL_API_KEY
})
```

## 📈 Production Checklist

- [ ] **Domain verified** with email service
- [ ] **SPF/DKIM records** configured
- [ ] **API keys** set as secrets (not in code)
- [ ] **From email** configured properly
- [ ] **Rate limiting** enabled
- [ ] **Error handling** implemented
- [ ] **User preferences** working
- [ ] **Test emails** successful
- [ ] **Templates** look good on mobile
- [ ] **Analytics** tracking enabled

## 🎯 Next Steps

1. **Set up your email service** (Resend recommended)
2. **Configure environment variables**
3. **Test email functionality**
4. **Customize email templates**
5. **Monitor email delivery**
6. **Gather user feedback**

---

**Your TimeOff Manager now has professional email notifications! 📧✨**

Need help? Check the [main README](../README.md) or create an issue.