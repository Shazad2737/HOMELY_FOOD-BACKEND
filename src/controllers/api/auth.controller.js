import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import { prisma } from '../../../config/database.js'
import { envConfig } from '../../../config/env.js'
import redisClient, { removeCache, setCache } from '../../../config/redis.js'
import { messageService } from '../../../adaptors/message-service.adaptor.js'
import { CustomError } from '../../utils/customError.js'
import { apiResponse } from '../../utils/responseHandler.js'
import {
    CustomerLoginResource,
    CustomerSignUpResource,
    CustomerVerifyOtpResource,
} from '../../resources/customer.resource.js'
import { generateCustomerCode } from '../../../helpers/customer.helper.js'

// REDIS KEY PREFIX HELPER
const rKey = (key) => `${envConfig.cache.KEY_PREFIX}-${key}`

export const signUp = async (req, res) => {
    const { name, mobile, password, confirmPassword } = req.body

    const existingCustomer = await prisma.customer.findUnique({
        where: { mobile },
    })

    // Handle existing customer
    if (existingCustomer) {
        if (!existingCustomer.isVerified) {
            const otpCode = messageService.generateOTP()
            const otpTTL = envConfig.cache.OTP_EXPIRY_SECONDS

            const redisKey = rKey(`otp:signup:${mobile}`)
            const otpData = {
                code: otpCode,
                customerId: existingCustomer.id,
                expiresAt: Date.now() + otpTTL * 1000,
            }

            await redisClient.set(
                redisKey,
                JSON.stringify(otpData),
                'EX',
                otpTTL
            )

            const otpSent = await messageService.sendOTP(mobile, otpCode)
            if (!otpSent) {
                throw new CustomError(
                    500,
                    'Failed to send OTP. Please try again.'
                )
            }

            return apiResponse.success(
                res,
                'Account already exists but not verified. OTP sent to your phone.',
                {
                    customer: new CustomerSignUpResource(
                        existingCustomer
                    ).exec(),
                    requiresOtpVerification: true,
                    redirectTo: 'otp-verification',
                },
                200
            )
        }

        throw new CustomError(
            409,
            'Phone number already registered. Please login.',
            {
                redirectTo: 'login',
            }
        )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const otpCode = messageService.generateOTP()
    const otpTTL = envConfig.cache.OTP_EXPIRY_SECONDS

    const customer = await prisma.customer.create({
        data: {
            name,
            mobile,
            password: hashedPassword,
            isVerified: false,
            brandId: req.brand.id,
            customerCode: await generateCustomerCode(prisma, {
                prefix: envConfig.customer.PREFIX,
                startingSequence: envConfig.customer.STARTING_SEQUENCE,
            }),
        },
    })

    // Store OTP in Redis
    const redisKey = rKey(`otp:signup:${mobile}`)
    const otpData = {
        code: otpCode,
        customerId: customer.id,
        expiresAt: Date.now() + otpTTL * 1000,
    }
    await redisClient.set(redisKey, JSON.stringify(otpData), 'EX', otpTTL)

    // Send OTP
    const otpSent = await messageService.sendOTP(mobile, otpCode)
    if (!otpSent) {
        throw new CustomError(500, 'Failed to send OTP. Please try again.')
    }

    return apiResponse.success(
        res,
        'Customer created successfully. Please verify OTP sent to your phone.',
        {
            customer: new CustomerSignUpResource(customer).exec(),
            requiresOtpVerification: true,
            redirectTo: 'otp-verification',
        },
        201
    )
}

export const login = async (req, res) => {
    const { mobile, password } = req.body

    const customer = await prisma.customer.findUnique({ where: { mobile } })
    if (!customer) {
        throw new CustomError(404, 'Customer not found. Please sign up first.')
    }

    // Check if customer is not verified
    if (!customer.isVerified) {
        throw new CustomError(
            403,
            'Account not verified. Please verify your phone number first.',
            {
                redirectTo: 'otp-verification',
            }
        )
    }

    if (customer.status !== 'ACTIVE') {
        throw new CustomError(403, 'Your account is inactive or suspended.')
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password)
    if (!isPasswordValid) {
        throw new CustomError(401, 'Invalid credentials.')
    }

    const tokenExpiry = envConfig.jwt.EXPIRY
    const tokenPayload = {
        data: {
            id: customer.id,
            name: customer.name,
            mobile: customer.mobile,
            brandId: customer.brandId,
        },
    }

    const generatedToken = jwt.sign(tokenPayload, envConfig.general.APP_KEY, {
        expiresIn: tokenExpiry,
    })

    const sessionKey = rKey(`cus-auth-${customer.id}`)
    const redisTTL = envConfig.cache.JWT_TOKEN_EXPIRY_SECONDS

    await Promise.all([
        removeCache([sessionKey]),
        setCache(sessionKey, generatedToken, redisTTL),
    ])

    return apiResponse.success(
        res,
        'Login successful',
        {
            customer: new CustomerLoginResource(customer).exec(),
            token: generatedToken,
        },
        200
    )
}

export const verifyOTP = async (req, res) => {
    const { mobile, otp, type = 'signup' } = req.body

    const redisKey = rKey(`otp:${type}:${mobile}`)
    const otpDataStr = await redisClient.get(redisKey)

    if (!otpDataStr) {
        throw new CustomError(
            400,
            'OTP expired or not found. Please request a new one.'
        )
    }

    const otpData = JSON.parse(otpDataStr)

    if (otpData.code !== otp) {
        throw new CustomError(400, 'Invalid OTP')
    }

    if (Date.now() > otpData.expiresAt) {
        await redisClient.del(redisKey)
        throw new CustomError(400, 'OTP has expired. Please request a new one.')
    }

    if (type === 'signup') {
        const customer = await prisma.customer.update({
            where: { id: otpData.customerId },
            data: {
                status: 'ACTIVE',
                isVerified: true,
            },
        })

        await redisClient.del(redisKey)

        const tokenExpiry = envConfig.jwt.EXPIRY
        const tokenPayload = {
            data: {
                id: customer.id,
                name: customer.name,
                mobile: customer.mobile,
                brandId: customer.brandId,
            },
        }

        const generatedToken = jwt.sign(
            tokenPayload,
            envConfig.general.APP_KEY,
            {
                expiresIn: tokenExpiry,
            }
        )

        const sessionKey = rKey(`cus-auth-${customer.id}`)
        const redisTTL = envConfig.cache.JWT_TOKEN_EXPIRY_SECONDS

        await Promise.all([
            removeCache([sessionKey]),
            setCache(sessionKey, generatedToken, redisTTL),
        ])

        return apiResponse.success(
            res,
            'Phone number verified successfully.',
            {
                customer: new CustomerVerifyOtpResource(customer).exec(),
                token: generatedToken,
            },
            200
        )
    }

    if (type === 'resetPassword') {
        await redisClient.del(redisKey)

        const tempToken = jwt.sign(
            { type: 'resetPassword', customerId: otpData.customerId },
            envConfig.general.APP_KEY,
            { expiresIn: '10m' }
        )

        return apiResponse.success(
            res,
            'OTP verified successfully. You may now reset your password.',
            {
                token: tempToken,
            },
            200
        )
    }

    // Fallback for unknown types
    throw new CustomError(400, 'Invalid OTP verification type')
}

export const resendOTP = async (req, res) => {
    const { mobile, type } = req.body // type = 'resetPassword' | 'signup'
    const otpType = type || 'signup'

    if (!mobile) {
        throw new CustomError(400, 'Phone number is required')
    }

    const redisKey = rKey(`otp:${otpType}:${mobile}`)
    const otpDataStr = await redisClient.get(redisKey)

    let otpCode
    let otpTTL = envConfig.cache.OTP_EXPIRY_SECONDS

    if (otpDataStr) {
        // Already exists — resend same OTP if still valid
        const otpData = JSON.parse(otpDataStr)
        const remainingTTL = await redisClient.ttl(redisKey)

        if (remainingTTL > 60) {
            otpCode = otpData.code
            otpTTL = remainingTTL
        } else {
            // Expiring soon generate new OTP
            otpCode = messageService.generateOTP()
            await redisClient.set(
                redisKey,
                JSON.stringify({
                    ...otpData,
                    code: otpCode,
                    expiresAt: Date.now() + otpTTL * 1000,
                }),
                'EX',
                otpTTL
            )
        }
    } else {
        // No OTP found - generate new one
        otpCode = messageService.generateOTP()
        await redisClient.set(
            redisKey,
            JSON.stringify({
                code: otpCode,
                expiresAt: Date.now() + otpTTL * 1000,
            }),
            'EX',
            otpTTL
        )
    }

    const otpSent = await messageService.sendOTP(mobile, otpCode)
    if (!otpSent) {
        throw new CustomError(500, 'Failed to resend OTP. Please try again.')
    }

    return apiResponse.success(
        res,
        'OTP resent successfully',
        {
            mobile,
            expiresIn: otpTTL,
        },
        200
    )
}

export const forgotPassword = async (req, res) => {
    const { mobile } = req.body

    if (!mobile) {
        throw new CustomError(400, 'Phone number is required')
    }

    const customer = await prisma.customer.findUnique({ where: { mobile } })

    if (!customer) {
        throw new CustomError(404, 'No account found with this phone number.')
    }

    if (customer.status !== 'ACTIVE') {
        throw new CustomError(403, 'Your account is inactive or suspended.')
    }

    const otpCode = messageService.generateOTP()
    const otpTTL = envConfig.cache.OTP_EXPIRY_SECONDS
    const redisKey = rKey(`otp:resetPassword:${mobile}`)

    const otpData = {
        code: otpCode,
        customerId: customer.id,
        expiresAt: Date.now() + otpTTL * 1000,
    }

    await redisClient.set(redisKey, JSON.stringify(otpData), 'EX', otpTTL)

    const otpSent = await messageService.sendOTP(mobile, otpCode)
    if (!otpSent) {
        throw new CustomError(500, 'Failed to send OTP. Please try again.')
    }

    return apiResponse.success(res, 'Password reset OTP sent successfully', {
        mobile,
        expiresIn: otpTTL,
    })
}

export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body

    const decoded = jwt.verify(token, envConfig.general.APP_KEY)

    if (decoded.type !== 'resetPassword') {
        throw new CustomError(400, 'Invalid reset token.')
    }

    const customer = await prisma.customer.findUnique({
        where: { id: decoded.customerId },
    })

    if (!customer) {
        throw new CustomError(404, 'Customer not found.')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.customer.update({
        where: { id: customer.id },
        data: { password: hashedPassword },
    })

    return apiResponse.success(
        res,
        'Password reset successfully. You can now log in.'
    )
}

export const logout = async (req, res) => {
    const customerId = req.user?.id

    const sessionKey = rKey(`cus-auth-${customerId}`)
    await removeCache([sessionKey])

    return apiResponse.success(res, 'Logged out successfully.')
}
