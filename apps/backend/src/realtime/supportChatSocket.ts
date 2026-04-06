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
  page?: number;
  limit?: number;
};

type SupportConversationResult = NonNullable<Awaited<ReturnType<typeof getAdminConversation>>>;

type SupportRole = 'admin' | 'customer';

type SupportBroadcastOptions = {
  clientMessageId?: string | null;
  createdMessageId?: string | null;
};

type SupportPresencePayload = {
  conversationId: string;
  adminOnline: boolean;
  customerOnline: boolean;
  onlineCount: number;
};

type SupportTypingPayload = {
  conversationId: string;
  role: SupportRole;
  isTyping: boolean;
};

type ConversationParticipant = {
  socketId: string;
  role: SupportRole;
};

const ADMIN_ROOM = 'support:admins';
const USER_NOTIFICATIONS_ROOM_PREFIX = 'user:notifications:';

let io: SocketIOServer | null = null;
const conversationParticipants = new Map<string, Map<string, ConversationParticipant>>();
const conversationTyping = new Map<string, Map<string, SupportRole>>();
const adminSocketIds = new Set<string>();

function getConversationRoom(conversationId: string) {
  return `support:conversation:${conversationId}`;
}

function getUserNotificationsRoom(userId: string) {
  return `${USER_NOTIFICATIONS_ROOM_PREFIX}${userId}`;
}

function getSocketRole(socket: Socket<any, any, any, SupportSocketData>): SupportRole {
  return socket.data.authType === 'admin' ? 'admin' : 'customer';
}

function getConversationParticipants(conversationId: string) {
  let participants = conversationParticipants.get(conversationId);
  if (!participants) {
    participants = new Map<string, ConversationParticipant>();
    conversationParticipants.set(conversationId, participants);
  }

  return participants;
}

function removeConversationParticipant(conversationId: string, socketId: string) {
  const participants = conversationParticipants.get(conversationId);
  if (!participants) {
    return;
  }

  participants.delete(socketId);
  if (participants.size === 0) {
    conversationParticipants.delete(conversationId);
  }
}

function clearConversationTyping(conversationId: string, socketId: string) {
  const typing = conversationTyping.get(conversationId);
  if (!typing) {
    return;
  }

  typing.delete(socketId);
  if (typing.size === 0) {
    conversationTyping.delete(conversationId);
  }
}

function getConversationPresence(conversationId: string): SupportPresencePayload {
  const participants = conversationParticipants.get(conversationId);
  const onlineRoles = new Set<SupportRole>();

  participants?.forEach((participant) => {
    onlineRoles.add(participant.role);
  });

  return {
    conversationId,
    adminOnline: adminSocketIds.size > 0,
    customerOnline: onlineRoles.has('customer'),
    onlineCount: participants?.size || 0,
  };
}

function getConversationTypingState(conversationId: string) {
  const typing = conversationTyping.get(conversationId);
  const typingRoles = new Set<SupportRole>();

  typing?.forEach((role) => {
    typingRoles.add(role);
  });

  return {
    conversationId,
    adminTyping: typingRoles.has('admin'),
    customerTyping: typingRoles.has('customer'),
  };
}

function broadcastPresence(conversationId: string) {
  if (!io) {
    return;
  }

  io.to(getConversationRoom(conversationId)).emit('support:presence', getConversationPresence(conversationId));
}

function broadcastTyping(conversationId: string, role: SupportRole, isTyping: boolean) {
  if (!io) {
    return;
  }

  io.to(getConversationRoom(conversationId)).emit('support:typing', {
    conversationId,
    role,
    isTyping,
  } satisfies SupportTypingPayload);
}

function broadcastGlobalPresence() {
  if (!io) {
    return;
  }

  for (const conversationId of conversationParticipants.keys()) {
    broadcastPresence(conversationId);
  }
}

async function canJoinConversation(
  socket: Socket<any, any, any, SupportSocketData>,
  payload: SupportJoinPayload
) {
  const paginationOptions = {
    page: typeof payload.page === 'number' && Number.isFinite(payload.page) ? payload.page : undefined,
    limit: typeof payload.limit === 'number' && Number.isFinite(payload.limit) ? payload.limit : undefined,
  };

  if (!payload.conversationId) {
    return null;
  }

  if (socket.data.authType === 'admin') {
    return getAdminConversation(payload.conversationId, paginationOptions);
  }

  if (socket.data.authType === 'user' && socket.data.user) {
    return getUserConversation(payload.conversationId, socket.data.user.userId, paginationOptions);
  }

  if (socket.data.authType === 'guest' && payload.visitorToken) {
    return getGuestConversation(payload.conversationId, payload.visitorToken, paginationOptions);
  }

  return null;
}

function annotateMessages(
  messages: ReturnType<typeof serializeMessages>,
  options: SupportBroadcastOptions = {}
) {
  if (!options.clientMessageId || !options.createdMessageId) {
    return messages;
  }

  return messages.map((message) => (
    message.id === options.createdMessageId
      ? { ...message, clientMessageId: options.clientMessageId }
      : message
  ));
}

function emitConversationSnapshot(result: SupportConversationResult, reason: string, options: SupportBroadcastOptions = {}) {
  if (!io) {
    return;
  }

  const summary = serializeConversationSummary(result.conversation);
  const conversation = serializeConversationDetail(result.conversation);
  const room = getConversationRoom(result.conversation.id);
  const presence = getConversationPresence(result.conversation.id);
  const typing = getConversationTypingState(result.conversation.id);
  const adminPayload = {
    reason,
    conversation,
    summary,
    presence,
    typing,
    messages: annotateMessages(serializeMessages(result.conversation, result.messages), options),
  };
  const participantPayload = {
    reason,
    conversation,
    summary,
    presence,
    typing,
    messages: annotateMessages(
      serializeMessages(result.conversation, result.messages, { includeInternal: false, viewerRole: 'customer' }),
      options
    ),
  };

  io.to(ADMIN_ROOM).emit('support:conversation-updated', adminPayload);
  io.to(room).emit('support:conversation-snapshot', participantPayload);
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
      adminSocketIds.add(socket.id);
      broadcastGlobalPresence();
    }

    if (socket.data.authType === 'user' && socket.data.user?.userId) {
      socket.join(getUserNotificationsRoom(socket.data.user.userId));
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
          removeConversationParticipant(socket.data.joinedConversationId, socket.id);
          clearConversationTyping(socket.data.joinedConversationId, socket.id);
          broadcastPresence(socket.data.joinedConversationId);
          broadcastTyping(socket.data.joinedConversationId, getSocketRole(socket), false);
        }

        socket.join(nextRoom);
        socket.data.joinedConversationId = payload.conversationId;
        getConversationParticipants(payload.conversationId).set(socket.id, {
          socketId: socket.id,
          role: getSocketRole(socket),
        });

        callback?.({
          success: true,
          data: {
            conversation: serializeConversationDetail(result.conversation),
            summary: serializeConversationSummary(result.conversation),
            presence: getConversationPresence(result.conversation.id),
            typing: getConversationTypingState(result.conversation.id),
            messages: socket.data.authType === 'admin'
              ? serializeMessages(result.conversation, result.messages, { viewerRole: 'admin' })
              : serializeMessages(result.conversation, result.messages, { includeInternal: false, viewerRole: 'customer' }),
            pagination: result.pagination,
          },
        });

        broadcastPresence(payload.conversationId);
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
        const conversationId = socket.data.joinedConversationId;
        socket.leave(getConversationRoom(conversationId));
        removeConversationParticipant(conversationId, socket.id);
        clearConversationTyping(conversationId, socket.id);
        socket.data.joinedConversationId = undefined;
        broadcastPresence(conversationId);
        broadcastTyping(conversationId, getSocketRole(socket), false);
      }
    });

    socket.on('support:typing', async (payload: { conversationId: string; isTyping: boolean }, callback?: (response: any) => void) => {
      try {
        const role = getSocketRole(socket);
        const conversationId = payload.conversationId;
        const isParticipantMessage = socket.data.joinedConversationId === conversationId;

        if (role !== 'admin' && !isParticipantMessage) {
          callback?.({ success: false, error: { message: 'Conversation access denied', code: 'SUPPORT_TYPING_DENIED' } });
          return;
        }

        if (role === 'admin') {
          const adminConversation = await getAdminConversation(conversationId);
          if (!adminConversation) {
            callback?.({ success: false, error: { message: 'Conversation access denied', code: 'SUPPORT_TYPING_DENIED' } });
            return;
          }
        }

        const typing = getConversationTypingState(conversationId);
        const conversationTypingState = conversationTyping.get(conversationId) || new Map<string, SupportRole>();

        if (payload.isTyping) {
          conversationTypingState.set(socket.id, role);
        } else {
          conversationTypingState.delete(socket.id);
        }

        if (conversationTypingState.size === 0) {
          conversationTyping.delete(conversationId);
        } else {
          conversationTyping.set(conversationId, conversationTypingState);
        }

        broadcastTyping(conversationId, role, payload.isTyping);
        callback?.({ success: true, data: { typing: getConversationTypingState(conversationId), presence: getConversationPresence(conversationId) } });
      } catch (error) {
        logger.error('Support socket typing error:', error);
        callback?.({ success: false, error: { message: 'Failed to update typing state', code: 'SUPPORT_TYPING_FAILED' } });
      }
    });

    socket.on('disconnect', () => {
      const joinedConversationId = socket.data.joinedConversationId;
      if (socket.data.authType === 'admin') {
        adminSocketIds.delete(socket.id);
        broadcastGlobalPresence();
      }

      if (joinedConversationId) {
        removeConversationParticipant(joinedConversationId, socket.id);
        clearConversationTyping(joinedConversationId, socket.id);
        broadcastPresence(joinedConversationId);
        broadcastTyping(joinedConversationId, getSocketRole(socket), false);
      }

      socket.data.joinedConversationId = undefined;
    });
  });

  logger.info('Support chat Socket.IO server initialized');
  return io;
}

export function broadcastSupportConversationSnapshot(
  result: SupportConversationResult,
  reason: string,
  options: SupportBroadcastOptions = {}
) {
  emitConversationSnapshot(result, reason, options);
}

export function broadcastUserNotificationsUpdated(
  userId: string,
  payload: { reason?: string; notificationId?: string; title?: string; message?: string } = {}
) {
  if (!io || !userId) {
    return;
  }

  io.to(getUserNotificationsRoom(userId)).emit('notifications:updated', {
    userId,
    reason: payload.reason || 'updated',
    notificationId: payload.notificationId || null,
    title: payload.title || null,
    message: payload.message || null,
  });
}

export function getSupportChatSocketServer() {
  return io;
}
