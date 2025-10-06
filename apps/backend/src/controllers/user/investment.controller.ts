import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { InvestmentStatus, TransactionType, TransactionStatus } from '@prisma/client';
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
 * Get user's investments
 */
export const getInvestments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const { status, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const whereClause: any = { userId };
        if (status && Object.values(InvestmentStatus).includes(status as InvestmentStatus)) {
            whereClause.status = status;
        }

        const [investments, total] = await Promise.all([
            db.prisma.investment.findMany({
                where: whereClause,
                include: {
                    miningOperation: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            dailyReturn: true,
                            minInvestment: true,
                            maxInvestment: true,
                            duration: true,
                            status: true
                        }
                    },
                    transactions: {
                        select: {
                            id: true,
                            type: true,
                            amount: true,
                            status: true,
                            createdAt: true
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            db.prisma.investment.count({ where: whereClause })
        ]);

        res.status(200).json({
            success: true,
            data: {
                investments,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error) {
        logger.error('Get investments error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_INVESTMENTS_FAILED' }
        });
    }
};

/**
 * Get specific investment details
 */
export const getInvestment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const { investmentId } = req.params;

        const investment = await db.prisma.investment.findFirst({
            where: {
                id: investmentId,
                userId
            },
            include: {
                miningOperation: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        dailyReturn: true,
                        minInvestment: true,
                        maxInvestment: true,
                        duration: true,
                        status: true
                    }
                },
                transactions: {
                    select: {
                        id: true,
                        type: true,
                        amount: true,
                        status: true,
                        description: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!investment) {
            res.status(404).json({
                success: false,
                error: { message: 'Investment not found', code: 'INVESTMENT_NOT_FOUND' }
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { investment }
        });

    } catch (error) {
        logger.error('Get investment error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_INVESTMENT_FAILED' }
        });
    }
};

/**
 * Create new investment
 */
export const createInvestment = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const { miningOperationId, amount } = req.body;

        // Check if mining operation exists and is active
        const miningOperation = await db.prisma.miningOperation.findUnique({
            where: { id: miningOperationId }
        });

        if (!miningOperation || miningOperation.status !== 'ACTIVE') {
            res.status(400).json({
                success: false,
                error: { message: 'Mining operation not available', code: 'MINING_OPERATION_UNAVAILABLE' }
            });
            return;
        }

        // Validate investment amount
        const investmentAmount = Number(amount);
        if (investmentAmount < Number(miningOperation.minInvestment) ||
            investmentAmount > Number(miningOperation.maxInvestment)) {
            res.status(400).json({
                success: false,
                error: {
                    message: `Investment amount must be between ${miningOperation.minInvestment} and ${miningOperation.maxInvestment}`,
                    code: 'INVALID_INVESTMENT_AMOUNT'
                }
            });
            return;
        }

        // Check user balance
        const user = await db.prisma.user.findUnique({
            where: { id: userId },
            select: { balance: true }
        });

        if (!user || Number(user.balance) < investmentAmount) {
            res.status(400).json({
                success: false,
                error: { message: 'Insufficient balance', code: 'INSUFFICIENT_BALANCE' }
            });
            return;
        }

        // Start transaction
        const result = await db.prisma.$transaction(async (prisma) => {
            // Deduct from user balance
            await prisma.user.update({
                where: { id: userId },
                data: { balance: { decrement: investmentAmount } }
            });

            // Create investment
            const investment = await prisma.investment.create({
                data: {
                    userId,
                    miningOperationId,
                    amount: investmentAmount,
                    dailyReturn: miningOperation.dailyReturn,
                    status: InvestmentStatus.ACTIVE,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + (miningOperation.duration * 24 * 60 * 60 * 1000))
                },
                include: {
                    miningOperation: {
                        select: {
                            id: true,
                            name: true,
                            dailyReturn: true
                        }
                    }
                }
            });

            // Create transaction record
            await prisma.transaction.create({
                data: {
                    userId,
                    investmentId: investment.id,
                    type: TransactionType.INVESTMENT,
                    amount: investmentAmount,
                    netAmount: investmentAmount,
                    status: TransactionStatus.COMPLETED,
                    description: `Investment in ${miningOperation.name}`,
                    reference: `INV-${investment.id}-${Date.now()}`
                }
            });

            // Update user's total invested
            await prisma.user.update({
                where: { id: userId },
                data: { totalInvested: { increment: investmentAmount } }
            });

            return investment;
        });

        logger.info(`New investment created: ${result.id}`, { userId, amount: investmentAmount });

        // Process referral bonus if user was referred and this is their first investment
        try {
            const userWithReferrer = await db.prisma.user.findUnique({
                where: { id: userId },
                select: { referredBy: true, username: true }
            });

            if (userWithReferrer?.referredBy) {
                // Check if this is the user's first investment
                const investmentCount = await db.prisma.investment.count({
                    where: { userId }
                });

                if (investmentCount === 1) { // This is their first investment
                    const investmentBonus = investmentAmount * 0.05; // 5% of investment amount

                    await db.prisma.$transaction(async (prisma) => {
                        // Add bonus to referrer
                        await prisma.user.update({
                            where: { id: userWithReferrer.referredBy! },
                            data: {
                                balance: { increment: investmentBonus }
                            }
                        });

                        // Create transaction record for referrer
                        await prisma.transaction.create({
                            data: {
                                userId: userWithReferrer.referredBy!,
                                type: TransactionType.REFERRAL_BONUS,
                                amount: investmentBonus,
                                netAmount: investmentBonus,
                                status: TransactionStatus.COMPLETED,
                                description: `Referral bonus for ${userWithReferrer.username}'s first investment of $${investmentAmount.toFixed(2)}`,
                                reference: `REF-INVEST-${userId}-${Date.now()}`
                            }
                        });

                        // Create notification for referrer
                        await prisma.notification.create({
                            data: {
                                userId: userWithReferrer.referredBy!,
                                type: 'SYSTEM_ANNOUNCEMENT',
                                title: 'Referral Investment Bonus!',
                                message: `You earned $${investmentBonus.toFixed(2)} bonus from your referral's first investment!`,
                                metadata: {
                                    referredUserId: userId,
                                    referredUsername: userWithReferrer.username,
                                    investmentAmount: investmentAmount,
                                    bonusAmount: investmentBonus,
                                    bonusType: 'investment'
                                }
                            }
                        });
                    });

                    logger.info(`Referral investment bonus processed: $${investmentBonus} to user ${userWithReferrer.referredBy}`);
                }
            }
        } catch (bonusError) {
            logger.error('Failed to process referral investment bonus:', bonusError);
            // Don't fail investment creation if bonus processing fails
        }

        res.status(201).json({
            success: true,
            data: { investment: result },
            message: 'Investment created successfully'
        });

    } catch (error) {
        logger.error('Create investment error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'CREATE_INVESTMENT_FAILED' }
        });
    }
};

/**
 * Withdraw investment (early termination)
 */
export const withdrawInvestment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const { investmentId } = req.params;

        const investment = await db.prisma.investment.findFirst({
            where: {
                id: investmentId,
                userId,
                status: InvestmentStatus.ACTIVE
            },
            include: {
                miningOperation: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!investment) {
            res.status(404).json({
                success: false,
                error: { message: 'Active investment not found', code: 'INVESTMENT_NOT_FOUND' }
            });
            return;
        }

        // Calculate withdrawal amount with penalty (10% default)
        const penaltyRate = 0.10; // 10% penalty
        const penalty = Number(investment.amount) * penaltyRate;
        const withdrawalAmount = Number(investment.amount) - penalty;

        // Start transaction
        await db.prisma.$transaction(async (prisma) => {
            // Update investment status
            await prisma.investment.update({
                where: { id: investmentId },
                data: {
                    status: InvestmentStatus.CANCELLED,
                    endDate: new Date()
                }
            });

            // Add to user balance
            await prisma.user.update({
                where: { id: userId },
                data: { balance: { increment: withdrawalAmount } }
            });

            // Create transaction record
            await prisma.transaction.create({
                data: {
                    userId,
                    investmentId,
                    type: TransactionType.WITHDRAWAL,
                    amount: withdrawalAmount,
                    netAmount: withdrawalAmount,
                    status: TransactionStatus.COMPLETED,
                    description: `Early withdrawal from ${investment.miningOperation.name} (penalty: ${penalty})`,
                    reference: `WD-${investmentId}-${Date.now()}`
                }
            });
        });

        logger.info(`Investment withdrawn: ${investmentId}`, { userId, amount: withdrawalAmount });

        res.status(200).json({
            success: true,
            message: 'Investment withdrawn successfully',
            data: {
                withdrawalAmount,
                penalty
            }
        });

    } catch (error) {
        logger.error('Withdraw investment error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'WITHDRAW_INVESTMENT_FAILED' }
        });
    }
};

/**
 * Get user's transaction history
 */
export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const { type, status, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const whereClause: any = { userId };
        if (type && Object.values(TransactionType).includes(type as TransactionType)) {
            whereClause.type = type;
        }
        if (status && Object.values(TransactionStatus).includes(status as TransactionStatus)) {
            whereClause.status = status;
        }

        const [transactions, total] = await Promise.all([
            db.prisma.transaction.findMany({
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
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            db.prisma.transaction.count({ where: whereClause })
        ]);

        res.status(200).json({
            success: true,
            data: {
                transactions,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error) {
        logger.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_TRANSACTIONS_FAILED' }
        });
    }
};

// Validation rules
export const createInvestmentValidation = [
    body('miningOperationId')
        .isString()
        .matches(/^c[a-z0-9]{24}$/)
        .withMessage('Valid mining operation ID is required'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0')
];

export const investmentIdValidation = [
    param('investmentId')
        .isString()
        .matches(/^c[a-z0-9]{24}$/)
        .withMessage('Valid investment ID is required')
];