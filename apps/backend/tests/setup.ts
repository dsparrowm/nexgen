// Mock the database
jest.mock('@/services/database', () => ({
    default: {
        prisma: {
            user: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            investment: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                count: jest.fn(),
            },
            transaction: {
                findMany: jest.fn(),
                create: jest.fn(),
                count: jest.fn(),
            },
            notification: {
                findMany: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                count: jest.fn(),
            },
        },
    },
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

// Mock JWT utilities
jest.mock('@/utils/jwt', () => ({
    generateTokenPair: jest.fn(() => ({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
    })),
    verifyToken: jest.fn(() => ({
        userId: 'mock-user-id',
        email: 'test@example.com',
        role: 'USER',
        type: 'user',
    })),
    extractTokenFromHeader: jest.fn(() => 'mock-token'),
}));

// Mock password utilities
jest.mock('@/utils/password', () => ({
    hashPassword: jest.fn(() => 'hashed-password'),
    verifyPassword: jest.fn(() => true),
}));