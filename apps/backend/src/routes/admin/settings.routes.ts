import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import {
    getCommunicationPolicy,
    getAccessControl,
    getFeatureFlags,
    getGrowthPromotions,
    getSystemSettings,
    updateSystemSettings,
    getSystemHealth,
    updateCommunicationPolicy,
    updateAccessControl,
    updateFeatureFlags,
    updateGrowthPromotions,
} from '@/controllers/admin/settings.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Settings endpoints
router.get('/', getSystemSettings);
router.put('/', updateSystemSettings);
router.get('/health', getSystemHealth);
router.get('/feature-flags', getFeatureFlags);
router.put('/feature-flags', updateFeatureFlags);
router.get('/access-control', getAccessControl);
router.put('/access-control', updateAccessControl);
router.get('/communications-policy', getCommunicationPolicy);
router.put('/communications-policy', updateCommunicationPolicy);
router.get('/growth-promotions', getGrowthPromotions);
router.put('/growth-promotions', updateGrowthPromotions);

export default router;
