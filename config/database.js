// import { PrismaClient } from '@prisma/client'
// import { logger } from '../src/utils/logger.js'
// import { envConfig } from '../config/env.js'

// const isProduction = envConfig?.general?.NODE_ENV === 'production'
// const isDevelopment = envConfig?.general?.NODE_ENV === 'development'
// const isStaging = envConfig?.general?.NODE_ENV === 'staging'

// // Toggle DB logging - default false (opt-in)
// const isDbLoggingEnabled = envConfig?.logging?.enableDatabaseLogs ?? false

// // Configure Prisma logging
// const getPrismaLogConfig = () => {
//     if (!isDbLoggingEnabled) return []

//     if (isProduction) {
//         return [
//             { emit: 'event', level: 'error' },
//             { emit: 'event', level: 'warn' },
//         ]
//     }

//     if (isStaging) {
//         return [
//             { emit: 'event', level: 'error' },
//             { emit: 'event', level: 'warn' },
//             { emit: 'event', level: 'info' },
//         ]
//     }

//     return [
//         { emit: 'event', level: 'query' },
//         { emit: 'event', level: 'error' },
//         { emit: 'event', level: 'info' },
//         { emit: 'event', level: 'warn' },
//     ]
// }

// // Prisma client
// const prisma = new PrismaClient({
//     log: getPrismaLogConfig(),
//     errorFormat: isProduction ? 'minimal' : 'colorless',
// })

// // Query logging (development + staging)
// if ((isDevelopment || isStaging) && isDbLoggingEnabled) {
//     prisma.$on('query', (e) => {
//         if (e.duration > 1000) {
//             logger.warn('Slow DB query detected', {
//                 query: e.query,
//                 duration: `${e.duration}ms`,
//                 params: e.params,
//             })
//         } else if (isDevelopment) {
//             logger.debug('DB query executed', {
//                 query: e.query,
//                 duration: `${e.duration}ms`,
//             })
//         }
//     })
// }

// // Info (dev + staging)
// if ((isDevelopment || isStaging) && isDbLoggingEnabled) {
//     prisma.$on('info', (e) => {
//         logger.info('Prisma info', e)
//     })
// }

// // Warn + Error (always when enabled)
// if (isDbLoggingEnabled) {
//     prisma.$on('warn', (e) => logger.warn('Prisma warning', e))
//     prisma.$on('error', (e) => logger.error('Prisma error', e))
// }

// // Connect
// async function connectDB() {
//     try {
//         await prisma.$connect()
//         logger.info('✅ Database connected successfully')
//         await prisma.$queryRaw`SELECT 1`
//         logger.info('✅ Database health check passed')
//     } catch (error) {
//         logger.error('❌ Database connection failed', error)
//         process.exit(1)
//     }
// }

// // Disconnect
// async function disconnectDB() {
//     try {
//         await prisma.$disconnect()
//         logger.info('🔌 Database disconnected')
//     } catch (error) {
//         logger.error('❌ Error disconnecting from database', error)
//     }
// }

// // Health check
// async function checkDBHealth() {
//     try {
//         const start = Date.now()
//         await prisma.$queryRaw`SELECT 1`
//         const ms = Date.now() - start

//         return { status: 'healthy', responseTime: `${ms}ms` }
//     } catch (error) {
//         logger.error('Database health check failed', error)
//         return { status: 'unhealthy', error: error.message }
//     }
// }

// // Query metrics
// let queryCount = 0
// let slowQueryCount = 0

// if ((isDevelopment || isStaging) && isDbLoggingEnabled) {
//     prisma.$on('query', (e) => {
//         queryCount++
//         if (e.duration > 1000) slowQueryCount++
//     })
// }

// function getQueryStats() {
//     if (!isDbLoggingEnabled) return { message: 'DB logging disabled' }
//     return {
//         totalQueries: queryCount,
//         slowQueries: slowQueryCount,
//         slowPercent: queryCount
//             ? ((slowQueryCount / queryCount) * 100).toFixed(2) + '%'
//             : '0%',
//     }
// }

// function resetQueryStats() {
//     queryCount = 0
//     slowQueryCount = 0
//     logger.info('Query statistics reset')
// }

// export {
//     prisma,
//     connectDB,
//     disconnectDB,
//     checkDBHealth,
//     getQueryStats,
//     resetQueryStats,
// }
// TODO: For testing pupose production crashes

import { PrismaClient } from '@prisma/client'
import { logger } from '../src/utils/logger.js'
import { envConfig } from '../config/env.js'

const NODE_ENV = envConfig?.general?.NODE_ENV || 'unknown'
const isDbLoggingEnabled = envConfig?.logging?.enableDatabaseLogs ?? true

const prisma = new PrismaClient({
    log: isDbLoggingEnabled
        ? [
              { emit: 'event', level: 'error' },
              { emit: 'event', level: 'warn' },
          ]
        : [],
    errorFormat: 'pretty',
})

// Log Prisma internal warnings & errors
if (isDbLoggingEnabled) {
    prisma.$on('warn', (e) => logger.warn('⚠️ Prisma warning', e))
    prisma.$on('error', (e) => logger.error('💥 Prisma error', e))
}

async function connectDB() {
    logger.info('⏳ Connecting to database...', {
        NODE_ENV,
        DATABASE_HOST: (() => {
            try {
                return new URL(process.env.DATABASE_URL)
            } catch {
                return 'INVALID DATABASE_URL'
            }
        })(),
    })

    try {
        await prisma.$connect()
        await prisma.$queryRaw`SELECT 1`
        logger.info('✅ Database connected successfully')
    } catch (error) {
        logger.error('❌ Database connection failed', {
            message: error.message,
            stack: error.stack,
            DATABASE_URL: process.env.DATABASE_URL,
        })

        // Important: fail fast so container restarts
        process.exit(1)
    }
}

// // Health check
async function checkDBHealth() {
    try {
        const start = Date.now()
        await prisma.$queryRaw`SELECT 1`
        const ms = Date.now() - start

        return { status: 'healthy', responseTime: `${ms}ms` }
    } catch (error) {
        logger.error('Database health check failed', error)
        return { status: 'unhealthy', error: error.message }
    }
}

async function disconnectDB() {
    try {
        await prisma.$disconnect()
        logger.info('🔌 Database connection closed')
    } catch (error) {
        logger.error('❌ Failed to disconnect database', {
            message: error.message,
            stack: error.stack,
        })
    }
}

export { prisma, connectDB, checkDBHealth, disconnectDB }
