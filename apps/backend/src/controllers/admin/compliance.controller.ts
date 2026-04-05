import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { DocumentStatus, KycStatus, UserRole } from '@prisma/client';
import db from '@/services/database';
import { logger } from '@/utils/logger';

type AuthRequest = Request & {
    user?: {
        userId: string;
        email: string;
        role: string;
        type: 'user' | 'admin';
    };
};

type ComplianceAction = 'freeze' | 'unfreeze' | 'mark_under_review';
type AccountState = 'ALL' | 'ACTIVE' | 'FROZEN';

const isAdmin = (req: AuthRequest): boolean =>
    req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.SUPER_ADMIN;

const buildQueueWhereClause = (
    search: string,
    accountState: AccountState,
    kycStatus: 'ALL' | KycStatus
) => {
    const whereClause: Record<string, unknown> = {
        OR: [
            { isActive: false },
            { kycStatus: { in: [KycStatus.PENDING, KycStatus.UNDER_REVIEW, KycStatus.REJECTED] } },
            { kycDocuments: { some: { status: { in: [DocumentStatus.PENDING, DocumentStatus.REJECTED] } } } },
        ],
    };

    if (search) {
        whereClause.AND = [
            {
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                ],
            },
        ];
    }

    if (accountState === 'ACTIVE') {
        whereClause.isActive = true;
    } else if (accountState === 'FROZEN') {
        whereClause.isActive = false;
    }

    if (kycStatus !== 'ALL') {
        whereClause.kycStatus = kycStatus;
    }

    return whereClause;
};

export const getComplianceOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.userId || !isAdmin(req)) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' },
            });
            return;
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const accountState =
            typeof req.query.accountState === 'string' && ['ALL', 'ACTIVE', 'FROZEN'].includes(req.query.accountState)
                ? (req.query.accountState as AccountState)
                : 'ALL';
        const kycStatus =
            typeof req.query.kycStatus === 'string' && Object.values(KycStatus).includes(req.query.kycStatus as KycStatus)
                ? (req.query.kycStatus as KycStatus)
                : 'ALL';
        const skip = (page - 1) * limit;
        const whereClause = buildQueueWhereClause(search, accountState, kycStatus);

        const [users, total, queuedAccounts, frozenAccounts, underReviewAccounts] = await Promise.all([
            db.prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    email: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    isActive: true,
                    kycStatus: true,
                    createdAt: true,
                    updatedAt: true,
                    kycDocuments: {
                        select: {
                            id: true,
                            status: true,
                        },
                    },
                },
                orderBy: [{ isActive: 'asc' }, { updatedAt: 'desc' }],
                skip,
                take: limit,
            }),
            db.prisma.user.count({ where: whereClause }),
            db.prisma.user.count({
                where: {
                    OR: [
                        { isActive: false },
                        { kycStatus: { in: [KycStatus.PENDING, KycStatus.UNDER_REVIEW, KycStatus.REJECTED] } },
                        { kycDocuments: { some: { status: { in: [DocumentStatus.PENDING, DocumentStatus.REJECTED] } } } },
                    ],
                },
            }),
            db.prisma.user.count({ where: { isActive: false } }),
            db.prisma.user.count({ where: { kycStatus: KycStatus.UNDER_REVIEW } }),
        ]);

        const queue = users.map((user) => ({
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            isActive: user.isActive,
            kycStatus: user.kycStatus,
            pendingDocuments: user.kycDocuments.filter((document) => document.status === DocumentStatus.PENDING).length,
            rejectedDocuments: user.kycDocuments.filter((document) => document.status === DocumentStatus.REJECTED).length,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    queuedAccounts,
                    frozenAccounts,
                    underReviewAccounts,
                },
                queue,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        logger.error('Get compliance overview error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_COMPLIANCE_OVERVIEW_FAILED' },
        });
    }
};

export const updateComplianceRestriction = async (req: AuthRequest, res: Response): Promise<void> => {
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
        if (!adminId || !isAdmin(req)) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' },
            });
            return;
        }

        const { userId } = req.params;
        const { action, reason } = req.body as { action: ComplianceAction; reason: string };

        if (userId === adminId) {
            res.status(400).json({
                success: false,
                error: { message: 'You cannot update your own compliance state', code: 'CANNOT_UPDATE_SELF' },
            });
            return;
        }

        const existingUser = await db.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                isActive: true,
                kycStatus: true,
            },
        });

        if (!existingUser) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' },
            });
            return;
        }

        const updateData: { isActive?: boolean; kycStatus?: KycStatus } = {};
        let auditAction = 'COMPLIANCE_ACCOUNT_UPDATED';

        if (action === 'freeze') {
            updateData.isActive = false;
            auditAction = 'COMPLIANCE_ACCOUNT_FROZEN';
        } else if (action === 'unfreeze') {
            updateData.isActive = true;
            auditAction = 'COMPLIANCE_ACCOUNT_UNFROZEN';
        } else {
            updateData.kycStatus = KycStatus.UNDER_REVIEW;
            auditAction = 'COMPLIANCE_KYC_MARKED_UNDER_REVIEW';
        }

        const updatedUser = await db.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                username: true,
                isActive: true,
                kycStatus: true,
                updatedAt: true,
            },
        });

        await db.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: auditAction,
                resource: 'user',
                resourceId: userId,
                oldValues: {
                    isActive: existingUser.isActive,
                    kycStatus: existingUser.kycStatus,
                },
                newValues: {
                    isActive: updatedUser.isActive,
                    kycStatus: updatedUser.kycStatus,
                    reason,
                    workflow: action,
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
            },
        });

        logger.info(`Compliance state updated: ${userId}`, { adminId, action });

        res.status(200).json({
            success: true,
            data: {
                user: updatedUser,
            },
            message: 'Compliance state updated successfully',
        });
    } catch (error) {
        logger.error('Update compliance restriction error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'UPDATE_COMPLIANCE_RESTRICTION_FAILED' },
        });
    }
};

export const complianceOverviewValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('accountState').optional().isIn(['ALL', 'ACTIVE', 'FROZEN']).withMessage('Invalid accountState'),
    query('kycStatus')
        .optional()
        .isIn(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'])
        .withMessage('Invalid KYC status'),
];

export const complianceRestrictionValidation = [
    param('userId')
        .isString()
        .matches(/^c[a-z0-9]{24}$/)
        .withMessage('Valid user ID is required'),
    body('action')
        .isIn(['freeze', 'unfreeze', 'mark_under_review'])
        .withMessage('Action must be freeze, unfreeze, or mark_under_review'),
    body('reason')
        .trim()
        .isLength({ min: 3, max: 300 })
        .withMessage('Reason must be 3-300 characters'),
];
