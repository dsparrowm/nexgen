import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import {
    getAllTransactions,
    getTransactionById,
    approveTransaction,
    rejectTransaction,
    getTransactionStats,
    createTransaction,
    updateTransaction,
    createTransactionValidation,
    updateTransactionValidation,
} from '../../controllers/admin/transaction.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Transaction management routes
router.get('/stats', getTransactionStats);
router.get('/', getAllTransactions);
router.post('/', createTransactionValidation, createTransaction);
router.get('/:id', getTransactionById);
router.put('/:id', updateTransactionValidation, updateTransaction);
router.post('/:id/approve', approveTransaction);
router.post('/:id/reject', rejectTransaction);

export default router;
