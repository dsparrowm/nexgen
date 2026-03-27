import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PaymentMethod, TransactionStatus, TransactionType } from '@prisma/client';
import { nanoid } from 'nanoid';
import db from '@/services/database';
import { logger } from '@/utils/logger';
import { getAssetCatalog, getSupportedAsset, isSupportedAssetSymbol } from '@/constants/assets';
import { getAssetPortfolioSnapshot, serializeAssetPosition } from '@/services/assetPortfolio.service';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
        type: 'user' | 'admin';
    };
}

interface AssetPositionRow {
    id: string;
    userId: string;
    symbol: string;
    status: string;
    amountInvested: number | string;
    unitsHeld: number | string;
    averageEntryPrice: number | string;
    currentPrice: number | string;
    currentValue: number | string;
    profitLoss: number | string;
    lastValuationAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const round = (value: number, decimals: number): number => {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Number(value.toFixed(decimals));
};

export const getSupportedAssets = async (_req: Request, res: Response): Promise<void> => {
    try {
        res.status(200).json({
            success: true,
            data: {
                assets: getAssetCatalog(),
                supportedAssets: getAssetCatalog()
            }
        });
    } catch (error) {
        logger.error('Get supported assets error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_SUPPORTED_ASSETS_FAILED' }
        });
    }
};

export const getUserAssetPortfolio = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
            });
            return;
        }

        const portfolio = await getAssetPortfolioSnapshot(userId);

        res.status(200).json({
            success: true,
            data: {
                ...portfolio,
                assetPositions: portfolio.positions,
                portfolio: portfolio.summary
            }
        });
    } catch (error) {
        logger.error('Get user asset portfolio error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'GET_ASSET_PORTFOLIO_FAILED' }
        });
    }
};

export const buyAssetPosition = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const assetSymbol = String(req.body.assetSymbol || req.body.symbol || '').toUpperCase().trim();
        const amount = Number(req.body.amount);

        if (!isSupportedAssetSymbol(assetSymbol)) {
            res.status(400).json({
                success: false,
                error: { message: 'Unsupported asset symbol', code: 'UNSUPPORTED_ASSET' }
            });
            return;
        }

        const asset = getSupportedAsset(assetSymbol);
        if (!asset) {
            res.status(400).json({
                success: false,
                error: { message: 'Unsupported asset symbol', code: 'UNSUPPORTED_ASSET' }
            });
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            res.status(400).json({
                success: false,
                error: { message: 'Investment amount must be greater than 0', code: 'INVALID_AMOUNT' }
            });
            return;
        }

        if (amount < asset.minInvestment) {
            res.status(400).json({
                success: false,
                error: {
                    message: `Minimum investment for ${asset.symbol} is $${asset.minInvestment.toFixed(2)}`,
                    code: 'MINIMUM_INVESTMENT_NOT_MET'
                }
            });
            return;
        }

        const user = await db.prisma.user.findUnique({
            where: { id: userId },
            select: { balance: true }
        });

        if (!user || Number(user.balance) < amount) {
            res.status(400).json({
                success: false,
                error: { message: 'Insufficient balance', code: 'INSUFFICIENT_BALANCE' }
            });
            return;
        }

        const [existingMiningInvestments, existingAssetPositions] = await Promise.all([
            db.prisma.investment.count({ where: { userId } }),
            db.prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
                `SELECT COUNT(*)::bigint AS count FROM "asset_positions" WHERE "userId" = $1`,
                userId
            )
        ]);

        const purchaseUnits = round(amount / asset.referencePrice, asset.precision);
        const currentPrice = round(asset.referencePrice, 2);
        const now = new Date();
        const existingAssetPositionCount = Number(existingAssetPositions[0]?.count || 0);

        const { assetPosition, transaction } = await db.prisma.$transaction(async (prisma) => {
            const [existingPosition] = await prisma.$queryRawUnsafe<AssetPositionRow[]>(
                `SELECT *
                 FROM "asset_positions"
                 WHERE "userId" = $1
                   AND "symbol" = CAST($2 AS "AssetSymbol")
                 LIMIT 1`,
                userId,
                asset.symbol
            );

            const amountInvested = round(Number(existingPosition?.amountInvested || 0) + amount, 2);
            const unitsHeld = round(Number(existingPosition?.unitsHeld || 0) + purchaseUnits, asset.precision);
            const averageEntryPrice = unitsHeld > 0 ? round(amountInvested / unitsHeld, 2) : currentPrice;
            const currentValue = round(unitsHeld * currentPrice, 2);
            const profitLoss = round(currentValue - amountInvested, 2);

            const assetPosition = existingPosition
                ? (await prisma.$queryRawUnsafe<AssetPositionRow[]>(
                    `UPDATE "asset_positions"
                     SET "status" = 'ACTIVE',
                         "amountInvested" = $2,
                         "unitsHeld" = $3,
                         "averageEntryPrice" = $4,
                         "currentPrice" = $5,
                         "currentValue" = $6,
                         "profitLoss" = $7,
                         "lastValuationAt" = $8,
                         "updatedAt" = NOW()
                     WHERE "id" = $1
                     RETURNING *`,
                    existingPosition.id,
                    amountInvested,
                    unitsHeld,
                    averageEntryPrice,
                    currentPrice,
                    currentValue,
                    profitLoss,
                    now
                ))[0]
                : (await prisma.$queryRawUnsafe<AssetPositionRow[]>(
                    `INSERT INTO "asset_positions" (
                        "id",
                        "userId",
                        "symbol",
                        "status",
                        "amountInvested",
                        "unitsHeld",
                        "averageEntryPrice",
                        "currentPrice",
                        "currentValue",
                        "profitLoss",
                        "lastValuationAt",
                        "createdAt",
                        "updatedAt"
                     ) VALUES (
                        $1,
                        $2,
                        CAST($3 AS "AssetSymbol"),
                        'ACTIVE',
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9,
                        $10,
                        NOW(),
                        NOW()
                     )
                     RETURNING *`,
                    `astpos_${nanoid(18)}`,
                    userId,
                    asset.symbol,
                    amountInvested,
                    unitsHeld,
                    averageEntryPrice,
                    currentPrice,
                    currentValue,
                    profitLoss,
                    now
                ))[0];

            await prisma.user.update({
                where: { id: userId },
                data: {
                    balance: { decrement: amount },
                    totalInvested: { increment: amount }
                }
            });

            const transaction = await prisma.transaction.create({
                data: {
                    userId,
                    type: TransactionType.INVESTMENT,
                    amount,
                    netAmount: -amount,
                    status: TransactionStatus.COMPLETED,
                    description: `Asset purchase in ${asset.name}`,
                    reference: `AST-${asset.symbol}-${assetPosition.id}-${Date.now()}`,
                    paymentMethod: PaymentMethod.MANUAL,
                    metadata: {
                        investmentType: 'ASSET',
                        assetSymbol: asset.symbol,
                        assetName: asset.name,
                        assetNetwork: asset.network,
                        investedAmount: amount,
                        unitsPurchased: purchaseUnits,
                        referencePrice: currentPrice,
                        positionId: assetPosition.id
                    }
                }
            });

            await prisma.notification.create({
                data: {
                    userId,
                    type: 'INVESTMENT_CREATED',
                    title: `${asset.name} position created`,
                    message: `Your $${amount.toFixed(2)} asset investment in ${asset.name} is now active.`,
                    metadata: {
                        assetSymbol: asset.symbol,
                        assetName: asset.name,
                        investedAmount: amount,
                        unitsPurchased: purchaseUnits,
                        positionId: assetPosition.id
                    }
                }
            });

            return { assetPosition, transaction };
        });

        logger.info(`Asset position created for user ${userId}: ${asset.symbol}`, {
            userId,
            assetSymbol: asset.symbol,
            amount
        });

        try {
            const userWithReferrer = await db.prisma.user.findUnique({
                where: { id: userId },
                select: { referredBy: true, username: true }
            });

            if (userWithReferrer?.referredBy) {
                if (existingMiningInvestments + existingAssetPositionCount === 0) {
                    const investmentBonus = amount * 0.05;

                    await db.prisma.$transaction(async (prisma) => {
                        await prisma.user.update({
                            where: { id: userWithReferrer.referredBy! },
                            data: {
                                balance: { increment: investmentBonus }
                            }
                        });

                        await prisma.transaction.create({
                            data: {
                                userId: userWithReferrer.referredBy!,
                                type: TransactionType.REFERRAL_BONUS,
                                amount: investmentBonus,
                                netAmount: investmentBonus,
                                status: TransactionStatus.COMPLETED,
                                description: `Referral bonus for ${userWithReferrer.username}'s first asset investment of $${amount.toFixed(2)}`,
                                reference: `REF-ASSET-${userId}-${Date.now()}`,
                                metadata: {
                                    referredUserId: userId,
                                    referredUsername: userWithReferrer.username,
                                    investmentAmount: amount,
                                    bonusAmount: investmentBonus,
                                    bonusType: 'asset_investment',
                                    assetSymbol
                                }
                            }
                        });

                        await prisma.notification.create({
                            data: {
                                userId: userWithReferrer.referredBy!,
                                type: 'SYSTEM_ANNOUNCEMENT',
                                title: 'Referral Asset Bonus!',
                                message: `You earned $${investmentBonus.toFixed(2)} from your referral's first asset investment.`,
                                metadata: {
                                    referredUserId: userId,
                                    referredUsername: userWithReferrer.username,
                                    investmentAmount: amount,
                                    bonusAmount: investmentBonus,
                                    bonusType: 'asset_investment',
                                    assetSymbol
                                }
                            }
                        });
                    });
                }
            }
        } catch (bonusError) {
            logger.error('Failed to process referral asset bonus:', bonusError);
        }

        const portfolio = await getAssetPortfolioSnapshot(userId);

        res.status(201).json({
            success: true,
            data: {
                position: serializeAssetPosition({
                    ...assetPosition,
                    symbol: asset.symbol
                }),
                assetPosition: serializeAssetPosition({
                    ...assetPosition,
                    symbol: asset.symbol
                }),
                transaction,
                portfolio,
                summary: portfolio.summary
            },
            message: 'Asset position created successfully'
        });
    } catch (error) {
        logger.error('Buy asset position error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', code: 'BUY_ASSET_FAILED' }
        });
    }
};

export const buyAssetValidation = [
    body('assetSymbol')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Asset symbol is required'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0')
];
