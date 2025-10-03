import 'dotenv/config';
import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import db from './services/database';

const startServer = async () => {
    try {
        // Test database connection
        const isHealthy = await db.healthCheck();
        if (!isHealthy) {
            throw new Error('Database connection failed');
        }
        logger.info('✅ Database connection established');

        // Create HTTP server
        const server = app.listen(config.port, () => {
            logger.info(`
🚀 NexGen Backend Server Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server: http://localhost:${config.port}
🌍 Environment: ${config.nodeEnv}
💾 Database: Connected
📱 User App: ${config.userAppUrl}
🔧 Admin App: ${config.adminAppUrl}
🏥 Health Check: http://localhost:${config.port}/health
📋 API Info: http://localhost:${config.port}/api
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
        });

        // Graceful shutdown handlers
        const gracefulShutdown = async (signal: string) => {
            logger.info(`${signal} received, shutting down gracefully`);
            try {
                server.close(async () => {
                    await db.disconnect();
                    logger.info('Database disconnected');
                    process.exit(0);
                });
            } catch (error) {
                logger.error('Error during shutdown:', error);
                process.exit(1);
            }
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err: Error) => {
            logger.error('Unhandled Promise Rejection:', err);
            server.close(() => {
                process.exit(1);
            });
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (err: Error) => {
            logger.error('Uncaught Exception:', err);
            process.exit(1);
        });

        return server;

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();