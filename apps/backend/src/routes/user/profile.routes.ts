import { Router } from 'express';
import multer from 'multer';
import { authenticateUser } from '@/middlewares/auth';
import { config } from '@/config/env';
import {
    updateProfile,
    changePassword,
    uploadKycDocument,
    getKycDocuments,
    uploadProfileImage,
    getDashboard,
    updateProfileValidation,
    changePasswordValidation,
    uploadKycDocumentValidation
} from '@/controllers/user/profile.controller';

const router = Router();

// Memory storage — files are streamed to Cloudinary, not written to disk
const storage = multer.memoryStorage();

const kycFileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only image files and PDFs are allowed'));
    }
};

const avatarFileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed for profile pictures'));
    }
};

const kycUpload = multer({
    storage,
    fileFilter: kycFileFilter,
    limits: { fileSize: config.maxFileSize },
});

const avatarUpload = multer({
    storage,
    fileFilter: avatarFileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB for avatars
});

// All routes require user authentication
router.use(authenticateUser);

// Dashboard
router.get('/dashboard', getDashboard);

// Profile management
router.put('/profile', updateProfileValidation, updateProfile);
router.put('/password', changePasswordValidation, changePassword);
router.post('/avatar', avatarUpload.single('avatar'), uploadProfileImage);

// KYC document management
router.post('/kyc/upload', kycUpload.single('document'), uploadKycDocumentValidation, uploadKycDocument);
router.get('/kyc/documents', getKycDocuments);

export default router;
