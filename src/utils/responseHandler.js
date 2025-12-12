import { envConfig } from '../../config/env.js'
import { logger } from './logger.js'

export const apiResponse = {
    success(res, message = 'Success', data, statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        })
    },

    error(res, error, statusCode = 500) {
        logger.error(error)

        const message = error.message || 'Something went wrong'

        const response = {
            success: false,
            message,
            ...(envConfig.general.NODE_ENV !== 'production' && {
                stack: error.stack,
            }),
        }

        return res.status(statusCode).json(response)
    },
}
