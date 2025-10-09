import { Resend } from 'resend';
import { render } from '@react-email/render';
import React from 'react';
import { logger } from '@/utils/logger';
import { EmailVerificationTemplate, WelcomeEmailTemplate } from '@/templates/emails';

const resend = new Resend(process.env.RESEND_API_KEY);

// Ensure we have a fallback FRONTEND_URL when the env var is not set
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.USER_APP_URL || 'http://localhost:3000';

interface EmailOptions {
    from?: string;
    to: string;
    subject: string;
    html: string;
    headers?: Record<string, string>;
}

/**
 * Send an email using Resend
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
    try {
        const { data, error } = await resend.emails.send({
            from: options.from || `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            headers: {
                'X-Entity-Ref-ID': Date.now().toString(),
                'List-Unsubscribe': `<mailto:${process.env.FROM_EMAIL}?subject=unsubscribe>`,
                ...options.headers,
            },
        });

        if (error) {
            throw new Error(error.message);
        }

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
    try {
        console.log('🔄 Starting email verification for:', email, 'userName:', userName);

        // Create HTML directly for testing
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
        </head>
        <body>
            <h1>Welcome to NexGen!</h1>
            <p>Hi${userName ? ` ${userName}` : ''},</p>
            <p>Please verify your email with code: <strong>${verificationCode}</strong></p>
            <p><a href="${FRONTEND_URL}/verify-email">Verify Email</a></p>
        </body>
        </html>
        `;

        console.log('✅ HTML created, length:', html.length);

        await sendEmail({
            to: email,
            subject: 'Please verify your NexGen account email address',
            html,
        });
        console.log('✅ Email sent successfully to:', email);
    } catch (error) {
        console.error('❌ Failed to send verification email to:', email, error);
        throw error;
    }
};

/**
 * Send welcome email after successful verification
 */
export const sendWelcomeEmail = async (
    email: string,
    userName: string
): Promise<void> => {
    const loginUrl = `${FRONTEND_URL}/login`;

    const html = await render(
        React.createElement(WelcomeEmailTemplate, {
            userName,
            loginUrl,
        })
    );

    await sendEmail({
        to: email,
        subject: 'Welcome to NexGen - Your Account is Active!',
        html,
    });
};

export default sendEmail;
