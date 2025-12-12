import express from 'express'
import { getMenuPage } from '../../controllers/api/menu.controller.js'
import {
    asyncHandler,
    validate,
} from '../../middlewares/validation.middleware.js'

const router = express.Router()

router.get('/:categoryId', asyncHandler(getMenuPage))

export default router
