import { Router } from 'express';
import { getDashboardOverview, getDashboardStats } from '../../controllers/user/dashboard.controller';
import { authenticateUser } from '@/middlewares/auth';

const router = Router();

// All dashboard routes require user authentication
router.use(authenticateUser);

// Get dashboard overview with key statistics
router.get('/overview', getDashboardOverview);

// Get detailed dashboard statistics
router.get('/stats', getDashboardStats);

export default router;