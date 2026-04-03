import { Request, Response } from 'express';
import { logger } from '@/utils/logger';
import {
  addUserMessage,
  createUserConversation,
  getUserConversation,
  listUserConversations,
  markConversationReadByCustomer,
  serializeConversationDetail,
  serializeConversationSummary,
  serializeMessages,
} from '@/services/supportChat.service';
import { broadcastSupportConversationSnapshot } from '@/realtime/supportChatSocket';

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
    const { subject, message, clientMessageId } = req.body;

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

    const { conversation, messages, createdMessageId } = await createUserConversation({ userId, subject, message, clientMessageId });
    broadcastSupportConversationSnapshot(
      { conversation, messages },
      'conversation_created',
      { createdMessageId, clientMessageId }
    );

    res.status(201).json({
      success: true,
      data: {
        conversation: serializeConversationDetail(conversation),
        messages: serializeMessages(conversation, messages, {
          includeInternal: false,
          highlightedMessageId: createdMessageId,
          clientMessageId,
          viewerRole: 'customer',
        }),
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
    const page = typeof req.query.page === 'string' ? Number(req.query.page) : undefined;
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required', code: 'AUTH_REQUIRED' },
      });
      return;
    }

    const result = await getUserConversation(conversationId, userId, {
      page: Number.isFinite(page) ? page : undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
      includeInternal: false,
    });
    if (!result) {
      res.status(404).json({
        success: false,
        error: { message: 'Conversation not found', code: 'SUPPORT_CONVERSATION_NOT_FOUND' },
      });
      return;
    }

    const { conversation, messages } = result;
    const readResult = await markConversationReadByCustomer(conversationId);

    res.status(200).json({
      success: true,
      data: {
        conversation: serializeConversationDetail(readResult.conversation),
        messages: serializeMessages(readResult.conversation, readResult.messages, { includeInternal: false, viewerRole: 'customer' }),
        pagination: result.pagination,
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
    const { message, clientMessageId } = req.body;

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

    const messageResult = await addUserMessage(conversationId, userId, message, clientMessageId);
    if (!messageResult) {
      res.status(404).json({
        success: false,
        error: { message: 'Conversation not found', code: 'SUPPORT_CONVERSATION_NOT_FOUND' },
      });
      return;
    }

    const { conversation, messages, createdMessageId } = messageResult;
    broadcastSupportConversationSnapshot(
      { conversation, messages },
      'message_created',
      { createdMessageId, clientMessageId }
    );

    res.status(201).json({
      success: true,
      data: {
        conversation: serializeConversationDetail(conversation),
        messages: serializeMessages(conversation, messages, {
          includeInternal: false,
          highlightedMessageId: createdMessageId,
          clientMessageId,
          viewerRole: 'customer',
        }),
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
