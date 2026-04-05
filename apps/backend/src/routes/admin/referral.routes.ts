import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import {
    createReferralBonusAdjustment,
    getReferralOverview,
    referralBonusAdjustmentValidation,
} from '@/controllers/admin/referral.controller';

const router = Router();

router.use(authenticateAdmin);

router.get('/overview', getReferralOverview);
router.post('/bonuses/adjust', referralBonusAdjustmentValidation, createReferralBonusAdjustment);

export default router;
