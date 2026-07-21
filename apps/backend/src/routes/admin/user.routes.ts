import { Router } from 'express';
import multer from 'multer';
import { authenticateAdmin } from '@/middlewares/auth';
import {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    uploadUserProfileImage,
    createUserValidation,
    updateUserValidation,
    userIdValidation
} from '@/controllers/admin/user.controller';

const router = Router();

const avatarUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for profile pictures'));
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 },
});

// All routes require admin authentication
router.use(authenticateAdmin);

// User management
router.get('/', getUsers);
router.get('/:userId', userIdValidation, getUser);
router.post('/', createUserValidation, createUser);
router.put('/:userId', userIdValidation, updateUserValidation, updateUser);
router.post(
    '/:userId/avatar',
    userIdValidation,
    avatarUpload.single('avatar'),
    uploadUserProfileImage
);
router.delete('/:userId', userIdValidation, deleteUser);

export default router;
