import { Router } from 'express';
import { authenticateUser } from '@/middlewares/auth';
import {
    getInvestments,
    getInvestment,
    createInvestment,
    withdrawInvestment,
    getTransactions,
    createInvestmentValidation,
    investmentIdValidation
} from '../../controllers/user/investment.controller';

const router = Router();

// All routes require user authentication
router.use(authenticateUser);

// Investment management
router.get('/', getInvestments);
router.get('/:investmentId', investmentIdValidation, getInvestment);
router.post('/', createInvestmentValidation, createInvestment);
router.post('/:investmentId/withdraw', investmentIdValidation, withdrawInvestment);

// Transaction history
// Transaction routes are mounted separately under /transactions

export default router;