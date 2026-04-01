import { Router } from 'express';
import {
  createConversation,
  createMessage,
  getConversation,
} from '@/controllers/public/support.controller';

const router = Router();

router.post('/conversations', createConversation);
router.get('/conversations/:conversationId', getConversation);
router.post('/conversations/:conversationId/messages', createMessage);

export default router;
