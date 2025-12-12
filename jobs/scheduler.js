import cron from 'node-cron'
import { updateSubscriptionStatus } from './updateSubscriptionStatus.js'
import { envConfig } from '../config/env.js'
import logger from '../src/utils/logger.js'

export function initializeCronJobs() {
    cron.schedule(
        '0 0 * * *',
        async () => {
            logger.info('Running scheduled subscription status update...')
            try {
                await updateSubscriptionStatus()
            } catch (error) {
                console.error('Cron job failed:', error)
            }
        },
        {
            timezone: envConfig.general.DEFAULT_TIMEZONE,
        }
    )

    logger.info('✅ Cron jobs initialized successfully')
}
