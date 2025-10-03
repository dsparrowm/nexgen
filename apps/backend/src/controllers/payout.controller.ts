import { Request, Response } from 'express';
import { PayoutStatus, TransactionType, TransactionStatus, UserRole } from '@prisma/client';
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
 * Process daily payouts for all active investments
 */
export const processDailyPayouts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const adminId = req.user?.userId;
        if (!adminId || req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
            });
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all active investments that haven't received payout today
        const activeInvestments = await db.prisma.investment.findMany({
            where: {
                status: 'ACTIVE',
                startDate: { lte: today }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        balance: true
                    }
                },
                miningOperation: {
                    select: {
                        id: true,
                        name: true,
                        dailyReturn: true
                    }
                },
                payouts: {
                    where: {
                        date: today
                    }
                }
            }
        });

        // Filter investments that are still active (no end date or end date in future) and haven't received payout today
        const investmentsToPayout = activeInvestments.filter(inv =>
            (!inv.endDate || inv.endDate >= today) && inv.payouts.length === 0
        );

        if (investmentsToPayout.length === 0) {
            res.status(200).json({
                success: true,
                message: 'No payouts to process today',
                data: { processed: 0 }
            });
            return;
        }

        let processedCount = 0;
        let totalPayoutAmount = 0;
        const errors: string[] = [];

        // Process payouts in transaction
        for (const investment of investmentsToPayout) {
            try {
                await db.prisma.$transaction(async (prisma) => {
                    const payoutAmount = Number(investment.amount) * Number(investment.miningOperation.dailyReturn);

                    // Create payout record
                    await prisma.payout.create({
                        data: {
                            investmentId: investment.id,
                            amount: payoutAmount,
                            date: today,
                            status: PayoutStatus.COMPLETED
                        }
                    });

                    // Update investment earnings
                    await prisma.investment.update({
                        where: { id: investment.id },
                        data: {
                            totalEarnings: { increment: payoutAmount },
                            lastPayout: today
                        }
                    });

                    // Add to user balance
                    await prisma.user.update({
                        where: { id: investment.user.id },
                        data: {
                            balance: { increment: payoutAmount },
                            totalEarnings: { increment: payoutAmount }
                        }
                    });

                    // Create transaction record
                    await prisma.transaction.create({
                        data: {
                            userId: investment.user.id,
                            investmentId: investment.id,
                            type: TransactionType.PAYOUT,
                            amount: payoutAmount,
                            netAmount: payoutAmount,
                            status: TransactionStatus.COMPLETED,
                            description: `Daily payout from ${investment.miningOperation.name}`,
                            reference: `PYT-${investment.id}-${Date.now()}`
                        }
                    });

                    // Create notification
                    await prisma.notification.create({
                        data: {
                            userId: investment.user.id,
                            type: 'PAYOUT_RECEIVED',
                            title: 'Daily Payout Received',
                            message: `You received $${payoutAmount.toFixed(2)} from your investment in ${investment.miningOperation.name}`,
                            metadata: {
                                investmentId: investment.id,
                                payoutAmount: payoutAmount,
                                miningOperation: investment.miningOperation.name
                            }
                        }
                    });

                    processedCount++;
                    totalPayoutAmount += payoutAmount;
                });
            } catch (error) {
                const errorMsg = `Failed to process payout for investment ${investment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                logger.error(errorMsg);
                errors.push(errorMsg);
            }
        }

        // Log the admin action
        await db.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: 'DAILY_PAYOUTS_PROCESSED',
                resource: 'payout',
                resourceId: null,
                newValues: {
                    processedCount,
                    totalPayoutAmount,
                    errors: errors.length
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        logger.info(`Daily payouts processed: ${processedCount} investments, total: $${totalPayoutAmount.toFixed(2)}`);

        res.status(200).json({
            success: true,
            data: {
                processed: processedCount,
                totalAmount: totalPayoutAmount,
                errors: errors.length > 0 ? errors : undefined
            },
            message: `Successfully processed ${processedCount} payouts totaling $${totalPayoutAmount.toFixed(2)}`
        });

    } catch (error) {
        logger.error('Process daily payouts error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'PROCESS_PAYOUTS_FAILED' }
        });
    }
};

/**
 * Get payout history for a user
 */
export const getUserPayouts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const { page = 1, limit = 20, investmentId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const whereClause: any = { investment: { userId } };
        if (investmentId) {
            whereClause.investmentId = investmentId;
        }

        const [payouts, total] = await Promise.all([
            db.prisma.payout.findMany({
                where: whereClause,
                include: {
                    investment: {
                        include: {
                            miningOperation: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: { date: 'desc' },
                skip,
                take: Number(limit)
            }),
            db.prisma.payout.count({ where: whereClause })
        ]);

        res.status(200).json({
            success: true,
            data: {
                payouts,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error) {
        logger.error('Get user payouts error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_USER_PAYOUTS_FAILED' }
        });
    }
};

/**
 * Get payout statistics
 */
export const getPayoutStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalPayouts,
            todayPayouts,
            monthlyPayouts,
            totalAmount,
            todayAmount,
            monthlyAmount
        ] = await Promise.all([
            // Count queries
            db.prisma.payout.count({
                where: { investment: { userId } }
            }),
            db.prisma.payout.count({
                where: {
                    investment: { userId },
                    date: today
                }
            }),
            db.prisma.payout.count({
                where: {
                    investment: { userId },
                    date: {
                        gte: new Date(today.getFullYear(), today.getMonth(), 1)
                    }
                }
            }),

            // Sum queries
            db.prisma.payout.aggregate({
                _sum: { amount: true },
                where: { investment: { userId } }
            }),
            db.prisma.payout.aggregate({
                _sum: { amount: true },
                where: {
                    investment: { userId },
                    date: today
                }
            }),
            db.prisma.payout.aggregate({
                _sum: { amount: true },
                where: {
                    investment: { userId },
                    date: {
                        gte: new Date(today.getFullYear(), today.getMonth(), 1)
                    }
                }
            })
        ]);

        const stats = {
            counts: {
                total: totalPayouts,
                today: todayPayouts,
                thisMonth: monthlyPayouts
            },
            amounts: {
                total: Number(totalAmount._sum.amount || 0),
                today: Number(todayAmount._sum.amount || 0),
                thisMonth: Number(monthlyAmount._sum.amount || 0)
            }
        };

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Get payout stats error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_PAYOUT_STATS_FAILED' }
        });
    }
};

/**
 * Get all payouts (admin only)
 */
export const getAllPayouts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId || req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
            });
            return;
        }

        const {
            page = 1,
            limit = 20,
            status,
            userId: filterUserId,
            startDate,
            endDate
        } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        // Build where clause
        const whereClause: any = {};

        if (status && Object.values(PayoutStatus).includes(status as PayoutStatus)) {
            whereClause.status = status;
        }

        if (filterUserId) {
            whereClause.investment = { userId: filterUserId };
        }

        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) whereClause.date.gte = new Date(startDate as string);
            if (endDate) whereClause.date.lte = new Date(endDate as string);
        }

        const [payouts, total] = await Promise.all([
            db.prisma.payout.findMany({
                where: whereClause,
                include: {
                    investment: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    username: true
                                }
                            },
                            miningOperation: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: { date: 'desc' },
                skip,
                take: Number(limit)
            }),
            db.prisma.payout.count({ where: whereClause })
        ]);

        res.status(200).json({
            success: true,
            data: {
                payouts,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error) {
        logger.error('Get all payouts error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_ALL_PAYOUTS_FAILED' }
        });
    }
};