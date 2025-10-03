import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { OperationStatus, UserRole } from '@prisma/client';
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
 * Get all mining operations with filtering and pagination
 */
export const getMiningOperations = async (req: AuthRequest, res: Response): Promise<void> => {
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
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        // Build where clause
        const whereClause: any = {};

        if (status && Object.values(OperationStatus).includes(status as OperationStatus)) {
            whereClause.status = status;
        }

        if (search) {
            whereClause.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        // Build order clause
        const orderBy: any = {};
        orderBy[sortBy as string] = sortOrder;

        const [operations, total] = await Promise.all([
            db.prisma.miningOperation.findMany({
                where: whereClause,
                include: {
                    _count: {
                        select: {
                            investments: true
                        }
                    },
                    investments: {
                        where: { status: 'ACTIVE' },
                        select: {
                            amount: true
                        }
                    }
                },
                orderBy,
                skip,
                take: Number(limit)
            }),
            db.prisma.miningOperation.count({ where: whereClause })
        ]);

        // Calculate total invested for each operation
        const operationsWithStats = operations.map(operation => ({
            ...operation,
            totalInvested: operation.investments.reduce((sum, inv) => sum + Number(inv.amount), 0),
            activeInvestments: operation._count.investments
        }));

        res.status(200).json({
            success: true,
            data: {
                operations: operationsWithStats,
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
 * Get specific mining operation details
 */
export const getMiningOperation = async (req: AuthRequest, res: Response): Promise<void> => {
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
        if (!userId || req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
            });
            return;
        }

        const { operationId } = req.params;

        const operation = await db.prisma.miningOperation.findUnique({
            where: { id: operationId },
            include: {
                investments: {
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
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: {
                        investments: true
                    }
                }
            }
        });

        if (!operation) {
            res.status(404).json({
                success: false,
                error: { message: 'Mining operation not found', code: 'OPERATION_NOT_FOUND' }
            });
            return;
        }

        // Calculate statistics
        const totalInvested = operation.investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const activeInvestments = operation.investments.filter(inv => inv.status === 'ACTIVE').length;

        const operationWithStats = {
            ...operation,
            totalInvested,
            activeInvestments,
            currentCapacity: operation.currentCapacity
        };

        res.status(200).json({
            success: true,
            data: { operation: operationWithStats }
        });

    } catch (error) {
        logger.error('Get mining operation error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_MINING_OPERATION_FAILED' }
        });
    }
};

/**
 * Create new mining operation
 */
export const createMiningOperation = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const {
            name,
            description,
            minInvestment,
            maxInvestment,
            dailyReturn,
            duration,
            riskLevel,
            totalCapacity,
            startDate,
            endDate,
            imageUrl,
            features
        } = req.body;

        const operation = await db.prisma.miningOperation.create({
            data: {
                name,
                description,
                minInvestment,
                maxInvestment,
                dailyReturn,
                duration,
                riskLevel,
                status: OperationStatus.DRAFT,
                totalCapacity,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                imageUrl,
                features: features || []
            }
        });

        // Log the admin action
        await db.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: 'MINING_OPERATION_CREATE',
                resource: 'mining_operation',
                resourceId: operation.id,
                newValues: operation,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        logger.info(`Mining operation created: ${operation.name}`, { adminId, operationId: operation.id });

        res.status(201).json({
            success: true,
            data: { operation },
            message: 'Mining operation created successfully'
        });

    } catch (error) {
        logger.error('Create mining operation error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'CREATE_MINING_OPERATION_FAILED' }
        });
    }
};

/**
 * Update mining operation
 */
export const updateMiningOperation = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const { operationId } = req.params;

        // Check if operation exists
        const existingOperation = await db.prisma.miningOperation.findUnique({
            where: { id: operationId }
        });

        if (!existingOperation) {
            res.status(404).json({
                success: false,
                error: { message: 'Mining operation not found', code: 'OPERATION_NOT_FOUND' }
            });
            return;
        }

        const {
            name,
            description,
            minInvestment,
            maxInvestment,
            dailyReturn,
            duration,
            riskLevel,
            status,
            totalCapacity,
            startDate,
            endDate,
            imageUrl,
            features
        } = req.body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (minInvestment !== undefined) updateData.minInvestment = minInvestment;
        if (maxInvestment !== undefined) updateData.maxInvestment = maxInvestment;
        if (dailyReturn !== undefined) updateData.dailyReturn = dailyReturn;
        if (duration !== undefined) updateData.duration = duration;
        if (riskLevel !== undefined) updateData.riskLevel = riskLevel;
        if (status && Object.values(OperationStatus).includes(status)) updateData.status = status;
        if (totalCapacity !== undefined) updateData.totalCapacity = totalCapacity;
        if (startDate !== undefined) updateData.startDate = new Date(startDate);
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (features !== undefined) updateData.features = features;

        const updatedOperation = await db.prisma.miningOperation.update({
            where: { id: operationId },
            data: updateData
        });

        // Log the admin action
        await db.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: 'MINING_OPERATION_UPDATE',
                resource: 'mining_operation',
                resourceId: operationId,
                oldValues: existingOperation,
                newValues: updatedOperation,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        logger.info(`Mining operation updated: ${updatedOperation.name}`, { adminId, operationId });

        res.status(200).json({
            success: true,
            data: { operation: updatedOperation },
            message: 'Mining operation updated successfully'
        });

    } catch (error) {
        logger.error('Update mining operation error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'UPDATE_MINING_OPERATION_FAILED' }
        });
    }
};

/**
 * Delete mining operation
 */
export const deleteMiningOperation = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const { operationId } = req.params;

        // Check if operation exists and has no active investments
        const operation = await db.prisma.miningOperation.findUnique({
            where: { id: operationId },
            include: {
                investments: {
                    where: { status: 'ACTIVE' }
                }
            }
        });

        if (!operation) {
            res.status(404).json({
                success: false,
                error: { message: 'Mining operation not found', code: 'OPERATION_NOT_FOUND' }
            });
            return;
        }

        if (operation.investments.length > 0) {
            res.status(400).json({
                success: false,
                error: { message: 'Cannot delete operation with active investments', code: 'OPERATION_HAS_ACTIVE_INVESTMENTS' }
            });
            return;
        }

        await db.prisma.miningOperation.delete({
            where: { id: operationId }
        });

        // Log the admin action
        await db.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: 'MINING_OPERATION_DELETE',
                resource: 'mining_operation',
                resourceId: operationId,
                oldValues: operation,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        logger.info(`Mining operation deleted: ${operation.name}`, { adminId, operationId });

        res.status(200).json({
            success: true,
            message: 'Mining operation deleted successfully'
        });

    } catch (error) {
        logger.error('Delete mining operation error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'DELETE_MINING_OPERATION_FAILED' }
        });
    }
};

// Validation rules
export const createMiningOperationValidation = [
    body('name')
        .isLength({ min: 1, max: 100 })
        .trim()
        .withMessage('Name is required and must be 1-100 characters'),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .trim()
        .withMessage('Description must be less than 1000 characters'),
    body('minInvestment')
        .isFloat({ min: 0.01 })
        .withMessage('Minimum investment must be greater than 0'),
    body('maxInvestment')
        .isFloat({ min: 0.01 })
        .withMessage('Maximum investment must be greater than 0')
        .custom((value, { req }) => {
            if (value <= req.body.minInvestment) {
                throw new Error('Maximum investment must be greater than minimum investment');
            }
            return true;
        }),
    body('dailyReturn')
        .isFloat({ min: 0, max: 1 })
        .withMessage('Daily return must be between 0 and 1 (as decimal)'),
    body('duration')
        .isInt({ min: 1, max: 3650 })
        .withMessage('Duration must be between 1 and 3650 days'),
    body('totalCapacity')
        .isFloat({ min: 0 })
        .withMessage('Total capacity must be a positive number'),
    body('startDate')
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date')
];

export const updateMiningOperationValidation = [
    body('name')
        .optional()
        .isLength({ min: 1, max: 100 })
        .trim()
        .withMessage('Name must be 1-100 characters'),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .trim()
        .withMessage('Description must be less than 1000 characters'),
    body('minInvestment')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Minimum investment must be greater than 0'),
    body('maxInvestment')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Maximum investment must be greater than 0'),
    body('dailyReturn')
        .optional()
        .isFloat({ min: 0, max: 1 })
        .withMessage('Daily return must be between 0 and 1 (as decimal)'),
    body('duration')
        .optional()
        .isInt({ min: 1, max: 3650 })
        .withMessage('Duration must be between 1 and 3650 days'),
    body('status')
        .optional()
        .isIn(Object.values(OperationStatus))
        .withMessage('Invalid status'),
    body('totalCapacity')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Total capacity must be a positive number'),
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date')
];

export const operationIdValidation = [
    param('operationId')
        .isUUID()
        .withMessage('Valid operation ID is required')
];