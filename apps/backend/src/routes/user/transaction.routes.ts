import { Router } from 'express';
import {
    createDeposit,
    createWithdrawal,
    getUserTransactions,
    getTransactionById,
    createDepositValidation,
    createWithdrawalValidation
} from '../../controllers/user/transaction.controller';
import { authenticateUser } from '@/middlewares/auth';

const router = Router();

// All routes require user authentication
router.use(authenticateUser);

// Transaction management
router.get('/', getUserTransactions);
router.get('/:id', getTransactionById);
router.post('/deposit', createDepositValidation, createDeposit);
router.post('/withdraw', createWithdrawalValidation, createWithdrawal);

export default router;