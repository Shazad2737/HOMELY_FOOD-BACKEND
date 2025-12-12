import express from 'express'
import {
    asyncHandler,
    validate,
} from '../../middlewares/validation.middleware.js'
import {
    passwordSchema,
    profileSchema,
} from '../../validations/profile.schema.js'
import {
    changePassword,
    renderChangePasswordPage,
    renderProfilePage,
    updateProfile,
} from '../../controllers/admin/profile.controller.js'

const router = express.Router()

router.get('/', asyncHandler(renderProfilePage))
router.post(
    '/update',
    validate(profileSchema.update),
    asyncHandler(updateProfile)
)

// change password
router.get('/change-password', asyncHandler(renderChangePasswordPage))
router.post(
    '/change-password',
    validate(passwordSchema.change),
    asyncHandler(changePassword)
)

export default router
