import { Request, Response } from 'express';
import { logger } from '@/utils/logger';
import {
  addGuestMessage,
  createGuestConversation,
  getGuestConversation,
  serializeConversationDetail,
  serializeMessages,
} from '@/services/supportChat.service';

export const createConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Name, email, and message are required',
          code: 'VALIDATION_FAILED',
        },
      });
      return;
    }

    const { conversation, messages, visitorToken } = await createGuestConversation({
      name,
      email,
      phone,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      data: {
        conversation: serializeConversationDetail(conversation),
        messages: serializeMessages(conversation, messages),
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

    const result = await getGuestConversation(conversationId, visitorToken);

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

    res.status(200).json({
      success: true,
      data: {
        conversation: serializeConversationDetail(conversation),
        messages: serializeMessages(conversation, messages),
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
    const { visitorToken, message } = req.body;

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

    const { conversation, messages } = await addGuestMessage(conversationId, visitorToken, message);

    res.status(201).json({
      success: true,
      data: {
        conversation: serializeConversationDetail(conversation),
        messages: serializeMessages(conversation, messages),
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
