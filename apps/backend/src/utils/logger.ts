import winston from 'winston'
import { config } from '../config/env'

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
}

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
}

// Add colors to winston
winston.addColors(colors)

// Define log format
const format = winston.format.combine(
    // Add timestamp
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    // Add colors (only for console)
    winston.format.colorize({ all: true }),
    // Define format of message
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
)

// Define transports
const transports = [
    // Console transport
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(
                (info) => `${info.timestamp} ${info.level}: ${info.message}`,
            ),
        ),
    }),
    // File transport for errors
    new winston.transports.File({
        filename: config.errorLogFile,
        level: 'error',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
        ),
    }),
    // File transport for all logs
    new winston.transports.File({
        filename: config.logFile,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
        ),
    }),
]

// Create logger
export const logger = winston.createLogger({
    level: config.logLevel,
    levels,
    format,
    transports,
    // Handle exceptions and rejections
    exceptionHandlers: [
        new winston.transports.File({ filename: './logs/exceptions.log' }),
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: './logs/rejections.log' }),
    ],
})

// Create a stream object for morgan HTTP request logging
export const loggerStream = {
    write: (message: string) => {
        logger.http(message.trim())
    },
}

export default logger