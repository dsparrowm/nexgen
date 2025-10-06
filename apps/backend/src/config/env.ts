import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

export const config = {
    // Server configuration
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '8000', 10),

    // Database configuration
    databaseUrl: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/nexgen_db',

    // JWT configuration
    userJwtSecret: process.env.USER_JWT_SECRET || 'user_jwt_secret_change_in_production',
    adminJwtSecret: process.env.ADMIN_JWT_SECRET || 'admin_jwt_secret_change_in_production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

    // Frontend URLs
    userAppUrl: process.env.USER_APP_URL || 'http://localhost:3000',
    adminAppUrl: process.env.ADMIN_APP_URL || 'http://localhost:3001',

    // CORS configuration
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://nexgen-user.vercel.app'
    ],

    // Redis configuration
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

    // Email configuration
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
    },
    fromEmail: process.env.FROM_EMAIL || 'noreply@nexgen.investment',
    fromName: process.env.FROM_NAME || 'NexGen Investment Platform',

    // Payment configuration
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    coinbase: {
        apiKey: process.env.COINBASE_API_KEY || '',
        webhookSecret: process.env.COINBASE_WEBHOOK_SECRET || '',
    },

    // File upload configuration
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',

    // Security configuration
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

    // Two-factor authentication
    twoFactorServiceName: process.env.TWO_FACTOR_SERVICE_NAME || 'NexGen Investment',

    // External APIs
    btcNetworkApi: process.env.BTC_NETWORK_DIFFICULTY_API || 'https://api.blockchain.info/stats',
    cryptoPriceApi: process.env.CRYPTO_PRICE_API || 'https://api.coingecko.com/api/v3',
    goldPriceApi: process.env.GOLD_PRICE_API || 'https://api.metals.live/v1/spot/gold',

    // Logging configuration
    logLevel: process.env.LOG_LEVEL || 'info',
    logFile: process.env.LOG_FILE || './logs/app.log',
    errorLogFile: process.env.ERROR_LOG_FILE || './logs/error.log',

    // Health check
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '300000', 10), // 5 minutes
}

// Validate required environment variables
const requiredEnvVars = [
    'DATABASE_URL',
    'USER_JWT_SECRET',
    'ADMIN_JWT_SECRET',
]

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '))
    console.error('Please check your .env file')
    process.exit(1)
}

export default config