import { Router } from 'express';
import {
    login,
    register,
    refreshToken,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    loginValidation,
    registerValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    verifyEmailValidation,
    resendVerificationValidation
} from '@/controllers/auth/user-auth.controller';
import { authenticateUser } from '@/middlewares/auth';

const router = Router();

// Public routes
router.post('/login', loginValidation, login);
router.post('/register', registerValidation, register);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.post('/verify-email', verifyEmailValidation, verifyEmail);
router.post('/resend-verification', resendVerificationValidation, resendVerification);

// Protected routes
router.post('/logout', authenticateUser, logout);
router.get('/profile', authenticateUser, getProfile);

export default router;