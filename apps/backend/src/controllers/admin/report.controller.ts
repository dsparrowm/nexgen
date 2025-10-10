import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

/**
 * Get revenue reports
 */
export const getRevenueReport = async (req: Request, res: Response) => {
    try {
        const { period = '30d' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Get revenue data from transactions
        const revenueData = await prisma.transaction.groupBy({
            by: ['type'],
            where: {
                type: 'DEPOSIT',
                status: 'COMPLETED',
                createdAt: {
                    gte: startDate,
                },
            },
            _sum: {
                amount: true,
            },
        });

        const totalRevenue = revenueData.reduce((sum, item) => sum + Number(item._sum.amount || 0), 0);

        // Get revenue by period (daily breakdown)
        const revenueByPeriod = await prisma.$queryRaw`
            SELECT
                DATE("createdAt") as date,
                SUM("amount") as revenue
            FROM transactions
            WHERE type = 'DEPOSIT'
            AND status = 'COMPLETED'
            AND "createdAt" >= ${startDate}
            GROUP BY DATE("createdAt")
            ORDER BY DATE("createdAt")
        `;

        res.json({
            success: true,
            data: {
                totalRevenue,
                revenueByPeriod,
                period,
            },
        });
    } catch (error) {
        logger.error('Error fetching revenue report:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch revenue report' },
        });
    }
};

/**
 * Get user analytics report
 */
export const getUserReport = async (req: Request, res: Response) => {
    try {
        const { period = '30d' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Get user registration data
        const newUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: startDate,
                },
            },
        });

        // Get active users (users with recent activity - simplified to users created in period)
        const activeUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: startDate,
                },
            },
        });

        // Get user registration by period
        const usersByPeriod = await prisma.$queryRaw`
            SELECT
                DATE("createdAt") as date,
                COUNT(*) as newUsers
            FROM users
            WHERE "createdAt" >= ${startDate}
            GROUP BY DATE("createdAt")
            ORDER BY DATE("createdAt")
        `;

        // Get user demographics
        const userDemographics = await prisma.user.groupBy({
            by: ['country'],
            where: {
                country: {
                    not: null,
                },
            },
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
            take: 10,
        });

        res.json({
            success: true,
            data: {
                newUsers,
                activeUsers,
                usersByPeriod,
                userDemographics,
                period,
            },
        });
    } catch (error) {
        logger.error('Error fetching user report:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch user report' },
        });
    }
};

/**
 * Get activity report
 */
export const getActivityReport = async (req: Request, res: Response) => {
    try {
        const { period = '30d' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Get transaction activity
        const transactionCount = await prisma.transaction.count({
            where: {
                createdAt: {
                    gte: startDate,
                },
            },
        });

        // Get investment activity
        const investmentCount = await prisma.investment.count({
            where: {
                createdAt: {
                    gte: startDate,
                },
            },
        });

        // Get login activity (simplified - using transaction activity as proxy)
        const loginCount = await prisma.transaction.count({
            where: {
                createdAt: {
                    gte: startDate,
                },
            },
        });

        // Get activity by period
        const activityByPeriod = await prisma.$queryRaw`
            SELECT
                DATE("createdAt") as date,
                COUNT(*) as transactions,
                (SELECT COUNT(*) FROM investments WHERE DATE("createdAt") = DATE(t."createdAt")) as investments,
                0 as logins
            FROM transactions t
            WHERE "createdAt" >= ${startDate}
            GROUP BY DATE("createdAt")
            ORDER BY DATE("createdAt")
        `;

        res.json({
            success: true,
            data: {
                transactionCount,
                investmentCount,
                loginCount,
                activityByPeriod,
                period,
            },
        });
    } catch (error) {
        logger.error('Error fetching activity report:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch activity report' },
        });
    }
};

/**
 * Get overview report (combined data)
 */
export const getOverviewReport = async (req: Request, res: Response) => {
    try {
        const { period = '30d' } = req.query;

        const now = new Date();
        let startDate: Date;

        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const [
            totalRevenue,
            totalUsers,
            activeUsers,
            totalTransactions,
            totalInvestments,
        ] = await Promise.all([
            prisma.transaction.aggregate({
                where: {
                    type: 'DEPOSIT',
                    status: 'COMPLETED',
                    createdAt: { gte: startDate },
                },
                _sum: { amount: true },
            }),
            prisma.user.count(),
            prisma.user.count({
                where: {
                    createdAt: { gte: startDate },
                },
            }),
            prisma.transaction.count({
                where: { createdAt: { gte: startDate } },
            }),
            prisma.investment.count({
                where: { createdAt: { gte: startDate } },
            }),
        ]);

        res.json({
            success: true,
            data: {
                totalRevenue: totalRevenue._sum.amount || 0,
                totalUsers,
                activeUsers,
                totalTransactions,
                totalInvestments,
                period,
            },
        });
    } catch (error) {
        logger.error('Error fetching overview report:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch overview report' },
        });
    }
};