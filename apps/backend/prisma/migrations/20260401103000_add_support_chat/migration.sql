CREATE TYPE "SupportConversationStatus" AS ENUM ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED');
CREATE TYPE "SupportConversationSource" AS ENUM ('LANDING_PAGE', 'DASHBOARD', 'ADMIN');
CREATE TYPE "SupportConversationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "SupportSenderType" AS ENUM ('VISITOR', 'CUSTOMER', 'ADMIN', 'SYSTEM');

CREATE TABLE "support_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "assignedAdminId" TEXT,
    "visitorToken" TEXT,
    "subject" TEXT,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "status" "SupportConversationStatus" NOT NULL DEFAULT 'OPEN',
    "source" "SupportConversationSource" NOT NULL DEFAULT 'LANDING_PAGE',
    "priority" "SupportConversationPriority" NOT NULL DEFAULT 'NORMAL',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAtByCustomer" TIMESTAMP(3),
    "lastReadAtByAdmin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderType" "SupportSenderType" NOT NULL,
    "senderUserId" TEXT,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "support_conversations_visitorToken_key" ON "support_conversations"("visitorToken");
CREATE INDEX "support_conversations_userId_status_idx" ON "support_conversations"("userId", "status");
CREATE INDEX "support_conversations_assignedAdminId_status_idx" ON "support_conversations"("assignedAdminId", "status");
CREATE INDEX "support_conversations_guestEmail_idx" ON "support_conversations"("guestEmail");
CREATE INDEX "support_conversations_lastMessageAt_idx" ON "support_conversations"("lastMessageAt");
CREATE INDEX "support_messages_conversationId_createdAt_idx" ON "support_messages"("conversationId", "createdAt");
CREATE INDEX "support_messages_senderUserId_idx" ON "support_messages"("senderUserId");

ALTER TABLE "support_conversations"
    ADD CONSTRAINT "support_conversations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "support_conversations"
    ADD CONSTRAINT "support_conversations_assignedAdminId_fkey"
    FOREIGN KEY ("assignedAdminId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "support_messages"
    ADD CONSTRAINT "support_messages_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "support_conversations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_messages"
    ADD CONSTRAINT "support_messages_senderUserId_fkey"
    FOREIGN KEY ("senderUserId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
