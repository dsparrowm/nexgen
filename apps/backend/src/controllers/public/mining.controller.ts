import { Request, Response } from 'express';
import { OperationStatus } from '@prisma/client';
import db from '@/services/database';
import { logger } from '@/utils/logger';

/**
 * Get all active mining operations available for investment
 */
export const getActiveMiningOperations = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 20, riskLevel, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        // Build where clause
        const whereClause: any = {
            status: OperationStatus.ACTIVE,
            startDate: { lte: new Date() },
            OR: [
                { endDate: null },
                { endDate: { gte: new Date() } }
            ]
        };

        if (riskLevel) {
            whereClause.riskLevel = riskLevel;
        }

        // Build order clause
        const orderBy: any = {};
        orderBy[sortBy as string] = sortOrder;

        const [operations, total] = await Promise.all([
            db.prisma.miningOperation.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    minInvestment: true,
                    maxInvestment: true,
                    dailyReturn: true,
                    duration: true,
                    riskLevel: true,
                    totalCapacity: true,
                    currentCapacity: true,
                    startDate: true,
                    endDate: true,
                    imageUrl: true,
                    features: true,
                    _count: {
                        select: {
                            investments: {
                                where: { status: 'ACTIVE' }
                            }
                        }
                    }
                },
                orderBy,
                skip,
                take: Number(limit)
            }),
            db.prisma.miningOperation.count({ where: whereClause })
        ]);

        // Calculate available capacity for each operation
        const operationsWithCapacity = operations.map(operation => ({
            ...operation,
            availableCapacity: Number(operation.totalCapacity) - Number(operation.currentCapacity),
            activeInvestments: operation._count.investments
        }));

        res.status(200).json({
            success: true,
            data: {
                operations: operationsWithCapacity,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error) {
        logger.error('Get active mining operations error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_MINING_OPERATIONS_FAILED' }
        });
    }
};

/**
 * Get specific mining operation details
 */
export const getMiningOperation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { operationId } = req.params;

        const operation = await db.prisma.miningOperation.findFirst({
            where: {
                id: operationId,
                status: OperationStatus.ACTIVE,
                startDate: { lte: new Date() },
                OR: [
                    { endDate: null },
                    { endDate: { gte: new Date() } }
                ]
            },
            select: {
                id: true,
                name: true,
                description: true,
                minInvestment: true,
                maxInvestment: true,
                dailyReturn: true,
                duration: true,
                riskLevel: true,
                totalCapacity: true,
                currentCapacity: true,
                startDate: true,
                endDate: true,
                imageUrl: true,
                features: true,
                _count: {
                    select: {
                        investments: {
                            where: { status: 'ACTIVE' }
                        }
                    }
                }
            }
        });

        if (!operation) {
            res.status(404).json({
                success: false,
                error: { message: 'Mining operation not found or not available', code: 'OPERATION_NOT_FOUND' }
            });
            return;
        }

        // Calculate additional stats
        const availableCapacity = Number(operation.totalCapacity) - Number(operation.currentCapacity);
        const utilizationRate = Number(operation.totalCapacity) > 0
            ? (Number(operation.currentCapacity) / Number(operation.totalCapacity)) * 100
            : 0;

        const operationWithStats = {
            ...operation,
            availableCapacity,
            utilizationRate: Math.round(utilizationRate * 100) / 100, // Round to 2 decimal places
            activeInvestments: operation._count.investments,
            estimatedMonthlyReturn: Number(operation.dailyReturn) * 30 * 100 // Convert to percentage
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
 * Get mining operation statistics
 */
export const getMiningStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const [
            totalOperations,
            activeOperations,
            totalCapacity,
            currentCapacity,
            totalInvestments,
            averageReturn
        ] = await Promise.all([
            db.prisma.miningOperation.count(),
            db.prisma.miningOperation.count({ where: { status: OperationStatus.ACTIVE } }),
            db.prisma.miningOperation.aggregate({
                _sum: { totalCapacity: true }
            }),
            db.prisma.miningOperation.aggregate({
                _sum: { currentCapacity: true }
            }),
            db.prisma.investment.count({ where: { status: 'ACTIVE' } }),
            db.prisma.miningOperation.aggregate({
                _avg: { dailyReturn: true },
                where: { status: OperationStatus.ACTIVE }
            })
        ]);

        const stats = {
            operations: {
                total: totalOperations,
                active: activeOperations
            },
            capacity: {
                total: Number(totalCapacity._sum.totalCapacity || 0),
                utilized: Number(currentCapacity._sum.currentCapacity || 0),
                available: Number(totalCapacity._sum.totalCapacity || 0) - Number(currentCapacity._sum.currentCapacity || 0),
                utilizationRate: Number(totalCapacity._sum.totalCapacity || 0) > 0
                    ? (Number(currentCapacity._sum.currentCapacity || 0) / Number(totalCapacity._sum.totalCapacity)) * 100
                    : 0
            },
            investments: {
                active: totalInvestments
            },
            performance: {
                averageDailyReturn: Number(averageReturn._avg.dailyReturn || 0),
                averageMonthlyReturn: Number(averageReturn._avg.dailyReturn || 0) * 30 * 100,
                averageYearlyReturn: Number(averageReturn._avg.dailyReturn || 0) * 365 * 100
            }
        };

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Get mining stats error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_MINING_STATS_FAILED' }
        });
    }
};