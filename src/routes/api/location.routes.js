import express from 'express'
import {
    asyncHandler,
    validate,
} from '../../middlewares/validation.middleware.js'
import {
    getAllLocationsByCountry,
    getAllAreaByLocation,
    getLocationFormBanners,
} from '../../controllers/api/location.controller.js'

const router = express.Router()

router.get('/', asyncHandler(getAllLocationsByCountry))
router.get('/area/:locationId', asyncHandler(getAllAreaByLocation))
router.get('/banner', asyncHandler(getLocationFormBanners))

export default router
