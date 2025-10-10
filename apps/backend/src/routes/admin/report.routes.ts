import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import {
    getOverviewReport,
    getRevenueReport,
    getUserReport,
    getActivityReport,
} from '@/controllers/admin/report.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Report endpoints
router.get('/overview', getOverviewReport);
router.get('/revenue', getRevenueReport);
router.get('/users', getUserReport);
router.get('/activity', getActivityReport);

export default router;