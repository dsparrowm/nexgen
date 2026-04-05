import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import {
    getAssetCatalog,
    getAssetDashboard,
    getAssetPosition,
    positionIdValidation,
    updateAssetPosition,
    updateAssetPositionValidation,
} from '@/controllers/admin/assets.controller';

const router = Router();

router.use(authenticateAdmin);

router.get('/catalog', getAssetCatalog);
router.get('/', getAssetDashboard);
router.get('/:positionId', positionIdValidation, getAssetPosition);
router.patch('/:positionId', positionIdValidation, updateAssetPositionValidation, updateAssetPosition);

export default router;
