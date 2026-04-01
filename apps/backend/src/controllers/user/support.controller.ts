import { Request, Response } from 'express';
import { logger } from '@/utils/logger';
import {
  addUserMessage,
  createUserConversation,
  getUserConversation,
  listUserConversations,
  serializeConversationDetail,
  serializeConversationSummary,
  serializeMessages,
} from '@/services/supportChat.service';

type AuthRequest = Request & {
  user?: {
    userId: string;
  };
};

export const listConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required', code: 'AUTH_REQUIRED' },
      });
      return;
    }

    const conversations = await listUserConversations(userId);

    res.status(200).json({
      success: true,
      data: {
        conversations: conversations.map(serializeConversationSummary),
      },
    });
  } catch (error) {
    logger.error('List user support conversations error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to load conversations', code: 'SUPPORT_CONVERSATIONS_LIST_FAILED' },
    });
  }
};

export const createConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { subject, message } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required', code: 'AUTH_REQUIRED' },
      });
      return;
    }

    if (!message?.trim()) {
      res.status(400).json({
        success: false,
        error: { message: 'Message is required', code: 'VALIDATION_FAILED' },
      });
      return;
    }

    const { conversation, messages } = await createUserConversation({ userId, subject, message });

    res.status(201).json({
      success: true,
      data: {
        conversation: serializeConversationDetail(conversation),
        messages: serializeMessages(conversation, messages),
      },
      message: 'Conversation created successfully',
    });
  } catch (error) {
    logger.error('Create user support conversation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create conversation', code: 'SUPPORT_CONVERSATION_CREATE_FAILED' },
    });
  }
};

export const getConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required', code: 'AUTH_REQUIRED' },
      });
      return;
    }

    const result = await getUserConversation(conversationId, userId);
    if (!result) {
      res.status(404).json({
        success: false,
        error: { message: 'Conversation not found', code: 'SUPPORT_CONVERSATION_NOT_FOUND' },
      });
      return;
    }

    const { conversation, messages } = result;

    res.status(200).json({
      success: true,
      data: {
        conversation: serializeConversationDetail(conversation),
        messages: serializeMessages(conversation, messages),
      },
    });
  } catch (error) {
    logger.error('Get user support conversation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to load conversation', code: 'SUPPORT_CONVERSATION_GET_FAILED' },
    });
  }
};

export const createMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;
    const { message } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required', code: 'AUTH_REQUIRED' },
      });
      return;
    }

    if (!message?.trim()) {
      res.status(400).json({
        success: false,
        error: { message: 'Message is required', code: 'VALIDATION_FAILED' },
      });
      return;
    }

    const existingConversation = await getUserConversation(conversationId, userId);
    if (!existingConversation) {
      res.status(404).json({
        success: false,
        error: { message: 'Conversation not found', code: 'SUPPORT_CONVERSATION_NOT_FOUND' },
      });
      return;
    }

    const { conversation, messages } = await addUserMessage(conversationId, userId, message);

    res.status(201).json({
      success: true,
      data: {
        conversation: serializeConversationDetail(conversation),
        messages: serializeMessages(conversation, messages),
      },
      message: 'Message sent successfully',
    });
  } catch (error) {
    logger.error('Create user support message error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to send message', code: 'SUPPORT_MESSAGE_CREATE_FAILED' },
    });
  }
};
