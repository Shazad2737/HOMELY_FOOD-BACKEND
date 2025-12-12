import jwt from 'jsonwebtoken'
import { getCache } from '../../config/redis.js'
import { envConfig } from '../../config/env.js'
import { getBrandsFromCache } from '../utils/cache.js'

export const authCheck = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer')) {
            return res.status(401).json({ message: 'Not authorized, no token' })
        }

        const token = authHeader.split(' ')[1]

        const decoded = jwt.verify(token, envConfig.general.APP_KEY)

        const redisKey = `${envConfig.cache.KEY_PREFIX}-cus-auth-${decoded.data?.id}`
        const tokenExistInRedis = await getCache(redisKey)

        if (!tokenExistInRedis || tokenExistInRedis !== token) {
            return res.status(401).json({
                error: 'User session expired',
            })
        }

        req.user = decoded.data

        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' })
        }
        return res.status(401).json({ error: 'Unauthorized' })
    }
}

export const setHeaders = async (req, res, next) => {
    try {
        const brandCode =
            req.headers.brand?.toLowerCase() || envConfig.general.BRAND_CODE

        if (!brandCode) {
            return res.status(400).json({ error: 'Brand header is required' })
        }

        const brands = await getBrandsFromCache()

        const brand = brands.find(
            (b) =>
                b.code.toLowerCase() === brandCode.toLowerCase() &&
                b.country?.isActive
        )

        if (!brand) {
            return res.status(400).json({ error: 'Invalid brand header' })
        }

        if (!brand.brandSettings || !brand.brandSettings.isActive) {
            return res
                .status(400)
                .json({ error: 'Settings not configured or inactive' })
        }

        req.brand = {
            id: brand.id,
            name: brand.name,
            code: brand.code,
        }

        req.country = {
            id: brand.country.id,
            name: brand.country.name,
            code: brand.country.code,
            currency: brand.country.currency,
            timezone: brand.country.timezone,
        }

        req.brandSettings = brand.brandSettings || null

        next()
    } catch (err) {
        console.error('Header Setup Error:', err)
        return res.status(400).json({ error: 'Invalid Header' })
    }
}
