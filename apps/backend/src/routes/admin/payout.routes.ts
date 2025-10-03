import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import {
    processDailyPayouts,
    getUserPayouts,
    getPayoutStats,
    getAllPayouts
} from '../../controllers/payout.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Payout management
router.post('/process', processDailyPayouts);
router.get('/all', getAllPayouts);

export default router;