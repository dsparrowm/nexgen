import { Router } from 'express';
import { authenticateUser } from '@/middlewares/auth';
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    getNotificationStats,
    notificationIdValidation
} from '@/controllers/user/notification.controller';

const router = Router();

// All routes require user authentication
router.use(authenticateUser);

// Notification management
router.get('/', getNotifications);
router.get('/stats', getNotificationStats);
router.put('/:notificationId/read', notificationIdValidation, markNotificationAsRead);
router.put('/read-all', markAllNotificationsAsRead);
router.delete('/:notificationId', notificationIdValidation, deleteNotification);

export default router;