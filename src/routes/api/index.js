import express from 'express'

import { authCheck, setHeaders } from '../../middlewares/api.middleware.js'

import authRoutes from './auth.routes.js'
import locationRoutes from './location.routes.js'
import orderRoutes from './order.routes.js'
import homeRoutes from './home.routes.js'
import menuRoutes from './menu.routes.js'
import subscriptionRoutes from './subscription.routes.js'
import notificationRoutes from './notification.routes.js'
import customerRoutes from './customer.routes.js'
import termsRoutes from './terms.routes.js'
import testRoutes from './test.routes.js'

const router = express.Router()

router.use('/test', testRoutes)

router.use(setHeaders)

router.use('/auth', authRoutes)
router.use('/terms', termsRoutes)

router.use(authCheck)

router.use('/location', locationRoutes)
router.use('/order', orderRoutes)
router.use('/home', homeRoutes)
router.use('/menu', menuRoutes)
router.use('/subscription', subscriptionRoutes)
router.use('/notification', notificationRoutes)
router.use('/customers', customerRoutes)

export default router
