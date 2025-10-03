import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { config } from './config/env'
import logger from './utils/logger'
import { errorHandler } from './middlewares/error.middleware'
import { notFound } from './middlewares/notFound'

// Import routes
import userAuthRoutes from './routes/auth/user-auth.routes'
import adminAuthRoutes from './routes/auth/admin-auth.routes'
import userRoutes from './routes/user'
import adminRoutes from './routes/admin'
import publicRoutes from './routes/public'

const app = express()

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}))

// CORS configuration
app.use(cors({
    origin: config.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Compression middleware
app.use(compression())

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    message: {
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
})
app.use(limiter)

// Request logging middleware
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'))
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message: string) => logger.info(message.trim())
        }
    }))
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
        version: process.env.npm_package_version || '1.0.0',
    })
})

// API routes
app.use('/api/auth/user', userAuthRoutes)
app.use('/api/auth/admin', adminAuthRoutes)
app.use('/api/user', userRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/public', publicRoutes)

// API info endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        message: 'NexGen Mining API',
        version: process.env.API_VERSION || '1.0.0',
        documentation: '/api/docs',
        endpoints: {
            user: {
                auth: '/api/auth/user',
                dashboard: '/api/user/dashboard',
                mining: '/api/user/mining',
                investments: '/api/user/investments',
                transactions: '/api/user/transactions',
            },
            admin: {
                auth: '/api/auth/admin',
                dashboard: '/api/admin/dashboard',
                users: '/api/admin/users',
                credits: '/api/admin/credits',
                settings: '/api/admin/settings',
            }
        }
    })
})

// Welcome endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'NexGen Investment Platform API',
        version: process.env.API_VERSION || '1.0.0',
        documentation: '/api/docs',
        health: '/health',
    })
})

// 404 handler
app.use('*', notFound)

// Global error handler
app.use(errorHandler)

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully')
    process.exit(0)
})

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully')
    process.exit(0)
})

export default app