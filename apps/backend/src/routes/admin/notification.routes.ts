import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import {
    listBroadcastNotifications,
    sendBroadcastNotification,
    sendBroadcastNotificationValidation,
} from '@/controllers/admin/notification.controller';

const router = Router();

router.use(authenticateAdmin);

router.get('/', listBroadcastNotifications);
router.post('/broadcast', sendBroadcastNotificationValidation, sendBroadcastNotification);

export default router;
