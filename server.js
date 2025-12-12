// import http from 'http'
// import app from './app.js'
// import { connectDB, disconnectDB } from './config/database.js'
// import { envConfig } from './config/env.js'
// import { logger } from './src/utils/logger.js'

// const PORT = envConfig.general.PORT
// const NODE_ENV = envConfig.general.NODE_ENV

// const startServer = async () => {
//     try {
//         // Connect to database
//         await connectDB()

//         // Create HTTP server
//         const server = http.createServer(app)

//         // Start listening
//         server.listen(PORT, () => {
//             logger.info(
//                 `✅ Server started: http://localhost:${PORT} (${NODE_ENV})`
//             )
//         })

//         // Handle server errors
//         server.on('error', (error) => {
//             if (error.code === 'EADDRINUSE') {
//                 logger.error(`❌ Port ${PORT} is already in use`, {
//                     port: PORT,
//                     error: error.message,
//                 })
//             } else {
//                 logger.error('❌ Server error occurred', {
//                     error: error.message,
//                     stack: error.stack,
//                 })
//             }
//             process.exit(1)
//         })

//         // Graceful shutdown handler
//         const shutdown = async (signal) => {
//             logger.info(
//                 `🛑 ${signal} received. Initiating graceful shutdown...`,
//                 {
//                     signal,
//                     uptime: process.uptime(),
//                 }
//             )

//             // Stop accepting new connections
//             server.close(async () => {
//                 logger.info('Server stopped accepting new connections')

//                 try {
//                     // Disconnect from database
//                     await disconnectDB()

//                     logger.info('✅ Server closed gracefully', {
//                         signal,
//                         totalUptime: process.uptime(),
//                     })

//                     process.exit(0)
//                 } catch (error) {
//                     logger.error('❌ Error during graceful shutdown', {
//                         error: error.message,
//                         stack: error.stack,
//                     })
//                     process.exit(1)
//                 }
//             })

//             // Force shutdown after 30 seconds
//             setTimeout(() => {
//                 logger.error('⚠️ Forced shutdown after timeout', {
//                     signal,
//                     timeout: '30s',
//                 })
//                 process.exit(1)
//             }, 30000)
//         }

//         // Register shutdown handlers
//         process.on('SIGINT', () => shutdown('SIGINT'))
//         process.on('SIGTERM', () => shutdown('SIGTERM'))

//         // Handle uncaught exceptions
//         process.on('uncaughtException', (error) => {
//             logger.error('💥 Uncaught Exception detected', {
//                 error: error.message,
//                 stack: error.stack,
//             })
//             shutdown('UNCAUGHT_EXCEPTION')
//         })

//         // Handle unhandled promise rejections
//         process.on('unhandledRejection', (reason, promise) => {
//             logger.error('💥 Unhandled Promise Rejection detected', {
//                 reason: reason,
//                 promise: promise,
//             })
//             shutdown('UNHANDLED_REJECTION')
//         })
//     } catch (err) {
//         logger.error('❌ Failed to start server', {
//             error: err.message,
//             stack: err.stack,
//         })
//         process.exit(1)
//     }
// }

// startServer()

// TODO: For checking purpose production server
import http from 'http'
import app from './app.js'
import { connectDB, disconnectDB } from './config/database.js'
import { envConfig } from './config/env.js'
import { logger } from './src/utils/logger.js'

// =============== GLOBAL CRASH HANDLERS ===============
process.on('uncaughtException', (error) => {
    logger.error('💥 Uncaught Exception', {
        message: error.message,
        stack: error.stack,
    })
    process.exit(1)
})

process.on('unhandledRejection', (reason) => {
    logger.error('💥 Unhandled Promise Rejection', {
        reason,
    })
    process.exit(1)
})

process.on('exit', (code) => {
    logger.warn(
        `🚪 Process exiting (code ${code}). If code = 137 → Out of Memory.`
    )
})
// ======================================================

const PORT = envConfig.general.PORT
const NODE_ENV = envConfig.general.NODE_ENV

// Startup Env Summary
logger.info('🚀 Application Booting...', {
    NODE_ENV,
    PORT,
    DATABASE_HOST: (() => {
        try {
            return new URL(process.env.DATABASE_URL).hostname
        } catch {
            return 'INVALID DATABASE_URL'
        }
    })(),
    REDIS_HOST: (() => {
        try {
            return new URL(process.env.REDIS_URL).hostname
        } catch {
            return 'NO REDIS CONFIGURED'
        }
    })(),
    VERSION: envConfig.general.APP_VERSION || 'unknown',
})

const startServer = async () => {
    try {
        console.log('process.env.DATABASE_URL', process.env.DATABASE_URL)
        // Connect Database
        await connectDB()

        // Create HTTP Server
        const server = http.createServer(app)

        server.listen(PORT, () => {
            logger.info(
                `✅ Server running at http://localhost:${PORT} (${NODE_ENV})`
            )
        })

        // Server Error Handling
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`❌ Port ${PORT} already in use`, { port: PORT })
            } else {
                logger.error('❌ Server Error', {
                    message: error.message,
                    stack: error.stack,
                })
            }
            process.exit(1)
        })

        // Graceful Shutdown
        const shutdown = async (signal) => {
            logger.warn(`🛑 ${signal} received → Graceful Shutdown Starting`, {
                uptime: `${process.uptime().toFixed(2)}s`,
            })

            server.close(async () => {
                logger.info('⏹️ HTTP Server closed, stopping DB connection...')

                try {
                    await disconnectDB()
                    logger.info('✅ Shutdown completed successfully')
                    process.exit(0)
                } catch (error) {
                    logger.error('❌ Shutdown Error', {
                        message: error.message,
                        stack: error.stack,
                    })
                    process.exit(1)
                }
            })

            // Force Exit if stuck
            setTimeout(() => {
                logger.error('⚠️ Force exiting after 30s timeout')
                process.exit(1)
            }, 30000)
        }

        // Shutdown Triggers
        process.on('SIGINT', () => shutdown('SIGINT'))
        process.on('SIGTERM', () => shutdown('SIGTERM'))
    } catch (err) {
        logger.error('❌ Failed to start server', {
            message: err.message,
            stack: err.stack,
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
        })
        process.exit(1)
    }
}

startServer()
