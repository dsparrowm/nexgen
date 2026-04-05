import { Request, Response } from 'express';
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

const CONFIG_KEYS = {
    platformSettings: 'platform_settings',
    featureFlags: 'platform_feature_flags',
    accessControl: 'platform_access_control',
    communicationPolicy: 'platform_communication_policy',
    growthPromotions: 'platform_growth_promotions',
} as const;

const defaultGeneralSettings = {
    platformName: process.env.PLATFORM_NAME || 'NexGen Investment Platform',
    platformUrl: process.env.PLATFORM_URL || 'https://nexgen.investment',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@nexgen.investment',
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
    minimumInvestment: parseFloat(process.env.MINIMUM_INVESTMENT || '100'),
    maximumInvestment: parseFloat(process.env.MAXIMUM_INVESTMENT || '100000'),
    defaultInterestRate: parseFloat(process.env.DEFAULT_INTEREST_RATE || '12.5'),
    compoundingFrequency: process.env.COMPOUNDING_FREQUENCY || 'monthly',
    withdrawalFee: parseFloat(process.env.WITHDRAWAL_FEE || '2.5'),
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '30', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    twoFactorRequired: process.env.TWO_FACTOR_REQUIRED === 'true',
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    emailNotifications: process.env.EMAIL_NOTIFICATIONS !== 'false',
    smsNotifications: process.env.SMS_NOTIFICATIONS === 'true',
    pushNotifications: process.env.PUSH_NOTIFICATIONS === 'true',
    apiRateLimit: parseInt(process.env.API_RATE_LIMIT || '1000', 10),
    apiKeyExpiration: parseInt(process.env.API_KEY_EXPIRATION || '365', 10),
    backupFrequency: process.env.BACKUP_FREQUENCY || 'daily',
    retentionPeriod: parseInt(process.env.RETENTION_PERIOD || '90', 10),
};

const defaultFeatureFlags = {
    enableBroadcastNotifications: true,
    enableReferralGovernance: true,
    enableComplianceQueue: true,
    enableTreasuryApprovals: true,
    enablePlatformAccessControl: true,
    enableAssetDesk: true,
};

const defaultAccessControl = {
    ADMIN: {
        canManageUsers: true,
        canManageTreasury: true,
        canManageAssets: true,
        canManageMining: true,
        canManageCompliance: true,
        canManageCommunications: true,
        canManageGrowth: true,
        canManageSettings: false,
    },
    SUPER_ADMIN: {
        canManageUsers: true,
        canManageTreasury: true,
        canManageAssets: true,
        canManageMining: true,
        canManageCompliance: true,
        canManageCommunications: true,
        canManageGrowth: true,
        canManageSettings: true,
    },
};

const defaultCommunicationPolicy = {
    allowScheduledBroadcasts: true,
    requireTemplateApproval: true,
    allowSuppressionList: true,
    defaultChannel: 'email',
};

const defaultGrowthPromotions = {
    referralBonusAmount: 25,
    welcomeBonusAmount: 10,
    leaderboardEnabled: true,
    promotionCampaignsEnabled: true,
    autoApproveReferralBonuses: false,
};

const isAdmin = (req: AuthRequest): boolean => !!req.user?.userId && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN');

const readConfig = async <T>(key: string, fallback: T): Promise<T> => {
    const record = await db.prisma.systemConfig.findUnique({ where: { key } });
    if (!record?.value) {
        return fallback;
    }

    try {
        const parsed = JSON.parse(record.value) as T;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return { ...(fallback as Record<string, unknown>), ...(parsed as Record<string, unknown>) } as T;
        }
        return parsed;
    } catch (error) {
        logger.warn(`Unable to parse system config for ${key}`, { error });
        return fallback;
    }
};

const upsertConfig = async (key: string, value: unknown, description: string) => {
    await db.prisma.systemConfig.upsert({
        where: { key },
        update: {
            value: JSON.stringify(value),
            description,
            isActive: true,
        },
        create: {
            key,
            value: JSON.stringify(value),
            description,
            isActive: true,
        },
    });
};

const writeAuditLog = async (
    req: AuthRequest,
    action: string,
    resource: string,
    oldValues: unknown,
    newValues: unknown,
) => {
    if (!req.user?.userId) {
        return;
    }

    await db.prisma.auditLog.create({
        data: {
            userId: req.user.userId,
            action,
            resource,
            oldValues: oldValues as any,
            newValues: newValues as any,
            userAgent: req.headers['user-agent'] || undefined,
            ipAddress: req.ip,
        },
    });
};

/**
 * Get system settings
 */
export const getSystemSettings = async (req: Request, res: Response) => {
    try {
        const [storedSettings, featureFlags, accessControl] = await Promise.all([
            readConfig<Record<string, unknown>>(CONFIG_KEYS.platformSettings, {}),
            readConfig<Record<string, unknown>>(CONFIG_KEYS.featureFlags, defaultFeatureFlags),
            readConfig<Record<string, unknown>>(CONFIG_KEYS.accessControl, defaultAccessControl),
        ]);

        const settings = {
            ...defaultGeneralSettings,
            ...storedSettings,
            featureFlags,
            accessControl,
        };

        res.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        logger.error('Error fetching system settings:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch system settings' },
        });
    }
};

/**
 * Update system settings
 */
export const updateSystemSettings = async (req: AuthRequest, res: Response) => {
    try {
        if (!isAdmin(req)) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' },
            });
            return;
        }

        const { featureFlags: _featureFlags, accessControl: _accessControl, ...generalUpdates } = req.body ?? {};
        const existingSettings = await readConfig<Record<string, unknown>>(CONFIG_KEYS.platformSettings, {});
        const nextSettings = {
            ...existingSettings,
            ...generalUpdates,
        };

        await upsertConfig(CONFIG_KEYS.platformSettings, nextSettings, 'Platform system settings');
        await writeAuditLog(req, 'SYSTEM_SETTINGS_UPDATED', 'SYSTEM_SETTINGS', existingSettings, nextSettings);

        logger.info('System settings updated by admin', {
            adminId: req.user?.userId,
        });

        res.json({
            success: true,
            message: 'System settings updated successfully',
            data: {
                ...defaultGeneralSettings,
                ...nextSettings,
            },
        });
    } catch (error) {
        logger.error('Error updating system settings:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update system settings' },
        });
    }
};

export const getFeatureFlags = async (req: Request, res: Response) => {
    try {
        const featureFlags = await readConfig<Record<string, unknown>>(CONFIG_KEYS.featureFlags, defaultFeatureFlags);

        res.json({
            success: true,
            data: featureFlags,
        });
    } catch (error) {
        logger.error('Error fetching feature flags:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch feature flags' },
        });
    }
};

export const updateFeatureFlags = async (req: AuthRequest, res: Response) => {
    try {
        if (!isAdmin(req)) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' },
            });
            return;
        }

        const existingFlags = await readConfig<Record<string, unknown>>(CONFIG_KEYS.featureFlags, defaultFeatureFlags);
        const nextFlags = {
            ...existingFlags,
            ...(req.body ?? {}),
        };

        await upsertConfig(CONFIG_KEYS.featureFlags, nextFlags, 'Admin platform feature flags');
        await writeAuditLog(req, 'FEATURE_FLAGS_UPDATED', 'FEATURE_FLAGS', existingFlags, nextFlags);

        res.json({
            success: true,
            message: 'Feature flags updated successfully',
            data: nextFlags,
        });
    } catch (error) {
        logger.error('Error updating feature flags:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update feature flags' },
        });
    }
};

export const getAccessControl = async (req: Request, res: Response) => {
    try {
        const accessControl = await readConfig<Record<string, unknown>>(CONFIG_KEYS.accessControl, defaultAccessControl);

        res.json({
            success: true,
            data: accessControl,
        });
    } catch (error) {
        logger.error('Error fetching access control:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch access control' },
        });
    }
};

export const updateAccessControl = async (req: AuthRequest, res: Response) => {
    try {
        if (!isAdmin(req)) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' },
            });
            return;
        }

        const existingAccessControl = await readConfig<Record<string, unknown>>(CONFIG_KEYS.accessControl, defaultAccessControl);
        const nextAccessControl = {
            ...existingAccessControl,
            ...(req.body ?? {}),
        };

        await upsertConfig(CONFIG_KEYS.accessControl, nextAccessControl, 'Admin access control matrix');
        await writeAuditLog(req, 'ACCESS_CONTROL_UPDATED', 'ACCESS_CONTROL', existingAccessControl, nextAccessControl);

        res.json({
            success: true,
            message: 'Access control updated successfully',
            data: nextAccessControl,
        });
    } catch (error) {
        logger.error('Error updating access control:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update access control' },
        });
    }
};

export const getCommunicationPolicy = async (req: Request, res: Response) => {
    try {
        const communicationPolicy = await readConfig<Record<string, unknown>>(CONFIG_KEYS.communicationPolicy, defaultCommunicationPolicy);

        res.json({
            success: true,
            data: communicationPolicy,
        });
    } catch (error) {
        logger.error('Error fetching communication policy:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch communication policy' },
        });
    }
};

export const updateCommunicationPolicy = async (req: AuthRequest, res: Response) => {
    try {
        if (!isAdmin(req)) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' },
            });
            return;
        }

        const existingPolicy = await readConfig<Record<string, unknown>>(CONFIG_KEYS.communicationPolicy, defaultCommunicationPolicy);
        const nextPolicy = {
            ...existingPolicy,
            ...(req.body ?? {}),
        };

        await upsertConfig(CONFIG_KEYS.communicationPolicy, nextPolicy, 'Admin communication policy');
        await writeAuditLog(req, 'COMMUNICATION_POLICY_UPDATED', 'COMMUNICATION_POLICY', existingPolicy, nextPolicy);

        res.json({
            success: true,
            message: 'Communication policy updated successfully',
            data: nextPolicy,
        });
    } catch (error) {
        logger.error('Error updating communication policy:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update communication policy' },
        });
    }
};

export const getGrowthPromotions = async (req: Request, res: Response) => {
    try {
        const growthPromotions = await readConfig<Record<string, unknown>>(CONFIG_KEYS.growthPromotions, defaultGrowthPromotions);

        res.json({
            success: true,
            data: growthPromotions,
        });
    } catch (error) {
        logger.error('Error fetching growth promotions:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch growth promotions' },
        });
    }
};

export const updateGrowthPromotions = async (req: AuthRequest, res: Response) => {
    try {
        if (!isAdmin(req)) {
            res.status(403).json({
                success: false,
                error: { message: 'Admin access required', code: 'ADMIN_REQUIRED' },
            });
            return;
        }

        const existingPromotions = await readConfig<Record<string, unknown>>(CONFIG_KEYS.growthPromotions, defaultGrowthPromotions);
        const nextPromotions = {
            ...existingPromotions,
            ...(req.body ?? {}),
        };

        await upsertConfig(CONFIG_KEYS.growthPromotions, nextPromotions, 'Admin growth promotion settings');
        await writeAuditLog(req, 'GROWTH_PROMOTIONS_UPDATED', 'GROWTH_PROMOTIONS', existingPromotions, nextPromotions);

        res.json({
            success: true,
            message: 'Growth promotions updated successfully',
            data: nextPromotions,
        });
    } catch (error) {
        logger.error('Error updating growth promotions:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update growth promotions' },
        });
    }
};

/**
 * Get system health status
 */
export const getSystemHealth = async (req: Request, res: Response) => {
    try {
        await db.prisma.$queryRaw`SELECT 1`;

        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();

        const health = {
            status: 'healthy',
            database: 'connected',
            uptime: Math.floor(uptime),
            memory: {
                used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            },
            timestamp: new Date().toISOString(),
        };

        res.json({
            success: true,
            data: health,
        });
    } catch (error) {
        logger.error('Error checking system health:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to check system health' },
        });
    }
};
