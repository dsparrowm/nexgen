import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User, UserRole, TransactionType, TransactionStatus } from '@prisma/client';
import db from '@/services/database';
import { generateUserToken, generateTokenPair, JWTPayload } from '@/utils/jwt';
import { hashPassword, verifyPassword } from '@/utils/password';
import { logger } from '@/utils/logger';
import { createError } from '@/middlewares/error.middleware';

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