import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { UserRole, TransactionType, TransactionStatus } from '@prisma/client';
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
 * Add credits to user balance
 */
export const addCredits = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const adminId = req.user?.userId;
        if (!adminId || req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
            });
            return;
        }

        const { userId, amount, reason } = req.body;
        const creditAmount = Number(amount);

        if (creditAmount <= 0) {
            res.status(400).json({
                success: false,
                error: { message: 'Credit amount must be greater than 0', code: 'INVALID_AMOUNT' }
            });
            return;
        }

        // Check if user exists
        const user = await db.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, balance: true }
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
            return;
        }

        // Add credits in transaction
        const result = await db.prisma.$transaction(async (prisma) => {
            // Update user balance
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    balance: { increment: creditAmount }
                },
                select: { id: true, balance: true }
            });

            // Create transaction record
            const transaction = await prisma.transaction.create({
                data: {
                    userId,
                    type: TransactionType.BONUS,
                    amount: creditAmount,
                    netAmount: creditAmount,
                    status: TransactionStatus.COMPLETED,
                    description: `Admin credit addition: ${reason || 'Manual credit addition'}`,
                    reference: `CREDIT-${userId}-${Date.now()}`
                }
            });

            // Create audit log
            await prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: 'CREDITS_ADDED',
                    resource: 'user',
                    resourceId: userId,
                    oldValues: { balance: user.balance },
                    newValues: { balance: updatedUser.balance, amount: creditAmount, reason },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            });

            // Create notification for user
            await prisma.notification.create({
                data: {
                    userId,
                    type: 'SYSTEM_ANNOUNCEMENT',
                    title: 'Credits Added',
                    message: `$${creditAmount.toFixed(2)} has been added to your account balance.`,
                    metadata: {
                        amount: creditAmount,
                        reason: reason || 'Admin credit addition',
                        adminId
                    }
                }
            });

            return { updatedUser, transaction };
        });

        logger.info(`Admin ${adminId} added ${creditAmount} credits to user ${userId}`);

        res.status(200).json({
            success: true,
            data: {
                userId,
                newBalance: result.updatedUser.balance,
                amount: creditAmount
            },
            message: `Successfully added $${creditAmount.toFixed(2)} to user balance`
        });

    } catch (error) {
        logger.error('Add credits error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'ADD_CREDITS_FAILED' }
        });
    }
};

/**
 * Deduct credits from user balance
 */
export const deductCredits = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const adminId = req.user?.userId;
        if (!adminId || req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
            });
            return;
        }

        const { userId, amount, reason } = req.body;
        const deductAmount = Number(amount);

        if (deductAmount <= 0) {
            res.status(400).json({
                success: false,
                error: { message: 'Deduct amount must be greater than 0', code: 'INVALID_AMOUNT' }
            });
            return;
        }

        // Check if user exists and has sufficient balance
        const user = await db.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, balance: true }
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
            return;
        }

        if (Number(user.balance) < deductAmount) {
            res.status(400).json({
                success: false,
                error: { message: 'User has insufficient balance', code: 'INSUFFICIENT_BALANCE' }
            });
            return;
        }

        // Deduct credits in transaction
        const result = await db.prisma.$transaction(async (prisma) => {
            // Update user balance
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    balance: { decrement: deductAmount }
                },
                select: { id: true, balance: true }
            });

            // Create transaction record
            const transaction = await prisma.transaction.create({
                data: {
                    userId,
                    type: TransactionType.FEE,
                    amount: deductAmount,
                    netAmount: -deductAmount,
                    status: TransactionStatus.COMPLETED,
                    description: `Admin credit deduction: ${reason || 'Manual credit deduction'}`,
                    reference: `DEDUCT-${userId}-${Date.now()}`
                }
            });

            // Create audit log
            await prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: 'CREDITS_DEDUCTED',
                    resource: 'user',
                    resourceId: userId,
                    oldValues: { balance: user.balance },
                    newValues: { balance: updatedUser.balance, amount: deductAmount, reason },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            });

            // Create notification for user
            await prisma.notification.create({
                data: {
                    userId,
                    type: 'SYSTEM_ANNOUNCEMENT',
                    title: 'Credits Deducted',
                    message: `$${deductAmount.toFixed(2)} has been deducted from your account balance.`,
                    metadata: {
                        amount: deductAmount,
                        reason: reason || 'Admin credit deduction',
                        adminId
                    }
                }
            });

            return { updatedUser, transaction };
        });

        logger.info(`Admin ${adminId} deducted ${deductAmount} credits from user ${userId}`);

        res.status(200).json({
            success: true,
            data: {
                userId,
                newBalance: result.updatedUser.balance,
                amount: deductAmount
            },
            message: `Successfully deducted $${deductAmount.toFixed(2)} from user balance`
        });

    } catch (error) {
        logger.error('Deduct credits error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'DEDUCT_CREDITS_FAILED' }
        });
    }
};

/**
 * Get credit transaction history for a user
 */
export const getCreditHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const adminId = req.user?.userId;
        if (!adminId || req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
            });
            return;
        }

        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        // Get credit-related transactions (BONUS and FEE types)
        const [transactions, total] = await Promise.all([
            db.prisma.transaction.findMany({
                where: {
                    userId,
                    type: { in: [TransactionType.BONUS, TransactionType.FEE] }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            db.prisma.transaction.count({
                where: {
                    userId,
                    type: { in: [TransactionType.BONUS, TransactionType.FEE] }
                }
            })
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
        logger.error('Get credit history error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_CREDIT_HISTORY_FAILED' }
        });
    }
};

// Validation rules
export const addCreditsValidation = [
    body('userId')
        .isUUID()
        .withMessage('Valid user ID is required'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0'),
    body('reason')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('Reason must be between 1 and 500 characters')
];

export const deductCreditsValidation = [
    body('userId')
        .isUUID()
        .withMessage('Valid user ID is required'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0'),
    body('reason')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('Reason must be between 1 and 500 characters')
];

export const userIdValidation = [
    param('userId')
        .isUUID()
        .withMessage('Valid user ID is required')
];