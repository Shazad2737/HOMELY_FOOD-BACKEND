import express from 'express'
import {
    asyncHandler,
    validate,
} from '../../middlewares/validation.middleware.js'
import {
    signUp,
    login,
    resetPassword,
    resendOTP,
    verifyOTP,
    forgotPassword,
    logout,
} from '../../controllers/api/auth.controller.js'
import { authCheck } from '../../middlewares/api.middleware.js'
import { customerAuthSchema } from '../../validations/auth.schema..js'

const router = express.Router()

router.post(
    '/signup',
    validate(customerAuthSchema.signUp),
    asyncHandler(signUp)
)
router.post(
    '/verify-otp',
    validate(customerAuthSchema.verifyOTP),
    asyncHandler(verifyOTP)
)
router.post('/login', validate(customerAuthSchema.login), asyncHandler(login))
router.post(
    '/forgot-password',
    validate(customerAuthSchema.forgotPassword),
    asyncHandler(forgotPassword)
)
router.post(
    '/reset-password',
    validate(customerAuthSchema.resetPassword),
    asyncHandler(resetPassword)
)
router.post(
    '/resend-otp',
    validate(customerAuthSchema.resendOTP),
    asyncHandler(resendOTP)
)
router.post('/logout', authCheck, asyncHandler(logout))

export default router
