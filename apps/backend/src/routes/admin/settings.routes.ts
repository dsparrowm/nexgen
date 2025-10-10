import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import {
    getSystemSettings,
    updateSystemSettings,
    getSystemHealth,
} from '@/controllers/admin/settings.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Settings endpoints
router.get('/', getSystemSettings);
router.put('/', updateSystemSettings);
router.get('/health', getSystemHealth);

export default router;