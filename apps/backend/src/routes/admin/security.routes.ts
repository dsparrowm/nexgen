import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import { getSecurityMetrics, getAuditLogs } from '@/controllers/admin/security.controller';

const router = Router();

// All security routes require admin authentication
router.use(authenticateAdmin);

/**
 * @route GET /api/admin/security/metrics
 * @desc Get security metrics (login attempts, failed logins, active sessions, blocked IPs)
 * @access Admin
 */
router.get('/metrics', getSecurityMetrics);

/**
 * @route GET /api/admin/security/audit-logs
 * @desc Get audit logs with filtering and pagination
 * @access Admin
 */
router.get('/audit-logs', getAuditLogs);

export default router;