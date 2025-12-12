import twilio from 'twilio'
import { envConfig } from '../config/env.js'

const client = twilio(envConfig.twilio.ACCOUNT_SID, envConfig.twilio.AUTH_TOKEN)

const TwilioService = {
    sendOTP: async (phoneNumber, otp) => {
        try {
            await client.messages.create({
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
