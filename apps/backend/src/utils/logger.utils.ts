import winston from 'winston'
import { config } from '../config'

// Create logs directory if it doesn't exist
const path = require('path')
const fs = require('fs')
const logDir = path.dirname(config.logging.file)

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
)

// Create logger instance
export const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'nexgen-backend' },
    transports: [
        // Write to file
        new winston.transports.File({
            filename: config.logging.file,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),

        // Write errors to separate file
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
})

// Add console transport for development
if (config.nodeEnv !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }))
}

// Create request logger middleware
export const requestLogger = (req: any, res: any, next: any) => {
    const start = Date.now()

    res.on('finish', () => {
        const duration = Date.now() - start
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }

        if (res.statusCode >= 400) {
            logger.error('HTTP Request Error', logData)
        } else {
            logger.info('HTTP Request', logData)
        }
    })

    next()
}