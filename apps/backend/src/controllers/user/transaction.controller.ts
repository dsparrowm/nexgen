import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { TransactionType, TransactionStatus, PaymentMethod } from '@prisma/client';
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
 * Create a deposit transaction
 */
export const createDeposit = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const { amount, paymentMethod, paymentId } = req.body;
        const depositAmount = Number(amount);

        if (depositAmount <= 0) {
            res.status(400).json({
                success: false,
                error: { message: 'Deposit amount must be greater than 0', code: 'INVALID_AMOUNT' }
            });
            return;
        }

        // Create deposit transaction
        const transaction = await db.prisma.transaction.create({
            data: {
                userId,
                type: TransactionType.DEPOSIT,
                amount: depositAmount,
                netAmount: depositAmount,
                status: TransactionStatus.PENDING, // Will be completed after payment processing
                paymentMethod: paymentMethod || PaymentMethod.MANUAL,
                paymentId,
                description: `Deposit of $${depositAmount.toFixed(2)}`,
                reference: `DEP-${userId}-${Date.now()}`
            }
        });

        logger.info(`Deposit transaction created: ${transaction.id}`, { userId, amount: depositAmount });

        res.status(201).json({
            success: true,
            data: { transaction },
            message: 'Deposit transaction created successfully. Please complete payment.'
        });

    } catch (error) {
        logger.error('Create deposit error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'CREATE_DEPOSIT_FAILED' }
        });
    }
};

/**
 * Create a withdrawal transaction
 */
export const createWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const { amount, paymentMethod } = req.body;
        const withdrawalAmount = Number(amount);

        if (withdrawalAmount <= 0) {
            res.status(400).json({
                success: false,
                error: { message: 'Withdrawal amount must be greater than 0', code: 'INVALID_AMOUNT' }
            });
            return;
        }

        // Check user balance
        const user = await db.prisma.user.findUnique({
            where: { id: userId },
            select: { balance: true }
        });

        if (!user || Number(user.balance) < withdrawalAmount) {
            res.status(400).json({
                success: false,
                error: { message: 'Insufficient balance', code: 'INSUFFICIENT_BALANCE' }
            });
            return;
        }

        // Create withdrawal transaction
        const transaction = await db.prisma.transaction.create({
            data: {
                userId,
                type: TransactionType.WITHDRAWAL,
                amount: withdrawalAmount,
                netAmount: -withdrawalAmount, // Negative for withdrawal
                status: TransactionStatus.PENDING, // Will be processed later
                paymentMethod: paymentMethod || PaymentMethod.BANK_TRANSFER,
                description: `Withdrawal of $${withdrawalAmount.toFixed(2)}`,
                reference: `WD-${userId}-${Date.now()}`
            }
        });

        logger.info(`Withdrawal transaction created: ${transaction.id}`, { userId, amount: withdrawalAmount });

        res.status(201).json({
            success: true,
            data: { transaction },
            message: 'Withdrawal request submitted successfully. Processing may take 1-3 business days.'
        });

    } catch (error) {
        logger.error('Create withdrawal error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'CREATE_WITHDRAWAL_FAILED' }
        });
    }
};

/**
 * Get user's transaction history (comprehensive)
 */
export const getUserTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
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

        // Calculate summary statistics
        const summary = await db.prisma.transaction.groupBy({
            by: ['type'],
            where: { userId, status: TransactionStatus.COMPLETED },
            _sum: { netAmount: true },
            _count: { id: true }
        });

        const transactionSummary = {
            deposits: Number(summary.find(s => s.type === TransactionType.DEPOSIT)?._sum.netAmount || 0),
            withdrawals: Math.abs(Number(summary.find(s => s.type === TransactionType.WITHDRAWAL)?._sum.netAmount || 0)),
            investments: Math.abs(Number(summary.find(s => s.type === TransactionType.INVESTMENT)?._sum.netAmount || 0)),
            payouts: Number(summary.find(s => s.type === TransactionType.PAYOUT)?._sum.netAmount || 0),
            totalTransactions: summary.reduce((sum, s) => sum + s._count.id, 0)
        };

        res.status(200).json({
            success: true,
            data: {
                transactions,
                summary: transactionSummary,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error) {
        logger.error('Get user transactions error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_TRANSACTIONS_FAILED' }
        });
    }
};

/**
 * Get transaction details by ID
 */
export const getTransactionById = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const transaction = await db.prisma.transaction.findFirst({
            where: {
                id,
                userId
            },
            include: {
                investment: {
                    include: {
                        miningOperation: {
                            select: {
                                id: true,
                                name: true,
                                description: true
                            }
                        }
                    }
                }
            }
        });

        if (!transaction) {
            res.status(404).json({
                success: false,
                error: { message: 'Transaction not found', code: 'TRANSACTION_NOT_FOUND' }
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { transaction }
        });

    } catch (error) {
        logger.error('Get transaction by ID error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_TRANSACTION_FAILED' }
        });
    }
};

// Validation rules
export const createDepositValidation = [
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0'),
    body('paymentMethod')
        .optional()
        .isIn(Object.values(PaymentMethod))
        .withMessage('Invalid payment method'),
    body('paymentId')
        .optional()
        .isString()
        .withMessage('Payment ID must be a string')
];

export const createWithdrawalValidation = [
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0'),
    body('paymentMethod')
        .optional()
        .isIn(Object.values(PaymentMethod))
        .withMessage('Invalid payment method')
];