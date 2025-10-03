# 🚀 Quick Start: Email Service Setup

This is a quick guide to get your email service up and running in 5 minutes.

## Step 1: Configure Environment Variables

1. Open `/apps/backend/.env` file
2. Update these three variables with your Namecheap credentials:

```env
NAMECHEAP_SUPPORT_EMAIL="support@yourdomain.com"
NAMECHEAP_SUPPORT_PASSWORD="your-actual-password"
FRONTEND_URL="http://localhost:3000"
```

**Where to find these:**
- `NAMECHEAP_SUPPORT_EMAIL`: Your Namecheap Private Email address
- `NAMECHEAP_SUPPORT_PASSWORD`: Your email password (from Namecheap control panel)
- `FRONTEND_URL`: Keep as `http://localhost:3000` for development

## Step 2: Test the Email Service

Run the test script to verify everything works:

```bash
cd apps/backend
npm run test:email
```

**Expected output:**
```
🧪 Starting Email Service Tests...

📧 Email Configuration:
   From: support@yourdomain.com
   Frontend URL: http://localhost:3000
   Test recipient: your-test-email@example.com

1️⃣  Testing Password Reset Email...
✅ Password reset email sent successfully!

2️⃣  Testing Email Verification Code...
✅ Verification code email sent successfully!

3️⃣  Testing Welcome Email...
✅ Welcome email sent successfully!

🎉 All email tests completed successfully!

📬 Check your inbox at: your-test-email@example.com
```

## Step 3: Check Your Inbox

You should receive 3 emails:
1. **Password Reset Email** - with 6-digit code and reset link
2. **Email Verification Code** - with 6-digit verification code
3. **Welcome Email** - with login button and feature highlights

## Step 4: Test the Forgot Password Flow

1. **Start the backend server:**
   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   cd apps/user
   npm run dev
   ```

3. **Test the flow:**
   - Go to http://localhost:3000/login
   - Click "Forgot password?"
   - Enter your email address
   - Submit the form
   - Check your email for the reset code
   - Use the code or link to reset your password

## Troubleshooting

### ❌ "Email sending failed"

**Check your credentials:**
```bash
# Verify these are set correctly in .env
echo $NAMECHEAP_SUPPORT_EMAIL
echo $NAMECHEAP_SUPPORT_PASSWORD
```

**Common issues:**
- Using control panel password instead of email password
- Email address typo
- Password has special characters that need escaping

### ❌ "Connection timeout"

**Try using port 587 with TLS:**

Edit `/apps/backend/src/services/email.service.ts`:
```typescript
const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 587,        // Changed from 465
    secure: false,    // Changed from true
    auth: {
        user: supportEmail,
        pass: supportEmailPassword,
    },
});
```

### ❌ Emails going to spam

**Set up SPF record** in your domain DNS:
```
v=spf1 include:spf.privateemail.com ~all
```

**Enable DKIM** in Namecheap control panel:
- Login to Namecheap
- Go to Private Email settings
- Enable DKIM authentication
- Add the DKIM record to your DNS

## Production Deployment

Before deploying to production:

1. **Update FRONTEND_URL** in `.env`:
   ```env
   FRONTEND_URL="https://yourdomain.com"
   ```

2. **Set up DNS records** (SPF, DKIM, DMARC)

3. **Test in production environment** with real email addresses

4. **Monitor email logs** for first few days

## Next Steps

✅ Email service is now configured!

**Optional enhancements:**
- [ ] Add email templates for other flows (account suspension, payment confirmation)
- [ ] Set up email queue for better reliability (Bull/BullMQ)
- [ ] Add email analytics tracking
- [ ] Implement unsubscribe functionality for marketing emails
- [ ] Add email rate limiting per user

## Support

- **Detailed documentation:** See `/apps/backend/EMAIL_SETUP.md`
- **Test script:** Run `npm run test:email`
- **Logs:** Check `/apps/backend/logs/app.log`

---

**That's it! Your email service is ready to use.** 🎉
