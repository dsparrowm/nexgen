import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import {
    PaymentMethod,
    TransactionStatus,
    TransactionType,
    UserRole,
} from '@prisma/client';
import db from '@/services/database';
import {
    applyTransactionEffects,
    computeNetAmount,
    reconcileTransactionEffects,
} from '@/services/transactionBalance.service';
import { logger } from '@/utils/logger';

const TRANSACTION_TYPES = Object.values(TransactionType);
const TRANSACTION_STATUSES = Object.values(TransactionStatus);
const PAYMENT_METHODS = Object.values(PaymentMethod);

const isAdmin = (role?: string) =>
    role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

const parseTransactionDate = (value: unknown): Date | null => {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const date = new Date(value as string);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
};

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
        if (!userId || !isAdmin(req.user?.role)) {
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
        if (!userId || !isAdmin(req.user?.role)) {
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
        const adminId = req.user?.userId;
        if (!adminId || !isAdmin(req.user?.role)) {
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

        await db.prisma.$transaction(async (prisma) => {
            await prisma.transaction.update({
                where: { id },
                data: {
                    status: TransactionStatus.COMPLETED,
                    processedAt: new Date(),
                    metadata: {
                        ...(transaction.metadata as Record<string, unknown> || {}),
                        approvedBy: adminId,
                        approvedAt: new Date().toISOString(),
                        approvalNotes: notes || '',
                        processedAt: new Date().toISOString()
                    }
                }
            });

            await applyTransactionEffects(
                prisma,
                transaction.userId,
                transaction.type,
                Number(transaction.amount),
                TransactionStatus.COMPLETED
            );

            logger.info(`Transaction ${id} approved by admin ${adminId}`, {
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
        if (error instanceof Error && error.message === 'INSUFFICIENT_BALANCE') {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Insufficient user balance to approve this transaction',
                    code: 'INSUFFICIENT_BALANCE',
                },
            });
            return;
        }
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
        const adminId = req.user?.userId;
        if (!adminId || !isAdmin(req.user?.role)) {
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
                    rejectedBy: adminId,
                    rejectedAt: new Date().toISOString(),
                    rejectionReason: reason || 'Rejected by admin',
                    rejectionNotes: notes || '',
                    processedAt: new Date().toISOString()
                }
            }
        });

        logger.info(`Transaction ${id} rejected by admin ${adminId}`, {
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
        const adminId = req.user?.userId;
        if (!adminId || !isAdmin(req.user?.role)) {
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

async function validateLinkedRecords(
    userId: string,
    investmentId?: string | null,
    assetPositionId?: string | null
): Promise<string | null> {
    if (investmentId) {
        const investment = await db.prisma.investment.findUnique({
            where: { id: investmentId },
            select: { userId: true },
        });
        if (!investment) {
            return 'Investment not found';
        }
        if (investment.userId !== userId) {
            return 'Investment does not belong to the selected user';
        }
    }

    if (assetPositionId) {
        const assetPosition = await db.prisma.assetPosition.findUnique({
            where: { id: assetPositionId },
            select: { userId: true },
        });
        if (!assetPosition) {
            return 'Asset position not found';
        }
        if (assetPosition.userId !== userId) {
            return 'Asset position does not belong to the selected user';
        }
    }

    return null;
}

/**
 * Create a transaction (admin)
 */
export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    details: errors.array(),
                },
            });
            return;
        }

        const adminId = req.user?.userId;
        if (!adminId || !isAdmin(req.user?.role)) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' },
            });
            return;
        }

        const {
            userId,
            type,
            amount,
            status = TransactionStatus.PENDING,
            description,
            fee = 0,
            paymentMethod,
            failureReason,
            reference,
            investmentId,
            assetPositionId,
            transactionDate,
        } = req.body;

        const transactionAmount = Number(amount);
        const transactionFee = Number(fee) || 0;
        const parsedTransactionDate = parseTransactionDate(transactionDate);

        if (transactionDate && !parsedTransactionDate) {
            res.status(400).json({
                success: false,
                error: { message: 'Invalid transaction date', code: 'INVALID_TRANSACTION_DATE' },
            });
            return;
        }

        const user = await db.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, balance: true },
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' },
            });
            return;
        }

        const linkError = await validateLinkedRecords(userId, investmentId, assetPositionId);
        if (linkError) {
            res.status(400).json({
                success: false,
                error: { message: linkError, code: 'INVALID_LINKED_RECORD' },
            });
            return;
        }

        const transactionReference =
            reference || `ADM-${type}-${userId}-${Date.now()}`;

        const existingReference = await db.prisma.transaction.findUnique({
            where: { reference: transactionReference },
        });

        if (existingReference) {
            res.status(400).json({
                success: false,
                error: { message: 'Reference already exists', code: 'DUPLICATE_REFERENCE' },
            });
            return;
        }

        const netAmount = computeNetAmount(type as TransactionType, transactionAmount);

        try {
            const transaction = await db.prisma.$transaction(async (prisma) => {
                const created = await prisma.transaction.create({
                    data: {
                        userId,
                        type: type as TransactionType,
                        amount: transactionAmount,
                        netAmount,
                        fee: transactionFee,
                        status: status as TransactionStatus,
                        description: description || `Admin-created ${type} transaction`,
                        reference: transactionReference,
                        paymentMethod: paymentMethod as PaymentMethod | undefined,
                        failureReason:
                            status === TransactionStatus.FAILED ? failureReason : undefined,
                        investmentId: investmentId || undefined,
                        assetPositionId: assetPositionId || undefined,
                        createdAt: parsedTransactionDate || undefined,
                        processedAt:
                            status === TransactionStatus.COMPLETED ||
                            status === TransactionStatus.FAILED
                                ? new Date()
                                : undefined,
                        metadata: {
                            createdByAdmin: adminId,
                            createdAt: new Date().toISOString(),
                        },
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                username: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                });

                await applyTransactionEffects(
                    prisma,
                    userId,
                    type as TransactionType,
                    transactionAmount,
                    status as TransactionStatus
                );

                await prisma.auditLog.create({
                    data: {
                        userId: adminId,
                        action: 'TRANSACTION_CREATED',
                        resource: 'transaction',
                        resourceId: created.id,
                        newValues: {
                            userId,
                            type,
                            amount: transactionAmount,
                            status,
                            reference: transactionReference,
                            createdAt: parsedTransactionDate?.toISOString() || new Date().toISOString(),
                        },
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent'),
                    },
                });

                return created;
            });

            logger.info(`Admin ${adminId} created transaction ${transaction.id}`);

            res.status(201).json({
                success: true,
                message: 'Transaction created successfully',
                data: { transaction },
            });
        } catch (error) {
            if (error instanceof Error && error.message === 'INSUFFICIENT_BALANCE') {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Insufficient user balance for this transaction',
                        code: 'INSUFFICIENT_BALANCE',
                    },
                });
                return;
            }
            throw error;
        }
    } catch (error) {
        logger.error('Create transaction error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'CREATE_TRANSACTION_FAILED' },
        });
    }
};

/**
 * Update a transaction (admin)
 */
export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    details: errors.array(),
                },
            });
            return;
        }

        const adminId = req.user?.userId;
        if (!adminId || !isAdmin(req.user?.role)) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' },
            });
            return;
        }

        const { id } = req.params;
        const existing = await db.prisma.transaction.findUnique({ where: { id } });

        if (!existing) {
            res.status(404).json({
                success: false,
                error: { message: 'Transaction not found', code: 'TRANSACTION_NOT_FOUND' },
            });
            return;
        }

        const {
            userId = existing.userId,
            type = existing.type,
            amount = Number(existing.amount),
            status = existing.status,
            description = existing.description,
            fee = Number(existing.fee),
            paymentMethod = existing.paymentMethod,
            failureReason = existing.failureReason,
            reference = existing.reference,
            investmentId = existing.investmentId,
            assetPositionId = existing.assetPositionId,
        } = req.body;

        const transactionAmount = Number(amount);
        const transactionFee = Number(fee) || 0;
        const parsedTransactionDate =
            req.body.transactionDate !== undefined
                ? parseTransactionDate(req.body.transactionDate)
                : existing.createdAt;

        if (req.body.transactionDate !== undefined && !parsedTransactionDate) {
            res.status(400).json({
                success: false,
                error: { message: 'Invalid transaction date', code: 'INVALID_TRANSACTION_DATE' },
            });
            return;
        }

        const user = await db.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' },
            });
            return;
        }

        const linkError = await validateLinkedRecords(userId, investmentId, assetPositionId);
        if (linkError) {
            res.status(400).json({
                success: false,
                error: { message: linkError, code: 'INVALID_LINKED_RECORD' },
            });
            return;
        }

        if (reference !== existing.reference) {
            const duplicateReference = await db.prisma.transaction.findUnique({
                where: { reference },
            });
            if (duplicateReference) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Reference already exists', code: 'DUPLICATE_REFERENCE' },
                });
                return;
            }
        }

        const netAmount = computeNetAmount(type as TransactionType, transactionAmount);
        const newStatus = status as TransactionStatus;
        const processedAt =
            newStatus === TransactionStatus.COMPLETED || newStatus === TransactionStatus.FAILED
                ? existing.processedAt || new Date()
                : null;

        try {
            const transaction = await db.prisma.$transaction(async (prisma) => {
                await reconcileTransactionEffects(
                    prisma,
                    existing.userId,
                    userId,
                    existing.type,
                    Number(existing.amount),
                    existing.status,
                    type as TransactionType,
                    transactionAmount,
                    newStatus
                );

                const updated = await prisma.transaction.update({
                    where: { id },
                    data: {
                        userId,
                        type: type as TransactionType,
                        amount: transactionAmount,
                        netAmount,
                        fee: transactionFee,
                        status: newStatus,
                        description,
                        reference,
                        paymentMethod: paymentMethod as PaymentMethod | null,
                        failureReason:
                            newStatus === TransactionStatus.FAILED ? failureReason : null,
                        investmentId: investmentId || null,
                        assetPositionId: assetPositionId || null,
                        createdAt: parsedTransactionDate || existing.createdAt,
                        processedAt,
                        metadata: {
                            ...(existing.metadata as Record<string, unknown> || {}),
                            updatedByAdmin: adminId,
                            updatedAt: new Date().toISOString(),
                        },
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                username: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                });

                await prisma.auditLog.create({
                    data: {
                        userId: adminId,
                        action: 'TRANSACTION_UPDATED',
                        resource: 'transaction',
                        resourceId: id,
                        oldValues: {
                            userId: existing.userId,
                            type: existing.type,
                            amount: Number(existing.amount),
                            status: existing.status,
                            reference: existing.reference,
                            createdAt: existing.createdAt.toISOString(),
                        },
                        newValues: {
                            userId,
                            type,
                            amount: transactionAmount,
                            status: newStatus,
                            reference,
                            createdAt: parsedTransactionDate?.toISOString(),
                        },
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent'),
                    },
                });

                return updated;
            });

            logger.info(`Admin ${adminId} updated transaction ${id}`);

            res.status(200).json({
                success: true,
                message: 'Transaction updated successfully',
                data: { transaction },
            });
        } catch (error) {
            if (error instanceof Error && error.message === 'INSUFFICIENT_BALANCE') {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Insufficient user balance for this transaction update',
                        code: 'INSUFFICIENT_BALANCE',
                    },
                });
                return;
            }
            throw error;
        }
    } catch (error) {
        logger.error('Update transaction error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'UPDATE_TRANSACTION_FAILED' },
        });
    }
};

export const createTransactionValidation = [
    body('userId')
        .isString()
        .matches(/^c[a-z0-9]{24}$/)
        .withMessage('Valid user ID is required'),
    body('type')
        .isIn(TRANSACTION_TYPES)
        .withMessage('Valid transaction type is required'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0'),
    body('status')
        .optional()
        .isIn(TRANSACTION_STATUSES)
        .withMessage('Valid transaction status is required'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must be 500 characters or fewer'),
    body('fee')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Fee must be 0 or greater'),
    body('paymentMethod')
        .optional()
        .isIn(PAYMENT_METHODS)
        .withMessage('Valid payment method is required'),
    body('failureReason')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Failure reason must be 500 characters or fewer'),
    body('reference')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Reference must be between 1 and 100 characters'),
    body('investmentId')
        .optional({ nullable: true })
        .isString()
        .matches(/^c[a-z0-9]{24}$/)
        .withMessage('Valid investment ID is required'),
    body('assetPositionId')
        .optional({ nullable: true })
        .isString()
        .matches(/^c[a-z0-9]{24}$/)
        .withMessage('Valid asset position ID is required'),
    body('transactionDate')
        .optional()
        .isISO8601()
        .withMessage('Valid transaction date is required'),
];

export const updateTransactionValidation = [
    param('id')
        .isString()
        .matches(/^c[a-z0-9]{24}$/)
        .withMessage('Valid transaction ID is required'),
    body('userId')
        .optional()
        .isString()
        .matches(/^c[a-z0-9]{24}$/)
        .withMessage('Valid user ID is required'),
    body('type')
        .optional()
        .isIn(TRANSACTION_TYPES)
        .withMessage('Valid transaction type is required'),
    body('amount')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0'),
    body('status')
        .optional()
        .isIn(TRANSACTION_STATUSES)
        .withMessage('Valid transaction status is required'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must be 500 characters or fewer'),
    body('fee')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Fee must be 0 or greater'),
    body('paymentMethod')
        .optional({ nullable: true })
        .isIn(PAYMENT_METHODS)
        .withMessage('Valid payment method is required'),
    body('failureReason')
        .optional({ nullable: true })
        .isLength({ max: 500 })
        .withMessage('Failure reason must be 500 characters or fewer'),
    body('reference')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Reference must be between 1 and 100 characters'),
    body('investmentId')
        .optional({ nullable: true })
        .isString()
        .matches(/^c[a-z0-9]{24}$/)
        .withMessage('Valid investment ID is required'),
    body('assetPositionId')
        .optional({ nullable: true })
        .isString()
        .matches(/^c[a-z0-9]{24}$/)
        .withMessage('Valid asset position ID is required'),
    body('transactionDate')
        .optional()
        .isISO8601()
        .withMessage('Valid transaction date is required'),
];