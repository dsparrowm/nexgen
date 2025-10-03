import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateUser } from '@/middlewares/auth';
import {
    updateProfile,
    changePassword,
    uploadKycDocument,
    getKycDocuments,
    getDashboard,
    updateProfileValidation,
    changePasswordValidation,
    uploadKycDocumentValidation
} from '@/controllers/user/profile.controller';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(process.cwd(), 'uploads', 'kyc'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept only image files and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only image files and PDFs are allowed'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// All routes require user authentication
router.use(authenticateUser);

// Dashboard
router.get('/dashboard', getDashboard);

// Profile management
router.put('/profile', updateProfileValidation, updateProfile);
router.put('/password', changePasswordValidation, changePassword);

// KYC document management
router.post('/kyc/upload', upload.single('document'), uploadKycDocumentValidation, uploadKycDocument);
router.get('/kyc/documents', getKycDocuments);

export default router;