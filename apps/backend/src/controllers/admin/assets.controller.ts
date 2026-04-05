import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Prisma, UserRole } from '@prisma/client';
import db from '@/services/database';
import { logger } from '@/utils/logger';
import { getAssetCatalog as getSupportedAssetCatalog, isSupportedAssetSymbol, type AssetSymbol } from '@/constants/assets';
import { serializeAssetPosition } from '@/services/assetPortfolio.service';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
        type: 'user' | 'admin';
    };
}

type AssetPositionStatus = 'ACTIVE' | 'CLOSED';

const ASSET_POSITION_STATUSES: readonly AssetPositionStatus[] = ['ACTIVE', 'CLOSED'];

interface RawAssetPositionRow {
    id: string;
    userId: string;
    symbol: AssetSymbol;
    status: AssetPositionStatus;
    amountInvested: Prisma.Decimal | number | string;
    unitsHeld: Prisma.Decimal | number | string;
    averageEntryPrice: Prisma.Decimal | number | string;
    currentPrice: Prisma.Decimal | number | string;
    currentValue: Prisma.Decimal | number | string;
    profitLoss: Prisma.Decimal | number | string;
    lastValuationAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    user_id: string;
    user_email: string;
    user_username: string;
    user_firstName: string | null;
    user_lastName: string | null;
    user_role: string;
    user_isActive: boolean;
    user_kycStatus: string;
}

interface AdminAssetUser {
    id: string;
    email: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    isActive: boolean;
    kycStatus: string;
}

interface AdminAssetPositionRecord {
    id: string;
    symbol: AssetSymbol;
    name: string;
    network: string;
    description: string;
    status: AssetPositionStatus;
    amountInvested: number;
    unitsHeld: number;
    averageEntryPrice: number;
    currentPrice: number;
    currentValue: number;
    profitLoss: number;
    lastValuationAt: string | null;
    createdAt: string;
    updatedAt: string;
    allocationColor: string;
    user: AdminAssetUser | null;
}

interface AssetDashboardSummaryRow {
    total_positions: bigint | number;
    active_positions: bigint | number;
    total_invested: Prisma.Decimal | number | string;
    current_value: Prisma.Decimal | number | string;
    total_pnl: Prisma.Decimal | number | string;
}

const getAdminAuthError = (res: Response): boolean => {
    res.status(403).json({
        success: false,
        error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
    });
    return true;
};

const isAdminRole = (role?: string): boolean =>
    role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

const formatAssetPosition = (position: RawAssetPositionRow): AdminAssetPositionRecord => {
    const serialized = serializeAssetPosition(position);

    return {
        ...serialized,
        status: serialized.status as AssetPositionStatus,
        user: {
            id: position.user_id,
            email: position.user_email,
            username: position.user_username,
            firstName: position.user_firstName,
            lastName: position.user_lastName,
            role: position.user_role,
            isActive: position.user_isActive,
            kycStatus: position.user_kycStatus
        }
    };
};

const buildAssetWhereClause = (filters: {
    userId?: string;
    symbol?: string;
    status?: string;
    search?: string;
}) => {
    const clauses: Prisma.Sql[] = [];

    if (filters.userId) {
        clauses.push(Prisma.sql`ap."userId" = ${filters.userId}`);
    }

    if (filters.symbol && isSupportedAssetSymbol(filters.symbol)) {
        clauses.push(Prisma.sql`ap."symbol" = CAST(${filters.symbol.toUpperCase()} AS "AssetSymbol")`);
    }

    if (filters.status && ASSET_POSITION_STATUSES.includes(filters.status as AssetPositionStatus)) {
        clauses.push(Prisma.sql`ap."status" = CAST(${filters.status} AS "AssetPositionStatus")`);
    }

    if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        const symbolTerm = `%${filters.search.toUpperCase()}%`;
        clauses.push(
            Prisma.sql`
                (
                    u."email" ILIKE ${searchTerm}
                    OR u."username" ILIKE ${searchTerm}
                    OR ap."symbol"::text ILIKE ${symbolTerm}
                )
            `
        );
    }

    return clauses.length > 0 ? Prisma.sql`WHERE ${Prisma.join(clauses, ' AND ')}` : Prisma.empty;
};

const queryAssetPositions = async (
    whereSql: Prisma.Sql,
    skip: number,
    limit: number
): Promise<RawAssetPositionRow[]> => {
    return db.prisma.$queryRaw<RawAssetPositionRow[]>(Prisma.sql`
        SELECT
            ap."id",
            ap."userId",
            ap."symbol",
            ap."status",
            ap."amountInvested",
            ap."unitsHeld",
            ap."averageEntryPrice",
            ap."currentPrice",
            ap."currentValue",
            ap."profitLoss",
            ap."lastValuationAt",
            ap."createdAt",
            ap."updatedAt",
            u."id" AS "user_id",
            u."email" AS "user_email",
            u."username" AS "user_username",
            u."firstName" AS "user_firstName",
            u."lastName" AS "user_lastName",
            u."role" AS "user_role",
            u."isActive" AS "user_isActive",
            u."kycStatus" AS "user_kycStatus"
        FROM "asset_positions" ap
        INNER JOIN "users" u ON u."id" = ap."userId"
        ${whereSql}
        ORDER BY ap."updatedAt" DESC, ap."createdAt" DESC
        OFFSET ${skip}
        LIMIT ${limit}
    `);
};

const getAssetPositionById = async (positionId: string): Promise<RawAssetPositionRow | null> => {
    const rows = await db.prisma.$queryRaw<RawAssetPositionRow[]>(Prisma.sql`
        SELECT
            ap."id",
            ap."userId",
            ap."symbol",
            ap."status",
            ap."amountInvested",
            ap."unitsHeld",
            ap."averageEntryPrice",
            ap."currentPrice",
            ap."currentValue",
            ap."profitLoss",
            ap."lastValuationAt",
            ap."createdAt",
            ap."updatedAt",
            u."id" AS "user_id",
            u."email" AS "user_email",
            u."username" AS "user_username",
            u."firstName" AS "user_firstName",
            u."lastName" AS "user_lastName",
            u."role" AS "user_role",
            u."isActive" AS "user_isActive",
            u."kycStatus" AS "user_kycStatus"
        FROM "asset_positions" ap
        INNER JOIN "users" u ON u."id" = ap."userId"
        WHERE ap."id" = ${positionId}
        LIMIT 1
    `);

    return rows[0] ?? null;
};

export const getAssetDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const adminId = req.user?.userId;
        if (!adminId || !isAdminRole(req.user?.role)) {
            getAdminAuthError(res);
            return;
        }

        const {
            page = 1,
            limit = 20,
            search,
            userId,
            symbol,
            status
        } = req.query;

        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.max(1, Math.min(100, Number(limit) || 20));
        const skip = (pageNum - 1) * limitNum;
        const whereSql = buildAssetWhereClause({
            userId: userId ? String(userId) : undefined,
            search: search ? String(search) : undefined,
            symbol: symbol ? String(symbol) : undefined,
            status: status ? String(status) : undefined
        });

        const [rows, totalRows, summaryRows] = await Promise.all([
            queryAssetPositions(whereSql, skip, limitNum),
            db.prisma.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
                SELECT COUNT(*)::bigint AS total
                FROM "asset_positions" ap
                INNER JOIN "users" u ON u."id" = ap."userId"
                ${whereSql}
            `),
            db.prisma.$queryRaw<AssetDashboardSummaryRow[]>(Prisma.sql`
                SELECT
                    COUNT(*)::bigint AS total_positions,
                    COUNT(*) FILTER (WHERE ap."status" = 'ACTIVE')::bigint AS active_positions,
                    COALESCE(SUM(ap."amountInvested"), 0) AS total_invested,
                    COALESCE(SUM(ap."currentValue"), 0) AS current_value,
                    COALESCE(SUM(ap."profitLoss"), 0) AS total_pnl
                FROM "asset_positions" ap
                INNER JOIN "users" u ON u."id" = ap."userId"
                ${whereSql}
            `)
        ]);

        const positions = rows.map(formatAssetPosition);
        const catalog = getSupportedAssetCatalog();
        const summaryRow = summaryRows[0] ?? {
            total_positions: 0,
            active_positions: 0,
            total_invested: 0,
            current_value: 0,
            total_pnl: 0
        };
        const total = Number(totalRows[0]?.total || 0);

        res.status(200).json({
            success: true,
            data: {
                catalog,
                positions,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                },
                summary: {
                    supportedAssets: catalog.length,
                    totalPositions: Number(summaryRow.total_positions || 0),
                    activePositions: Number(summaryRow.active_positions || 0),
                    totalInvested: Number(summaryRow.total_invested || 0),
                    currentValue: Number(summaryRow.current_value || 0),
                    totalPnL: Number(summaryRow.total_pnl || 0)
                }
            }
        });
    } catch (error) {
        logger.error('Get asset dashboard error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_ASSET_DASHBOARD_FAILED' }
        });
    }
};

export const getAssetPosition = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const adminId = req.user?.userId;
        if (!adminId || !isAdminRole(req.user?.role)) {
            getAdminAuthError(res);
            return;
        }

        const { positionId } = req.params;
        const position = await getAssetPositionById(positionId);

        if (!position) {
            res.status(404).json({
                success: false,
                error: { message: 'Asset position not found', code: 'ASSET_POSITION_NOT_FOUND' }
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { position: formatAssetPosition(position) }
        });
    } catch (error) {
        logger.error('Get asset position error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_ASSET_POSITION_FAILED' }
        });
    }
};

export const updateAssetPosition = async (req: AuthRequest, res: Response): Promise<void> => {
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
        if (!adminId || !isAdminRole(req.user?.role)) {
            getAdminAuthError(res);
            return;
        }

        const { positionId } = req.params;
        const {
            status,
            amountInvested,
            unitsHeld,
            averageEntryPrice,
            currentPrice,
            currentValue,
            profitLoss,
            lastValuationAt,
            reason
        } = req.body;

        const existingPosition = await getAssetPositionById(positionId);
        if (!existingPosition) {
            res.status(404).json({
                success: false,
                error: { message: 'Asset position not found', code: 'ASSET_POSITION_NOT_FOUND' }
            });
            return;
        }

        const updateFields: Prisma.Sql[] = [];

        if (status !== undefined) {
            updateFields.push(Prisma.sql`"status" = CAST(${status} AS "AssetPositionStatus")`);
        }
        if (amountInvested !== undefined) {
            updateFields.push(Prisma.sql`"amountInvested" = ${amountInvested}`);
        }
        if (unitsHeld !== undefined) {
            updateFields.push(Prisma.sql`"unitsHeld" = ${unitsHeld}`);
        }
        if (averageEntryPrice !== undefined) {
            updateFields.push(Prisma.sql`"averageEntryPrice" = ${averageEntryPrice}`);
        }
        if (currentPrice !== undefined) {
            updateFields.push(Prisma.sql`"currentPrice" = ${currentPrice}`);
        }
        if (currentValue !== undefined) {
            updateFields.push(Prisma.sql`"currentValue" = ${currentValue}`);
        }
        if (profitLoss !== undefined) {
            updateFields.push(Prisma.sql`"profitLoss" = ${profitLoss}`);
        }
        if (lastValuationAt !== undefined) {
            updateFields.push(Prisma.sql`"lastValuationAt" = ${lastValuationAt ? new Date(lastValuationAt) : null}`);
        }

        if (updateFields.length === 0) {
            res.status(400).json({
                success: false,
                error: { message: 'No update fields provided', code: 'NO_UPDATE_FIELDS' }
            });
            return;
        }

        await db.prisma.$executeRaw(Prisma.sql`
            UPDATE "asset_positions"
            SET ${Prisma.join(updateFields, ', ')},
                "updatedAt" = NOW()
            WHERE "id" = ${positionId}
        `);

        const updatedPosition = await getAssetPositionById(positionId);
        if (!updatedPosition) {
            res.status(500).json({
                success: false,
                error: { message: 'Updated asset position could not be loaded', code: 'UPDATE_ASSET_POSITION_FAILED' }
            });
            return;
        }

        await db.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: 'ASSET_POSITION_UPDATE',
                resource: 'asset_position',
                resourceId: positionId,
                oldValues: formatAssetPosition(existingPosition) as unknown as Prisma.InputJsonValue,
                newValues: {
                    ...formatAssetPosition(updatedPosition),
                    reason: reason || null
                } as unknown as Prisma.InputJsonValue,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        logger.info(`Asset position updated: ${positionId}`, { adminId, reason });

        res.status(200).json({
            success: true,
            data: { position: formatAssetPosition(updatedPosition) },
            message: 'Asset position updated successfully'
        });
    } catch (error) {
        logger.error('Update asset position error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'UPDATE_ASSET_POSITION_FAILED' }
        });
    }
};

export const getAssetCatalog = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const adminId = req.user?.userId;
        if (!adminId || !isAdminRole(req.user?.role)) {
            getAdminAuthError(res);
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                assets: getSupportedAssetCatalog(),
                supportedAssets: getSupportedAssetCatalog()
            }
        });
    } catch (error) {
        logger.error('Get asset catalog error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_ASSET_CATALOG_FAILED' }
        });
    }
};

export const positionIdValidation = [
    param('positionId')
        .isString()
        .isLength({ min: 10 })
        .withMessage('Valid asset position ID is required')
];

export const updateAssetPositionValidation = [
    body('status')
        .optional()
        .isIn(ASSET_POSITION_STATUSES)
        .withMessage('Status must be ACTIVE or CLOSED'),
    body('amountInvested')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Amount invested must be a positive number'),
    body('unitsHeld')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Units held must be a positive number'),
    body('averageEntryPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Average entry price must be a positive number'),
    body('currentPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Current price must be a positive number'),
    body('currentValue')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Current value must be a positive number'),
    body('profitLoss')
        .optional()
        .isFloat()
        .withMessage('Profit/loss must be a valid number'),
    body('lastValuationAt')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('Last valuation date must be a valid date'),
    body('reason')
        .optional()
        .isLength({ min: 3, max: 500 })
        .withMessage('Reason must be 3-500 characters')
];
