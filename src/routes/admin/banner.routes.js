import express from 'express'
import multer from 'multer'
import {
    asyncHandler,
    validate,
} from '../../middlewares/validation.middleware.js'
import { bannerSchema } from '../../validations/banner.schema.js'
import {
    listBanners,
    renderAddEditBanner,
    saveBanner,
    bannerImageUpload,
    toggleBannerStatus,
    deleteBanner,
    getBannersDataTable,
} from '../../controllers/admin/banner.contoller.js'

const upload = multer({ dest: 'uploads/' })

const router = express.Router()

router.get('/', asyncHandler(listBanners))
router.get('/json', asyncHandler(getBannersDataTable))
router.get('/add', asyncHandler(renderAddEditBanner))
router.get('/edit/:id', asyncHandler(renderAddEditBanner))
router.post('/save', validate(bannerSchema.save), asyncHandler(saveBanner))
router.post('/image-upload', upload.any(), asyncHandler(bannerImageUpload))
router.post('/toggle-status/:id', asyncHandler(toggleBannerStatus))
router.delete('/delete/:id', asyncHandler(deleteBanner))

export default router
