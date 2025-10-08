import nodemailer from 'nodemailer';
import { logger } from '@/utils/logger';

const supportEmail = process.env.NAMECHEAP_SUPPORT_EMAIL;
const supportEmailPassword = process.env.NAMECHEAP_SUPPORT_PASSWORD;

// Ensure we have a fallback FRONTEND_URL when the env var is not set
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.USER_APP_URL || 'http://localhost:3000';

// Configure the transporter
const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com', // Namecheap SMTP host
    port: 587, // Use 587 for TLS/STARTTLS, or 465 for SSL
    secure: true, // Set to true for port 465, false for other ports
    auth: {
        user: supportEmail, // Your email address
        pass: supportEmailPassword, // Your email password
    },
    logger: true,
    debug: true,
});

interface EmailOptions {
    from?: string;
    to: string;
    subject: string;
    html: string;
}

/**
 * Send an email using Nodemailer
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
    try {
        const mailOptions = {
            from: options.from || `NexGen Support <${supportEmail}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Email sent successfully to: ${options.to}`);
    } catch (error) {
        logger.error('Error sending email:', error);
        throw new Error('Email sending failed');
    }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
    email: string,
    resetToken: string,
    userName?: string
): Promise<void> => {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .email-container {
                    background-color: #ffffff;
                    border-radius: 10px;
                    padding: 40px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 32px;
                    font-weight: bold;
                    color: #D4AF37;
                }
                h1 {
                    color: #1a1a2e;
                    font-size: 24px;
                    margin-bottom: 20px;
                }
                .token-box {
                    background: linear-gradient(135deg, #D4AF37 0%, #C9A02C 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    margin: 30px 0;
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                }
                .button {
                    display: inline-block;
                    padding: 14px 30px;
                    background: linear-gradient(135deg, #D4AF37 0%, #C9A02C 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                    margin: 20px 0;
                    text-align: center;
                }
                .info-box {
                    background-color: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #777;
                    font-size: 12px;
                }
                .security-note {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 20px;
                    font-size: 14px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <div class="logo">NEXGEN</div>
                </div>
                
                <h1>Reset Your Password</h1>
                
                <p>Hi${userName ? ` ${userName}` : ''},</p>
                
                <p>We received a request to reset your password for your NexGen account. Use the code below to reset your password:</p>
                
                <div class="token-box">
                    ${resetToken}
                </div>
                
                <div class="info-box">
                    <strong>⏰ This code will expire in 1 hour</strong>
                </div>
                
                <p>Alternatively, you can click the button below to reset your password directly:</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                
                <div class="security-note">
                    <strong>🔒 Security Tips:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Never share this code with anyone</li>
                        <li>NexGen will never ask for your password via email</li>
                        <li>If you didn't request this reset, please ignore this email</li>
                    </ul>
                </div>
                
                <p style="margin-top: 30px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                
                <div class="footer">
                    <p><strong>NexGen Cloud Mining Platform</strong></p>
                    <p>This is an automated email, please do not reply.</p>
                    <p>Need help? Contact us at support@nexgen.com</p>
                </div>
            </div>
        </body>
        </html>
    `;

    await sendEmail({
        to: email,
        subject: 'Reset Your NexGen Password',
        html,
    });
};

/**
 * Send email verification code
 */
export const sendEmailVerificationCode = async (
    email: string,
    verificationCode: string,
    userName?: string
): Promise<void> => {
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .email-container {
                    background-color: #ffffff;
                    border-radius: 10px;
                    padding: 40px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 32px;
                    font-weight: bold;
                    color: #D4AF37;
                }
                h1 {
                    color: #1a1a2e;
                    font-size: 24px;
                    margin-bottom: 20px;
                }
                .code-box {
                    background: linear-gradient(135deg, #D4AF37 0%, #C9A02C 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    margin: 30px 0;
                    font-size: 36px;
                    font-weight: bold;
                    letter-spacing: 10px;
                }
                .info-box {
                    background-color: #e7f3ff;
                    border-left: 4px solid #2196F3;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #777;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <div class="logo">NEXGEN</div>
                </div>
                
                <h1>Welcome to NexGen! 🎉</h1>
                
                <p>Hi${userName ? ` ${userName}` : ''},</p>
                
                <p>Thank you for signing up! Please verify your email address using the code below:</p>
                
                <div class="code-box">
                    ${verificationCode}
                </div>
                
                <div class="info-box">
                    <strong>ℹ️ Enter this code on the verification page to activate your account.</strong>
                </div>
                
                <p>If you didn't create an account with NexGen, you can safely ignore this email.</p>
                
                <div class="footer">
                    <p><strong>NexGen Cloud Mining Platform</strong></p>
                    <p>This is an automated email, please do not reply.</p>
                    <p>Need help? Contact us at support@nexgen.com</p>
                </div>
            </div>
        </body>
        </html>
    `;

    await sendEmail({
        to: email,
        subject: 'Verify Your NexGen Account',
        html,
    });
};

/**
 * Send welcome email after successful verification
 */
export const sendWelcomeEmail = async (
    email: string,
    userName: string
): Promise<void> => {
    const loginUrl = `${FRONTEND_URL}/login`;

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to NexGen</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .email-container {
                    background-color: #ffffff;
                    border-radius: 10px;
                    padding: 40px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 32px;
                    font-weight: bold;
                    color: #D4AF37;
                }
                h1 {
                    color: #1a1a2e;
                    font-size: 28px;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .button {
                    display: inline-block;
                    padding: 14px 30px;
                    background: linear-gradient(135deg, #D4AF37 0%, #C9A02C 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                    margin: 20px 0;
                }
                .features {
                    margin: 30px 0;
                }
                .feature-item {
                    padding: 15px;
                    margin: 10px 0;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid #D4AF37;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #777;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <div class="logo">NEXGEN</div>
                </div>
                
                <h1>Welcome to NexGen, ${userName}! 🎊</h1>
                
                <p>Your account has been successfully verified and is now active!</p>
                
                <p>You're now part of the NexGen community and ready to start your cloud mining journey.</p>
                
                <div class="features">
                    <h3 style="color: #1a1a2e;">What's Next?</h3>
                    <div class="feature-item">
                        <strong>⛏️ Start Mining</strong><br>
                        Choose from our range of mining plans and start earning.
                    </div>
                    <div class="feature-item">
                        <strong>💼 Make Investments</strong><br>
                        Explore investment opportunities and grow your portfolio.
                    </div>
                    <div class="feature-item">
                        <strong>👥 Refer Friends</strong><br>
                        Share your referral code and earn bonus rewards.
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <a href="${loginUrl}" class="button">Login to Dashboard</a>
                </div>
                
                <p style="margin-top: 30px;">If you have any questions, our support team is here to help!</p>
                
                <div class="footer">
                    <p><strong>NexGen Cloud Mining Platform</strong></p>
                    <p>This is an automated email, please do not reply.</p>
                    <p>Need help? Contact us at support@nexgen.com</p>
                </div>
            </div>
        </body>
        </html>
    `;

    await sendEmail({
        to: email,
        subject: 'Welcome to NexGen - Your Account is Active!',
        html,
    });
};

export default sendEmail;
