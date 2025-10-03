import { Request, Response } from 'express';
import { UserRole, KycStatus, InvestmentStatus, TransactionStatus } from '@prisma/client';
import db from '@/services/database';
import { logger } from '@/utils/logger';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
        type: 'user' | 'admin';
    };
}

/**
 * Get admin dashboard statistics
 */
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId || req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
            });
            return;
        }

        // Get comprehensive dashboard statistics
        const [
            totalUsers,
            activeUsers,
            totalInvestments,
            activeInvestments,
            totalInvestmentAmount,
            totalEarnings,
            pendingKycDocuments,
            totalTransactions,
            recentTransactions,
            topInvestors,
            investmentGrowth,
            userGrowth
        ] = await Promise.all([
            // User statistics
            db.prisma.user.count(),
            db.prisma.user.count({ where: { isActive: true } }),

            // Investment statistics
            db.prisma.investment.count(),
            db.prisma.investment.count({ where: { status: InvestmentStatus.ACTIVE } }),
            db.prisma.investment.aggregate({
                _sum: { amount: true },
                where: { status: InvestmentStatus.ACTIVE }
            }),
            db.prisma.user.aggregate({
                _sum: { totalEarnings: true }
            }),

            // KYC statistics
            db.prisma.kycDocument.count({ where: { status: 'PENDING' } }),

            // Transaction statistics
            db.prisma.transaction.count(),

            // Recent transactions (last 10)
            db.prisma.transaction.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { email: true, username: true } },
                    investment: {
                        include: {
                            miningOperation: { select: { name: true } }
                        }
                    }
                }
            }),

            // Top investors
            db.prisma.user.findMany({
                take: 5,
                orderBy: { totalInvested: 'desc' },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    totalInvested: true,
                    totalEarnings: true,
                    createdAt: true
                }
            }),

            // Investment growth (last 30 days)
            db.prisma.investment.groupBy({
                by: ['createdAt'],
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                },
                _sum: { amount: true },
                orderBy: { createdAt: 'asc' }
            }),

            // User growth (last 30 days)
            db.prisma.user.groupBy({
                by: ['createdAt'],
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                },
                _count: true,
                orderBy: { createdAt: 'asc' }
            })
        ]);

        const stats = {
            users: {
                total: totalUsers,
                active: activeUsers,
                growth: userGrowth
            },
            investments: {
                total: totalInvestments,
                active: activeInvestments,
                totalAmount: totalInvestmentAmount._sum.amount || 0,
                growth: investmentGrowth
            },
            earnings: {
                total: totalEarnings._sum.totalEarnings || 0
            },
            kyc: {
                pending: pendingKycDocuments
            },
            transactions: {
                total: totalTransactions,
                recent: recentTransactions
            },
            topInvestors
        };

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_DASHBOARD_STATS_FAILED' }
        });
    }
};

/**
 * Get system health metrics
 */
export const getSystemHealth = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId || req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
            });
            return;
        }

        // Get database connection status
        let dbStatus = 'healthy';
        try {
            await db.prisma.$queryRaw`SELECT 1`;
        } catch (error) {
            dbStatus = 'unhealthy';
            logger.error('Database health check failed:', error);
        }

        // Get system metrics
        const metrics = {
            database: {
                status: dbStatus,
                timestamp: new Date().toISOString()
            },
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.version,
                platform: process.platform
            },
            timestamp: new Date().toISOString()
        };

        res.status(200).json({
            success: true,
            data: metrics
        });

    } catch (error) {
        logger.error('Get system health error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_SYSTEM_HEALTH_FAILED' }
        });
    }
};