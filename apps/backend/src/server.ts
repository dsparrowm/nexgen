console.log('🚀 Starting server.js...');

// Check if basic Node.js functionality works
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Working directory:', process.cwd());

try {
    console.log('📦 Loading dotenv...');
    require('dotenv').config();
    console.log('✅ Dotenv loaded');
} catch (error) {
    console.error('❌ Failed to load dotenv:', error);
    process.exit(1);
}

let app: any, config: any, logger: any, db: any;
try {
    console.log('📦 Loading app module...');
    app = require('./app').default;
    console.log('✅ App module loaded');
} catch (error) {
    console.error('❌ Failed to load app module:', error);
    console.error('Error stack:', (error as Error)?.stack);
    process.exit(1);
}

try {
    console.log('📦 Loading config module...');
    config = require('./config/env').config;
    console.log('✅ Config module loaded');
} catch (error) {
    console.error('❌ Failed to load config module:', error);
    console.error('Error stack:', (error as Error)?.stack);
    process.exit(1);
}

try {
    console.log('📦 Loading logger module...');
    logger = require('./utils/logger').logger;
    console.log('✅ Logger module loaded');
} catch (error) {
    console.error('❌ Failed to load logger module:', error);
    console.error('Error stack:', (error as Error)?.stack);
    process.exit(1);
}

try {
    console.log('📦 Loading database module...');
    db = require('./services/database').default;
    console.log('✅ Database module loaded');
} catch (error) {
    console.error('❌ Failed to load database module:', error);
    console.error('Error stack:', (error as Error)?.stack);
    process.exit(1);
}

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
        const server = app.listen(config.port, '0.0.0.0', () => {
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
        server.on('error', (error: any) => {
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
console.log('🚀 Calling startServer()...');
startServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});