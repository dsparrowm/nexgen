import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import { getDashboardStats, getSystemHealth } from '@/controllers/admin/dashboard.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Dashboard statistics
router.get('/stats', getDashboardStats);
router.get('/health', getSystemHealth);

export default router;