import { Router } from 'express';
import profileRoutes from './profile.routes';
import investmentRoutes from './investment.routes';
import notificationRoutes from './notification.routes';
import referralRoutes from './referral.routes';
import dashboardRoutes from './dashboard.routes';
import miningRoutes from './mining.routes';
import transactionRoutes from './transaction.routes';
import payoutRoutes from './payout.routes';

const router = Router();

// Mount sub-routes
router.use('/profile', profileRoutes);
router.use('/investments', investmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/referral', referralRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/mining', miningRoutes);
router.use('/transactions', transactionRoutes);
router.use('/payouts', payoutRoutes);

export default router;