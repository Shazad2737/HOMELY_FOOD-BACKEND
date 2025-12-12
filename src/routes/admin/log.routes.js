import express from 'express'
import { asyncHandler } from '../../middlewares/validation.middleware.js'

import {
    serverLogList,
    serverLogJson,
} from '../../controllers/admin/log.controller.js'

const router = express.Router()

router.get('/server', asyncHandler(serverLogList))
router.get('/server/json', asyncHandler(serverLogJson))

export default router
