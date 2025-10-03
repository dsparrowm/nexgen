import { Router } from 'express';
import {
    login,
    register,
    refreshToken,
    logout,
    getProfile,
    loginValidation,
    registerValidation
} from '@/controllers/auth/user-auth.controller';
import { authenticateUser } from '@/middlewares/auth';

const router = Router();

// Public routes
router.post('/login', loginValidation, login);
router.post('/register', registerValidation, register);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authenticateUser, logout);
router.get('/profile', authenticateUser, getProfile);

export default router;