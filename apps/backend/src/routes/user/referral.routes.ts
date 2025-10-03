import { Router } from 'express';
import { authenticateUser } from '@/middlewares/auth';
import {
    getReferralStats,
    getReferralLeaderboard,
    getReferralCode
} from '@/controllers/user/referral.controller';

const router = Router();

// All routes require user authentication
router.use(authenticateUser);

// Referral endpoints
router.get('/stats', getReferralStats);
router.get('/leaderboard', getReferralLeaderboard);
router.get('/code', getReferralCode);

export default router;