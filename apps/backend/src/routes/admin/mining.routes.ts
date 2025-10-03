import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import {
    getMiningOperations,
    getMiningOperation,
    createMiningOperation,
    updateMiningOperation,
    deleteMiningOperation,
    createMiningOperationValidation,
    updateMiningOperationValidation,
    operationIdValidation
} from '@/controllers/admin/mining.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Mining operations management
router.get('/', getMiningOperations);
router.get('/:operationId', operationIdValidation, getMiningOperation);
router.post('/', createMiningOperationValidation, createMiningOperation);
router.put('/:operationId', operationIdValidation, updateMiningOperationValidation, updateMiningOperation);
router.delete('/:operationId', operationIdValidation, deleteMiningOperation);

export default router;