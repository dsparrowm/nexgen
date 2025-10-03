import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User, KycStatus, DocumentType, DocumentStatus } from '@prisma/client';
import db from '@/services/database';
import { hashPassword, verifyPassword } from '@/utils/password';
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
 * Update user profile
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const {
            firstName,
            lastName,
            phoneNumber,
            country,
            state,
            city,
            address,
            zipCode,
            dateOfBirth
        } = req.body;

        const updatedUser = await db.prisma.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                phoneNumber,
                country,
                state,
                city,
                address,
                zipCode,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                country: true,
                state: true,
                city: true,
                address: true,
                zipCode: true,
                dateOfBirth: true,
                kycStatus: true,
                balance: true,
                totalInvested: true,
                totalEarnings: true,
                referralCode: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true
            }
        });

        logger.info(`User profile updated: ${updatedUser.email}`, { userId });

        res.status(200).json({
            success: true,
            data: { user: updatedUser },
            message: 'Profile updated successfully'
        });

    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'UPDATE_PROFILE_FAILED' }
        });
    }
};

/**
 * Change user password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await db.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
            return;
        }

        // Verify current password
        const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            res.status(400).json({
                success: false,
                error: { message: 'Current password is incorrect', code: 'INVALID_CURRENT_PASSWORD' }
            });
            return;
        }

        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword);

        // Update password
        await db.prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        // Deactivate all existing sessions (force logout from other devices)
        await db.prisma.session.updateMany({
            where: { userId },
            data: { isActive: false }
        });

        logger.info(`Password changed for user: ${user.email}`, { userId });

        res.status(200).json({
            success: true,
            message: 'Password changed successfully. Please login again.'
        });

    } catch (error) {
        logger.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'CHANGE_PASSWORD_FAILED' }
        });
    }
};

/**
 * Upload KYC document
 */
export const uploadKycDocument = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const { type } = req.body;
        const file = req.file;

        if (!file) {
            res.status(400).json({
                success: false,
                error: { message: 'Document file is required', code: 'DOCUMENT_REQUIRED' }
            });
            return;
        }

        if (!Object.values(DocumentType).includes(type)) {
            res.status(400).json({
                success: false,
                error: { message: 'Invalid document type', code: 'INVALID_DOCUMENT_TYPE' }
            });
            return;
        }

        // Check if user already has this type of document
        const existingDocument = await db.prisma.kycDocument.findFirst({
            where: {
                userId,
                type: type as DocumentType,
                status: { not: DocumentStatus.REJECTED }
            }
        });

        if (existingDocument) {
            res.status(409).json({
                success: false,
                error: { message: 'Document of this type already exists', code: 'DOCUMENT_EXISTS' }
            });
            return;
        }

        // Create KYC document record
        const document = await db.prisma.kycDocument.create({
            data: {
                userId,
                type: type as DocumentType,
                fileName: file.originalname,
                filePath: file.path,
                fileSize: file.size,
                mimeType: file.mimetype,
                status: DocumentStatus.PENDING
            }
        });

        // Update user KYC status if this is their first document
        const documentCount = await db.prisma.kycDocument.count({
            where: { userId }
        });

        if (documentCount === 1) {
            await db.prisma.user.update({
                where: { id: userId },
                data: { kycStatus: KycStatus.PENDING }
            });
        }

        logger.info(`KYC document uploaded: ${type}`, { userId, documentId: document.id });

        res.status(201).json({
            success: true,
            data: { document },
            message: 'Document uploaded successfully'
        });

    } catch (error) {
        logger.error('Upload KYC document error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'UPLOAD_DOCUMENT_FAILED' }
        });
    }
};

/**
 * Get user's KYC documents
 */
export const getKycDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const documents = await db.prisma.kycDocument.findMany({
            where: { userId },
            orderBy: { uploadedAt: 'desc' }
        });

        res.status(200).json({
            success: true,
            data: { documents }
        });

    } catch (error) {
        logger.error('Get KYC documents error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_DOCUMENTS_FAILED' }
        });
    }
};

/**
 * Get user dashboard data
 */
export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        // Get user basic info
        const user = await db.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                balance: true,
                totalInvested: true,
                totalEarnings: true,
                kycStatus: true,
                isVerified: true,
                createdAt: true
            }
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
            return;
        }

        // Get active investments
        const activeInvestments = await db.prisma.investment.findMany({
            where: {
                userId,
                status: 'ACTIVE'
            },
            include: {
                miningOperation: {
                    select: {
                        id: true,
                        name: true,
                        dailyReturn: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get recent transactions
        const recentTransactions = await db.prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                type: true,
                amount: true,
                status: true,
                description: true,
                createdAt: true
            }
        });

        // Get recent notifications
        const recentNotifications = await db.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                type: true,
                title: true,
                message: true,
                isRead: true,
                createdAt: true
            }
        });

        // Calculate total daily earnings from active investments
        const totalDailyEarnings = activeInvestments.reduce((total, investment) => {
            return total + (Number(investment.amount) * Number(investment.miningOperation.dailyReturn));
        }, 0);

        const dashboardData = {
            user,
            activeInvestments: activeInvestments.length,
            totalDailyEarnings,
            recentTransactions,
            recentNotifications,
            unreadNotifications: recentNotifications.filter(n => !n.isRead).length
        };

        res.status(200).json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        logger.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_DASHBOARD_FAILED' }
        });
    }
};

// Validation rules
export const updateProfileValidation = [
    body('firstName')
        .optional()
        .isLength({ min: 1, max: 50 })
        .trim()
        .withMessage('First name must be 1-50 characters'),
    body('lastName')
        .optional()
        .isLength({ min: 1, max: 50 })
        .trim()
        .withMessage('Last name must be 1-50 characters'),
    body('phoneNumber')
        .optional()
        .isLength({ min: 10, max: 15 })
        .withMessage('Phone number must be 10-15 characters'),
    body('country')
        .optional()
        .isLength({ min: 2, max: 100 })
        .trim()
        .withMessage('Country must be 2-100 characters'),
    body('state')
        .optional()
        .isLength({ min: 2, max: 100 })
        .trim()
        .withMessage('State must be 2-100 characters'),
    body('city')
        .optional()
        .isLength({ min: 2, max: 100 })
        .trim()
        .withMessage('City must be 2-100 characters'),
    body('address')
        .optional()
        .isLength({ min: 5, max: 255 })
        .trim()
        .withMessage('Address must be 5-255 characters'),
    body('zipCode')
        .optional()
        .isLength({ min: 3, max: 10 })
        .withMessage('ZIP code must be 3-10 characters'),
    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Date of birth must be a valid date')
];

export const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .matches(/[A-Z]/)
        .withMessage('New password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('New password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('New password must contain at least one number')
        .matches(/[@$!%*?&#]/)
        .withMessage('New password must contain at least one special character (@$!%*?&#)')
];

export const uploadKycDocumentValidation = [
    body('type')
        .isIn(Object.values(DocumentType))
        .withMessage('Invalid document type')
];