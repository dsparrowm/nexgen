import { Router } from 'express';
import { authenticateAdmin } from '@/middlewares/auth';
import {
  assignToAdmin,
  createMessage,
  getConversation,
  listConversations,
  markAsRead,
  setStatus,
} from '@/controllers/admin/support.controller';

const router = Router();

router.use(authenticateAdmin);
router.get('/conversations', listConversations);
router.get('/conversations/:conversationId', getConversation);
router.post('/conversations/:conversationId/messages', createMessage);
router.put('/conversations/:conversationId/read', markAsRead);
router.put('/conversations/:conversationId/status', setStatus);
router.put('/conversations/:conversationId/assign', assignToAdmin);

export default router;
