import express from 'express'
import {
    validate,
    asyncHandler,
} from '../../middlewares/validation.middleware.js'
import {
    getsJson,
    listSubscriptions,
    saveSubscription,
    getCustomers,
    renderSubscriptionForm,
    cancelSubscription,
    getPlansByCategory,
} from '../../controllers/admin/subscription.controller.js'
import { subscriptionSchema } from '../../validations/subscription.schema.js'

const router = express.Router()

router.get('/', asyncHandler(listSubscriptions))
router.get('/json', asyncHandler(getsJson))
router.get('/add', asyncHandler(renderSubscriptionForm))
router.get('/edit/:id', asyncHandler(renderSubscriptionForm))
router.post('/cancel/:id', asyncHandler(cancelSubscription))
router.post(
    '/save',
    validate(subscriptionSchema.save),
    asyncHandler(saveSubscription)
)

// Helper endpoints
router.get('/customers', asyncHandler(getCustomers))
router.get('/plans/by-category', asyncHandler(getPlansByCategory))

export default router
