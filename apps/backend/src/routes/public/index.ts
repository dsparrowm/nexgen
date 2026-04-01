import { Router } from 'express';
import miningRoutes from './mining.routes';
import supportRoutes from './support.routes';

const router = Router();

// Mount public sub-routes
router.use('/mining', miningRoutes);
router.use('/support', supportRoutes);

export default router;
