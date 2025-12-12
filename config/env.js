import dotenv from 'dotenv'

dotenv.config()

export const envConfig = {
    general: {
        PORT: process.env.PORT || 4000,
        APP_KEY: process.env.APP_KEY || 'default_app_key',
        NODE_ENV: process.env.NODE_ENV || 'development',
        CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
        CLIENT_NAME: process.env.CLIENT_NAME || 'Homely',
        BRAND_CODE: process.env.BRAND_CODE || 'IMS001',
        DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE || 'Asia/Dubai',
        SESSION_MAX_AGE: Number(process.env.SESSION_MAX_AGE) || 720,
        MEDIA_PROVIDER: process.env.MEDIA_PROVIDER || 'imagekit',
        SMS_PROVIDER: process.env.SMS_PROVIDER || 'SMSCOUNTRY',
    },
    logging: {
        enableConsoleLogs: process.env.LOG_ENABLE_CONSOLE !== 'false', // default true
        enableDatabaseLogs: process.env.LOG_ENABLE_DATABASE === 'true', // default false (opt-in)
    },
    order: {
        ADVANCE_ORDER_CUTOFF_HOUR:
            Number(process.env.ADVANCE_ORDER_CUTOFF_HOUR) || 18,
        MIN_ADVANCE_ORDER_DAYS: Number(process.env.MIN_ADVANCE_ORDER_DAYS) || 0,
        MAX_ADVANCE_ORDER_DAYS:
            Number(process.env.MAX_ADVANCE_ORDER_DAYS) || 10,
    },
    customer: {
        PREFIX: process.env.CUSTOMER_PREFIX,
        STARTING_SEQUENCE: Number(process.env.CUSTOMER_STARTING_SEQUENCE),
    },
    cache: {
        REDIS_URL: process.env.REDIS_URL,
        ACTIVE: process.env.CACHE_LOCAL_DATA || true,
        KEY_PREFIX: process.env.REDIS_KEY_PREFIX || 'homely',
        EXPIRY: Number(process.env.REDIS_EXPIRY) || 1440,

        JWT_TOKEN_EXPIRY_SECONDS:
            Number(process.env.JWT_TOKEN_EXPIRY_SECONDS) || 86400,
        OTP_EXPIRY_SECONDS: Number(process.env.OTP_EXPIRY_SECONDS) || 300,
    },
    imagekit: {
        PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
        PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
        URL: process.env.IMAGEKIT_URL,
        FOLDER: process.env.IMAGEKIT_FOLDER,
    },
    twilio: {
        ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
        AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
        PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    },
    smsCountry: {
        USERNAME: process.env.SMSCOUNTRY_USERNAME,
        PASSWORD: process.env.SMSCOUNTRY_PASSWORD,

        AUTH_KEY: process.env.SMSCOUNTRY_AUTH_KEY,
        AUTH_TOKEN: process.env.SMSCOUNTRY_AUTH_TOKEN,

        SENDER_ID: process.env.SMSCOUNTRY_SENDER_ID,
    },
    jwt: {
        SECRET: process.env.JWT_SECRET,
        EXPIRY: process.env.JWT_EXPIRY || '30d',

        // REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",
    },
}
