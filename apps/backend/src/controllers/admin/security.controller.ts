import { Request, Response } from 'express';
import { logger } from '@/utils/logger';
import db from '@/services/database';
import { UserRole } from '@prisma/client';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
        type: 'user' | 'admin';
    };
}

/**
 * Get security metrics
 */
export const getSecurityMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId || req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
            });
            return;
        }

        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Get security metrics
        const [
            loginAttempts,
            failedLogins,
            activeSessions,
            blockedIPs
        ] = await Promise.all([
            // Login attempts in last 24 hours (successful logins)
            db.prisma.auditLog.count({
                where: {
                    action: 'LOGIN_SUCCESS',
                    timestamp: { gte: last24Hours }
                }
            }),
            // Failed login attempts
            db.prisma.auditLog.count({
                where: {
                    action: 'LOGIN_FAILED',
                    timestamp: { gte: last24Hours }
                }
            }),
            // Active sessions (users with recent activity)
            db.prisma.session.count({
                where: {
                    expiresAt: { gt: now }
                }
            }),
            // Blocked IPs (this would need a separate table, for now return 0)
            Promise.resolve(0)
        ]);

        res.json({
            success: true,
            data: {
                loginAttempts,
                failedLogins,
                activeSessions,
                blockedIPs
            }
        });
    } catch (error) {
        logger.error('Error fetching security metrics:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch security metrics' }
        });
    }
};

/**
 * Get audit logs with filtering and pagination
 */
export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
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
            search,
            action,
            resource,
            status,
            sortBy = 'timestamp',
            sortOrder = 'desc'
        } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        // Build where clause
        const whereClause: any = {};

        if (search) {
            whereClause.OR = [
                { action: { contains: search as string, mode: 'insensitive' } },
                { resource: { contains: search as string, mode: 'insensitive' } },
                { user: { email: { contains: search as string, mode: 'insensitive' } } },
                { user: { username: { contains: search as string, mode: 'insensitive' } } }
            ];
        }

        if (action && action !== 'all') {
            if (action === 'login') {
                whereClause.action = { in: ['LOGIN_SUCCESS', 'LOGIN_FAILED'] };
            } else if (action === 'user') {
                whereClause.action = { contains: 'USER' };
            } else if (action === 'credit') {
                whereClause.action = { contains: 'CREDIT' };
            } else if (action === 'settings') {
                whereClause.action = { contains: 'SETTINGS' };
            }
        }

        if (resource) {
            whereClause.resource = { contains: resource as string, mode: 'insensitive' };
        }

        // Get total count for pagination
        const total = await db.prisma.auditLog.count({ where: whereClause });

        // Get audit logs with user information
        const auditLogs = await db.prisma.auditLog.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        email: true,
                        username: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                [sortBy as string]: sortOrder
            },
            skip,
            take: Number(limit)
        });

        // Transform data for frontend
        const transformedLogs = auditLogs.map((log: any) => ({
            id: log.id,
            action: log.action,
            admin: log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.username || log.user.email : 'System',
            resource: log.resource,
            ipAddress: log.ipAddress || 'Unknown',
            timestamp: log.timestamp,
            status: log.action.includes('FAILED') || log.action.includes('ERROR') ? 'failure' : 'success',
            details: generateLogDetails(log)
        }));

        res.json({
            success: true,
            data: {
                logs: transformedLogs,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching audit logs:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch audit logs' }
        });
    }
};

/**
 * Generate human-readable details for audit log
 */
const generateLogDetails = (log: any): string => {
    const action = log.action;
    const resource = log.resource;

    switch (action) {
        case 'LOGIN_SUCCESS':
            return 'Successful login';
        case 'LOGIN_FAILED':
            return 'Failed login attempt';
        case 'USER_CREATED':
            return `Created user account`;
        case 'USER_UPDATED':
            return `Updated user profile`;
        case 'USER_DELETED':
            return `Deleted user account`;
        case 'CREDIT_ADDED':
            return `Added credits to user account`;
        case 'CREDIT_DEDUCTED':
            return `Deducted credits from user account`;
        case 'SETTINGS_UPDATED':
            return `Updated system settings`;
        default:
            return `${action.replace(/_/g, ' ')} on ${resource}`;
    }
};