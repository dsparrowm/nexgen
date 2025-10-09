import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import {
    getAllTransactions,
    getTransactionById,
    approveTransaction,
    rejectTransaction,
    getTransactionStats
} from '../../controllers/admin/transaction.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Transaction management routes
router.get('/stats', getTransactionStats);
router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);
router.post('/:id/approve', approveTransaction);
router.post('/:id/reject', rejectTransaction);

export default router;