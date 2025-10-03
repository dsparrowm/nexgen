# Email Service Setup Guide

This guide explains how to set up and configure the email service for NexGen backend using Namecheap Private Email.

## Overview

The email service uses **Nodemailer** with **Namecheap Private Email** SMTP to send transactional emails including:
- Password reset emails with 6-digit codes
- Email verification codes for new users
- Welcome emails after successful verification

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Email Configuration (Namecheap Private Email)
NAMECHEAP_SUPPORT_EMAIL="support@yourdomain.com"
NAMECHEAP_SUPPORT_PASSWORD="your-email-password"
FRONTEND_URL="http://localhost:3000"
```

**Important:**
- Replace `support@yourdomain.com` with your actual Namecheap email address
- Replace `your-email-password` with your actual email password
- Update `FRONTEND_URL` with your production URL when deploying

### Production URLs

For production, update the `FRONTEND_URL` to your actual domain:

```env
FRONTEND_URL="https://yourdomain.com"
```

## Email Service API

### Available Functions

#### 1. `sendPasswordResetEmail(email, resetToken, userName?)`
Sends a password reset email with a 6-digit code.

**Parameters:**
- `email` (string): Recipient email address
- `resetToken` (string): 6-digit reset code
- `userName` (string, optional): User's first name for personalization

**Email includes:**
- 6-digit reset code (large, centered display)
- Reset link button (direct link to reset page with token)
- 1-hour expiration notice
- Security tips
- Professional styling with NexGen branding

**Example:**
```typescript
await sendPasswordResetEmail('user@example.com', '123456', 'John');
```

#### 2. `sendEmailVerificationCode(email, verificationCode, userName?)`
Sends an email verification code for new user signups.

**Parameters:**
- `email` (string): Recipient email address
- `verificationCode` (string): 6-digit verification code
- `userName` (string, optional): User's first name for personalization

**Email includes:**
- 6-digit verification code (large display)
- Welcome message
- Instructions to verify account
- Professional styling

**Example:**
```typescript
await sendEmailVerificationCode('user@example.com', '654321', 'Jane');
```

#### 3. `sendWelcomeEmail(email, userName)`
Sends a welcome email after successful email verification.

**Parameters:**
- `email` (string): Recipient email address
- `userName` (string): User's first name

**Email includes:**
- Welcome message with user's name
- Overview of platform features (mining, investments, referrals)
- Login button to dashboard
- Professional styling

**Example:**
```typescript
await sendWelcomeEmail('user@example.com', 'John');
```

## Integration Examples

### Password Reset Flow

In `user-auth.controller.ts`, the forgot password endpoint now sends emails:

```typescript
// Generate reset token
const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
const resetExpires = new Date(Date.now() + 3600000); // 1 hour

// Save to database
await db.prisma.user.update({
    where: { id: user.id },
    data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
    }
});

// Send email
await sendPasswordResetEmail(
    user.email,
    resetToken,
    user.firstName || undefined
);
```

### Email Verification (Future Implementation)

```typescript
// Generate verification code
const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

// Save to database
await db.prisma.user.update({
    where: { id: user.id },
    data: { verificationCode }
});

// Send verification email
await sendEmailVerificationCode(
    user.email,
    verificationCode,
    user.firstName
);
```

### Welcome Email (Future Implementation)

```typescript
// After user verifies email
await sendWelcomeEmail(user.email, user.firstName);
```

## Email Templates

All email templates include:
- **Responsive design** - Works on mobile and desktop
- **Professional styling** - Gold gradient accents matching NexGen brand
- **Security information** - Clear expiration times and security tips
- **Call-to-action buttons** - Easy-to-click buttons for main actions
- **Footer information** - Support contact and legal links

### Template Customization

To customize email templates, edit the HTML strings in `/apps/backend/src/services/email.service.ts`:

1. **Colors**: Search for `#D4AF37` (gold) and `#1a1a2e` (navy) to change brand colors
2. **Content**: Update text within `<p>`, `<h1>`, and other text elements
3. **Logo**: Replace the text logo with an `<img>` tag pointing to your logo URL
4. **Support Email**: Update `support@nexgen.com` with your actual support email

## Testing Emails

### Development Testing

1. **Set up environment variables:**
   ```bash
   cd apps/backend
   cp .env.example .env
   # Edit .env with your Namecheap credentials
   ```

2. **Test the forgot password flow:**
   ```bash
   curl -X POST http://localhost:8000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

3. **Check your inbox** for the password reset email

### Production Testing

Before deploying to production:

1. ✅ Test with a real email address you control
2. ✅ Verify all links work with production URL
3. ✅ Check email rendering in multiple clients (Gmail, Outlook, Apple Mail)
4. ✅ Verify SPF, DKIM, and DMARC records for Namecheap domain
5. ✅ Test spam score using tools like Mail-Tester

## Troubleshooting

### Email Not Sending

1. **Check SMTP credentials:**
   - Verify `NAMECHEAP_SUPPORT_EMAIL` is correct
   - Verify `NAMECHEAP_SUPPORT_PASSWORD` is correct
   - Ensure you're using the email password, not the control panel password

2. **Check network connectivity:**
   - Ensure port 465 (SSL) is not blocked by firewall
   - Test SMTP connection manually

3. **Check logs:**
   ```bash
   cd apps/backend
   tail -f logs/app.log | grep email
   ```

### Emails Going to Spam

1. **Set up SPF record** for your domain:
   ```
   v=spf1 include:spf.privateemail.com ~all
   ```

2. **Set up DKIM** through Namecheap control panel

3. **Set up DMARC record:**
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
   ```

4. **Warm up your email address** by sending increasing volumes over time

### Connection Timeout

If you get connection timeout errors:

1. Try port 587 with TLS instead of port 465 with SSL:
   ```typescript
   const transporter = nodemailer.createTransport({
       host: 'mail.privateemail.com',
       port: 587,
       secure: false, // Use TLS
       auth: {
           user: supportEmail,
           pass: supportEmailPassword,
       },
   });
   ```

## Security Best Practices

1. **Never commit credentials** - Keep `.env` file out of version control
2. **Use strong passwords** - Enable 2FA on email account if available
3. **Rotate passwords regularly** - Change email password periodically
4. **Monitor email logs** - Watch for unusual sending patterns
5. **Rate limit email sending** - Prevent abuse by limiting emails per user/IP
6. **Validate email addresses** - Check format before sending
7. **Use HTTPS links** - All email links should use HTTPS in production

## Alternative Email Providers

While this setup uses Namecheap Private Email, you can easily switch to other providers:

### SendGrid
```typescript
const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
    },
});
```

### AWS SES
```typescript
const transporter = nodemailer.createTransport({
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    auth: {
        user: process.env.AWS_SES_USER,
        pass: process.env.AWS_SES_PASSWORD,
    },
});
```

### Gmail (App Password)
```typescript
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});
```

## Email Analytics

To track email performance:

1. **Add tracking pixels** to email templates
2. **Use UTM parameters** in links
3. **Log email events** (sent, opened, clicked, bounced)
4. **Monitor delivery rates**
5. **Track user actions** after email clicks

## Compliance

### GDPR Compliance
- Include unsubscribe links in marketing emails
- Store user consent for receiving emails
- Allow users to download their data
- Implement right to be forgotten

### CAN-SPAM Compliance
- Include physical address in footer
- Honor unsubscribe requests within 10 days
- Don't use misleading subject lines
- Clearly identify emails as advertisements

## Support

For issues related to:
- **Namecheap email:** Contact Namecheap support
- **NexGen email service:** Check logs and this documentation
- **Email deliverability:** Use tools like Mail-Tester, MXToolbox

## Future Enhancements

Planned improvements:
- [ ] Email template engine (Handlebars/EJS)
- [ ] HTML/text dual versions
- [ ] Email queue with retry logic (Bull/BullMQ)
- [ ] Email analytics dashboard
- [ ] A/B testing for email content
- [ ] Internationalization (i18n) support
- [ ] Email preview before sending
- [ ] Bounce and complaint handling
