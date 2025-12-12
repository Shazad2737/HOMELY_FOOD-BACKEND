import express from 'express'
import {
    validate,
    asyncHandler,
} from '../../middlewares/validation.middleware.js'
import {
    listFoodItems,
    getFoodItemsJson,
    deleteFoodItem,
    toggleStatus,
    saveFoodItem,
    foodItemFormPage,
    foodItemImageUpload,
    getPlansByCategory,
} from '../../controllers/admin/foodItem.controller.js'
import { foodItemSchema } from '../../validations/foodItem.schema.js'
import multer from 'multer'

const upload = multer({ dest: 'uploads/' })

const router = express.Router()

// Food Item routes
router.get('/', asyncHandler(listFoodItems))
router.get('/json', asyncHandler(getFoodItemsJson))
router.get('/add', asyncHandler(foodItemFormPage))
router.post('/save', validate(foodItemSchema.save), asyncHandler(saveFoodItem))
router.post('/image-upload', upload.any(), foodItemImageUpload)
router.get('/edit/:id', asyncHandler(foodItemFormPage))
// router.post("/edit/:id", upload.single("image"), asyncHandler(updateFoodItem));
router.delete('/delete/:id', asyncHandler(deleteFoodItem))
router.post('/toggle-status/:id', asyncHandler(toggleStatus))

// Helper routes
router.get('/plans/by-category', asyncHandler(getPlansByCategory))

export default router
