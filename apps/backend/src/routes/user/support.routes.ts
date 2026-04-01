import { Router } from 'express';
import { authenticateUser } from '@/middlewares/auth';
import {
  createConversation,
  createMessage,
  getConversation,
  listConversations,
} from '@/controllers/user/support.controller';

const router = Router();

router.use(authenticateUser);
router.get('/conversations', listConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:conversationId', getConversation);
router.post('/conversations/:conversationId/messages', createMessage);

export default router;
