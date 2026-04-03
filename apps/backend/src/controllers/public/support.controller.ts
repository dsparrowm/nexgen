import { Request, Response } from 'express';
import { logger } from '@/utils/logger';
import {
  addGuestMessage,
  createGuestConversation,
  getGuestConversation,
  markConversationReadByCustomer,
  serializeConversationDetail,
  serializeMessages,
} from '@/services/supportChat.service';
import { broadcastSupportConversationSnapshot } from '@/realtime/supportChatSocket';

export const createConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, subject, message, clientMessageId } = req.body;

    if (!message?.trim()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Message is required',
          code: 'VALIDATION_FAILED',
        },
      });
      return;
    }

    const { conversation, messages, visitorToken, createdMessageId } = await createGuestConversation({
      name,
      email,
      phone,
      subject,
      message,
      clientMessageId,
    });
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
        visitorToken,
      },
      message: 'Support conversation created successfully',
    });
  } catch (error) {
    logger.error('Create public support conversation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create support conversation',
        code: 'SUPPORT_CONVERSATION_CREATE_FAILED',
      },
    });
  }
};

export const getConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const visitorToken = String(req.query.visitorToken || '');
    const page = typeof req.query.page === 'string' ? Number(req.query.page) : undefined;
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;

    if (!visitorToken) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Visitor token is required',
          code: 'VISITOR_TOKEN_REQUIRED',
        },
      });
      return;
    }

    const result = await getGuestConversation(conversationId, visitorToken, {
      page: Number.isFinite(page) ? page : undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
      includeInternal: false,
    });

    if (!result) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Conversation not found',
          code: 'SUPPORT_CONVERSATION_NOT_FOUND',
        },
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
    logger.error('Get public support conversation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to load support conversation',
        code: 'SUPPORT_CONVERSATION_GET_FAILED',
      },
    });
  }
};

export const createMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { visitorToken, message, clientMessageId } = req.body;

    if (!visitorToken || !message?.trim()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Visitor token and message are required',
          code: 'VALIDATION_FAILED',
        },
      });
      return;
    }

    const existingConversation = await getGuestConversation(conversationId, visitorToken);
    if (!existingConversation) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Conversation not found',
          code: 'SUPPORT_CONVERSATION_NOT_FOUND',
        },
      });
      return;
    }

    const { conversation, messages, createdMessageId } = await addGuestMessage(conversationId, visitorToken, message, clientMessageId);
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
    logger.error('Create public support message error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send message',
        code: 'SUPPORT_MESSAGE_CREATE_FAILED',
      },
    });
  }
};
