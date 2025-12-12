import express from 'express'
import {
    asyncHandler,
    validate,
} from '../../middlewares/validation.middleware.js'
import {
    getProfile,
    updateProfilePicture,
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
} from '../../controllers/api/customer.controller.js'
import { customerSchema } from '../../validations/customer.schema.js'
import { upload } from '../../middlewares/upload.middleware.js'

const router = express.Router()

// Profile routes
router.get('/profile', asyncHandler(getProfile))
router.patch(
    '/profile-picture',
    upload.single('profilePicture'),
    asyncHandler(updateProfilePicture)
)

// Address routes
router.get('/addresses', asyncHandler(getAddresses))
router.post(
    '/addresses',
    validate(customerSchema.createAddress),
    asyncHandler(createAddress)
)
router.patch(
    '/addresses/:addressId',
    validate(customerSchema.updateAddress),
    asyncHandler(updateAddress)
)
router.delete(
    '/addresses/:addressId',
    validate(customerSchema.deleteAddress),
    asyncHandler(deleteAddress)
)
router.patch(
    '/addresses/:addressId/set-default',
    validate(customerSchema.setDefaultAddress),
    asyncHandler(setDefaultAddress)
)

export default router
