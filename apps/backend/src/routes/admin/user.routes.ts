import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    createUserValidation,
    updateUserValidation,
    userIdValidation
} from '@/controllers/admin/user.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// User management
router.get('/', getUsers);
router.get('/:userId', userIdValidation, getUser);
router.post('/', createUserValidation, createUser);
router.put('/:userId', userIdValidation, updateUserValidation, updateUser);
router.delete('/:userId', userIdValidation, deleteUser);

export default router;