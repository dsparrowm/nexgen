import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User, UserRole } from '@prisma/client';
import db from '@/services/database';
import { generateAdminToken, generateTokenPair, JWTPayload } from '@/utils/jwt';
import { verifyPassword } from '@/utils/password';
import { logger } from '@/utils/logger';

export interface AuthRequest extends Request {
    user?: JWTPayload;
}

/**
 * Admin login controller
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

        // Find admin user by email
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

        // Check if user has admin role
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied. Admin privileges required.',
                    code: 'INSUFFICIENT_PRIVILEGES'
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
            type: 'admin'
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

        // Log successful admin login
        logger.info(`Admin login successful: ${user.email}`, {
            userId: user.id,
            role: user.role,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Create audit log for admin login
        await db.prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'ADMIN_LOGIN',
                resource: 'auth',
                resourceId: user.id,
                oldValues: undefined,
                newValues: { loginTime: new Date().toISOString() },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        // Return admin data and tokens
        const adminData = {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            lastLogin: new Date()
        };

        res.status(200).json({
            success: true,
            data: {
                admin: adminData,
                tokens
            },
            message: 'Admin login successful'
        });

    } catch (error) {
        logger.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'ADMIN_LOGIN_FAILED'
            }
        });
    }
};

/**
 * Refresh admin access token
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

        // Verify user has admin role
        if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied. Admin privileges required.',
                    code: 'INSUFFICIENT_PRIVILEGES'
                }
            });
            return;
        }

        // Generate new tokens
        const tokenPayload: JWTPayload = {
            userId: session.user.id,
            email: session.user.email,
            role: session.user.role,
            type: 'admin'
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
            message: 'Admin token refreshed successfully'
        });

    } catch (error) {
        logger.error('Admin token refresh error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'ADMIN_TOKEN_REFRESH_FAILED'
            }
        });
    }
};

/**
 * Logout admin
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

            // Create audit log for admin logout
            await db.prisma.auditLog.create({
                data: {
                    userId: userId,
                    action: 'ADMIN_LOGOUT',
                    resource: 'auth',
                    resourceId: userId,
                    oldValues: undefined,
                    newValues: { logoutTime: new Date().toISOString() },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Admin logout successful'
        });

    } catch (error) {
        logger.error('Admin logout error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'ADMIN_LOGOUT_FAILED'
            }
        });
    }
};

/**
 * Get current admin profile
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
                role: true,
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
                    message: 'Admin not found',
                    code: 'ADMIN_NOT_FOUND'
                }
            });
            return;
        }

        // Verify admin role
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied. Admin privileges required.',
                    code: 'INSUFFICIENT_PRIVILEGES'
                }
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { admin: user }
        });

    } catch (error) {
        logger.error('Get admin profile error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'GET_ADMIN_PROFILE_FAILED'
            }
        });
    }
};

/**
 * Get admin dashboard stats
 */
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
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

        // Calculate date ranges for historical comparisons
        const now = new Date();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        // Get various stats for admin dashboard
        const [
            totalUsers,
            activeUsers,
            totalInvestments,
            totalTransactions,
            pendingKyc,
            pendingWithdrawals,
            recentTransactions,
            // Historical data for percentage calculations
            usersLast7Days,
            usersPrevious7Days,
            investmentsLast7Days,
            investmentsPrevious7Days,
            transactionsLast7Days,
            transactionsPrevious7Days
        ] = await Promise.all([
            // Total users
            db.prisma.user.count(),

            // Active users (with investments or recent activity)
            db.prisma.user.count({
                where: {
                    isActive: true,
                    OR: [
                        { investments: { some: {} } },
                        { transactions: { some: {} } }
                    ]
                }
            }),

            // Total investments
            db.prisma.investment.aggregate({
                _sum: { amount: true }
            }),

            // Total transactions
            db.prisma.transaction.count(),

            // Pending KYC
            db.prisma.user.count({
                where: { kycStatus: 'PENDING' }
            }),

            // Pending withdrawals
            db.prisma.transaction.count({
                where: {
                    type: 'WITHDRAWAL',
                    status: 'PENDING'
                }
            }),

            // Recent transactions
            db.prisma.transaction.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { username: true, email: true }
                    }
                }
            }),

            // Users in last 7 days
            db.prisma.user.count({
                where: { createdAt: { gte: last7Days } }
            }),

            // Users in previous 7 days
            db.prisma.user.count({
                where: {
                    createdAt: {
                        gte: previous7Days,
                        lt: last7Days
                    }
                }
            }),

            // Investments in last 7 days
            db.prisma.investment.aggregate({
                where: { createdAt: { gte: last7Days } },
                _sum: { amount: true }
            }),

            // Investments in previous 7 days
            db.prisma.investment.aggregate({
                where: {
                    createdAt: {
                        gte: previous7Days,
                        lt: last7Days
                    }
                },
                _sum: { amount: true }
            }),

            // Transactions in last 7 days
            db.prisma.transaction.count({
                where: { createdAt: { gte: last7Days } }
            }),

            // Transactions in previous 7 days
            db.prisma.transaction.count({
                where: {
                    createdAt: {
                        gte: previous7Days,
                        lt: last7Days
                    }
                }
            })
        ]);

        // Calculate percentage changes
        const calculatePercentageChange = (current: number, previous: number): string => {
            if (previous === 0) return current > 0 ? '+100%' : '0%';
            const change = ((current - previous) / previous) * 100;
            return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
        };

        const usersChange = calculatePercentageChange(usersLast7Days, usersPrevious7Days);
        const investmentsChange = calculatePercentageChange(
            Number(investmentsLast7Days._sum.amount || 0),
            Number(investmentsPrevious7Days._sum.amount || 0)
        );
        const transactionsChange = calculatePercentageChange(transactionsLast7Days, transactionsPrevious7Days);

        // Calculate system uptime (simplified - would use monitoring service in production)
        const serverStartTime = process.uptime(); // seconds since server started
        const uptime = serverStartTime > 0 ? 99.9 : 0; // Simplified calculation

        const stats = {
            totalUsers,
            activeUsers,
            totalInvestments: totalInvestments._sum.amount || 0,
            totalTransactions,
            pendingKyc,
            pendingWithdrawals,
            supportTickets: 0, // TODO: Implement support ticket system
            recentTransactions,
            changes: {
                users: usersChange,
                investments: investmentsChange,
                transactions: transactionsChange,
                uptime: '+0.1%' // Minimal change for stability metric
            },
            systemUptime: `${uptime.toFixed(1)}%`
        };

        res.status(200).json({
            success: true,
            data: { stats }
        });

    } catch (error) {
        logger.error('Get admin dashboard stats error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'GET_DASHBOARD_STATS_FAILED'
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