import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User, UserRole, TransactionType, TransactionStatus } from '@prisma/client';
import db from '@/services/database';
import { generateUserToken, generateTokenPair, JWTPayload } from '@/utils/jwt';
import { hashPassword, verifyPassword } from '@/utils/password';
import { logger } from '@/utils/logger';
import { createError } from '@/middlewares/error.middleware';
import { sendPasswordResetEmail, sendEmailVerificationCode, sendWelcomeEmail } from '@/services/email.service';

export interface AuthRequest extends Request {
    user?: JWTPayload;
}

/**
 * User login controller
 */
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    details: errors.array()
                }
            });
            return;
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await db.prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid email or password',
                    code: 'INVALID_CREDENTIALS'
                }
            });
            return;
        }

        // Check if user is active
        if (!user.isActive) {
            res.status(403).json({
                success: false,
                error: {
                    message: 'Account is deactivated',
                    code: 'ACCOUNT_DEACTIVATED'
                }
            });
            return;
        }

        // Verify password
        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid email or password',
                    code: 'INVALID_CREDENTIALS'
                }
            });
            return;
        }

        // Generate tokens
        const tokenPayload: JWTPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            type: 'user'
        };

        const tokens = generateTokenPair(tokenPayload);

        // Create session record
        await db.prisma.session.create({
            data: {
                userId: user.id,
                token: tokens.refreshToken,
                refreshToken: tokens.refreshToken,
                userAgent: req.get('User-Agent') || undefined,
                ipAddress: req.ip,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            }
        });

        // Log successful login
        logger.info(`User login successful: ${user.email}`, {
            userId: user.id,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Return user data and tokens
        const userData = {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isVerified: user.isVerified,
            balance: user.balance,
            totalInvested: user.totalInvested,
            totalEarnings: user.totalEarnings,
            createdAt: user.createdAt
        };

        res.status(200).json({
            success: true,
            data: {
                user: userData,
                tokens
            },
            message: 'Login successful'
        });

    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'LOGIN_FAILED'
            }
        });
    }
};

/**
 * User registration controller
 */
export const register = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    details: errors.array()
                }
            });
            return;
        }

        const {
            email,
            username,
            password,
            firstName,
            lastName,
            phoneNumber,
            country,
            referralCode
        } = req.body;

        // Check if email already exists
        const existingEmail = await db.prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingEmail) {
            res.status(409).json({
                success: false,
                error: {
                    message: 'Email already registered',
                    code: 'EMAIL_EXISTS'
                }
            });
            return;
        }

        // Check if username already exists
        const existingUsername = await db.prisma.user.findUnique({
            where: { username }
        });

        if (existingUsername) {
            res.status(409).json({
                success: false,
                error: {
                    message: 'Username already taken',
                    code: 'USERNAME_EXISTS'
                }
            });
            return;
        }

        // Find referrer if referral code provided
        let referrerId: string | null = null;
        if (referralCode) {
            const referrer = await db.prisma.user.findUnique({
                where: { referralCode }
            });
            referrerId = referrer?.id || null;
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Generate unique referral code
        const userReferralCode = `${username}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour from now

        // Create user
        const user = await db.prisma.user.create({
            data: {
                email: email.toLowerCase(),
                username,
                password: hashedPassword,
                firstName,
                lastName,
                phoneNumber,
                country,
                referralCode: userReferralCode,
                referredBy: referrerId,
                role: UserRole.USER,
                verificationCode,
                verificationCodeExpires,
                isEmailVerified: false,
            }
        });

        // Process referral bonus if referrer exists
        if (referrerId) {
            try {
                // Give welcome bonus to referrer
                const welcomeBonus = 10.00; // $10 welcome bonus

                await db.prisma.$transaction(async (prisma) => {
                    // Add bonus to referrer balance
                    await prisma.user.update({
                        where: { id: referrerId },
                        data: {
                            balance: { increment: welcomeBonus }
                        }
                    });

                    // Create transaction record for referrer
                    await prisma.transaction.create({
                        data: {
                            userId: referrerId,
                            type: TransactionType.REFERRAL_BONUS,
                            amount: welcomeBonus,
                            netAmount: welcomeBonus,
                            status: TransactionStatus.COMPLETED,
                            description: `Referral bonus for user ${username} registration`,
                            reference: `REF-WELCOME-${user.id}-${Date.now()}`
                        }
                    });

                    // Create notification for referrer
                    await prisma.notification.create({
                        data: {
                            userId: referrerId,
                            type: 'SYSTEM_ANNOUNCEMENT',
                            title: 'Referral Bonus Earned!',
                            message: `Congratulations! You earned $${welcomeBonus.toFixed(2)} for referring ${username}.`,
                            metadata: {
                                referredUserId: user.id,
                                referredUsername: username,
                                bonusAmount: welcomeBonus,
                                bonusType: 'welcome'
                            }
                        }
                    });
                });

                logger.info(`Referral bonus processed: $${welcomeBonus} to user ${referrerId} for referring ${username}`);
            } catch (bonusError) {
                logger.error('Failed to process referral bonus:', bonusError);
                // Don't fail registration if bonus processing fails
            }
        }

        // Generate tokens
        const tokenPayload: JWTPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            type: 'user'
        };

        const tokens = generateTokenPair(tokenPayload);

        // Create session record
        await db.prisma.session.create({
            data: {
                userId: user.id,
                token: tokens.refreshToken,
                refreshToken: tokens.refreshToken,
                userAgent: req.get('User-Agent') || undefined,
                ipAddress: req.ip,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }
        });

        // Log successful registration
        logger.info(`User registration successful: ${user.email}`, {
            userId: user.id,
            ip: req.ip,
            referrerId
        });

        // Send verification email
        console.log('📧 About to send verification email to:', user.email, 'with code:', verificationCode);
        try {
            await sendEmailVerificationCode(
                user.email,
                verificationCode,
                user.firstName || undefined
            );
            console.log('✅ Verification email sent successfully to:', user.email);
            logger.info(`Verification email sent to: ${user.email}`);
        } catch (emailError) {
            console.error('❌ Failed to send verification email:', emailError);
            logger.error('Failed to send verification email:', emailError);
            // Don't fail registration if email sending fails
        }

        // Return user data and tokens
        const userData = {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isVerified: user.isVerified,
            isEmailVerified: user.isEmailVerified,
            balance: user.balance,
            totalInvested: user.totalInvested,
            totalEarnings: user.totalEarnings,
            referralCode: user.referralCode,
            createdAt: user.createdAt
        };

        res.status(201).json({
            success: true,
            data: {
                user: userData,
                tokens
            },
            message: 'Registration successful'
        });

    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'REGISTRATION_FAILED'
            }
        });
    }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Refresh token is required',
                    code: 'REFRESH_TOKEN_MISSING'
                }
            });
            return;
        }

        // Find session by refresh token
        const session = await db.prisma.session.findFirst({
            where: {
                refreshToken,
                isActive: true,
                expiresAt: {
                    gt: new Date()
                }
            },
            include: {
                user: true
            }
        });

        if (!session) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid or expired refresh token',
                    code: 'INVALID_REFRESH_TOKEN'
                }
            });
            return;
        }

        // Generate new tokens
        const tokenPayload: JWTPayload = {
            userId: session.user.id,
            email: session.user.email,
            role: session.user.role,
            type: 'user'
        };

        const tokens = generateTokenPair(tokenPayload);

        // Update session with new refresh token
        await db.prisma.session.update({
            where: { id: session.id },
            data: {
                refreshToken: tokens.refreshToken,
                lastUsed: new Date()
            }
        });

        res.status(200).json({
            success: true,
            data: { tokens },
            message: 'Token refreshed successfully'
        });

    } catch (error) {
        logger.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'TOKEN_REFRESH_FAILED'
            }
        });
    }
};

/**
 * Logout user
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (userId) {
            // Deactivate all user sessions
            await db.prisma.session.updateMany({
                where: { userId },
                data: { isActive: false }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'LOGOUT_FAILED'
            }
        });
    }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                }
            });
            return;
        }

        const user = await db.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                country: true,
                state: true,
                city: true,
                address: true,
                zipCode: true,
                dateOfBirth: true,
                kycStatus: true,
                balance: true,
                totalInvested: true,
                totalEarnings: true,
                referralCode: true,
                isVerified: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { user }
        });

    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'GET_PROFILE_FAILED'
            }
        });
    }
};

// Validation rules
export const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];

export const registerValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('username')
        .isLength({ min: 3, max: 30 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('firstName')
        .isLength({ min: 1, max: 50 })
        .trim()
        .withMessage('First name is required and must be less than 50 characters'),
    body('lastName')
        .isLength({ min: 1, max: 50 })
        .trim()
        .withMessage('Last name is required and must be less than 50 characters'),
    body('country')
        .isLength({ min: 2, max: 100 })
        .trim()
        .withMessage('Country is required'),
    body('referralCode')
        .optional()
        .isLength({ min: 3, max: 20 })
        .withMessage('Invalid referral code format')
];

export const forgotPasswordValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address')
];

export const resetPasswordValidation = [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

/**
 * Forgot password - Send reset email
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    details: errors.array()
                }
            });
            return;
        }

        const { email } = req.body;

        // Find user by email
        const user = await db.prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        // Always return success to prevent email enumeration
        // But only send email if user exists
        if (user) {
            // Generate reset token (6-digit code)
            const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
            const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

            // Save reset token to database
            await db.prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken: resetToken,
                    passwordResetExpires: resetExpires
                }
            });

            // Send password reset email
            try {
                await sendPasswordResetEmail(
                    user.email,
                    resetToken,
                    user.firstName || undefined
                );
                logger.info(`Password reset email sent to: ${email}`);
            } catch (emailError) {
                logger.error('Failed to send password reset email:', emailError);
                // Don't throw error - still return success to prevent email enumeration
            }
        }

        res.status(200).json({
            success: true,
            data: {
                message: 'If an account exists with that email, a password reset link has been sent.'
            }
        });

    } catch (error) {
        logger.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'FORGOT_PASSWORD_FAILED'
            }
        });
    }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    details: errors.array()
                }
            });
            return;
        }

        const { token, password } = req.body;

        // Find user with valid reset token
        const user = await db.prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetExpires: {
                    gte: new Date() // Token not expired
                }
            }
        });

        if (!user) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid or expired reset token',
                    code: 'INVALID_RESET_TOKEN'
                }
            });
            return;
        }

        // Hash new password
        const hashedPassword = await hashPassword(password);

        // Update user password and clear reset token
        await db.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null
            }
        });

        // Log password reset
        logger.info(`Password reset successful for user: ${user.email}`);

        res.status(200).json({
            success: true,
            data: {
                message: 'Password has been reset successfully. You can now login with your new password.'
            }
        });

    } catch (error) {
        logger.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'RESET_PASSWORD_FAILED'
            }
        });
    }
};

/**
 * Validation for email verification
 */
export const verifyEmailValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('code')
        .notEmpty().withMessage('Verification code is required')
        .isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits')
        .isNumeric().withMessage('Verification code must be numeric'),
];

/**
 * Verify email with 6-digit code
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    details: errors.array()
                }
            });
            return;
        }

        const { email, code } = req.body;

        // Find user with matching email and verification code
        const user = await db.prisma.user.findFirst({
            where: {
                email: email.toLowerCase(),
                verificationCode: code,
                verificationCodeExpires: {
                    gte: new Date() // Code not expired
                }
            }
        });

        if (!user) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid or expired verification code',
                    code: 'INVALID_VERIFICATION_CODE'
                }
            });
            return;
        }

        // Check if already verified
        if (user.isEmailVerified) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Email already verified',
                    code: 'EMAIL_ALREADY_VERIFIED'
                }
            });
            return;
        }

        // Mark email as verified and clear verification code
        await db.prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                verificationCode: null,
                verificationCodeExpires: null,
                isVerified: true, // Also set general verification flag
            }
        });

        // Send welcome email
        try {
            await sendWelcomeEmail(user.email, user.firstName || user.username);
            logger.info(`Welcome email sent to: ${user.email}`);
        } catch (emailError) {
            logger.error('Failed to send welcome email:', emailError);
            // Don't fail verification if welcome email sending fails
        }

        // Log successful verification
        logger.info(`Email verified for user: ${user.email}`);

        res.status(200).json({
            success: true,
            data: {
                message: 'Email verified successfully! Welcome to NexGen.',
                isEmailVerified: true
            }
        });

    } catch (error) {
        logger.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'VERIFICATION_FAILED'
            }
        });
    }
};

/**
 * Validation for resend verification
 */
export const resendVerificationValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

/**
 * Resend verification code
 */
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    details: errors.array()
                }
            });
            return;
        }

        const { email } = req.body;

        // Find user by email
        const user = await db.prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        // Always return success to prevent email enumeration
        // But only send email if user exists and not verified
        if (user && !user.isEmailVerified) {
            // Generate new verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour from now

            // Update user with new code
            await db.prisma.user.update({
                where: { id: user.id },
                data: {
                    verificationCode,
                    verificationCodeExpires
                }
            });

            // Send verification email
            console.log('📧 RESEND: About to send verification email to:', user.email, 'with code:', verificationCode);
            try {
                await sendEmailVerificationCode(
                    user.email,
                    verificationCode,
                    user.firstName || undefined
                );
                console.log('✅ RESEND: Verification email sent successfully to:', user.email);
                logger.info(`Verification code resent to: ${user.email}`);
            } catch (emailError) {
                console.error('❌ RESEND: Failed to resend verification email:', emailError);
                logger.error('Failed to resend verification email:', emailError);
                // Don't throw error - still return success to prevent email enumeration
            }
        }

        res.status(200).json({
            success: true,
            data: {
                message: 'If your email is registered and not verified, a new verification code has been sent.'
            }
        });

    } catch (error) {
        logger.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'RESEND_VERIFICATION_FAILED'
            }
        });
    }
};