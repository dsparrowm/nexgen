import { nanoid } from 'nanoid';
import db from '@/services/database';

export const SUPPORT_CONVERSATION_STATUSES = ['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'] as const;
export const SUPPORT_CONVERSATION_SOURCES = ['LANDING_PAGE', 'DASHBOARD', 'ADMIN'] as const;
export const SUPPORT_CONVERSATION_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export const SUPPORT_SENDER_TYPES = ['VISITOR', 'CUSTOMER', 'ADMIN', 'SYSTEM'] as const;

export type SupportConversationStatus = (typeof SUPPORT_CONVERSATION_STATUSES)[number];
export type SupportConversationSource = (typeof SUPPORT_CONVERSATION_SOURCES)[number];
export type SupportConversationPriority = (typeof SUPPORT_CONVERSATION_PRIORITIES)[number];
export type SupportSenderType = (typeof SUPPORT_SENDER_TYPES)[number];

type SupportUserRow = {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
};

type ConversationRow = {
  id: string;
  clientMessageId: string | null;
  userId: string | null;
  assignedAdminId: string | null;
  visitorToken: string | null;
  subject: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  status: SupportConversationStatus;
  source: SupportConversationSource;
  priority: SupportConversationPriority;
  lastMessageAt: Date;
  lastReadAtByCustomer: Date | null;
  lastReadAtByAdmin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customerId: string | null;
  customerEmail: string | null;
  customerUsername: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
  customerRole: string | null;
  assignedAdminEmail: string | null;
  assignedAdminUsername: string | null;
  assignedAdminFirstName: string | null;
  assignedAdminLastName: string | null;
  assignedAdminRole: string | null;
  lastMessage: string | null;
  lastMessageSenderType: SupportSenderType | null;
  lastMessageCreatedAt: Date | null;
  messageCount: number;
};

type MessageRow = {
  id: string;
  clientMessageId: string | null;
  conversationId: string;
  senderType: SupportSenderType;
  senderUserId: string | null;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  senderId: string | null;
  senderEmail: string | null;
  senderUsername: string | null;
  senderFirstName: string | null;
  senderLastName: string | null;
  senderRole: string | null;
};

type QueryRunner = {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
};

type MessagePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

type MessageQueryOptions = {
  includeInternal?: boolean;
  page?: number;
  limit?: number;
};

type MessageViewRole = 'admin' | 'customer';

const conversationSelect = `
  SELECT
    c.id,
    c."clientMessageId" AS "clientMessageId",
    c."userId" AS "userId",
    c."assignedAdminId" AS "assignedAdminId",
    c."visitorToken" AS "visitorToken",
    c.subject,
    c."guestName" AS "guestName",
    c."guestEmail" AS "guestEmail",
    c."guestPhone" AS "guestPhone",
    c.status,
    c.source,
    c.priority,
    c."lastMessageAt" AS "lastMessageAt",
    c."lastReadAtByCustomer" AS "lastReadAtByCustomer",
    c."lastReadAtByAdmin" AS "lastReadAtByAdmin",
    c."createdAt" AS "createdAt",
    c."updatedAt" AS "updatedAt",
    customer.id AS "customerId",
    customer.email AS "customerEmail",
    customer.username AS "customerUsername",
    customer."firstName" AS "customerFirstName",
    customer."lastName" AS "customerLastName",
    customer.role AS "customerRole",
    admin.email AS "assignedAdminEmail",
    admin.username AS "assignedAdminUsername",
    admin."firstName" AS "assignedAdminFirstName",
    admin."lastName" AS "assignedAdminLastName",
    admin.role AS "assignedAdminRole",
    last_message.content AS "lastMessage",
    last_message."senderType" AS "lastMessageSenderType",
    last_message."createdAt" AS "lastMessageCreatedAt",
    COALESCE(message_counts.count, 0)::int AS "messageCount"
  FROM "support_conversations" c
  LEFT JOIN "users" customer ON customer.id = c."userId"
  LEFT JOIN "users" admin ON admin.id = c."assignedAdminId"
  LEFT JOIN LATERAL (
    SELECT m.content, m."senderType", m."createdAt"
    FROM "support_messages" m
    WHERE m."conversationId" = c.id
    ORDER BY m."createdAt" DESC
    LIMIT 1
  ) last_message ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS count
    FROM "support_messages" m_count
    WHERE m_count."conversationId" = c.id
  ) message_counts ON true
`;

function buildDisplayName(user?: { firstName: string | null; lastName: string | null; username: string | null } | null) {
  if (!user) return null;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.username || null;
}

function serializeUser(user?: SupportUserRow | null) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    displayName: buildDisplayName(user) || user.email,
  };
}

function getCustomerFromRow(row: ConversationRow) {
  const user = row.customerId
    ? serializeUser({
      id: row.customerId,
      email: row.customerEmail || '',
      username: row.customerUsername || '',
      firstName: row.customerFirstName,
      lastName: row.customerLastName,
      role: row.customerRole || 'USER',
    })
    : null;

  return {
    user,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    guestPhone: row.guestPhone,
    displayName: user?.displayName || row.guestName || 'Website visitor',
    displayEmail: user?.email || row.guestEmail || null,
  };
}

function getAssignedAdminFromRow(row: ConversationRow) {
  if (!row.assignedAdminId || !row.assignedAdminEmail) {
    return null;
  }

  return serializeUser({
    id: row.assignedAdminId,
    email: row.assignedAdminEmail,
    username: row.assignedAdminUsername || '',
    firstName: row.assignedAdminFirstName,
    lastName: row.assignedAdminLastName,
    role: row.assignedAdminRole || 'ADMIN',
  });
}

function messageSenderLabel(message: MessageRow, customer: ReturnType<typeof getCustomerFromRow>) {
  if (message.senderId && message.senderEmail) {
    return (
      buildDisplayName({
        firstName: message.senderFirstName,
        lastName: message.senderLastName,
        username: message.senderUsername,
      }) || message.senderEmail
    );
  }

  if (message.senderType === 'VISITOR') {
    return customer.guestName || customer.guestEmail || 'Visitor';
  }

  if (message.senderType === 'CUSTOMER') {
    return customer.displayName;
  }

  if (message.senderType === 'ADMIN') {
    return 'Support agent';
  }

  return 'System';
}

async function fetchConversationByWhere(
  runner: QueryRunner,
  whereClause: string,
  params: unknown[]
) {
  const rows = await runner.$queryRawUnsafe<ConversationRow[]>(
    `${conversationSelect} WHERE ${whereClause} ORDER BY c."lastMessageAt" DESC LIMIT 1`,
    ...params
  );

  return rows[0] || null;
}

function normalizeMessagePage(value?: number) {
  if (!Number.isFinite(value) || !value) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

function normalizeMessageLimit(value?: number) {
  if (!Number.isFinite(value) || !value) {
    return 20;
  }

  return Math.min(100, Math.max(1, Math.floor(value)));
}

async function fetchMessages(
  runner: QueryRunner,
  conversationId: string,
  options: MessageQueryOptions = {}
) {
  const includeInternal = options.includeInternal ?? true;
  const page = options.page ? normalizeMessagePage(options.page) : null;
  const limit = options.limit ? normalizeMessageLimit(options.limit) : null;
  const whereParts = ['m."conversationId" = $1'];

  if (!includeInternal) {
    whereParts.push('m."isInternal" = FALSE');
  }

  const whereClause = whereParts.join(' AND ');

  if (!page || !limit) {
    return runner.$queryRawUnsafe<MessageRow[]>(
      `
        SELECT
          m.id,
          m."clientMessageId" AS "clientMessageId",
          m."conversationId" AS "conversationId",
          m."senderType" AS "senderType",
          m."senderUserId" AS "senderUserId",
          m.content,
          m."isInternal" AS "isInternal",
          m."createdAt" AS "createdAt",
          sender.id AS "senderId",
          sender.email AS "senderEmail",
          sender.username AS "senderUsername",
          sender."firstName" AS "senderFirstName",
          sender."lastName" AS "senderLastName",
          sender.role AS "senderRole"
        FROM "support_messages" m
        LEFT JOIN "users" sender ON sender.id = m."senderUserId"
        WHERE ${whereClause}
        ORDER BY m."createdAt" ASC, m.id ASC
      `,
      conversationId
    );
  }

  const [{ count: total = 0 } = { count: 0 }] = await runner.$queryRawUnsafe<Array<{ count: number }>>(
    `
      SELECT COUNT(*)::int AS count
      FROM "support_messages" m
      WHERE ${whereClause}
    `,
    conversationId
  );

  const offset = (page - 1) * limit;
  const rows = await runner.$queryRawUnsafe<MessageRow[]>(
    `
      SELECT
        m.id,
        m."clientMessageId" AS "clientMessageId",
        m."conversationId" AS "conversationId",
        m."senderType" AS "senderType",
        m."senderUserId" AS "senderUserId",
        m.content,
        m."isInternal" AS "isInternal",
        m."createdAt" AS "createdAt",
        sender.id AS "senderId",
        sender.email AS "senderEmail",
        sender.username AS "senderUsername",
        sender."firstName" AS "senderFirstName",
        sender."lastName" AS "senderLastName",
        sender.role AS "senderRole"
      FROM "support_messages" m
      LEFT JOIN "users" sender ON sender.id = m."senderUserId"
      WHERE ${whereClause}
      ORDER BY m."createdAt" DESC, m.id DESC
      LIMIT $2 OFFSET $3
    `,
    conversationId,
    limit,
    offset
  );

  return {
    messages: rows.reverse(),
    pagination: {
      page,
      limit,
      total,
      totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      hasMore: page * limit < total,
    } satisfies MessagePagination,
  };
}

export function serializeConversationSummary(row: ConversationRow) {
  const customer = getCustomerFromRow(row);
  const assignedAdmin = getAssignedAdminFromRow(row);
  const unreadCount =
    row.lastMessage &&
      row.lastMessageSenderType !== 'ADMIN' &&
      (!row.lastReadAtByAdmin || (row.lastMessageCreatedAt && row.lastMessageCreatedAt > row.lastReadAtByAdmin))
      ? 1
      : 0;

  return {
    id: row.id,
    subject: row.subject,
    status: row.status,
    source: row.source,
    priority: row.priority,
    customerName: customer.displayName,
    customerEmail: customer.displayEmail,
    customerPhone: customer.guestPhone,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastMessageAt: row.lastMessageAt,
    lastReadAtByCustomer: row.lastReadAtByCustomer,
    lastReadAtByAdmin: row.lastReadAtByAdmin,
    customer,
    assignedAdmin,
    assignedAdminId: assignedAdmin?.id || null,
    assignedAdminName: assignedAdmin?.displayName || null,
    preview: row.lastMessage,
    lastMessage: row.lastMessage,
    unreadCount,
    messageCount: row.messageCount,
  };
}

export function serializeConversationDetail(row: ConversationRow) {
  const customer = getCustomerFromRow(row);
  const assignedAdmin = getAssignedAdminFromRow(row);

  return {
    id: row.id,
    subject: row.subject,
    status: row.status,
    source: row.source,
    priority: row.priority,
    customerName: customer.displayName,
    customerEmail: customer.displayEmail,
    customerPhone: customer.guestPhone,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastMessageAt: row.lastMessageAt,
    lastReadAtByCustomer: row.lastReadAtByCustomer,
    lastReadAtByAdmin: row.lastReadAtByAdmin,
    customer,
    assignedAdmin,
    assignedAdminId: assignedAdmin?.id || null,
    assignedAdminName: assignedAdmin?.displayName || null,
  };
}

export function serializeMessages(
  conversation: ConversationRow,
  rows: MessageRow[],
  options: {
    includeInternal?: boolean;
    highlightedMessageId?: string | null;
    clientMessageId?: string | null;
    viewerRole?: MessageViewRole;
  } = {}
) {
  const customer = getCustomerFromRow(conversation)
  const includeInternal = options.includeInternal ?? true
  const viewerRole = options.viewerRole ?? 'admin'

  return rows
    .filter((message) => includeInternal || !message.isInternal)
    .map((message: MessageRow) => ({
      id: message.id,
      conversationId: message.conversationId,
      clientMessageId: message.clientMessageId,
      content: message.content,
      message: message.content,
      senderType: message.senderType,
      isInternal: message.isInternal,
      createdAt: message.createdAt,
      senderName: messageSenderLabel(message, customer),
      senderEmail: message.senderEmail || customer.displayEmail || null,
      readAt: viewerRole === 'admin'
        ? (message.senderType === 'ADMIN' ? conversation.lastReadAtByCustomer : null)
        : (message.senderType === 'ADMIN' ? null : conversation.lastReadAtByAdmin),
      isRead: viewerRole === 'admin'
        ? message.senderType === 'ADMIN'
          ? Boolean(conversation.lastReadAtByCustomer && message.createdAt <= conversation.lastReadAtByCustomer)
          : false
        : message.senderType === 'ADMIN'
          ? false
          : Boolean(conversation.lastReadAtByAdmin && message.createdAt <= conversation.lastReadAtByAdmin),
      sender: message.senderId && message.senderEmail
        ? serializeUser({
          id: message.senderId,
          email: message.senderEmail,
          username: message.senderUsername || '',
          firstName: message.senderFirstName,
          lastName: message.senderLastName,
          role: message.senderRole || message.senderType,
        })
        : {
          id: null,
          email: null,
          username: null,
          firstName: null,
          lastName: null,
          role: message.senderType,
          displayName: messageSenderLabel(message, customer),
        },
    }));
}

async function fetchConversationAndMessages(
  runner: QueryRunner,
  whereClause: string,
  params: unknown[],
  options: MessageQueryOptions = {}
) {
  const conversation = await fetchConversationByWhere(runner, whereClause, params);
  if (!conversation) {
    return null;
  }

  const messageResult = await fetchMessages(runner, conversation.id, options);
  if (Array.isArray(messageResult)) {
    return { conversation, messages: messageResult };
  }

  return { conversation, messages: messageResult.messages, pagination: messageResult.pagination };
}

async function fetchConversationAndMessagesByClientMessageId(
  runner: QueryRunner,
  clientMessageId: string,
  options: MessageQueryOptions = {}
) {
  return fetchConversationAndMessages(runner, 'c.id = (SELECT m."conversationId" FROM "support_messages" m WHERE m."clientMessageId" = $1 LIMIT 1)', [clientMessageId], options);
}

export async function createGuestConversation(input: {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  clientMessageId?: string;
}) {
  const visitorToken = nanoid(32);
  const conversationId = nanoid();
  const messageId = nanoid();

  if (input.clientMessageId) {
    const existing = await fetchConversationAndMessagesByClientMessageId(db.prisma as unknown as QueryRunner, input.clientMessageId);
    if (existing) {
      return {
        conversation: existing.conversation,
        messages: existing.messages,
        createdMessageId: existing.messages.find((message) => message.clientMessageId === input.clientMessageId)?.id || null,
        visitorToken: existing.conversation.visitorToken,
      };
    }
  }

  return db.prisma.$transaction(async (tx) => {
    const conversationInsertResult = input.clientMessageId
      ? await tx.$queryRawUnsafe<Array<{ id: string }>>(
        `
        INSERT INTO "support_conversations" (
          "id",
          "clientMessageId",
          "guestName",
          "guestEmail",
          "guestPhone",
          subject,
          "visitorToken",
          status,
          source,
          priority,
          "lastMessageAt",
          "createdAt",
          "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN', 'LANDING_PAGE', 'NORMAL', NOW(), NOW(), NOW())
        ON CONFLICT ("clientMessageId") DO NOTHING
        RETURNING id
      `,
        conversationId,
        input.clientMessageId,
        input.name?.trim() || null,
        input.email?.trim().toLowerCase() || null,
        input.phone?.trim() || null,
        input.subject?.trim() || 'Website support request',
        visitorToken
      )
      : [
        { id: conversationId },
      ];

    if (input.clientMessageId && conversationInsertResult.length === 0) {
      const existing = await fetchConversationAndMessagesByClientMessageId(tx as QueryRunner, input.clientMessageId);
      if (existing) {
        return {
          conversation: existing.conversation,
          messages: existing.messages,
          createdMessageId: existing.messages.find((message) => message.clientMessageId === input.clientMessageId)?.id || null,
          visitorToken: existing.conversation.visitorToken,
        };
      }
    }

    const messageInsertResult = input.clientMessageId
      ? await tx.$queryRawUnsafe<Array<{ id: string }>>(
        `
        INSERT INTO "support_messages" (
          "id",
          "clientMessageId",
          "conversationId",
          "senderType",
          content,
          "isInternal",
          "createdAt"
        )
        VALUES ($1, $2, $3, 'VISITOR', $4, FALSE, NOW())
        ON CONFLICT ("clientMessageId") DO NOTHING
        RETURNING id
      `,
        messageId,
        input.clientMessageId,
        conversationId,
        input.message.trim()
      )
      : [
        { id: messageId },
      ];

    if (input.clientMessageId && messageInsertResult.length === 0) {
      const existing = await fetchConversationAndMessagesByClientMessageId(tx as QueryRunner, input.clientMessageId);
      if (existing) {
        return {
          conversation: existing.conversation,
          messages: existing.messages,
          createdMessageId: existing.messages.find((message) => message.clientMessageId === input.clientMessageId)?.id || null,
          visitorToken: existing.conversation.visitorToken,
        };
      }
    }

    if (!input.clientMessageId) {
      await tx.$executeRawUnsafe(
        `
          INSERT INTO "support_messages" (
            "id",
            "conversationId",
            "senderType",
            content,
            "isInternal",
            "createdAt"
          )
          VALUES ($1, $2, 'VISITOR', $3, FALSE, NOW())
        `,
        messageId,
        conversationId,
        input.message.trim()
      );
    }

    const result = await fetchConversationAndMessages(tx as QueryRunner, 'c.id = $1', [conversationId]);

    return {
      conversation: result!.conversation,
      messages: result!.messages,
      createdMessageId: messageId,
      visitorToken,
    };
  });
}

export async function createUserConversation(input: {
  userId: string;
  subject?: string;
  message: string;
  clientMessageId?: string;
}) {
  const conversationId = nanoid();
  const messageId = nanoid();

  if (input.clientMessageId) {
    const existing = await fetchConversationAndMessagesByClientMessageId(db.prisma as unknown as QueryRunner, input.clientMessageId);
    if (existing) {
      return {
        ...existing,
        createdMessageId: existing.messages.find((message) => message.clientMessageId === input.clientMessageId)?.id || null,
      };
    }
  }

  return db.prisma.$transaction(async (tx) => {
    const conversationInsertResult = input.clientMessageId
      ? await tx.$queryRawUnsafe<Array<{ id: string }>>(
        `
        INSERT INTO "support_conversations" (
          "id",
          "clientMessageId",
          "userId",
          subject,
          status,
          source,
          priority,
          "lastMessageAt",
          "lastReadAtByCustomer",
          "createdAt",
          "updatedAt"
        )
        VALUES ($1, $2, $3, $4, 'OPEN', 'DASHBOARD', 'NORMAL', NOW(), NOW(), NOW(), NOW())
        ON CONFLICT ("clientMessageId") DO NOTHING
        RETURNING id
      `,
        conversationId,
        input.clientMessageId,
        input.userId,
        input.subject?.trim() || 'Customer support request'
      )
      : [
        { id: conversationId },
      ];

    if (input.clientMessageId && conversationInsertResult.length === 0) {
      const existing = await fetchConversationAndMessagesByClientMessageId(tx as QueryRunner, input.clientMessageId);
      if (existing) {
        return {
          ...existing,
          createdMessageId: existing.messages.find((message) => message.clientMessageId === input.clientMessageId)?.id || null,
        };
      }
    }

    const messageInsertResult = input.clientMessageId
      ? await tx.$queryRawUnsafe<Array<{ id: string }>>(
        `
        INSERT INTO "support_messages" (
          "id",
          "clientMessageId",
          "conversationId",
          "senderType",
          "senderUserId",
          content,
          "isInternal",
          "createdAt"
        )
        VALUES ($1, $2, $3, 'CUSTOMER', $4, $5, FALSE, NOW())
        ON CONFLICT ("clientMessageId") DO NOTHING
        RETURNING id
      `,
        messageId,
        input.clientMessageId,
        conversationId,
        input.userId,
        input.message.trim()
      )
      : [
        { id: messageId },
      ];

    if (input.clientMessageId && messageInsertResult.length === 0) {
      const existing = await fetchConversationAndMessagesByClientMessageId(tx as QueryRunner, input.clientMessageId);
      if (existing) {
        return {
          ...existing,
          createdMessageId: existing.messages.find((message) => message.clientMessageId === input.clientMessageId)?.id || null,
        };
      }
    }

    if (!input.clientMessageId) {
      await tx.$executeRawUnsafe(
        `
          INSERT INTO "support_messages" (
            "id",
            "conversationId",
            "senderType",
            "senderUserId",
            content,
            "isInternal",
            "createdAt"
          )
          VALUES ($1, $2, 'CUSTOMER', $3, $4, FALSE, NOW())
        `,
        messageId,
        conversationId,
        input.userId,
        input.message.trim()
      );
    }

    const result = await fetchConversationAndMessages(tx as QueryRunner, 'c.id = $1', [conversationId]);
    return { ...result!, createdMessageId: messageId };
  });
}

async function addMessageAndRefresh(
  conversationId: string,
  updateSql: string,
  updateParams: unknown[],
  insertParams: unknown[],
  clientMessageId?: string
) {
  const messageId = nanoid();

  if (clientMessageId) {
    const existing = await fetchConversationAndMessagesByClientMessageId(db.prisma as unknown as QueryRunner, clientMessageId);
    if (existing) {
      return {
        ...existing,
        createdMessageId: existing.messages.find((message) => message.clientMessageId === clientMessageId)?.id || null,
      };
    }
  }

  return db.prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(updateSql, ...updateParams);
    const messageInsertResult = clientMessageId
      ? await tx.$queryRawUnsafe<Array<{ id: string }>>(
        `
        INSERT INTO "support_messages" (
          "id",
          "clientMessageId",
          "conversationId",
          "senderType",
          "senderUserId",
          content,
          "isInternal",
          "createdAt"
        )
        VALUES ($1, $2, $3, $4::"SupportSenderType", $5, $6, FALSE, NOW())
        ON CONFLICT ("clientMessageId") DO NOTHING
        RETURNING id
      `,
        messageId,
        clientMessageId,
        ...insertParams
      )
      : [
        { id: messageId },
      ];

    if (clientMessageId && messageInsertResult.length === 0) {
      const existing = await fetchConversationAndMessagesByClientMessageId(tx as QueryRunner, clientMessageId);
      if (existing) {
        return {
          ...existing,
          createdMessageId: existing.messages.find((message) => message.clientMessageId === clientMessageId)?.id || null,
        };
      }
    }

    if (!clientMessageId) {
      await tx.$executeRawUnsafe(
        `
        INSERT INTO "support_messages" (
          "id",
          "conversationId",
          "senderType",
          "senderUserId",
          content,
          "isInternal",
          "createdAt"
        )
        VALUES ($1, $2, $3::"SupportSenderType", $4, $5, FALSE, NOW())
      `,
        messageId,
        ...insertParams
      );
    }

    const result = await fetchConversationAndMessages(tx as QueryRunner, 'c.id = $1', [conversationId]);
    return {
      ...result!,
      createdMessageId: messageId,
    };
  });
}

export async function addGuestMessage(conversationId: string, visitorToken: string, message: string, clientMessageId?: string) {
  void visitorToken;

  return addMessageAndRefresh(
    conversationId,
    `
      UPDATE "support_conversations"
      SET status = 'OPEN',
          "lastMessageAt" = NOW(),
          "lastReadAtByCustomer" = NOW(),
          "updatedAt" = NOW()
      WHERE id = $1
    `,
    [conversationId],
    [conversationId, 'VISITOR', null, message.trim()],
    clientMessageId
  );
}

export async function addUserMessage(conversationId: string, userId: string, message: string, clientMessageId?: string) {
  return addMessageAndRefresh(
    conversationId,
    `
      UPDATE "support_conversations"
      SET status = 'OPEN',
          "lastMessageAt" = NOW(),
          "lastReadAtByCustomer" = NOW(),
          "updatedAt" = NOW()
      WHERE id = $1
    `,
    [conversationId],
    [conversationId, 'CUSTOMER', userId, message.trim()],
    clientMessageId
  );
}

export async function addAdminMessage(conversationId: string, adminId: string, message: string, clientMessageId?: string) {
  return addMessageAndRefresh(
    conversationId,
    `
      UPDATE "support_conversations"
      SET status = 'PENDING',
          "assignedAdminId" = $2,
          "lastMessageAt" = NOW(),
          "lastReadAtByAdmin" = NOW(),
          "updatedAt" = NOW()
      WHERE id = $1
    `,
    [conversationId, adminId],
    [conversationId, 'ADMIN', adminId, message.trim()],
    clientMessageId
  );
}

export async function getGuestConversation(conversationId: string, visitorToken: string, options: MessageQueryOptions = {}) {
  return fetchConversationAndMessages(db.prisma as unknown as QueryRunner, 'c.id = $1 AND c."visitorToken" = $2', [
    conversationId,
    visitorToken,
  ], options);
}

export async function getUserConversation(conversationId: string, userId: string, options: MessageQueryOptions = {}) {
  return fetchConversationAndMessages(db.prisma as unknown as QueryRunner, 'c.id = $1 AND c."userId" = $2', [
    conversationId,
    userId,
  ], options);
}

export async function getAdminConversation(conversationId: string, options: MessageQueryOptions = {}) {
  return fetchConversationAndMessages(db.prisma as unknown as QueryRunner, 'c.id = $1', [conversationId], options);
}

export async function listUserConversations(userId: string) {
  return db.prisma.$queryRawUnsafe<ConversationRow[]>(
    `${conversationSelect} WHERE c."userId" = $1 ORDER BY c."lastMessageAt" DESC`,
    userId
  );
}

export async function listAdminConversations(filters: {
  status?: string;
  search?: string;
}) {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters.status && SUPPORT_CONVERSATION_STATUSES.includes(filters.status as SupportConversationStatus)) {
    params.push(filters.status);
    clauses.push(`c.status = $${params.length}::"SupportConversationStatus"`);
  }

  if (filters.search?.trim()) {
    params.push(`%${filters.search.trim()}%`);
    const index = params.length;
    clauses.push(`
      (
        COALESCE(c.subject, '') ILIKE $${index}
        OR COALESCE(c."guestName", '') ILIKE $${index}
        OR COALESCE(c."guestEmail", '') ILIKE $${index}
        OR COALESCE(customer.email, '') ILIKE $${index}
        OR COALESCE(customer.username, '') ILIKE $${index}
        OR EXISTS (
          SELECT 1
          FROM "support_messages" m_search
          WHERE m_search."conversationId" = c.id
            AND m_search.content ILIKE $${index}
        )
      )
    `);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  return db.prisma.$queryRawUnsafe<ConversationRow[]>(
    `${conversationSelect} ${whereSql} ORDER BY c."lastMessageAt" DESC`,
    ...params
  );
}

export async function updateConversationStatus(
  conversationId: string,
  status: SupportConversationStatus
) {
  return db.prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `
        UPDATE "support_conversations"
        SET status = $2::"SupportConversationStatus",
            "lastReadAtByAdmin" = NOW(),
            "updatedAt" = NOW()
        WHERE id = $1
      `,
      conversationId,
      status
    );

    return (await fetchConversationAndMessages(tx as QueryRunner, 'c.id = $1', [conversationId]))!;
  });
}

export async function assignConversation(conversationId: string, adminId: string) {
  return db.prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `
        UPDATE "support_conversations"
        SET "assignedAdminId" = $2,
            "lastReadAtByAdmin" = NOW(),
            "updatedAt" = NOW()
        WHERE id = $1
      `,
      conversationId,
      adminId
    );

    return (await fetchConversationAndMessages(tx as QueryRunner, 'c.id = $1', [conversationId]))!;
  });
}

export async function markConversationReadByAdmin(conversationId: string) {
  return db.prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `
        UPDATE "support_conversations"
        SET "lastReadAtByAdmin" = NOW(),
            "updatedAt" = NOW()
        WHERE id = $1
      `,
      conversationId
    );

    return (await fetchConversationAndMessages(tx as QueryRunner, 'c.id = $1', [conversationId]))!;
  });
}

export async function markConversationReadByCustomer(conversationId: string) {
  return db.prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `
        UPDATE "support_conversations"
        SET "lastReadAtByCustomer" = NOW(),
            "updatedAt" = NOW()
        WHERE id = $1
      `,
      conversationId
    );

    return (await fetchConversationAndMessages(tx as QueryRunner, 'c.id = $1', [conversationId]))!;
  });
}
