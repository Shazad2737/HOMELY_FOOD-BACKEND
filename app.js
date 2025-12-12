import express from 'express'
import cors from 'cors'
import { format } from 'date-fns'

import { envConfig } from './config/env.js'
import {
    notFound,
    errorHandler,
} from './src/middlewares/errorHandler.middleware.js'
import { checkDBHealth } from './config/database.js'
import configureNunjucks from './config/nunjucks.js'
import adminRoutes from './src/routes/admin/index.js'
import apiRoutes from './src/routes/api/index.js'
import sessionConfig from './config/session.js'
import helmetConfig from './config/helmet.js'
import { initializeCronJobs } from './jobs/scheduler.js'
import httpLogger from './src/middlewares/httpLogger.middleware.js'

const app = express()

app.use(httpLogger)

// Middleware
app.use(helmetConfig)
app.use(cors({ origin: envConfig.general.CLIENT_URL, credentials: true }))
// app.use(
//   morgan(envConfig.general.NODE_ENV === "production" ? "combined" : "dev")
// );
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

// Initialize cron jobs
initializeCronJobs()

// Configure session storage
app.use(sessionConfig())

// Configure Nunjucks
configureNunjucks(app)

app.set('view engine', 'njk')

// Routes
app.use('/admin', adminRoutes)
app.use('/api/v1', apiRoutes)

// Health
app.get('/health', async (req, res) => {
    const prismaHealth = await checkDBHealth()
    res.status(200).json({
        Health: 'OK',
        'App Key': envConfig.general.APP_KEY,
        Timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        TimeNow: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        'Database Health': prismaHealth,
    })
})

// Error handling
app.use(notFound) // 404 handler
app.use(errorHandler) // Global error handler

export default app
