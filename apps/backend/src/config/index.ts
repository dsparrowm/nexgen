import dotenv from 'dotenv'

dotenv.config()

export const config = {
    // Server Configuration
    port: process.env.PORT || 8000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database Configuration
    database: {
        url: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/nexgen_db'
    },

    // JWT Configuration
    jwt: {
        userSecret: process.env.USER_JWT_SECRET || 'user_secret_fallback',
        adminSecret: process.env.ADMIN_JWT_SECRET || 'admin_secret_fallback',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
    },

    // App URLs
    apps: {
        userUrl: process.env.USER_APP_URL || 'http://localhost:3000',
        adminUrl: process.env.ADMIN_APP_URL || 'http://localhost:3001',
        backendUrl: process.env.BACKEND_URL || 'http://localhost:8000'
    },

    // CORS Configuration
    cors: {
        origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001']
    },

    // Redis Configuration
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    },

    // Email Configuration
    email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.FROM_EMAIL || 'noreply@nexgen.investment'
    },

    // Payment Gateways
    payments: {
        stripe: {
            secretKey: process.env.STRIPE_SECRET_KEY || '',
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
        },
        coinbase: {
            apiKey: process.env.COINBASE_API_KEY || '',
            webhookSecret: process.env.COINBASE_WEBHOOK_SECRET || ''
        }
    },

    // File Upload Configuration
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
        uploadPath: process.env.UPLOAD_PATH || './uploads'
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
    },

    // Mining API Configuration
    mining: {
        apiUrl: process.env.MINING_API_URL || 'https://api.mining-provider.com',
        apiKey: process.env.MINING_API_KEY || ''
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || './logs/app.log'
    }
}