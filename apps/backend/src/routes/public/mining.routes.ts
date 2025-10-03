import { Router } from 'express';
import {
    getActiveMiningOperations,
    getMiningOperation,
    getMiningStats
} from '@/controllers/public/mining.controller';

const router = Router();

// Public mining operations endpoints (no authentication required)
router.get('/', getActiveMiningOperations);
router.get('/stats', getMiningStats);
router.get('/:operationId', getMiningOperation);

export default router;