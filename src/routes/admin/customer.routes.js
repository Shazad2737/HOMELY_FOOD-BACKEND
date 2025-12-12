import express from 'express'
import {
    validate,
    asyncHandler,
} from '../../middlewares/validation.middleware.js'
import {
    customerJson,
    customerList,
    customerView,
    updateCustomerStatus,
} from '../../controllers/admin/customer.controller.js'

const router = express.Router()

router.get('/', asyncHandler(customerList))
router.get('/json', asyncHandler(customerJson))
router.get('/view/:id', asyncHandler(customerView))
router.post('/status/:id', asyncHandler(updateCustomerStatus))

export default router
