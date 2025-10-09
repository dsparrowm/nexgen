import { Request, Response } from 'express';
import { TransactionStatus, UserRole } from '@prisma/client';
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
 * Get all transactions with filtering and pagination
 */
export const getAllTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
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
            type,
            userId: filterUserId,
            search
        } = req.query;

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (type) {
            where.type = type;
        }

        if (filterUserId) {
            where.userId = filterUserId;
        }

        if (search) {
            where.OR = [
                { description: { contains: search as string, mode: 'insensitive' } },
                { reference: { contains: search as string, mode: 'insensitive' } },
                { user: { email: { contains: search as string, mode: 'insensitive' } } },
                { user: { username: { contains: search as string, mode: 'insensitive' } } }
            ];
        }

        // Get transactions with user info
        const [transactions, total] = await Promise.all([
            db.prisma.transaction.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            username: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            db.prisma.transaction.count({ where })
        ]);

        res.status(200).json({
            success: true,
            data: {
                transactions,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });

    } catch (error) {
        logger.error('Get all transactions error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_TRANSACTIONS_FAILED' }
        });
    }
};

/**
 * Get a specific transaction by ID
 */
export const getTransactionById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId || req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
            });
            return;
        }

        const { id } = req.params;

        const transaction = await db.prisma.transaction.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        balance: true
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

/**
 * Approve a transaction (deposit or withdrawal)
 */
export const approveTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId || req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
            });
            return;
        }

        const { id } = req.params;
        const { notes } = req.body;

        const transaction = await db.prisma.transaction.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!transaction) {
            res.status(404).json({
                success: false,
                error: { message: 'Transaction not found', code: 'TRANSACTION_NOT_FOUND' }
            });
            return;
        }

        if (transaction.status !== TransactionStatus.PENDING) {
            res.status(400).json({
                success: false,
                error: { message: 'Transaction is not in pending status', code: 'INVALID_STATUS' }
            });
            return;
        }

        // Update transaction status and process the transaction
        await db.prisma.$transaction(async (prisma) => {
            // Update transaction status
            await prisma.transaction.update({
                where: { id },
                data: {
                    status: TransactionStatus.COMPLETED,
                    processedAt: new Date(),
                    metadata: {
                        ...(transaction.metadata as any || {}),
                        approvedBy: userId,
                        approvedAt: new Date().toISOString(),
                        approvalNotes: notes || '',
                        processedAt: new Date().toISOString()
                    }
                }
            });

            // For deposits, add to user balance
            if (transaction.type === 'DEPOSIT') {
                await prisma.user.update({
                    where: { id: transaction.userId },
                    data: {
                        balance: {
                            increment: transaction.amount
                        }
                    }
                });
            }
            // For withdrawals, balance was already checked during creation
            // The negative netAmount represents the deduction

            logger.info(`Transaction ${id} approved by admin ${userId}`, {
                transactionId: id,
                type: transaction.type,
                amount: transaction.amount,
                userId: transaction.userId
            });
        });

        res.status(200).json({
            success: true,
            message: 'Transaction approved successfully',
            data: { transactionId: id }
        });

    } catch (error) {
        logger.error('Approve transaction error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'APPROVE_TRANSACTION_FAILED' }
        });
    }
};

/**
 * Reject a transaction
 */
export const rejectTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId || req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
            });
            return;
        }

        const { id } = req.params;
        const { reason, notes } = req.body;

        const transaction = await db.prisma.transaction.findUnique({
            where: { id }
        });

        if (!transaction) {
            res.status(404).json({
                success: false,
                error: { message: 'Transaction not found', code: 'TRANSACTION_NOT_FOUND' }
            });
            return;
        }

        if (transaction.status !== TransactionStatus.PENDING) {
            res.status(400).json({
                success: false,
                error: { message: 'Transaction is not in pending status', code: 'INVALID_STATUS' }
            });
            return;
        }

        // Update transaction status to failed
        await db.prisma.transaction.update({
            where: { id },
            data: {
                status: TransactionStatus.FAILED,
                failureReason: reason || 'Rejected by admin',
                processedAt: new Date(),
                metadata: {
                    ...(transaction.metadata as any || {}),
                    rejectedBy: userId,
                    rejectedAt: new Date().toISOString(),
                    rejectionReason: reason || 'Rejected by admin',
                    rejectionNotes: notes || '',
                    processedAt: new Date().toISOString()
                }
            }
        });

        logger.info(`Transaction ${id} rejected by admin ${userId}`, {
            transactionId: id,
            reason: reason || 'Rejected by admin',
            userId: transaction.userId
        });

        res.status(200).json({
            success: true,
            message: 'Transaction rejected successfully',
            data: { transactionId: id }
        });

    } catch (error) {
        logger.error('Reject transaction error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'REJECT_TRANSACTION_FAILED' }
        });
    }
};

/**
 * Get transaction statistics for admin dashboard
 */
export const getTransactionStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId || req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
            });
            return;
        }

        const [
            totalTransactions,
            pendingTransactions,
            completedTransactions,
            failedTransactions,
            totalDepositAmount,
            totalWithdrawalAmount,
            recentPendingTransactions
        ] = await Promise.all([
            db.prisma.transaction.count(),
            db.prisma.transaction.count({ where: { status: TransactionStatus.PENDING } }),
            db.prisma.transaction.count({ where: { status: TransactionStatus.COMPLETED } }),
            db.prisma.transaction.count({ where: { status: TransactionStatus.FAILED } }),
            db.prisma.transaction.aggregate({
                _sum: { amount: true },
                where: { type: 'DEPOSIT', status: TransactionStatus.COMPLETED }
            }),
            db.prisma.transaction.aggregate({
                _sum: { amount: true },
                where: { type: 'WITHDRAWAL', status: TransactionStatus.COMPLETED }
            }),
            db.prisma.transaction.findMany({
                where: { status: TransactionStatus.PENDING },
                include: {
                    user: {
                        select: { email: true, username: true, firstName: true, lastName: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            })
        ]);

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    total: totalTransactions,
                    pending: pendingTransactions,
                    completed: completedTransactions,
                    failed: failedTransactions
                },
                amounts: {
                    deposits: Number(totalDepositAmount._sum.amount || 0),
                    withdrawals: Math.abs(Number(totalWithdrawalAmount._sum.amount || 0))
                },
                recentPending: recentPendingTransactions
            }
        });

    } catch (error) {
        logger.error('Get transaction stats error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_STATS_FAILED' }
        });
    }
};