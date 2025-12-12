import express from 'express'
import { asyncHandler } from '../../middlewares/validation.middleware.js'
import { getDashboard } from '../../controllers/admin/dashboard.controller.js'

const router = express.Router()

router.get('/', asyncHandler(getDashboard))

export default router
