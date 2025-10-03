import { Request, Response } from 'express';
import db from '@/services/database';
import { logger } from '@/utils/logger';
import { UserRole, TransactionType, TransactionStatus } from '@prisma/client';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
        type: 'user' | 'admin';
    };
}

/**
 * Get referral stats for a user
 */
export const getReferralStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        // Get referred users
        const referredUsers = await db.prisma.user.findMany({
            where: { referredBy: userId },
            select: {
                id: true,
                email: true,
                username: true,
                createdAt: true,
                totalInvested: true,
                totalEarnings: true
            }
        });

        // Get referral bonus transactions
        const referralBonuses = await db.prisma.transaction.findMany({
            where: {
                userId,
                type: TransactionType.REFERRAL_BONUS,
                status: TransactionStatus.COMPLETED
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate total bonus
        const totalBonus = referralBonuses.reduce((sum, tx) => sum + Number(tx.amount), 0);

        res.status(200).json({
            success: true,
            data: {
                referredUsers,
                referralBonuses,
                totalBonus
            }
        });

    } catch (error) {
        logger.error('Get referral stats error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_REFERRAL_STATS_FAILED' }
        });
    }
};

/**
 * Get referral leaderboard (top referrers)
 */
export const getReferralLeaderboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const topReferrers = await db.prisma.user.findMany({
            take: 10,
            orderBy: { totalEarnings: 'desc' },
            select: {
                id: true,
                email: true,
                username: true,
                totalEarnings: true,
                totalInvested: true,
                referrals: {
                    select: { id: true }
                }
            }
        });

        res.status(200).json({
            success: true,
            data: { leaderboard: topReferrers }
        });

    } catch (error) {
        logger.error('Get referral leaderboard error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_REFERRAL_LEADERBOARD_FAILED' }
        });
    }
};

/**
 * Get referral code for current user
 */
export const getReferralCode = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const user = await db.prisma.user.findUnique({
            where: { id: userId },
            select: { referralCode: true }
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { referralCode: user.referralCode }
        });

    } catch (error) {
        logger.error('Get referral code error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_REFERRAL_CODE_FAILED' }
        });
    }
};