import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { NotificationType, UserRole } from '@prisma/client';
import db from '@/services/database';
import { logger } from '@/utils/logger';
import { broadcastUserNotificationsUpdated } from '@/realtime/supportChatSocket';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
        type: 'user' | 'admin';
    };
}

type NotificationTarget = {
    role?: UserRole;
    isActive?: boolean;
    kycStatus?: string;
    userIds?: string[];
};

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

const buildTargetWhere = (target?: NotificationTarget) => {
    const where: Record<string, unknown> = {};

    if (target?.role) {
        where.role = target.role;
    }

    if (target?.isActive !== undefined) {
        where.isActive = target.isActive;
    }

    if (target?.kycStatus) {
        where.kycStatus = target.kycStatus;
    }

    if (target?.userIds?.length) {
        where.id = { in: target.userIds };
    }

    return where;
};

export const listBroadcastNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!ensureAdmin(req, res)) {
            return;
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {
            type: NotificationType.SYSTEM_ANNOUNCEMENT,
        };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { message: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { user: { username: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const [notifications, total, unreadCount, recipientCount] = await Promise.all([
            db.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                            isActive: true,
                            kycStatus: true,
                        },
                    },
                },
            }),
            db.prisma.notification.count({ where }),
            db.prisma.notification.count({ where: { ...where, isRead: false } }),
            db.prisma.notification.count({ where }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                notifications,
                summary: {
                    total,
                    unreadCount,
                    recipientCount,
                },
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        logger.error('List broadcast notifications error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to load notifications', code: 'LIST_BROADCAST_NOTIFICATIONS_FAILED' },
        });
    }
};

export const sendBroadcastNotification = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const adminId = ensureAdmin(req, res);
        if (!adminId) {
            return;
        }

        const {
            title,
            message,
            target,
        } = req.body as {
            title: string;
            message: string;
            target?: NotificationTarget;
        };

        const recipientWhere = buildTargetWhere(target);
        const recipients = await db.prisma.user.findMany({
            where: recipientWhere,
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
            },
        });

        if (recipients.length === 0) {
            res.status(400).json({
                success: false,
                error: { message: 'No recipients matched the selected target', code: 'NO_NOTIFICATION_RECIPIENTS' },
            });
            return;
        }

        const result = await db.prisma.$transaction(async (tx) => {
            const createdNotifications = await Promise.all(
                recipients.map((recipient) =>
                    tx.notification.create({
                        data: {
                            userId: recipient.id,
                            type: NotificationType.SYSTEM_ANNOUNCEMENT,
                            title,
                            message,
                            metadata: {
                                broadcast: true,
                                sentByAdminId: adminId,
                                target: target || null,
                            },
                        },
                    })
                )
            );

            await tx.auditLog.create({
                data: {
                    userId: adminId,
                    action: 'BROADCAST_NOTIFICATION_CREATED',
                    resource: 'notification',
                    resourceId: null,
                    oldValues: undefined,
                    newValues: {
                        title,
                        message,
                        recipientCount: recipients.length,
                        target: target || null,
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                },
            });

            return createdNotifications;
        });

        logger.info('Broadcast notification created', {
            adminId,
            recipientCount: result.length,
            title,
        });

        for (const notification of result) {
            if (notification.userId) {
                broadcastUserNotificationsUpdated(notification.userId, {
                    reason: 'created',
                    notificationId: notification.id,
                    title: notification.title,
                    message: notification.message,
                });
            }
        }

        res.status(201).json({
            success: true,
            data: {
                recipientCount: result.length,
            },
            message: `Broadcast sent to ${result.length} user${result.length === 1 ? '' : 's'}.`,
        });
    } catch (error) {
        logger.error('Send broadcast notification error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to send broadcast notification', code: 'SEND_BROADCAST_NOTIFICATION_FAILED' },
        });
    }
};

export const sendBroadcastNotificationValidation = [
    body('title')
        .isString()
        .isLength({ min: 3, max: 120 })
        .withMessage('Title must be 3-120 characters'),
    body('message')
        .isString()
        .isLength({ min: 5, max: 2000 })
        .withMessage('Message must be 5-2000 characters'),
    body('target.role')
        .optional()
        .isIn(Object.values(UserRole))
        .withMessage('Invalid target role'),
    body('target.isActive')
        .optional()
        .isBoolean()
        .withMessage('Target active state must be boolean'),
    body('target.kycStatus')
        .optional()
        .isString()
        .withMessage('Target KYC status must be a string'),
    body('target.userIds')
        .optional()
        .isArray()
        .withMessage('Target user IDs must be an array'),
];
