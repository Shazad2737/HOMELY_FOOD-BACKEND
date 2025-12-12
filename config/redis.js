import { createClient } from 'redis'
import { envConfig } from './env.js'
import logger from '../src/utils/logger.js'

const redisClient = createClient({
    url: envConfig.cache.REDIS_URL,
})

redisClient.on('error', (err) => {
    logger.error('Redis connection error:', err)
})

redisClient.on('ready', () => {
    logger.info('✅ Redis client is ready')
})

await redisClient.connect()

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Parsed data or null
 */
export const getCache = async (key) => {
    try {
        const data = await redisClient.get(key)

        // Return null if no data found
        if (!data) {
            return null
        }

        // Parse JSON string back to object/array
        return JSON.parse(data)
    } catch (error) {
        logger.error('Redis Get Error:', error)
        return null
    }
}

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache (will be stringified)
 * @param {number} expiry - Expiry in seconds (default: 300 = 5 minutes)
 * @returns {Promise<string|null>} - "OK" or null
 */
export const setCache = async (key, data, expiry = 300) => {
    try {
        // Stringify data before storing
        const serializedData = JSON.stringify(data)

        return await redisClient.set(key, serializedData, {
            EX: expiry,
        })
    } catch (error) {
        logger.error('Redis Set Error:', error)
        return null
    }
}

/**
 * Remove one or more keys from cache
 * @param {string|string[]} keys - Single key or array of keys
 * @returns {Promise<number|null>} - Number of keys deleted or null
 */
export const removeCache = async (keys = []) => {
    try {
        // Handle both single key and array of keys
        if (!Array.isArray(keys)) {
            keys = [keys]
        }

        // Return 0 if no keys provided
        if (keys.length === 0) {
            return 0
        }

        return await redisClient.del(keys)
    } catch (error) {
        logger.error('Redis Remove Error:', error)
        return null
    }
}

/**
 * Clear all cache keys matching the prefix
 * @returns {Promise<number|null>} - Number of keys deleted or null
 */
export const clearCacheAll = async () => {
    try {
        const keys_to_remove = []
        const iterator = redisClient.scanIterator({
            MATCH: `${envConfig.cache.KEY_PREFIX}-*`,
            COUNT: 100, // Scan 100 keys at a time
        })

        for await (const key of iterator) {
            keys_to_remove.push(key)
        }

        if (keys_to_remove.length === 0) {
            return 0
        }

        return await redisClient.del(keys_to_remove)
    } catch (error) {
        logger.error('Redis Clear All Error:', error)
        return null
    }
}

/**
 * Flush entire Redis database
 * @returns {Promise<string|null>} - "OK" or null
 */
export const flushCache = async () => {
    try {
        return await redisClient.flushAll()
    } catch (error) {
        logger.error('Redis Flush Error:', error)
        return null
    }
}

/**
 * Check if key exists in cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - true if exists, false otherwise
 */
export const hasCache = async (key) => {
    try {
        const exists = await redisClient.exists(key)
        return exists === 1
    } catch (error) {
        logger.error('Redis Exists Error:', error)
        return false
    }
}

/**
 * Get TTL (time to live) for a key
 * @param {string} key - Cache key
 * @returns {Promise<number|null>} - TTL in seconds or null
 */
export const getCacheTTL = async (key) => {
    try {
        return await redisClient.ttl(key)
    } catch (error) {
        logger.error('Redis TTL Error:', error)
        return null
    }
}

/**
 * Set expiry for an existing key
 * @param {string} key - Cache key
 * @param {number} expiry - Expiry in seconds
 * @returns {Promise<boolean>} - true if successful
 */
export const setCacheExpiry = async (key, expiry) => {
    try {
        const result = await redisClient.expire(key, expiry)
        return result === 1
    } catch (error) {
        logger.error('Redis Expire Error:', error)
        return false
    }
}

/**
 * Get multiple keys at once
 * @param {string[]} keys - Array of cache keys
 * @returns {Promise<any[]>} - Array of parsed values (null for missing keys)
 */
export const getCacheMultiple = async (keys) => {
    try {
        if (!keys || keys.length === 0) {
            return []
        }

        const values = await redisClient.mGet(keys)

        // Parse each value
        return values.map((value) => {
            if (!value) return null
            try {
                return JSON.parse(value)
            } catch {
                return null
            }
        })
    } catch (error) {
        logger.error('Redis MGet Error:', error)
        return []
    }
}

/**
 * Set multiple keys at once
 * @param {Object} keyValuePairs - Object with key-value pairs
 * @param {number} expiry - Expiry in seconds (applied to all keys)
 * @returns {Promise<boolean>} - true if successful
 */
export const setCacheMultiple = async (keyValuePairs, expiry = 300) => {
    try {
        const pipeline = redisClient.multi()

        for (const [key, value] of Object.entries(keyValuePairs)) {
            const serializedData = JSON.stringify(value)
            pipeline.set(key, serializedData, { EX: expiry })
        }

        await pipeline.exec()
        return true
    } catch (error) {
        logger.error('Redis MSet Error:', error)
        return false
    }
}

export default redisClient
