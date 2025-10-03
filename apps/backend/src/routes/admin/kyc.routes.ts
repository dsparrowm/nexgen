import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import {
    getPendingKycDocuments,
    reviewKycDocument,
    getKycDocuments,
    getKycStats,
    reviewKycValidation,
    documentIdValidation
} from '@/controllers/admin/kyc.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// KYC management
router.get('/pending', getPendingKycDocuments);
router.get('/stats', getKycStats);
router.get('/', getKycDocuments);
router.put('/:documentId/review', documentIdValidation, reviewKycValidation, reviewKycDocument);

export default router;