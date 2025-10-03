import { Router } from 'express';
import miningRoutes from './mining.routes';

const router = Router();

// Mount public sub-routes
router.use('/mining', miningRoutes);

export default router;