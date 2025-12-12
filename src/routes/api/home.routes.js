import express from 'express'

import {
    asyncHandler,
    validate,
} from '../../middlewares/validation.middleware.js'
import { getHomePage } from '../../controllers/api/home.controller.js'

const router = express.Router()

router.get('/', asyncHandler(getHomePage))

export default router
