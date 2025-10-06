import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { DocumentStatus, KycStatus, UserRole } from '@prisma/client';
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
 * Get pending KYC documents for review
 */
export const getPendingKycDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId || req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
            });
            return;
        }

        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [documents, total] = await Promise.all([
            db.prisma.kycDocument.findMany({
                where: { status: DocumentStatus.PENDING },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                            kycStatus: true,
                            createdAt: true
                        }
                    }
                },
                orderBy: { uploadedAt: 'asc' },
                skip,
                take: Number(limit)
            }),
            db.prisma.kycDocument.count({ where: { status: DocumentStatus.PENDING } })
        ]);

        res.status(200).json({
            success: true,
            data: {
                documents,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error) {
        logger.error('Get pending KYC documents error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_PENDING_KYC_FAILED' }
        });
    }
};

/**
 * Review KYC document (approve or reject)
 */
export const reviewKycDocument = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const { documentId } = req.params;
        const { action, rejectionReason } = req.body;

        // Check if document exists
        const document = await db.prisma.kycDocument.findUnique({
            where: { id: documentId },
            include: { user: true }
        });

        if (!document) {
            res.status(404).json({
                success: false,
                error: { message: 'Document not found', code: 'DOCUMENT_NOT_FOUND' }
            });
            return;
        }

        if (document.status !== DocumentStatus.PENDING) {
            res.status(400).json({
                success: false,
                error: { message: 'Document has already been reviewed', code: 'DOCUMENT_ALREADY_REVIEWED' }
            });
            return;
        }

        const newStatus = action === 'approve' ? DocumentStatus.APPROVED : DocumentStatus.REJECTED;
        const updateData: any = {
            status: newStatus,
            reviewedAt: new Date(),
            reviewedBy: adminId
        };

        if (action === 'reject' && rejectionReason) {
            updateData.rejectionReason = rejectionReason;
        }

        // Update document status
        const updatedDocument = await db.prisma.kycDocument.update({
            where: { id: documentId },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        kycStatus: true
                    }
                }
            }
        });

        // Update user's KYC status based on document review
        let newKycStatus = document.user.kycStatus;

        if (action === 'approve') {
            // Check if user has all required documents approved
            const userDocuments = await db.prisma.kycDocument.findMany({
                where: { userId: document.userId }
            });

            const hasApprovedDocument = userDocuments.some(doc => doc.status === DocumentStatus.APPROVED);
            const hasRejectedDocuments = userDocuments.some(doc => doc.status === DocumentStatus.REJECTED);
            const hasPendingDocuments = userDocuments.some(doc => doc.status === DocumentStatus.PENDING);

            if (hasApprovedDocument && !hasPendingDocuments) {
                newKycStatus = KycStatus.APPROVED;
            } else if (hasRejectedDocuments && !hasPendingDocuments) {
                newKycStatus = KycStatus.REJECTED;
            } else {
                newKycStatus = KycStatus.UNDER_REVIEW;
            }
        } else if (action === 'reject') {
            // Check if all documents are rejected
            const userDocuments = await db.prisma.kycDocument.findMany({
                where: { userId: document.userId }
            });

            const allRejected = userDocuments.every(doc => doc.status === DocumentStatus.REJECTED);
            if (allRejected) {
                newKycStatus = KycStatus.REJECTED;
            } else {
                newKycStatus = KycStatus.UNDER_REVIEW;
            }
        }

        // Update user KYC status if it changed
        if (newKycStatus !== document.user.kycStatus) {
            await db.prisma.user.update({
                where: { id: document.userId },
                data: { kycStatus: newKycStatus }
            });
        }

        // Log the admin action
        await db.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: 'KYC_DOCUMENT_REVIEW',
                resource: 'kyc_document',
                resourceId: documentId,
                oldValues: { status: document.status },
                newValues: { status: newStatus, rejectionReason },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        logger.info(`KYC document ${action}ed: ${documentId}`, { adminId, userId: document.userId, action });

        res.status(200).json({
            success: true,
            data: { document: updatedDocument },
            message: `Document ${action}ed successfully`
        });

    } catch (error) {
        logger.error('Review KYC document error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'REVIEW_KYC_FAILED' }
        });
    }
};

/**
 * Get all KYC documents with filtering
 */
export const getKycDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
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
            userId: filterUserId,
            type
        } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        // Build where clause
        const whereClause: any = {};

        if (status && Object.values(DocumentStatus).includes(status as DocumentStatus)) {
            whereClause.status = status;
        }

        if (filterUserId) {
            whereClause.userId = filterUserId;
        }

        if (type) {
            whereClause.type = type;
        }

        const [documents, total] = await Promise.all([
            db.prisma.kycDocument.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                            kycStatus: true
                        }
                    }
                },
                orderBy: { uploadedAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            db.prisma.kycDocument.count({ where: whereClause })
        ]);

        res.status(200).json({
            success: true,
            data: {
                documents,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error) {
        logger.error('Get KYC documents error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_KYC_DOCUMENTS_FAILED' }
        });
    }
};

/**
 * Get KYC statistics
 */
export const getKycStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId || req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' }
            });
            return;
        }

        const [
            pending,
            approved,
            rejected,
            totalUsers,
            approvedUsers,
            rejectedUsers,
            underReviewUsers
        ] = await Promise.all([
            db.prisma.kycDocument.count({ where: { status: DocumentStatus.PENDING } }),
            db.prisma.kycDocument.count({ where: { status: DocumentStatus.APPROVED } }),
            db.prisma.kycDocument.count({ where: { status: DocumentStatus.REJECTED } }),
            db.prisma.user.count(),
            db.prisma.user.count({ where: { kycStatus: KycStatus.APPROVED } }),
            db.prisma.user.count({ where: { kycStatus: KycStatus.REJECTED } }),
            db.prisma.user.count({ where: { kycStatus: KycStatus.UNDER_REVIEW } })
        ]);

        const stats = {
            documents: {
                pending,
                approved,
                rejected,
                total: pending + approved + rejected
            },
            users: {
                total: totalUsers,
                approved: approvedUsers,
                rejected: rejectedUsers,
                underReview: underReviewUsers,
                pending: totalUsers - approvedUsers - rejectedUsers - underReviewUsers
            }
        };

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Get KYC stats error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_KYC_STATS_FAILED' }
        });
    }
};

// Validation rules
export const reviewKycValidation = [
    body('action')
        .isIn(['approve', 'reject'])
        .withMessage('Action must be either approve or reject'),
    body('rejectionReason')
        .optional()
        .isLength({ min: 10, max: 500 })
        .withMessage('Rejection reason must be 10-500 characters')
        .if(body('action').equals('reject'))
        .notEmpty()
        .withMessage('Rejection reason is required when rejecting')
];

export const documentIdValidation = [
    param('documentId')
        .isString()
        .matches(/^c[a-z0-9]{24}$/)
        .withMessage('Valid document ID is required')
];