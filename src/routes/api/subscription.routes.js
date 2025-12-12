import express from 'express'
import {
    asyncHandler,
    validate,
} from '../../middlewares/validation.middleware.js'
import { getSubscriptions } from '../../controllers/api/subscription.controller.js'

const router = express.Router()

router.get('/', asyncHandler(getSubscriptions))

export default router
