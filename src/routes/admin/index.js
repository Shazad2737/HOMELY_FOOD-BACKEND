import express from 'express'

import authRoutes from './auth.routes.js'
import foodItemRoutes from './foodItem.routes.js'
import categoryRoutes from './category.routes.js'
import planRoutes from './plan.routes.js'
import locationRoutes from './location.routes.js'
import mealTypeRoutes from './mealtype.routes.js'
import subscriptionRoutes from './subscription.routes.js'
import bannerRoutes from './banner.routes.js'
import notificationRoutes from './notification.routes.js'
import holidayRoutes from './holiday.routes.js'
import customerRoutes from './customer.routes.js'
import orderRoutes from './order.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import settingRoutes from './setting.routes.js'
import profileRoutes from './profile.routes.js'
import logRoutes from './log.routes.js'

import { baseConfig, nunjucksFilter } from '../../middlewares/cms.middleware.js'
import { isAuthenticated } from '../../middlewares/auth.middleware.js'

const router = express.Router()

router.use('/auth', authRoutes)

router.use(isAuthenticated)
router.use(nunjucksFilter)
router.use(baseConfig)

router.use('/dashboard', dashboardRoutes)
router.use('/fooditem', foodItemRoutes)
router.use('/category', categoryRoutes)
router.use('/plan', planRoutes)
router.use('/location', locationRoutes)
router.use('/mealtype', mealTypeRoutes)
router.use('/subscription', subscriptionRoutes)
router.use('/banner', bannerRoutes)
router.use('/notification', notificationRoutes)
router.use('/holiday', holidayRoutes)
router.use('/customer', customerRoutes)
router.use('/order', orderRoutes)
router.use('/settings', settingRoutes)
router.use('/profile', profileRoutes)
router.use('/logs', logRoutes)

export default router
