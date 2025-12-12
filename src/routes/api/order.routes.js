import express from 'express'
import {
    asyncHandler,
    validate,
} from '../../middlewares/validation.middleware.js'
import {
    createOrder,
    getAvailableOrderDays,
    getOrders,
} from '../../controllers/api/order.controller.js'
import { createOrderSchema } from '../../validations/order.schema.js'

const router = express.Router()

router.get('/', asyncHandler(getOrders))
router.get('/available', asyncHandler(getAvailableOrderDays))
router.post('/create', validate(createOrderSchema), asyncHandler(createOrder))

export default router
