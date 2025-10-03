import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import { UserRole } from '@prisma/client';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

/**
 * Authentication middleware for user routes
 */
export const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Access token is required',
                    code: 'AUTH_TOKEN_MISSING'
                }
            });
            return;
        }

        const decoded = verifyToken(token, 'user');
        req.user = decoded;

        next();
    } catch (error) {
        logger.error('User authentication error:', error);
        res.status(401).json({
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Authentication failed',
                code: 'AUTH_FAILED'
            }
        });
    }
};

/**
 * Authentication middleware for admin routes
 */
export const authenticateAdmin = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Access token is required',
                    code: 'AUTH_TOKEN_MISSING'
                }
            });
            return;
        }

        const decoded = verifyToken(token, 'admin');
        req.user = decoded;

        next();
    } catch (error) {
        logger.error('Admin authentication error:', error);
        res.status(401).json({
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Authentication failed',
                code: 'AUTH_FAILED'
            }
        });
    }
};

/**
 * Role-based authorization middleware
 */
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                }
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role as UserRole)) {
            res.status(403).json({
                success: false,
                error: {
                    message: 'Insufficient permissions',
                    code: 'INSUFFICIENT_PERMISSIONS'
                }
            });
            return;
        }

        next();
    };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);

        if (token) {
            const decoded = verifyToken(token, 'user');
            req.user = decoded;
        }

        next();
    } catch (error) {
        // Don't fail, just continue without authentication
        logger.debug('Optional auth failed, continuing without user:', error);
        next();
    }
};