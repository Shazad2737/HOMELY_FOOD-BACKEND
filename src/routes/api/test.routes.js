import express from 'express'

import {
    exportDishItemData,
    sendTestMessage,
} from '../../controllers/api/test.controller.js'

const router = express.Router()

// router.get('/export-data', exportDishItemData)
// router.post('/send-test-message', sendTestMessage)

export default router
