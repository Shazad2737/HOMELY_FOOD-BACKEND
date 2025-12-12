import axios from 'axios'
import { envConfig } from '../config/env.js'
import logger from '../src/utils/logger.js'

// const smsCountryClient = axios.create({
//     baseURL: `https://restapi.smscountry.com/v0.1/Accounts/${envConfig.smsCountry.USERNAME}`,
//     auth: {
// username: envConfig.smsCountry.USERNAME,
// password: envConfig.smsCountry.PASSWORD,
//     },
//     headers: { 'Content-Type': 'application/json' },
// })

const SMSCountryService = {
    // sendOTP: async (phoneNumber, otp) => {
    //     try {
    //         const payload = {
    //             Text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
    //             Number: phoneNumber,
    //             // SenderId: envConfig.smsCountry.SENDER_ID,
    //             SenderId: 'SMSCOU',
    //         }

    //         const response = await smsCountryClient.post('/SMSes/', payload)

    //         logger.info('SMS Country OTP sent successfully', {
    //             to: phoneNumber,
    //             messageId: response.data?.MessageUUID,
    //         })

    //         return true
    //     } catch (error) {
    //         logger.error(
    //             'SMS Country Error:',
    //             error.response?.data || error.message
    //         )
    //         return false
    //     }
    // },

    // TODO: hhtp case (eatroot)
    sendOTP: async (mobile, smsBody) => {
        const url = 'https://api.smscountry.com/SMSCwebservice_bulk.aspx'

        const username = envConfig.smsCountry.USERNAME
        const password = envConfig.smsCountry.PASSWORD
        const senderId = envConfig.smsCountry.SENDER_ID

        const message = encodeURIComponent(`your otp is : ${smsBody}`)

        const smsUrl =
            `${url}?User=${username}&passwd=${password}` +
            `&mobilenumber=${mobile}&message=${message}` +
            `&sid=${senderId}&mtype=N&DR=Y`

        try {
            // send request using GET
            const response = await axios.get(smsUrl)
            console.log('SMSCountry Response:', response.data)
            const responseData =
                typeof response.data === 'string'
                    ? response.data
                    : JSON.stringify(response.data)

            // Log to DB
            // await prisma.smsLog.create({
            //     data: {
            //         sms_provider_id: 1,
            //         recipient: mobile,
            //         sms_type: type,
            //         restaurant_id: restaurantId,
            //         sender_id: senderId,
            //         req: smsUrl,
            //         res: responseData,
            //     },
            // })

            logger.info('SMS sent successfully', {
                to: mobile,
                res: responseData,
            })

            return true
        } catch (error) {
            logger.error(
                'SMSCountry Error:',
                error.response?.data || error.message
            )

            // await prisma.smsLog.create({
            //     data: {
            //         sms_provider_id: 1,
            //         recipient: mobile,
            //         sms_type: type,
            //         restaurant_id: req.headers['restaurant-id'] || null,
            //         sender_id: senderId,
            //         req: smsUrl,
            //         res: error.response?.data || error.message,
            //     },
            // })

            // return [500, 'SMS sending failed']
            return false
        }
    },

    // TODO: restapi case (india)
    // sendOTP: async (mobile, otp) => {
    //     try {
    //         const accountKey = envConfig.smsCountry.AUTH_KEY
    //         const authToken = envConfig.smsCountry.AUTH_TOKEN
    //         const senderId = envConfig.smsCountry.SENDER_ID
    //         const templateId = '1407165399089830556'

    //         const mobileFixed = mobile.replace(/[^0-9]/g, '')

    //         const payload = {
    //             Number: mobileFixed,
    //             SenderId: senderId,
    //             Text: `User Admin login OTP is** - SMSCOU`,
    //             Tool: 'API',
    //             TemplateId: templateId,
    //         }

    //         const url = `https://restapi.smscountry.com/v0.1/Accounts/${accountKey}/SMSes/`

    //         const auth = {
    //             username: accountKey,
    //             password: authToken,
    //         }

    //         const { data } = await axios.post(url, payload, { auth })

    //         logger.info('SMSCountry OTP sent successfully', {
    //             to: mobileFixed,
    //             messageId: data?.MessageUUID,
    //         })

    //         return {
    //             success: true,
    //             messageId: data?.MessageUUID,
    //             providerResponse: data,
    //         }
    //     } catch (error) {
    //         logger.error(
    //             'SMSCountry Error:',
    //             error.response?.data || error.message
    //         )
    //         return {
    //             success: false,
    //             error: error.response?.data || error.message,
    //         }
    //     }
    // },

    // TODO: rest api (outside india)
    // sendOTP: async (mobile, message) => {
    //     try {
    //         const accountKey = envConfig.smsCountry.AUTH_KEY
    //         const authToken = envConfig.smsCountry.AUTH_TOKEN
    //         const senderId = envConfig.smsCountry.SENDER_ID

    //         const mobileFixed = mobile.replace(/[^0-9]/g, '')

    //         const payload = {
    //             Number: mobileFixed,
    //             SenderId: senderId,
    //             Text: message,
    //             Tool: 'API',
    //             // No TemplateId here
    //         }

    //         const url = `https://restapi.smscountry.com/v0.1/Accounts/${accountKey}/SMSes/`

    //         const { data } = await axios.post(url, payload, {
    //             auth: { username: accountKey, password: authToken },
    //         })

    //         logger.info('SMS sent successfully', {
    //             to: mobileFixed,
    //             messageId: data?.MessageUUID,
    //         })

    //         return { success: true }
    //     } catch (error) {
    //         logger.error(
    //             'SMSCountry Error:',
    //             error.response?.data || error.message
    //         )
    //         return { success: false }
    //     }
    // },

    // sendSMS: async (phoneNumber, message) => {
    //     try {
    //         const payload = {
    //             Text: message,
    //             Number: phoneNumber,
    //             SenderId: envConfig.smsCountry.SENDER_ID,
    //         }

    //         const response = await smsCountryClient.post('/SMSes/', payload)

    //         logger.info('SMS Country message sent successfully', {
    //             to: phoneNumber,
    //             messageId: response.data?.MessageUUID,
    //         })

    //         return true
    //     } catch (error) {
    //         logger.error(
    //             'SMS Country Error:',
    //             error.response?.data || error.message
    //         )
    //         return false
    //     }
    // },

    generateOTP(length = 6) {
        return [...Array(length)]
            .map(() => Math.floor(Math.random() * 10))
            .join('')
    },
}

export const smsCountryService = SMSCountryService
