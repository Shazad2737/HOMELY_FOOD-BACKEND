import { createLogger, format, transports } from 'winston'
import 'winston-daily-rotate-file'
import { envConfig } from '../../config/env.js'

const { combine, timestamp, colorize, errors, json, printf } = format

const isProduction = envConfig?.general?.NODE_ENV === 'production'
const isStaging = envConfig?.general?.NODE_ENV === 'staging'

// Toggle console logs only
const consoleLogsEnabled = envConfig?.logging?.enableConsoleLogs ?? true

// Console output formatting
const consoleFormat = printf(
    ({ level, message, timestamp, stack, ...meta }) => {
        const metaStr = Object.keys(meta).length
            ? `\n${JSON.stringify(meta, null, 2)}`
            : ''
        return `${timestamp} [${level}]: ${stack || message}${metaStr}`
    }
)

// Custom format to filter out HTTP logs from console in staging/production
const consoleFilter = format((info) => {
    if (isStaging || isProduction) {
        // Skip HTTP level logs - they clutter the console
        if (info.level === 'http') {
            return false
        }
    }
    return info
})

const logTransports = []

// Console Transport - excludes HTTP logs in staging/production
if (consoleLogsEnabled) {
    logTransports.push(
        new transports.Console({
            level: isProduction ? 'warn' : 'debug',
            format: combine(
                consoleFilter(),
                colorize(),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                errors({ stack: true }),
                consoleFormat
            ),
        })
    )
}

// File Transports - ALWAYS ENABLED
if (isProduction || isStaging) {
    // Daily error log
    logTransports.push(
        new transports.DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '30d',
            format: combine(
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                errors({ stack: true }),
                json()
            ),
        })
    )

    // Daily combined log (all levels)
    logTransports.push(
        new transports.DailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: isProduction ? '14d' : '7d',
            format: combine(
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                errors({ stack: true }),
                json()
            ),
        })
    )

    // HTTP log - separate file for HTTP requests only
    logTransports.push(
        new transports.DailyRotateFile({
            filename: 'logs/http-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'http',
            maxSize: '20m',
            maxFiles: '7d',
            format: combine(
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                json()
            ),
        })
    )
} else {
    // Development simple logs
    logTransports.push(
        new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: combine(
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                errors({ stack: true }),
                json()
            ),
        })
    )

    logTransports.push(
        new transports.File({
            filename: 'logs/combined.log',
            format: combine(
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                errors({ stack: true }),
                json()
            ),
        })
    )

    // Note: HTTP logs disabled in development to reduce noise
    // They are only enabled in staging/production environments
}

// Create logger
export const logger = createLogger({
    level: isProduction ? 'info' : 'debug',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true })
    ),
    transports: logTransports,
    exitOnError: false,

    // Exception handlers - ALWAYS ENABLED
    exceptionHandlers: [
        new transports.File({
            filename: 'logs/exceptions.log',
            format: combine(
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                errors({ stack: true }),
                json()
            ),
        }),
    ],

    // Rejection handlers - ALWAYS ENABLED
    rejectionHandlers: [
        new transports.File({
            filename: 'logs/rejections.log',
            format: combine(
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                errors({ stack: true }),
                json()
            ),
        }),
    ],
})

// Morgan stream for HTTP logging - ALWAYS WRITES TO FILE
export const morganStream = {
    write: (message) => {
        logger.http(message.trim())
    },
}

export default logger
