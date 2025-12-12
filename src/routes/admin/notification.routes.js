import express from 'express'
import multer from 'multer'
import {
    validate,
    asyncHandler,
} from '../../middlewares/validation.middleware.js'
import {
    listNotification,
    notificationImageUpload,
    notificationJson,
    notificationSave,
} from '../../controllers/admin/notification.controller.js'
import { notificationSchema } from '../../validations/notification.schema.js'

const upload = multer({ dest: 'uploads/' })

const router = express.Router()

router.get('/', asyncHandler(listNotification))
router.post(
    '/save',
    validate(notificationSchema.save),
    asyncHandler(notificationSave)
)
router.post('/image-upload', upload.any(), notificationImageUpload)
router.get('/json', notificationJson)
router.get('/add', async (req, res) => {
    res.render('admin/notification/form', { notification: null })
})

export default router
