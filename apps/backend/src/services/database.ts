import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

declare global {
    var __prisma: PrismaClient | undefined;
}

class DatabaseService {
    private static instance: DatabaseService;
    public prisma: PrismaClient;

    constructor() {
        // Prevent multiple instances in development
        if (globalThis.__prisma) {
            this.prisma = globalThis.__prisma;
        } else {
            this.prisma = new PrismaClient({
                log: ['query', 'info', 'warn', 'error'],
            });

            globalThis.__prisma = this.prisma;
        }
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    /**
     * Connect to the database
     */
    async connect(): Promise<void> {
        try {
            await this.prisma.$connect();
            logger.info('✅ Connected to database successfully');
        } catch (error) {
            logger.error('❌ Failed to connect to database:', error);
            throw error;
        }
    }

    /**
     * Disconnect from the database
     */
    async disconnect(): Promise<void> {
        try {
            await this.prisma.$disconnect();
            logger.info('✅ Disconnected from database successfully');
        } catch (error) {
            logger.error('❌ Failed to disconnect from database:', error);
            throw error;
        }
    }

    /**
     * Health check for database connection
     */
    async healthCheck(): Promise<boolean> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            logger.error('Database health check failed:', error);
            return false;
        }
    }

    /**
     * Execute raw SQL query
     */
    async executeRaw(query: string, ...params: any[]): Promise<any> {
        try {
            return await this.prisma.$executeRawUnsafe(query, ...params);
        } catch (error) {
            logger.error('Raw query execution failed:', error);
            throw error;
        }
    }

    /**
     * Start a database transaction
     */
    async transaction<T>(fn: (prisma: any) => Promise<T>): Promise<T> {
        return await this.prisma.$transaction(fn);
    }

    /**
     * Reset the database (for testing purposes)
     */
    async reset(): Promise<void> {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Database reset is not allowed in production');
        }

        try {
            // Reset all tables in reverse order of dependencies
            await this.prisma.auditLog.deleteMany();
            await this.prisma.session.deleteMany();
            await this.prisma.notification.deleteMany();
            await this.prisma.payout.deleteMany();
            await this.prisma.transaction.deleteMany();
            await this.prisma.investment.deleteMany();
            await this.prisma.miningOperation.deleteMany();
            await this.prisma.kycDocument.deleteMany();
            await this.prisma.user.deleteMany();
            await this.prisma.systemConfig.deleteMany();

            logger.info('✅ Database reset completed');
        } catch (error) {
            logger.error('❌ Database reset failed:', error);
            throw error;
        }
    }
}

// Export singleton instance
const db = DatabaseService.getInstance();
export default db;
export { DatabaseService };