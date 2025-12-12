import express from 'express'
import multer from 'multer'
import {
    validate,
    asyncHandler,
} from '../../middlewares/validation.middleware.js'
import { categorySchema } from '../../validations/category.schema.js'
import {
    getCategoriesJson,
    saveCategory,
    listCategories,
    categoryFormPage,
    toggleStatus,
    categoryImageUpload,
} from '../../controllers/admin/category.controller.js'

const upload = multer({ dest: 'uploads/' })

const router = express.Router()

router.get('/', asyncHandler(listCategories))
router.get('/json', asyncHandler(getCategoriesJson))
router.get('/add', asyncHandler(categoryFormPage))
router.get('/edit/:id', asyncHandler(categoryFormPage))
router.post('/image-upload', upload.any(), categoryImageUpload)
router.post('/save', validate(categorySchema.save), asyncHandler(saveCategory))
router.post('/toggle-status/:id', asyncHandler(toggleStatus))

export default router
