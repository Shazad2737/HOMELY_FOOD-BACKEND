import { envConfig } from '../../config/env.js'
import { getCache, setCache, removeCache } from '../../config/redis.js'
import { prisma } from '../../config/database.js'

export const keyEnums = {
    headers: {
        brand: `${envConfig.cache.KEY_PREFIX}-brands`,
    },
    holidays: (brandId) => `${envConfig.cache.KEY_PREFIX}-holidays-${brandId}`,
}

export const getBrandsFromCache = async () => {
    try {
        if (!envConfig.cache.ACTIVE) {
            return await fetchBrandsFromDB()
        }

        // Try to get from cache
        const cachedBrands = await getCache(keyEnums.headers.brand)

        if (cachedBrands) {
            return cachedBrands
        }

        const brands = await fetchBrandsFromDB()

        if (brands.length > 0) {
            await setCache(
                keyEnums.headers.brand,
                brands,
                envConfig.cache.EXPIRY
            )
        }

        return brands
    } catch (error) {
        console.error('Cache load error:', error)
        return []
    }
}

const fetchBrandsFromDB = async () => {
    return await prisma.brand.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            code: true,
            country: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                    currency: true,
                    timezone: true,
                    isActive: true,
                },
            },
            brandSettings: {
                select: {
                    advanceOrderCutoffHour: true,
                    minAdvanceOrderDays: true,
                    maxAdvanceOrderDays: true,
                    whatsappNumber: true,
                    phoneNumber: true,
                    helpCenterUrl: true,
                    isActive: true,
                },
            },
        },
    })
}

export const getHolidaysFromCache = async (brandId) => {
    try {
        const cacheKey = keyEnums.holidays(brandId)

        if (!envConfig.cache.ACTIVE) {
            return await fetchHolidaysFromDB(brandId)
        }

        const cachedHolidays = await getCache(cacheKey)

        if (cachedHolidays) {
            return cachedHolidays
        }

        const holidays = await fetchHolidaysFromDB(brandId)

        if (holidays.length > 0) {
            await setCache(cacheKey, holidays, envConfig.cache.EXPIRY)
        }

        return holidays
    } catch (error) {
        console.error('Error fetching holidays:', error)
        return []
    }
}

const fetchHolidaysFromDB = async (brandId) => {
    return await prisma.holiday.findMany({
        where: {
            brandId,
            isActive: true,
        },
        select: {
            id: true,
            name: true,
            description: true,
            type: true,
            date: true,
            dayOfWeek: true,
        },
        orderBy: { createdAt: 'desc' },
    })
}

export const clearBrandsCache = async () => {
    try {
        await removeCache(keyEnums.headers.brand)
    } catch (error) {
        console.error('Error clearing brands cache:', error)
    }
}

export const clearHolidaysCache = async (brandId) => {
    try {
        await removeCache(keyEnums.holidays(brandId))
    } catch (error) {
        console.error('Error clearing holidays cache:', error)
    }
}

export const refreshBrandsCache = async () => {
    try {
        // Clear existing cache
        await clearBrandsCache()

        // Fetch fresh data
        return await getBrandsFromCache()
    } catch (error) {
        console.error('Error refreshing brands cache:', error)
        return []
    }
}

export const refreshHolidaysCache = async (brandId) => {
    try {
        // Clear existing cache
        await clearHolidaysCache(brandId)

        // Fetch fresh data
        return await getHolidaysFromCache(brandId)
    } catch (error) {
        console.error('Error refreshing holidays cache:', error)
        return []
    }
}
