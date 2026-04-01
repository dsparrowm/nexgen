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

const conversationSelect = `
  SELECT
    c.id,
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

async function fetchMessages(runner: QueryRunner, conversationId: string) {
  return runner.$queryRawUnsafe<MessageRow[]>(
    `
      SELECT
        m.id,
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
      WHERE m."conversationId" = $1
      ORDER BY m."createdAt" ASC
    `,
    conversationId
  );
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

export function serializeMessages(conversation: ConversationRow, rows: MessageRow[]) {
  const customer = getCustomerFromRow(conversation);

  return rows.map((message: MessageRow) => ({
    id: message.id,
    conversationId: message.conversationId,
    content: message.content,
    message: message.content,
    senderType: message.senderType,
    isInternal: message.isInternal,
    createdAt: message.createdAt,
    senderName: messageSenderLabel(message, customer),
    senderEmail: message.senderEmail || customer.displayEmail || null,
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
  params: unknown[]
) {
  const conversation = await fetchConversationByWhere(runner, whereClause, params);
  if (!conversation) {
    return null;
  }

  const messages = await fetchMessages(runner, conversation.id);
  return { conversation, messages };
}

export async function createGuestConversation(input: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  const visitorToken = nanoid(32);

  return db.prisma.$transaction(async (tx) => {
    const inserted = await tx.$queryRawUnsafe<Array<{ id: string }>>(
      `
        INSERT INTO "support_conversations" (
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
        VALUES ($1, $2, $3, $4, $5, 'OPEN', 'LANDING_PAGE', 'NORMAL', NOW(), NOW(), NOW())
        RETURNING id
      `,
      input.name.trim(),
      input.email.trim().toLowerCase(),
      input.phone?.trim() || null,
      input.subject?.trim() || 'Website support request',
      visitorToken
    );

    const conversationId = inserted[0]?.id;
    await tx.$executeRawUnsafe(
      `
        INSERT INTO "support_messages" (
          "conversationId",
          "senderType",
          content,
          "isInternal",
          "createdAt"
        )
        VALUES ($1, 'VISITOR', $2, FALSE, NOW())
      `,
      conversationId,
      input.message.trim()
    );

    const result = await fetchConversationAndMessages(tx as QueryRunner, 'c.id = $1', [conversationId]);

    return {
      conversation: result!.conversation,
      messages: result!.messages,
      visitorToken,
    };
  });
}

export async function createUserConversation(input: {
  userId: string;
  subject?: string;
  message: string;
}) {
  return db.prisma.$transaction(async (tx) => {
    const inserted = await tx.$queryRawUnsafe<Array<{ id: string }>>(
      `
        INSERT INTO "support_conversations" (
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
        VALUES ($1, $2, 'OPEN', 'DASHBOARD', 'NORMAL', NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `,
      input.userId,
      input.subject?.trim() || 'Customer support request'
    );

    const conversationId = inserted[0]?.id;
    await tx.$executeRawUnsafe(
      `
        INSERT INTO "support_messages" (
          "conversationId",
          "senderType",
          "senderUserId",
          content,
          "isInternal",
          "createdAt"
        )
        VALUES ($1, 'CUSTOMER', $2, $3, FALSE, NOW())
      `,
      conversationId,
      input.userId,
      input.message.trim()
    );

    const result = await fetchConversationAndMessages(tx as QueryRunner, 'c.id = $1', [conversationId]);
    return result!;
  });
}

async function addMessageAndRefresh(
  conversationId: string,
  updateSql: string,
  updateParams: unknown[],
  insertParams: unknown[]
) {
  return db.prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(updateSql, ...updateParams);
    await tx.$executeRawUnsafe(
      `
        INSERT INTO "support_messages" (
          "conversationId",
          "senderType",
          "senderUserId",
          content,
          "isInternal",
          "createdAt"
        )
        VALUES ($1, $2, $3, $4, FALSE, NOW())
      `,
      ...insertParams
    );

    const result = await fetchConversationAndMessages(tx as QueryRunner, 'c.id = $1', [conversationId]);
    return result!;
  });
}

export async function addGuestMessage(conversationId: string, visitorToken: string, message: string) {
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
    [conversationId, 'VISITOR', null, message.trim()]
  );
}

export async function addUserMessage(conversationId: string, userId: string, message: string) {
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
    [conversationId, 'CUSTOMER', userId, message.trim()]
  );
}

export async function addAdminMessage(conversationId: string, adminId: string, message: string) {
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
    [conversationId, 'ADMIN', adminId, message.trim()]
  );
}

export async function getGuestConversation(conversationId: string, visitorToken: string) {
  return fetchConversationAndMessages(db.prisma as unknown as QueryRunner, 'c.id = $1 AND c."visitorToken" = $2', [
    conversationId,
    visitorToken,
  ]);
}

export async function getUserConversation(conversationId: string, userId: string) {
  return fetchConversationAndMessages(db.prisma as unknown as QueryRunner, 'c.id = $1 AND c."userId" = $2', [
    conversationId,
    userId,
  ]);
}

export async function getAdminConversation(conversationId: string) {
  return fetchConversationAndMessages(db.prisma as unknown as QueryRunner, 'c.id = $1', [conversationId]);
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
    clauses.push(`c.status = $${params.length}`);
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
        SET status = $2,
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
