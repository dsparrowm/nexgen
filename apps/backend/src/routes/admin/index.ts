import { Router } from 'express';
import dashboardRoutes from './dashboard.routes';
import userRoutes from './user.routes';
import miningRoutes from './mining.routes';
import kycRoutes from './kyc.routes';
import creditRoutes from './credit.routes';
import payoutRoutes from './payout.routes';

const router = Router();

// Mount sub-routes
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/mining', miningRoutes);
router.use('/kyc', kycRoutes);
router.use('/credits', creditRoutes);
router.use('/payouts', payoutRoutes);

export default router;