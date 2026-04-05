import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Prisma, TransactionStatus, TransactionType, UserRole } from '@prisma/client';
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

interface ReferralLeaderboardRow {
    id: string;
    email: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    referralCode: string;
    createdAt: Date;
    referralCount: number;
    referredInvestedCount: number;
    referralBonusTotal: Prisma.Decimal | number | string;
    bonusCount: number;
    lastBonusAt: Date | null;
}

const ensureAdmin = (req: AuthRequest, res: Response): string | null => {
    const adminId = req.user?.userId;

    if (!adminId || (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN)) {
        res.status(403).json({
            success: false,
            error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
        });
        return null;
    }

    return adminId;
};

const serializeLeaderboardRow = (row: ReferralLeaderboardRow) => ({
    id: row.id,
    email: row.email,
    username: row.username,
    firstName: row.firstName,
    lastName: row.lastName,
    referralCode: row.referralCode,
    createdAt: row.createdAt,
    referralCount: Number(row.referralCount || 0),
    referredInvestedCount: Number(row.referredInvestedCount || 0),
    referralBonusTotal: Number(row.referralBonusTotal || 0),
    bonusCount: Number(row.bonusCount || 0),
    lastBonusAt: row.lastBonusAt,
    displayName: [row.firstName, row.lastName].filter(Boolean).join(' ').trim() || row.username || row.email,
});

const getLeaderboardRows = async (search: string | undefined, limit: number, offset: number) => {
    const query = search?.trim();
    const searchSql = query ? Prisma.sql`
        AND (
            u.email ILIKE ${`%${query}%`}
            OR u.username ILIKE ${`%${query}%`}
            OR COALESCE(u."firstName", '') ILIKE ${`%${query}%`}
            OR COALESCE(u."lastName", '') ILIKE ${`%${query}%`}
            OR u."referralCode" ILIKE ${`%${query}%`}
        )
    ` : Prisma.empty;

    const rows = await db.prisma.$queryRaw<ReferralLeaderboardRow[]>(Prisma.sql`
        SELECT
            u.id,
            u.email,
            u.username,
            u."firstName",
            u."lastName",
            u."referralCode",
            u."createdAt",
            COALESCE(ref_stats."referralCount", 0)::int AS "referralCount",
            COALESCE(ref_stats."referredInvestedCount", 0)::int AS "referredInvestedCount",
            COALESCE(bonus_stats."referralBonusTotal", 0) AS "referralBonusTotal",
            COALESCE(bonus_stats."bonusCount", 0)::int AS "bonusCount",
            bonus_stats."lastBonusAt" AS "lastBonusAt"
        FROM "users" u
        LEFT JOIN LATERAL (
            SELECT
                COUNT(*)::int AS "referralCount",
                COUNT(*) FILTER (WHERE COALESCE(r."totalInvested", 0) > 0)::int AS "referredInvestedCount"
            FROM "users" r
            WHERE r."referredBy" = u.id
        ) ref_stats ON true
        LEFT JOIN LATERAL (
            SELECT
                COALESCE(SUM(t.amount), 0) AS "referralBonusTotal",
                COUNT(*)::int AS "bonusCount",
                MAX(t."createdAt") AS "lastBonusAt"
            FROM "transactions" t
            WHERE t."userId" = u.id
              AND t."type" = CAST(${TransactionType.REFERRAL_BONUS} AS "TransactionType")
              AND t."status" = CAST(${TransactionStatus.COMPLETED} AS "TransactionStatus")
        ) bonus_stats ON true
        WHERE (
            COALESCE(ref_stats."referralCount", 0) > 0
            OR COALESCE(bonus_stats."bonusCount", 0) > 0
        )
        ${searchSql}
        ORDER BY
            COALESCE(bonus_stats."referralBonusTotal", 0) DESC,
            COALESCE(ref_stats."referralCount", 0) DESC,
            u."createdAt" DESC
        LIMIT ${limit}
        OFFSET ${offset}
    `);

    const countRows = await db.prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
        SELECT COUNT(*)::int AS total
        FROM (
            SELECT u.id
            FROM "users" u
            LEFT JOIN LATERAL (
                SELECT COUNT(*)::int AS "referralCount"
                FROM "users" r
                WHERE r."referredBy" = u.id
            ) ref_stats ON true
            LEFT JOIN LATERAL (
                SELECT COUNT(*)::int AS "bonusCount"
                FROM "transactions" t
                WHERE t."userId" = u.id
                  AND t."type" = CAST(${TransactionType.REFERRAL_BONUS} AS "TransactionType")
                  AND t."status" = CAST(${TransactionStatus.COMPLETED} AS "TransactionStatus")
            ) bonus_stats ON true
            WHERE (
                COALESCE(ref_stats."referralCount", 0) > 0
                OR COALESCE(bonus_stats."bonusCount", 0) > 0
            )
            ${searchSql}
        ) leaderboard
    `);

    return {
        rows,
        total: Number(countRows[0]?.total || 0),
    };
};

export const getReferralOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!ensureAdmin(req, res)) {
            return;
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const offset = (page - 1) * limit;

        const [
            totalReferrers,
            totalReferredUsers,
            totalBonusAggregate,
            recentBonusTransactions,
            leaderboardResult,
        ] = await Promise.all([
            db.prisma.user.count({
                where: {
                    referrals: {
                        some: {}
                    }
                }
            }),
            db.prisma.user.count({
                where: {
                    referredBy: { not: null }
                }
            }),
            db.prisma.transaction.aggregate({
                where: {
                    type: TransactionType.REFERRAL_BONUS,
                    status: TransactionStatus.COMPLETED,
                },
                _sum: { amount: true },
                _count: { id: true }
            }),
            db.prisma.transaction.findMany({
                where: {
                    type: TransactionType.REFERRAL_BONUS,
                    status: TransactionStatus.COMPLETED,
                },
                orderBy: { createdAt: 'desc' },
                take: 8,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                        }
                    }
                }
            }),
            getLeaderboardRows(search, limit, offset),
        ]);

        const leaderboard = leaderboardResult.rows.map(serializeLeaderboardRow);

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalReferrers,
                    totalReferredUsers,
                    totalReferralBonuses: Number(totalBonusAggregate._sum.amount || 0),
                    totalBonusTransactions: totalBonusAggregate._count.id || 0,
                },
                leaderboard,
                topReferrers: leaderboard.slice(0, 5),
                recentBonuses: recentBonusTransactions.map((transaction) => ({
                    id: transaction.id,
                    amount: Number(transaction.amount),
                    createdAt: transaction.createdAt,
                    description: transaction.description,
                    reference: transaction.reference,
                    user: transaction.user ? {
                        id: transaction.user.id,
                        email: transaction.user.email,
                        username: transaction.user.username,
                        firstName: transaction.user.firstName,
                        lastName: transaction.user.lastName,
                        displayName: [transaction.user.firstName, transaction.user.lastName].filter(Boolean).join(' ').trim()
                            || transaction.user.username
                            || transaction.user.email,
                    } : null,
                })),
                pagination: {
                    page,
                    limit,
                    total: leaderboardResult.total,
                    pages: leaderboardResult.total > 0 ? Math.ceil(leaderboardResult.total / limit) : 0,
                }
            }
        });
    } catch (error) {
        logger.error('Get admin referral overview error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_ADMIN_REFERRAL_OVERVIEW_FAILED' }
        });
    }
};

export const createReferralBonusAdjustment = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const adminId = ensureAdmin(req, res);
        if (!adminId) {
            return;
        }

        const userId = String(req.body.userId);
        const amount = Number(req.body.amount);
        const reason = String(req.body.reason || '').trim();

        if (!Number.isFinite(amount) || amount === 0) {
            res.status(400).json({
                success: false,
                error: { message: 'Adjustment amount cannot be zero', code: 'INVALID_AMOUNT' }
            });
            return;
        }

        const user = await db.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                balance: true,
            }
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
            return;
        }

        if (amount < 0 && Number(user.balance) < Math.abs(amount)) {
            res.status(400).json({
                success: false,
                error: { message: 'User has insufficient balance for this correction', code: 'INSUFFICIENT_BALANCE' }
            });
            return;
        }

        const result = await db.prisma.$transaction(async (prisma) => {
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    balance: { increment: amount }
                },
                select: {
                    id: true,
                    balance: true,
                }
            });

            const transaction = await prisma.transaction.create({
                data: {
                    userId,
                    type: TransactionType.REFERRAL_BONUS,
                    amount,
                    netAmount: amount,
                    status: TransactionStatus.COMPLETED,
                    description: `Admin referral bonus adjustment: ${reason}`,
                    reference: `REF-ADMIN-${userId}-${Date.now()}`,
                    metadata: {
                        adjustmentType: 'manual_referral_governance',
                        adminId,
                        reason,
                    }
                }
            });

            await prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: 'REFERRAL_BONUS_ADJUSTED',
                    resource: 'user',
                    resourceId: userId,
                    oldValues: {
                        balance: user.balance,
                    },
                    newValues: {
                        balance: updatedUser.balance,
                        adjustmentAmount: amount,
                        reason,
                        transactionId: transaction.id,
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            });

            await prisma.notification.create({
                data: {
                    userId,
                    type: 'SYSTEM_ANNOUNCEMENT',
                    title: amount > 0 ? 'Referral Bonus Added' : 'Referral Bonus Adjusted',
                    message: amount > 0
                        ? `An admin applied a referral bonus adjustment of $${amount.toFixed(2)} to your account.`
                        : `An admin adjusted your referral bonus balance by -$${Math.abs(amount).toFixed(2)}.`,
                    metadata: {
                        adjustmentAmount: amount,
                        adminId,
                        reason,
                        transactionId: transaction.id,
                    }
                }
            });

            return { updatedUser, transaction };
        });

        logger.info(`Referral bonus adjusted by admin ${adminId}`, {
            targetUserId: userId,
            amount,
            reason,
            transactionId: result.transaction.id,
        });

        res.status(200).json({
            success: true,
            data: {
                transactionId: result.transaction.id,
                userId,
                amount,
                newBalance: Number(result.updatedUser.balance),
            },
            message: amount > 0
                ? `Added $${amount.toFixed(2)} referral bonus successfully`
                : `Adjusted referral bonus by -$${Math.abs(amount).toFixed(2)} successfully`
        });
    } catch (error) {
        logger.error('Create referral bonus adjustment error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'CREATE_REFERRAL_BONUS_ADJUSTMENT_FAILED' }
        });
    }
};

export const referralBonusAdjustmentValidation = [
    body('userId')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('User ID is required'),
    body('amount')
        .isFloat()
        .withMessage('A valid adjustment amount is required'),
    body('reason')
        .isLength({ min: 5, max: 250 })
        .withMessage('Reason must be between 5 and 250 characters')
];
