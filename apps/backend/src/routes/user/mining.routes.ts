import { Router } from 'express';
import {
    getMiningOperations,
    getMiningOperationById,
    startMiningOperation,
    getUserMiningOperations,
    stopMiningOperation
} from '../../controllers/user/mining.controller';
import { authenticateUser } from '@/middlewares/auth';
import { body } from 'express-validator';

const router = Router();

// Public routes (available mining operations)
router.get('/operations', getMiningOperations);
router.get('/operations/:id', getMiningOperationById);

// Protected routes (require authentication)
router.use(authenticateUser);

// User mining operations
router.get('/', getUserMiningOperations);
router.post('/start', [
    body('operationId')
        .isString()
        .notEmpty()
        .withMessage('Operation ID is required'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number')
], startMiningOperation);

router.put('/:id/stop', stopMiningOperation);

export default router;