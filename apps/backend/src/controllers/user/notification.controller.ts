import { Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import { NotificationType } from '@prisma/client';
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
 * Get user's notifications
 */
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const { isRead, type, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const whereClause: any = { userId };
        if (isRead !== undefined) {
            whereClause.isRead = isRead === 'true';
        }
        if (type && Object.values(NotificationType).includes(type as NotificationType)) {
            whereClause.type = type;
        }

        const [notifications, total] = await Promise.all([
            db.prisma.notification.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            db.prisma.notification.count({ where: whereClause })
        ]);

        res.status(200).json({
            success: true,
            data: {
                notifications,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error) {
        logger.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_NOTIFICATIONS_FAILED' }
        });
    }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const { notificationId } = req.params;

        const notification = await db.prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId
            }
        });

        if (!notification) {
            res.status(404).json({
                success: false,
                error: { message: 'Notification not found', code: 'NOTIFICATION_NOT_FOUND' }
            });
            return;
        }

        if (notification.isRead) {
            res.status(200).json({
                success: true,
                message: 'Notification is already read'
            });
            return;
        }

        await db.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });

        logger.info(`Notification marked as read: ${notificationId}`, { userId });

        res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        logger.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'MARK_READ_FAILED' }
        });
    }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const result = await db.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false
            },
            data: { isRead: true }
        });

        logger.info(`All notifications marked as read for user: ${userId}`, { count: result.count });

        res.status(200).json({
            success: true,
            message: `${result.count} notifications marked as read`
        });

    } catch (error) {
        logger.error('Mark all notifications as read error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'MARK_ALL_READ_FAILED' }
        });
    }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const { notificationId } = req.params;

        const notification = await db.prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId
            }
        });

        if (!notification) {
            res.status(404).json({
                success: false,
                error: { message: 'Notification not found', code: 'NOTIFICATION_NOT_FOUND' }
            });
            return;
        }

        await db.prisma.notification.delete({
            where: { id: notificationId }
        });

        logger.info(`Notification deleted: ${notificationId}`, { userId });

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });

    } catch (error) {
        logger.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'DELETE_NOTIFICATION_FAILED' }
        });
    }
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const [total, unread, read] = await Promise.all([
            db.prisma.notification.count({ where: { userId } }),
            db.prisma.notification.count({ where: { userId, isRead: false } }),
            db.prisma.notification.count({ where: { userId, isRead: true } })
        ]);

        res.status(200).json({
            success: true,
            data: {
                total,
                unread,
                read
            }
        });

    } catch (error) {
        logger.error('Get notification stats error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_STATS_FAILED' }
        });
    }
};

// Validation rules
export const notificationIdValidation = [
    param('notificationId')
        .isUUID()
        .withMessage('Valid notification ID is required')
];