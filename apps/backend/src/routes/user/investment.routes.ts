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
router.get('/investments', getInvestments);
router.get('/investments/:investmentId', investmentIdValidation, getInvestment);
router.post('/investments', createInvestmentValidation, createInvestment);
router.post('/investments/:investmentId/withdraw', investmentIdValidation, withdrawInvestment);

// Transaction history
router.get('/transactions', getTransactions);

export default router;