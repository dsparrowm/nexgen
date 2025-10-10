import { Router } from 'express';
import dashboardRoutes from './dashboard.routes';
import userRoutes from './user.routes';
import miningRoutes from './mining.routes';
import kycRoutes from './kyc.routes';
import creditRoutes from './credit.routes';
import payoutRoutes from './payout.routes';
import transactionRoutes from './transaction.routes';
import reportRoutes from './report.routes';
import settingsRoutes from './settings.routes';
import securityRoutes from './security.routes';

const router = Router();

// Mount sub-routes
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/mining', miningRoutes);
router.use('/kyc', kycRoutes);
router.use('/credits', creditRoutes);
router.use('/payouts', payoutRoutes);
router.use('/transactions', transactionRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/security', securityRoutes);

export default router;