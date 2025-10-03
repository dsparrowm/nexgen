import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
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
 * Get user dashboard overview with key statistics
 */
export const getDashboardOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        // Get user basic info
        const user = await db.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                balance: true,
                totalInvested: true,
                totalEarnings: true,
                createdAt: true
            }
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
            return;
        }

        // Get active investments count and total value
        const activeInvestments = await db.prisma.investment.aggregate({
            where: {
                userId,
                status: 'ACTIVE'
            },
            _count: { id: true },
            _sum: { amount: true }
        });

        // Get total mining operations the user has invested in
        const miningOperations = await db.prisma.investment.count({
            where: { userId }
        });

        // Get recent transactions (last 5)
        const recentTransactions = await db.prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                type: true,
                amount: true,
                netAmount: true,
                status: true,
                description: true,
                createdAt: true
            }
        });

        // Get recent payouts (last 5)
        const recentPayouts = await db.prisma.payout.findMany({
            where: {
                investment: { userId }
            },
            orderBy: { date: 'desc' },
            take: 5,
            include: {
                investment: {
                    include: {
                        miningOperation: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        // Calculate today's earnings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayEarnings = await db.prisma.payout.aggregate({
            where: {
                investment: { userId },
                date: {
                    gte: today,
                    lt: tomorrow
                }
            },
            _sum: { amount: true }
        });

        // Get unread notifications count
        const unreadNotifications = await db.prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        });

        // Calculate portfolio performance (simplified)
        const totalPortfolioValue = Number(user.balance) + Number(activeInvestments._sum.amount || 0);
        const totalEarnings = Number(user.totalEarnings);

        const dashboardData = {
            user: {
                balance: user.balance,
                totalInvested: user.totalInvested,
                totalEarnings: user.totalEarnings,
                accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) // days
            },
            portfolio: {
                activeInvestments: activeInvestments._count.id,
                totalInvested: activeInvestments._sum.amount || 0,
                totalValue: totalPortfolioValue,
                performance: totalEarnings > 0 ? ((totalEarnings / Number(user.totalInvested)) * 100) : 0
            },
            mining: {
                totalOperations: miningOperations,
                todayEarnings: Number(todayEarnings._sum.amount || 0)
            },
            activity: {
                recentTransactions,
                recentPayouts: recentPayouts.map(p => ({
                    id: p.id,
                    amount: p.amount,
                    date: p.date,
                    miningOperation: p.investment.miningOperation.name
                })),
                unreadNotifications
            }
        };

        res.status(200).json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        logger.error('Get dashboard overview error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_DASHBOARD_FAILED' }
        });
    }
};

/**
 * Get detailed user statistics
 */
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        // Get comprehensive stats
        const [
            totalInvestments,
            activeInvestments,
            completedInvestments,
            totalTransactions,
            successfulTransactions,
            totalPayouts,
            monthlyPayouts,
            referralStats
        ] = await Promise.all([
            // Investment stats
            db.prisma.investment.count({ where: { userId } }),
            db.prisma.investment.count({ where: { userId, status: 'ACTIVE' } }),
            db.prisma.investment.count({ where: { userId, status: 'COMPLETED' } }),

            // Transaction stats
            db.prisma.transaction.count({ where: { userId } }),
            db.prisma.transaction.count({ where: { userId, status: 'COMPLETED' } }),

            // Payout stats
            db.prisma.payout.count({ where: { investment: { userId } } }),
            db.prisma.payout.count({
                where: {
                    investment: { userId },
                    date: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                }
            }),

            // Referral stats
            db.prisma.user.count({ where: { referredBy: userId } })
        ]);

        // Get earnings by month (last 12 months)
        const earningsByMonth = await db.prisma.$queryRaw`
            SELECT
                DATE_TRUNC('month', date) as month,
                SUM(amount) as earnings
            FROM "payouts"
            WHERE "investmentId" IN (
                SELECT id FROM "investments" WHERE "userId" = ${userId}
            )
            AND date >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', date)
            ORDER BY month DESC
        `;

        const stats = {
            investments: {
                total: totalInvestments,
                active: activeInvestments,
                completed: completedInvestments
            },
            transactions: {
                total: totalTransactions,
                successful: successfulTransactions,
                successRate: totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0
            },
            payouts: {
                total: totalPayouts,
                thisMonth: monthlyPayouts
            },
            referrals: {
                totalReferrals: referralStats
            },
            earnings: {
                byMonth: earningsByMonth
            }
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