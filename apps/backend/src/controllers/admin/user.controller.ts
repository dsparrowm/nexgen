import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { UserRole, KycStatus, DocumentStatus } from '@prisma/client';
import db from '@/services/database';
import { hashPassword } from '@/utils/password';
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
 * Get all users with filtering and pagination
 */
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
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
            role,
            isActive,
            kycStatus,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        // Build where clause
        const whereClause: any = {};

        if (search) {
            whereClause.OR = [
                { email: { contains: search as string, mode: 'insensitive' } },
                { username: { contains: search as string, mode: 'insensitive' } },
                { firstName: { contains: search as string, mode: 'insensitive' } },
                { lastName: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        if (role && Object.values(UserRole).includes(role as UserRole)) {
            whereClause.role = role;
        }

        if (isActive !== undefined) {
            whereClause.isActive = isActive === 'true';
        }

        if (kycStatus) {
            // Map frontend kycStatus values to database enum values
            const kycStatusMapping: { [key: string]: string } = {
                'PENDING': 'PENDING',
                'VERIFIED': 'APPROVED',
                'APPROVED': 'APPROVED',
                'REJECTED': 'REJECTED',
                'UNDER_REVIEW': 'UNDER_REVIEW'
            };

            const mappedStatus = kycStatusMapping[kycStatus as string];
            if (mappedStatus && Object.values(KycStatus).includes(mappedStatus as KycStatus)) {
                whereClause.kycStatus = mappedStatus;
            }
        }

        // Build order clause
        const orderBy: any = {};
        orderBy[sortBy as string] = sortOrder;

        const [users, total] = await Promise.all([
            db.prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    email: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isActive: true,
                    isVerified: true,
                    kycStatus: true,
                    balance: true,
                    totalInvested: true,
                    totalEarnings: true,
                    referralCode: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            investments: true,
                            transactions: true,
                            kycDocuments: true
                        }
                    }
                },
                orderBy,
                skip,
                take: Number(limit)
            }),
            db.prisma.user.count({ where: whereClause })
        ]);

        // Transform kycStatus to frontend format
        const transformedUsers = users.map(user => ({
            ...user,
            kycStatus: user.kycStatus === 'APPROVED' ? 'VERIFIED' : user.kycStatus
        }));

        res.status(200).json({
            success: true,
            data: {
                users: transformedUsers,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error) {
        logger.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_USERS_FAILED' }
        });
    }
};

/**
 * Get specific user details
 */
export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const { userId } = req.params;

        const user = await db.prisma.user.findUnique({
            where: { id: userId },
            include: {
                investments: {
                    include: {
                        miningOperation: {
                            select: {
                                id: true,
                                name: true,
                                status: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                kycDocuments: {
                    orderBy: { uploadedAt: 'desc' }
                },
                notifications: {
                    where: { isRead: false },
                    select: { id: true }
                },
                sessions: {
                    where: { isActive: true },
                    select: { id: true, createdAt: true, lastUsed: true, userAgent: true, ipAddress: true }
                },
                _count: {
                    select: {
                        investments: true,
                        transactions: true,
                        kycDocuments: true,
                        referrals: true
                    }
                }
            }
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
            return;
        }

        // Transform kycStatus to frontend format
        const transformedUser = {
            ...user,
            kycStatus: user.kycStatus === 'APPROVED' ? 'VERIFIED' : user.kycStatus
        };

        res.status(200).json({
            success: true,
            data: { user: transformedUser }
        });

    } catch (error) {
        logger.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_USER_FAILED' }
        });
    }
};

/**
 * Update user details
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const { userId } = req.params;
        const {
            firstName,
            lastName,
            phoneNumber,
            country,
            state,
            city,
            address,
            zipCode,
            isActive,
            isVerified,
            kycStatus,
            role,
            balance
        } = req.body;

        // Check if user exists
        const existingUser = await db.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
            return;
        }

        // Prevent admin from modifying their own role or deactivating themselves
        if (userId === adminId) {
            if (role && role !== existingUser.role) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Cannot modify your own role', code: 'CANNOT_MODIFY_OWN_ROLE' }
                });
                return;
            }
            if (isActive === false) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Cannot deactivate your own account', code: 'CANNOT_DEACTIVATE_SELF' }
                });
                return;
            }
        }

        const updateData: any = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (country !== undefined) updateData.country = country;
        if (state !== undefined) updateData.state = state;
        if (city !== undefined) updateData.city = city;
        if (address !== undefined) updateData.address = address;
        if (zipCode !== undefined) updateData.zipCode = zipCode;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (isVerified !== undefined) updateData.isVerified = isVerified;
        if (role && Object.values(UserRole).includes(role)) updateData.role = role;
        if (balance !== undefined) updateData.balance = balance;
        if (kycStatus !== undefined) {
            // Map frontend values to Prisma enum values
            const kycStatusMapping: { [key: string]: KycStatus } = {
                'PENDING': KycStatus.PENDING,
                'VERIFIED': KycStatus.APPROVED,
                'APPROVED': KycStatus.APPROVED,
                'REJECTED': KycStatus.REJECTED,
                'UNDER_REVIEW': KycStatus.UNDER_REVIEW
            };

            const mappedStatus = kycStatusMapping[kycStatus];
            if (!mappedStatus) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Invalid KYC status', code: 'INVALID_KYC_STATUS' }
                });
                return;
            }
            updateData.kycStatus = mappedStatus;
        }

        const updatedUser = await db.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                isVerified: true,
                isEmailVerified: true,
                kycStatus: true,
                balance: true,
                phoneNumber: true,
                country: true,
                state: true,
                city: true,
                address: true,
                zipCode: true,
                updatedAt: true
            }
        });

        // Log the admin action
        await db.prisma.auditLog.create({
            data: {
                userId,
                action: 'USER_UPDATE',
                resource: 'user',
                resourceId: userId,
                oldValues: existingUser,
                newValues: updatedUser,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        logger.info(`User updated by admin: ${updatedUser.email}`, { adminId, userId });

        // Transform kycStatus back to frontend format
        const transformedUser = {
            ...updatedUser,
            kycStatus: updatedUser.kycStatus === 'APPROVED' ? 'VERIFIED' : updatedUser.kycStatus
        };

        res.status(200).json({
            success: true,
            data: { user: transformedUser },
            message: 'User updated successfully'
        });

    } catch (error) {
        logger.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'UPDATE_USER_FAILED' }
        });
    }
};

/**
 * Delete user (hard delete - permanently removes user and all associated data)
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const { userId } = req.params;

        // Check if user exists
        const existingUser = await db.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
            return;
        }

        // Prevent admin from deleting themselves
        if (userId === adminId) {
            res.status(400).json({
                success: false,
                error: { message: 'Cannot delete your own account', code: 'CANNOT_DELETE_SELF' }
            });
            return;
        }

        // Store user data for audit log before deletion
        const userDataForAudit = {
            id: existingUser.id,
            email: existingUser.email,
            username: existingUser.username,
            role: existingUser.role
        };

        // Log the admin action BEFORE deleting the user
        await db.prisma.auditLog.create({
            data: {
                userId,
                action: 'USER_DELETE',
                resource: 'user',
                resourceId: userId,
                oldValues: userDataForAudit,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        // Hard delete the user (cascade delete will handle all related records)
        await db.prisma.user.delete({
            where: { id: userId }
        });

        logger.info(`User permanently deleted by admin: ${existingUser.email}`, { adminId, userId });

        res.status(200).json({
            success: true,
            message: 'User permanently deleted successfully'
        });

    } catch (error) {
        logger.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'DELETE_USER_FAILED' }
        });
    }
};

/**
 * Create new user (admin only)
 */
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const {
            email,
            username,
            password,
            firstName,
            lastName,
            role = UserRole.USER,
            isActive = true,
            isVerified = false,
            balance = 0
        } = req.body;

        // Check if email or username already exists
        const existingUser = await db.prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            res.status(409).json({
                success: false,
                error: {
                    message: existingUser.email === email ? 'Email already exists' : 'Username already exists',
                    code: 'USER_EXISTS'
                }
            });
            return;
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Generate referral code
        const referralCode = `${username}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const newUser = await db.prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                firstName,
                lastName,
                role,
                isActive,
                isVerified,
                balance,
                referralCode
            },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                isVerified: true,
                balance: true,
                createdAt: true
            }
        });

        // Log the admin action
        await db.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: 'USER_CREATE',
                resource: 'user',
                resourceId: newUser.id,
                newValues: newUser,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        logger.info(`User created by admin: ${newUser.email}`, { adminId, userId: newUser.id });

        res.status(201).json({
            success: true,
            data: { user: newUser },
            message: 'User created successfully'
        });

    } catch (error) {
        logger.error('Create user error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'CREATE_USER_FAILED' }
        });
    }
};

// Validation rules
export const createUserValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('username')
        .isLength({ min: 3, max: 30 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),
    body('firstName')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 1, max: 50 })
        .trim()
        .withMessage('First name must be 1-50 characters'),
    body('lastName')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 1, max: 50 })
        .trim()
        .withMessage('Last name must be 1-50 characters'),
    body('role')
        .optional({ nullable: true })
        .isIn(Object.values(UserRole))
        .withMessage('Invalid role'),
    body('balance')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('Balance must be a positive number')
];

export const updateUserValidation = [
    body('firstName')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 1, max: 50 })
        .trim()
        .withMessage('First name must be 1-50 characters'),
    body('lastName')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 1, max: 50 })
        .trim()
        .withMessage('Last name must be 1-50 characters'),
    body('phoneNumber')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 10, max: 15 })
        .withMessage('Phone number must be 10-15 characters'),
    body('country')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 100 })
        .trim()
        .withMessage('Country must be 2-100 characters'),
    body('state')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 100 })
        .trim()
        .withMessage('State must be 2-100 characters'),
    body('city')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 100 })
        .trim()
        .withMessage('City must be 2-100 characters'),
    body('address')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 5, max: 255 })
        .trim()
        .withMessage('Address must be 5-255 characters'),
    body('zipCode')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 3, max: 10 })
        .withMessage('ZIP code must be 3-10 characters'),
    body('isActive')
        .optional({ nullable: true })
        .isBoolean()
        .withMessage('isActive must be a boolean'),
    body('isVerified')
        .optional({ nullable: true })
        .isBoolean()
        .withMessage('isVerified must be a boolean'),
    body('role')
        .optional({ nullable: true })
        .isIn(Object.values(UserRole))
        .withMessage('Invalid role'),
    body('kycStatus')
        .optional({ nullable: true })
        .isIn(['PENDING', 'VERIFIED', 'REJECTED'])
        .withMessage('Invalid KYC status'),
    body('balance')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('Balance must be a positive number')
];

export const userIdValidation = [
    param('userId')
        .isString()
        .matches(/^c[a-z0-9]{24}$/)
        .withMessage('Valid user ID is required')
];