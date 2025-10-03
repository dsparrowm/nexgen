import { Router } from 'express';
import {
    login,
    refreshToken,
    logout,
    getProfile,
    getDashboardStats,
    loginValidation
} from '@/controllers/auth/admin-auth.controller';
import { authenticateAdmin } from '@/middlewares/auth';

const router = Router();

// Public routes
router.post('/login', loginValidation, login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authenticateAdmin, logout);
router.get('/profile', authenticateAdmin, getProfile);
router.get('/dashboard/stats', authenticateAdmin, getDashboardStats);

export default router;