import { Request, Response } from 'express';
import { OperationStatus, InvestmentStatus } from '@prisma/client';
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
 * Get all available mining operations
 */
export const getMiningOperations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 20, status, riskLevel } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        // Build where clause
        const whereClause: any = {};

        if (status && Object.values(OperationStatus).includes(status as OperationStatus)) {
            whereClause.status = status;
        }

        if (riskLevel) {
            whereClause.riskLevel = riskLevel;
        }

        const [operations, total] = await Promise.all([
            db.prisma.miningOperation.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            db.prisma.miningOperation.count({ where: whereClause })
        ]);

        res.status(200).json({
            success: true,
            data: {
                operations,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error) {
        logger.error('Get mining operations error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_MINING_OPERATIONS_FAILED' }
        });
    }
};

/**
 * Get mining operation details by ID
 */
export const getMiningOperationById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const operation = await db.prisma.miningOperation.findUnique({
            where: { id }
        });

        if (!operation) {
            res.status(404).json({
                success: false,
                error: { message: 'Mining operation not found', code: 'MINING_OPERATION_NOT_FOUND' }
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { operation }
        });

    } catch (error) {
        logger.error('Get mining operation by ID error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_MINING_OPERATION_FAILED' }
        });
    }
};

/**
 * Start a mining operation (create investment)
 */
export const startMiningOperation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const { operationId, amount } = req.body;

        // Validate input
        if (!operationId || !amount) {
            res.status(400).json({
                success: false,
                error: { message: 'Operation ID and amount are required', code: 'INVALID_INPUT' }
            });
            return;
        }

        const investmentAmount = Number(amount);
        if (investmentAmount <= 0) {
            res.status(400).json({
                success: false,
                error: { message: 'Investment amount must be greater than 0', code: 'INVALID_AMOUNT' }
            });
            return;
        }

        // Get mining operation
        const operation = await db.prisma.miningOperation.findUnique({
            where: { id: operationId }
        });

        if (!operation) {
            res.status(404).json({
                success: false,
                error: { message: 'Mining operation not found', code: 'MINING_OPERATION_NOT_FOUND' }
            });
            return;
        }

        // Check if operation is active
        if (operation.status !== OperationStatus.ACTIVE) {
            res.status(400).json({
                success: false,
                error: { message: 'Mining operation is not available', code: 'OPERATION_NOT_AVAILABLE' }
            });
            return;
        }

        // Check investment limits
        if (investmentAmount < Number(operation.minInvestment) || investmentAmount > Number(operation.maxInvestment)) {
            res.status(400).json({
                success: false,
                error: {
                    message: `Investment amount must be between ${operation.minInvestment} and ${operation.maxInvestment}`,
                    code: 'INVALID_INVESTMENT_AMOUNT'
                }
            });
            return;
        }

        // Check if operation has capacity
        if (Number(operation.currentCapacity) + investmentAmount > Number(operation.totalCapacity)) {
            res.status(400).json({
                success: false,
                error: { message: 'Mining operation has reached capacity', code: 'CAPACITY_EXCEEDED' }
            });
            return;
        }

        // Get user balance
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

        // Calculate end date
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + operation.duration);

        // Create investment in transaction
        const result = await db.prisma.$transaction(async (prisma) => {
            // Create investment
            const investment = await prisma.investment.create({
                data: {
                    userId,
                    miningOperationId: operationId,
                    amount: investmentAmount,
                    dailyReturn: operation.dailyReturn,
                    startDate,
                    endDate,
                    status: InvestmentStatus.ACTIVE
                }
            });

            // Update user balance
            await prisma.user.update({
                where: { id: userId },
                data: {
                    balance: { decrement: investmentAmount },
                    totalInvested: { increment: investmentAmount }
                }
            });

            // Update operation capacity
            await prisma.miningOperation.update({
                where: { id: operationId },
                data: {
                    currentCapacity: { increment: investmentAmount }
                }
            });

            // Create transaction record
            await prisma.transaction.create({
                data: {
                    userId,
                    investmentId: investment.id,
                    type: 'INVESTMENT',
                    amount: investmentAmount,
                    netAmount: -investmentAmount, // Negative for investment
                    status: 'COMPLETED',
                    description: `Investment in ${operation.name}`,
                    reference: `INV-${investment.id}-${Date.now()}`
                }
            });

            // Create notification
            await prisma.notification.create({
                data: {
                    userId,
                    type: 'INVESTMENT_CREATED',
                    title: 'Mining Operation Started',
                    message: `Your investment of $${investmentAmount.toFixed(2)} in ${operation.name} has been activated.`,
                    metadata: {
                        investmentId: investment.id,
                        operationId: operationId,
                        amount: investmentAmount
                    }
                }
            });

            return investment;
        });

        logger.info(`User ${userId} started mining operation ${operationId} with amount ${investmentAmount}`);

        res.status(201).json({
            success: true,
            data: { investment: result },
            message: 'Mining operation started successfully'
        });

    } catch (error) {
        logger.error('Start mining operation error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'START_MINING_FAILED' }
        });
    }
};

/**
 * Get user's active mining operations
 */
export const getUserMiningOperations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const { page = 1, limit = 20, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        // Build where clause
        const whereClause: any = { userId };

        if (status && Object.values(InvestmentStatus).includes(status as InvestmentStatus)) {
            whereClause.status = status;
        }

        const [investments, total] = await Promise.all([
            db.prisma.investment.findMany({
                where: whereClause,
                include: {
                    miningOperation: true,
                    payouts: {
                        orderBy: { date: 'desc' },
                        take: 5
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            db.prisma.investment.count({ where: whereClause })
        ]);

        // Calculate current earnings for each investment
        const investmentsWithEarnings = investments.map(investment => {
            const totalPayouts = investment.payouts.reduce((sum, payout) => sum + Number(payout.amount), 0);
            const dailyReturn = Number(investment.miningOperation.dailyReturn);
            const daysActive = Math.floor((Date.now() - investment.startDate.getTime()) / (1000 * 60 * 60 * 24));
            const expectedEarnings = daysActive > 0 ? Number(investment.amount) * dailyReturn * daysActive : 0;

            return {
                ...investment,
                currentEarnings: totalPayouts,
                expectedEarnings,
                performance: expectedEarnings > 0 ? (totalPayouts / expectedEarnings) * 100 : 0
            };
        });

        res.status(200).json({
            success: true,
            data: {
                investments: investmentsWithEarnings,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error) {
        logger.error('Get user mining operations error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_USER_MINING_FAILED' }
        });
    }
};

/**
 * Stop a mining operation
 */
export const stopMiningOperation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const { id } = req.params;

        // Get investment
        const investment = await db.prisma.investment.findFirst({
            where: {
                id,
                userId,
                status: InvestmentStatus.ACTIVE
            },
            include: {
                miningOperation: true
            }
        });

        if (!investment) {
            res.status(404).json({
                success: false,
                error: { message: 'Active investment not found', code: 'INVESTMENT_NOT_FOUND' }
            });
            return;
        }

        // Update investment status
        await db.prisma.investment.update({
            where: { id },
            data: {
                status: InvestmentStatus.COMPLETED,
                endDate: new Date()
            }
        });

        // Create notification
        await db.prisma.notification.create({
            data: {
                userId,
                type: 'INVESTMENT_COMPLETED',
                title: 'Mining Operation Completed',
                message: `Your investment in ${investment.miningOperation.name} has been completed.`,
                metadata: {
                    investmentId: id,
                    operationId: investment.miningOperationId,
                    amount: investment.amount
                }
            }
        });

        logger.info(`User ${userId} stopped mining operation ${id}`);

        res.status(200).json({
            success: true,
            message: 'Mining operation stopped successfully'
        });

    } catch (error) {
        logger.error('Stop mining operation error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'STOP_MINING_FAILED' }
        });
    }
};