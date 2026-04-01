import { Request, Response } from 'express';
import { logger } from '@/utils/logger';
import {
  addAdminMessage,
  assignConversation,
  getAdminConversation,
  listAdminConversations,
  markConversationReadByAdmin,
  SUPPORT_CONVERSATION_STATUSES,
  type SupportConversationStatus,
  serializeConversationDetail,
  serializeConversationSummary,
  serializeMessages,
  updateConversationStatus,
} from '@/services/supportChat.service';

type AuthRequest = Request & {
  user?: {
    userId: string;
  };
};

export const listConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversations = await listAdminConversations({
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    });

    res.status(200).json({
      success: true,
      data: {
        conversations: conversations.map(serializeConversationSummary),
      },
    });
  } catch (error) {
    logger.error('List admin support conversations error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to load conversations', code: 'SUPPORT_CONVERSATIONS_LIST_FAILED' },
    });
  }
};

export const getConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const result = await getAdminConversation(conversationId);

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
    logger.error('Get admin support conversation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to load conversation', code: 'SUPPORT_CONVERSATION_GET_FAILED' },
    });
  }
};

export const createMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.userId;
    const { conversationId } = req.params;
    const { message } = req.body;

    if (!adminId) {
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

    const existingConversation = await getAdminConversation(conversationId);
    if (!existingConversation) {
      res.status(404).json({
        success: false,
        error: { message: 'Conversation not found', code: 'SUPPORT_CONVERSATION_NOT_FOUND' },
      });
      return;
    }

    const { conversation, messages } = await addAdminMessage(conversationId, adminId, message);

    res.status(201).json({
      success: true,
      data: {
        conversation: serializeConversationDetail(conversation),
        messages: serializeMessages(conversation, messages),
      },
      message: 'Reply sent successfully',
    });
  } catch (error) {
    logger.error('Create admin support message error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to send reply', code: 'SUPPORT_MESSAGE_CREATE_FAILED' },
    });
  }
};

export const setStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const status = req.body?.status as SupportConversationStatus | undefined;

    if (!status || !SUPPORT_CONVERSATION_STATUSES.includes(status)) {
      res.status(400).json({
        success: false,
        error: { message: 'A valid status is required', code: 'VALIDATION_FAILED' },
      });
      return;
    }

    const { conversation, messages } = await updateConversationStatus(conversationId, status);

    res.status(200).json({
      success: true,
      data: {
        conversation: serializeConversationDetail(conversation),
        messages: serializeMessages(conversation, messages),
      },
      message: 'Conversation status updated successfully',
    });
  } catch (error) {
    logger.error('Update support conversation status error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update conversation status', code: 'SUPPORT_STATUS_UPDATE_FAILED' },
    });
  }
};

export const assignToAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fallbackAdminId = req.user?.userId;
    const { conversationId } = req.params;
    const adminId = (req.body?.adminId as string | undefined) || fallbackAdminId;

    if (!adminId) {
      res.status(400).json({
        success: false,
        error: { message: 'Admin assignment requires an admin user', code: 'VALIDATION_FAILED' },
      });
      return;
    }

    const { conversation, messages } = await assignConversation(conversationId, adminId);

    res.status(200).json({
      success: true,
      data: {
        conversation: serializeConversationDetail(conversation),
        messages: serializeMessages(conversation, messages),
      },
      message: 'Conversation assigned successfully',
    });
  } catch (error) {
    logger.error('Assign support conversation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to assign conversation', code: 'SUPPORT_ASSIGN_FAILED' },
    });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { conversation, messages } = await markConversationReadByAdmin(conversationId);

    res.status(200).json({
      success: true,
      data: {
        conversation: serializeConversationDetail(conversation),
        messages: serializeMessages(conversation, messages),
      },
      message: 'Conversation marked as read',
    });
  } catch (error) {
    logger.error('Mark support conversation as read error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to mark conversation as read', code: 'SUPPORT_MARK_READ_FAILED' },
    });
  }
};
