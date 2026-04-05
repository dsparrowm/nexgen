import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import {
    complianceOverviewValidation,
    complianceRestrictionValidation,
    getComplianceOverview,
    updateComplianceRestriction,
} from '@/controllers/admin/compliance.controller';

const router = Router();

router.use(authenticateAdmin);

router.get('/', complianceOverviewValidation, getComplianceOverview);
router.put('/users/:userId/restriction', complianceRestrictionValidation, updateComplianceRestriction);

export default router;
