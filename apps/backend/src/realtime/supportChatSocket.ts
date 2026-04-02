import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '@/config/env';
import logger from '@/utils/logger';
import { verifyToken, type JWTPayload } from '@/utils/jwt';
import {
  getAdminConversation,
  getGuestConversation,
  getUserConversation,
  serializeConversationDetail,
  serializeConversationSummary,
  serializeMessages,
} from '@/services/supportChat.service';

type SocketAuthType = 'admin' | 'user' | 'guest';

type SupportSocketData = {
  authType: SocketAuthType;
  user?: JWTPayload;
  joinedConversationId?: string;
};

type SupportJoinPayload = {
  conversationId: string;
  visitorToken?: string;
};

type SupportConversationResult = NonNullable<Awaited<ReturnType<typeof getAdminConversation>>>;

const ADMIN_ROOM = 'support:admins';

let io: SocketIOServer | null = null;

function getConversationRoom(conversationId: string) {
  return `support:conversation:${conversationId}`;
}

async function canJoinConversation(socket: Socket<any, any, any, SupportSocketData>, payload: SupportJoinPayload) {
  if (!payload.conversationId) {
    return null;
  }

  if (socket.data.authType === 'admin') {
    return getAdminConversation(payload.conversationId);
  }

  if (socket.data.authType === 'user' && socket.data.user) {
    return getUserConversation(payload.conversationId, socket.data.user.userId);
  }

  if (socket.data.authType === 'guest' && payload.visitorToken) {
    return getGuestConversation(payload.conversationId, payload.visitorToken);
  }

  return null;
}

function emitConversationSnapshot(result: SupportConversationResult, reason: string) {
  if (!io) {
    return;
  }

  const summary = serializeConversationSummary(result.conversation);
  const conversation = serializeConversationDetail(result.conversation);
  const messages = serializeMessages(result.conversation, result.messages);
  const room = getConversationRoom(result.conversation.id);
  const payload = {
    reason,
    conversation,
    summary,
    messages,
  };

  io.to(ADMIN_ROOM).emit('support:conversation-updated', payload);
  io.to(room).emit('support:conversation-snapshot', payload);
}

function resolveSocketUser(socket: Socket) {
  const token =
    typeof socket.handshake.auth?.token === 'string'
      ? socket.handshake.auth.token
      : typeof socket.handshake.headers.authorization === 'string' &&
          socket.handshake.headers.authorization.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.slice(7)
        : null;

  const requestedType =
    socket.handshake.auth?.type === 'admin' || socket.handshake.auth?.type === 'user'
      ? socket.handshake.auth.type
      : null;

  if (!token || !requestedType) {
    return { authType: 'guest' as const };
  }

  const user = verifyToken(token, requestedType);
  return { authType: requestedType, user };
}

export function initializeSupportChatSocketServer(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: config.allowedOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const resolved = resolveSocketUser(socket);
      socket.data.authType = resolved.authType;
      if ('user' in resolved) {
        socket.data.user = resolved.user;
      }
      next();
    } catch (error) {
      next(new Error(error instanceof Error ? error.message : 'Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.data.authType === 'admin') {
      socket.join(ADMIN_ROOM);
    }

    socket.on('support:join', async (payload: SupportJoinPayload, callback?: (response: any) => void) => {
      try {
        const result = await canJoinConversation(socket, payload);
        if (!result) {
          callback?.({
            success: false,
            error: {
              message: 'Conversation access denied',
              code: 'SUPPORT_JOIN_DENIED',
            },
          });
          return;
        }

        const nextRoom = getConversationRoom(payload.conversationId);
        if (socket.data.joinedConversationId) {
          socket.leave(getConversationRoom(socket.data.joinedConversationId));
        }

        socket.join(nextRoom);
        socket.data.joinedConversationId = payload.conversationId;

        callback?.({
          success: true,
          data: {
            conversation: serializeConversationDetail(result.conversation),
            summary: serializeConversationSummary(result.conversation),
            messages: serializeMessages(result.conversation, result.messages),
          },
        });
      } catch (error) {
        logger.error('Support socket join error:', error);
        callback?.({
          success: false,
          error: {
            message: 'Failed to join support conversation',
            code: 'SUPPORT_JOIN_FAILED',
          },
        });
      }
    });

    socket.on('support:leave', () => {
      if (socket.data.joinedConversationId) {
        socket.leave(getConversationRoom(socket.data.joinedConversationId));
        socket.data.joinedConversationId = undefined;
      }
    });

    socket.on('disconnect', () => {
      socket.data.joinedConversationId = undefined;
    });
  });

  logger.info('Support chat Socket.IO server initialized');
  return io;
}

export function broadcastSupportConversationSnapshot(result: SupportConversationResult, reason: string) {
  emitConversationSnapshot(result, reason);
}

export function getSupportChatSocketServer() {
  return io;
}
