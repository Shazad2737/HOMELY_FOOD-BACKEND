import express from 'express'
import {
    asyncHandler,
    validate,
} from '../../middlewares/validation.middleware.js'
import {
    getNotification,
    readAllNotificaction,
} from '../../controllers/api/notification.controller.js'

const router = express.Router()

router.get('/', asyncHandler(getNotification))
router.patch('/read-all', asyncHandler(readAllNotificaction))

export default router
