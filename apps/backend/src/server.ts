import 'dotenv/config';
import { createServer } from 'http';
import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import db from './services/database';
import { initializeSupportChatSocketServer } from './realtime/supportChatSocket';

const startServer = async () => {
    console.log('Starting NexGen Backend Server...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Port:', process.env.PORT);
    console.log('Database URL exists:', !!process.env.DATABASE_URL);
    try {
        console.log('Testing database connection...');
        // Test database connection
        const isHealthy = await db.healthCheck();
        if (!isHealthy) {
            throw new Error('Database connection failed');
        }
        console.log('Database connection established');
        logger.info('✅ Database connection established');

        // Create HTTP server
        const httpServer = createServer(app);
        initializeSupportChatSocketServer(httpServer);

        const server = httpServer.listen(config.port, '0.0.0.0', () => {
            console.log(`Server is listening on port ${config.port}`);
            logger.info(`
🚀 NexGen Backend Server Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server: http://0.0.0.0:${config.port}
🌍 Environment: ${config.nodeEnv}
💾 Database: Connected
📱 User App: ${config.userAppUrl}
🔧 Admin App: ${config.adminAppUrl}
🏥 Health Check: http://0.0.0.0:${config.port}/health
📋 API Info: http://0.0.0.0:${config.port}/api
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
        });

        // Handle server errors
        server.on('error', (error) => {
            console.error('Server error:', error);
            logger.error('Server error:', error);
            process.exit(1);
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
