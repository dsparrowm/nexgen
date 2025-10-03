/**
 * Email Service Test Script
 * 
 * This script tests the email service functionality without needing to run the full server.
 * Useful for verifying SMTP credentials and email templates.
 * 
 * Usage: 
 *   npm run test:email
 *   OR
 *   TEST_EMAIL="your-email@gmail.com" npm run test:email
 *   OR
 *   ts-node -r tsconfig-paths/register scripts/test-email.ts
 */

import dotenv from 'dotenv';
import * as readline from 'readline';
import { sendPasswordResetEmail, sendEmailVerificationCode, sendWelcomeEmail } from '../src/services/email.service';
import { logger } from '../src/utils/logger';

// Load environment variables
dotenv.config();

// Get test email from args, env, or prompt
const getTestEmail = async (): Promise<string> => {
    // Check command line arguments first
    const emailArg = process.argv.find(arg => arg.includes('@'));
    if (emailArg) {
        return emailArg;
    }

    // Check environment variable
    if (process.env.TEST_EMAIL && process.env.TEST_EMAIL !== 'your-test-email@example.com') {
        return process.env.TEST_EMAIL;
    }

    // Prompt user for email
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('\n📧 Enter the email address to send test emails to: ', (email) => {
            rl.close();
            resolve(email.trim());
        });
    });
};

let TEST_EMAIL: string;

async function testEmails() {
    console.log('\n🧪 Starting Email Service Tests...\n');

    // Check if required environment variables are set
    if (!process.env.NAMECHEAP_SUPPORT_EMAIL || !process.env.NAMECHEAP_SUPPORT_PASSWORD) {
        console.error('❌ Error: Email credentials not configured');
        console.error('Please set NAMECHEAP_SUPPORT_EMAIL and NAMECHEAP_SUPPORT_PASSWORD in .env file');
        process.exit(1);
    }

    if (!process.env.FRONTEND_URL) {
        console.warn('⚠️  Warning: FRONTEND_URL not set, using default: http://localhost:3000');
    }

    // Get test email (from args, env, or prompt user)
    TEST_EMAIL = await getTestEmail();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(TEST_EMAIL)) {
        console.error(`❌ Error: Invalid email format: ${TEST_EMAIL}`);
        console.error('Please provide a valid email address');
        process.exit(1);
    }

    console.log('📧 Email Configuration:');
    console.log(`   From: ${process.env.NAMECHEAP_SUPPORT_EMAIL}`);
    console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`   Test recipient: ${TEST_EMAIL}\n`);

    try {
        // Test 1: Password Reset Email
        console.log('1️⃣  Testing Password Reset Email...');
        await sendPasswordResetEmail(TEST_EMAIL, '123456', 'Test User');
        console.log('✅ Password reset email sent successfully!\n');

        // Wait 2 seconds between emails
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 2: Email Verification Code
        console.log('2️⃣  Testing Email Verification Code...');
        await sendEmailVerificationCode(TEST_EMAIL, '654321', 'Test User');
        console.log('✅ Verification code email sent successfully!\n');

        // Wait 2 seconds between emails
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 3: Welcome Email
        console.log('3️⃣  Testing Welcome Email...');
        await sendWelcomeEmail(TEST_EMAIL, 'Test User');
        console.log('✅ Welcome email sent successfully!\n');

        console.log('🎉 All email tests completed successfully!');
        console.log(`\n📬 Check your inbox at: ${TEST_EMAIL}\n`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Email test failed:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
        }
        console.error('\nTroubleshooting steps:');
        console.error('1. Verify SMTP credentials in .env file');
        console.error('2. Check if email account is active');
        console.error('3. Ensure port 465 (SSL) is not blocked');
        console.error('4. Try using port 587 (TLS) instead');
        console.error('5. Check backend logs for detailed error information\n');
        process.exit(1);
    }
}

// Run the tests
testEmails();
