import express from 'express'
import {
    asyncHandler,
    validate,
} from '../../middlewares/validation.middleware.js'
import { getLatestTerms } from '../../controllers/api/terms.controller.js'

const router = express.Router()

router.get('/', asyncHandler(getLatestTerms))

export default router
