import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export interface CustomError extends Error {
    statusCode?: number
    isOperational?: boolean
}

export const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let { statusCode = 500, message } = err

    // Log error
    logger.error(`Error ${statusCode}: ${message}`, {
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString(),
    })

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400
        message = 'Validation Error'
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401
        message = 'Invalid token'
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401
        message = 'Token expired'
    }

    // Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        statusCode = 400
        message = 'Database operation failed'
    }

    // Don't expose detailed error messages in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Internal server error'
    }

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    })
}

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}

// Create custom error
export const createError = (message: string, statusCode: number = 500): CustomError => {
    const error = new Error(message) as CustomError
    error.statusCode = statusCode
    error.isOperational = true
    return error
}

export default errorHandler