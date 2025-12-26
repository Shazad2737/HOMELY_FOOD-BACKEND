import logger from '../src/utils/logger.js'

/**
 * Console OTP Adaptor
 * For development/testing - logs OTP to console instead of sending SMS
 * Set SMS_PROVIDER=CONSOLE in .env to use this
 */
const ConsoleService = {
    sendOTP: async (phoneNumber, otp) => {
        console.log('\n' + '='.repeat(50))
        console.log('📱 OTP VERIFICATION (DEV MODE)')
        console.log('='.repeat(50))
        console.log(`   Phone: ${phoneNumber}`)
        console.log(`   OTP:   ${otp}`)
        console.log(`   Valid: 10 minutes`)
        console.log('='.repeat(50) + '\n')

        logger.info(`[CONSOLE OTP] Phone: ${phoneNumber}, OTP: ${otp}`)

        return true // Always succeeds
    },

    generateOTP: (length = 6) => {
        const digits = '0123456789'
        let otp = ''
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * 10)]
        }
        return otp
    },
}

export const consoleService = ConsoleService
