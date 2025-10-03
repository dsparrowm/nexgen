import { Router } from 'express';
import { authenticateUser } from '@/middlewares/auth';
import {
    getUserPayouts,
    getPayoutStats
} from '../../controllers/payout.controller';

const router = Router();

// All routes require user authentication
router.use(authenticateUser);

// User payout history
router.get('/', getUserPayouts);
router.get('/stats', getPayoutStats);

export default router;