import { Prisma } from '@prisma/client'
import { envConfig } from '../../config/env.js'
import { CustomError } from '../utils/customError.js'
import { logger } from '../utils/logger.js'
import multer from 'multer'

// --- Handle 404 Not Found ---
export const notFound = (req, res, next) => {
    const skipStatic = ['/admin/assets', '/admin/media', '.devtools']

    if (
        skipStatic.some(
            (path) =>
                req.originalUrl.startsWith(path) ||
                req.originalUrl.includes(path)
        )
    ) {
        return next()
    }

    // Log 404 errors
    logger.warn(`404 Not Found - ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    })

    next(new CustomError(404, `Not Found - ${req.originalUrl}`))
}

// --- Global Error Handler Middleware ---
export const errorHandler = (err, req, res, next) => {
    try {
        // Default values
        let statusCode = err.statusCode || 500
        let message = err.message || 'Internal server error'
        let errors = err.errors || null

        // Prepare context for logging
        const logContext = {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?.id || 'anonymous',
            errorCode: err.code,
            statusCode,
        }

        // --- Multer Errors ---
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                statusCode = 400
                message = 'File size too large'
            } else {
                statusCode = 400
                message = err.message
            }
            logger.warn(`Multer Error: ${message}`, logContext)
        }

        // --- Prisma: Known Request Errors ---
        else if (err instanceof Prisma.PrismaClientKnownRequestError) {
            switch (err.code) {
                case 'P2002':
                    statusCode = 409
                    message = 'Duplicate field value entered'
                    logger.warn(`Prisma P2002 - Duplicate entry`, {
                        ...logContext,
                        target: err.meta?.target,
                    })
                    break
                case 'P2003':
                    statusCode = 400
                    message = 'Invalid relation: Foreign key constraint failed'
                    logger.warn(`Prisma P2003 - Foreign key constraint`, {
                        ...logContext,
                        fieldName: err.meta?.field_name,
                    })
                    break
                case 'P2001':
                case 'P2025':
                    statusCode = 404
                    message = 'Record not found'
                    logger.warn(`Prisma ${err.code} - Record not found`, {
                        ...logContext,
                        model: err.meta?.modelName,
                    })
                    break
                case 'P2011':
                    statusCode = 400
                    message = 'Missing required field'
                    logger.warn(`Prisma P2011 - Missing required field`, {
                        ...logContext,
                        constraint: err.meta?.constraint,
                    })
                    break
                default:
                    statusCode = 400
                    message = `Database error: ${err.message}`
                    logger.error(`Prisma Error ${err.code}`, {
                        ...logContext,
                        prismaError: err.message,
                        meta: err.meta,
                    })
            }
        }

        // --- Prisma: Validation Errors ---
        else if (err instanceof Prisma.PrismaClientValidationError) {
            statusCode = 400
            const missingFieldMatch = err.message.match(
                /Argument `(.*?)` is missing/
            )
            const field = missingFieldMatch ? missingFieldMatch[1] : null
            message = field
                ? `Invalid or missing field: ${field}`
                : 'Invalid data structure or missing required fields.'

            logger.warn(`Prisma Validation Error: ${message}`, {
                ...logContext,
                field,
            })
        }

        // --- Prisma: Initialization / Connection Errors ---
        else if (err instanceof Prisma.PrismaClientInitializationError) {
            statusCode = 503
            message = 'Database connection failed. Please try again later.'
            logger.error(
                'Prisma Initialization Error - Database connection failed',
                {
                    ...logContext,
                    errorCode: err.errorCode,
                }
            )
        }

        // --- Prisma: Rust Panic ---
        else if (err instanceof Prisma.PrismaClientRustPanicError) {
            statusCode = 500
            message = 'Database engine crashed unexpectedly.'
            logger.error('Prisma Rust Panic - Critical database error', {
                ...logContext,
                error: err.message,
            })
        }

        // --- Prisma: Unknown Request Errors ---
        else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
            statusCode = 500
            message = 'Unknown database error occurred.'
            logger.error('Prisma Unknown Request Error', {
                ...logContext,
                error: err.message,
            })
        }

        // --- Validation Errors ---
        else if (err.name === 'ValidationError' && err.details) {
            errors = err.details.map((e) => ({
                field: e.context?.key || e.path?.[0],
                message: e.message,
            }))
            statusCode = 422
            message = 'Validation error'
            logger.warn('Validation Error', {
                ...logContext,
                validationErrors: errors,
            })
        }

        // --- JWT Authentication Errors ---
        else if (err.name === 'JsonWebTokenError') {
            statusCode = 401
            message = 'Invalid token'
            logger.warn('JWT Error - Invalid token', logContext)
        } else if (err.name === 'TokenExpiredError') {
            statusCode = 401
            message = 'Token expired'
            logger.warn('JWT Error - Token expired', logContext)
        }

        // --- Unhandled Errors (5xx) ---
        else if (statusCode >= 500) {
            logger.error(`Internal Server Error: ${err.message}`, {
                ...logContext,
                stack: err.stack,
            })
        }

        // --- Client Errors (4xx) ---
        else if (statusCode >= 400 && statusCode < 500) {
            logger.warn(`Client Error: ${message}`, logContext)
        }

        // --- Determine if it's an Admin or API route ---
        const isAdmin = req.originalUrl.startsWith('/admin')

        // --- API Response ---
        if (!isAdmin) {
            return res.status(statusCode).json({
                success: false,
                message,
                errors,
                ...(envConfig?.general?.NODE_ENV === 'development' && {
                    stack: err.stack,
                }),
            })
        }

        // --- Admin Dashboard Error Page ---
        const view = statusCode === 404 ? 'admin/error-404' : 'admin/error-500'

        return res.status(statusCode).render(view, {
            title: 'Error',
            message,
            statusCode,
            stack:
                envConfig?.general?.NODE_ENV === 'development'
                    ? err.stack
                    : null,
        })
    } catch (internalError) {
        // Log the error in the error handler itself
        logger.error('Critical Error in errorHandler middleware', {
            originalError: err?.message,
            internalError: internalError.message,
            stack: internalError.stack,
            url: req?.originalUrl,
            method: req?.method,
        })

        return res.status(500).json({
            success: false,
            message: internalError.message || 'Something went wrong',
            ...(envConfig?.general?.NODE_ENV === 'development' && {
                stack: internalError.stack,
            }),
        })
    }
}
