import twilio from 'twilio'
import { envConfig } from '../config/env.js'

// Lazy initialize Twilio client to avoid startup crashes when credentials are missing
let client = null

const getClient = () => {
    if (!client) {
        const accountSid = envConfig.twilio?.ACCOUNT_SID
        const authToken = envConfig.twilio?.AUTH_TOKEN

        if (!accountSid || !authToken || !accountSid.startsWith('AC')) {
            console.warn('⚠️ Twilio credentials not configured or invalid. SMS features will be disabled.')
            return null
        }

        client = twilio(accountSid, authToken)
    }
    return client
}

const TwilioService = {
    sendOTP: async (phoneNumber, otp) => {
        try {
            const twilioClient = getClient()
            if (!twilioClient) {
                console.warn('Twilio client not available - SMS not sent')
                return false
            }

            await twilioClient.messages.create({
                body: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
                from: envConfig.twilio.PHONE_NUMBER,
                to: phoneNumber,
            })
            return true
        } catch (error) {
            console.error('Twilio Error:', error)
            return false
        }
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

export const twilioService = TwilioService
