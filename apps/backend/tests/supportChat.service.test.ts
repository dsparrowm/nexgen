jest.mock('nanoid', () => ({
    nanoid: jest.fn(() => 'mock-id'),
}));

jest.mock('@/services/database', () => ({
    __esModule: true,
    default: {
        prisma: {},
    },
}));

import { serializeMessages } from '../src/services/supportChat.service';

describe('support chat serialization', () => {
    const conversation = {
        id: 'conversation-1',
        userId: 'user-1',
        assignedAdminId: null,
        visitorToken: null,
        subject: 'Need help',
        guestName: null,
        guestEmail: null,
        guestPhone: null,
        status: 'OPEN',
        source: 'DASHBOARD',
        priority: 'NORMAL',
        lastMessageAt: new Date(),
        lastReadAtByCustomer: null,
        lastReadAtByAdmin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customerId: 'user-1',
        customerEmail: 'customer@example.com',
        customerUsername: 'customer',
        customerFirstName: 'Customer',
        customerLastName: 'User',
        customerRole: 'USER',
        assignedAdminEmail: null,
        assignedAdminUsername: null,
        assignedAdminFirstName: null,
        assignedAdminLastName: null,
        assignedAdminRole: null,
        lastMessage: 'Latest message',
        lastMessageSenderType: 'CUSTOMER',
        lastMessageCreatedAt: new Date(),
        messageCount: 2,
    } as const;

    const messages = [
        {
            id: 'message-1',
            clientMessageId: 'client-123',
            conversationId: 'conversation-1',
            senderType: 'CUSTOMER',
            senderUserId: 'user-1',
            content: 'Public reply',
            isInternal: false,
            createdAt: new Date('2026-04-03T10:00:00.000Z'),
            senderId: 'user-1',
            senderEmail: 'customer@example.com',
            senderUsername: 'customer',
            senderFirstName: 'Customer',
            senderLastName: 'User',
            senderRole: 'USER',
        },
        {
            id: 'message-2',
            conversationId: 'conversation-1',
            senderType: 'ADMIN',
            senderUserId: 'admin-1',
            content: 'Internal note',
            isInternal: true,
            createdAt: new Date('2026-04-03T10:01:00.000Z'),
            senderId: 'admin-1',
            senderEmail: 'agent@example.com',
            senderUsername: 'agent',
            senderFirstName: 'Support',
            senderLastName: 'Agent',
            senderRole: 'ADMIN',
        },
    ] as const;

    it('includes internal messages for admin views by default', () => {
        const serialized = serializeMessages(conversation as any, messages as any);

        expect(serialized).toHaveLength(2);
        expect(serialized[1].content).toBe('Internal note');
        expect(serialized[1].isInternal).toBe(true);
    });

    it('filters internal messages for participant views', () => {
        const serialized = serializeMessages(conversation as any, messages as any, { includeInternal: false });

        expect(serialized).toHaveLength(1);
        expect(serialized[0].content).toBe('Public reply');
        expect(serialized[0].isInternal).toBe(false);
    });

    it('preserves client message ids on serialized messages', () => {
        const serialized = serializeMessages(conversation as any, messages as any);

        expect(serialized[0].clientMessageId).toBe('client-123');
        expect(serialized[1].clientMessageId).toBeUndefined();
    });
});