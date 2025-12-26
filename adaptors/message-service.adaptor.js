import { envConfig } from '../config/env.js'
import logger from '../src/utils/logger.js'
import { twilioService } from './twilio.adaptor.js'
import { smsCountryService } from './smsCountry.adaptor.js'
import { consoleService } from './console.adaptor.js'

class MessageServiceAdaptor {
    constructor() {
        this.provider = null
        this.initializeProvider()
    }

    initializeProvider() {
        const providerType = envConfig.general?.SMS_PROVIDER || 'CONSOLE'

        switch (providerType.toUpperCase()) {
            case 'CONSOLE':
            case 'DEV':
            case 'LOG':
                this.provider = consoleService
                logger.info(
                    '📱 SMS Provider: CONSOLE (OTPs will be logged, not sent)'
                )
                break
            case 'TWILIO':
                this.provider = twilioService
                break
            case 'SMSCOUNTRY':
            case 'SMS_COUNTRY':
                this.provider = smsCountryService
                break
            default:
                this.provider = consoleService
                logger.warn(
                    `Unknown messaging provider: ${providerType}. Defaulting to CONSOLE.`
                )
        }

        logger.info(
            `✅ Message Service Adaptor initialized with provider: ${providerType}`
        )
    }

    generateOTP() {
        if (!this.provider || !this.provider.generateOTP) {
            throw new Error('Message provider not properly configured')
        }
        return this.provider.generateOTP()
    }

    async sendOTP(mobile, otpCode) {
        if (!this.provider || !this.provider.sendOTP) {
            throw new Error('Message provider not properly configured')
        }
        return await this.provider.sendOTP(mobile, otpCode)
    }

    getProviderName() {
        return envConfig.general?.SMS_PROVIDER
    }
}

export const messageService = new MessageServiceAdaptor()
