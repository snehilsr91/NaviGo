# Email Configuration Guide

## Setup Instructions

To enable email notifications when events are approved, you need to configure SMTP settings.

### Option 1: Gmail (Quick Setup)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Enter "NaviGo" as the app name
   - Copy the generated 16-character password

3. **Set Environment Variables**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

### Option 2: SendGrid (Recommended for Production)

1. **Create a SendGrid account** (free tier available)
2. **Create an API Key**:
   - Go to SendGrid → Settings → API Keys
   - Create a new API Key with "Mail Send" permissions
   - Copy the API key

3. **Set Environment Variables**:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   ```

### Option 3: Other SMTP Services

You can use any SMTP service (Mailgun, AWS SES, etc.). Just configure:

```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_SECURE=false  # or true for port 465
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Testing

1. Set the environment variables in your `.env` file
2. Restart the backend server
3. Approve an event booking request
4. Check the organizer's email inbox

## Note

If email is not configured, the system will continue to work normally but will log a warning and skip sending emails. Event approvals will still work without email configuration.

