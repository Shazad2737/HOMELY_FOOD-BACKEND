import express from 'express'
import {
    validate,
    asyncHandler,
} from '../../middlewares/validation.middleware.js'
import {
    getBrandSettings,
    getMealType,
    saveBrandSettings,
    updateMealType,
} from '../../controllers/admin/settings.controller.js'
import {
    brandSettingsSchema,
    mealTypeSchema,
} from '../../validations/settings.schema.js'

const router = express.Router()

// --- GENERAL ---
router.get('/general', asyncHandler(getBrandSettings))
router.post(
    '/general/save',
    validate(brandSettingsSchema.save),
    asyncHandler(saveBrandSettings)
)

// --- MEAL TYPES ---
router.get('/meal-types', asyncHandler(getMealType))
router.post(
    '/meal-types/save',
    validate(mealTypeSchema.save),
    asyncHandler(updateMealType)
)

export default router
