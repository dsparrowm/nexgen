import { Router } from 'express';
import { authenticateUser } from '@/middlewares/auth';
import {
    buyAssetPosition,
    buyAssetValidation,
    getSupportedAssets,
    getUserAssetPortfolio
} from '@/controllers/user/asset.controller';

const router = Router();

router.use(authenticateUser);

router.get('/', getSupportedAssets);
router.get('/supported', getSupportedAssets);
router.get('/portfolio', getUserAssetPortfolio);
router.get('/positions', getUserAssetPortfolio);
router.post('/buy', buyAssetValidation, buyAssetPosition);
router.post('/purchase', buyAssetValidation, buyAssetPosition);

export default router;
