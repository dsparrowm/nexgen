import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import {
    addCredits,
    deductCredits,
    getCreditHistory,
    addCreditsValidation,
    deductCreditsValidation,
    userIdValidation
} from '../../controllers/admin/credit.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Credit management
router.post('/add', addCreditsValidation, addCredits);
router.post('/deduct', deductCreditsValidation, deductCredits);
router.get('/history/:userId', userIdValidation, getCreditHistory);

export default router;