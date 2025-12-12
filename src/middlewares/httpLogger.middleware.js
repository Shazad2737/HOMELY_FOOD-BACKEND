import morgan from 'morgan'
import { morganStream } from '../utils/logger.js'
import { envConfig } from '../../config/env.js'

const isProduction = envConfig?.general?.NODE_ENV === 'production'
const isStaging = envConfig?.general?.NODE_ENV === 'staging'

// Custom token: response time with indicators (for file logs)
morgan.token('response-time-ms', (req, res) => {
    const rt = parseFloat(morgan['response-time'](req, res))
    return `${rt}ms`
})

// Formats - simplified for file logging
const developmentFormat = ':method :url :status :response-time-ms - :user-agent'

const stagingFormat =
    ':method :url :status :response-time-ms :res[content-length]'

const productionFormat =
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'

// Format selector
const getFormat = () => {
    if (isProduction) return productionFormat
    if (isStaging) return stagingFormat
    return developmentFormat
}

// Morgan middleware - ALWAYS LOGS TO FILE
export const httpLogger = morgan(getFormat(), {
    stream: morganStream, // Always writes to file via winston http level
    skip: (req, res) => {
        // Skip health checks
        if (req.url.startsWith('/health')) return true

        // Skip static assets (CSS, JS, images, fonts, etc.)
        if (
            req.url.match(
                /\.(css|js|map|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i
            )
        ) {
            return true
        }

        // Skip common static paths
        if (
            req.url.startsWith('/admin/assets') ||
            req.url.startsWith('/admin/media') ||
            req.url.startsWith('/admin/common') ||
            req.url.startsWith('/admin/custom') ||
            req.url.includes('.devtools')
        ) {
            return true
        }

        // Skip log viewer's own API calls to prevent recursive logging
        if (req.url.startsWith('/admin/logs/server/json')) {
            return true
        }

        return false
    },
})

export default httpLogger
