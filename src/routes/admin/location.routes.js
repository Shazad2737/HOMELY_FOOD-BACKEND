import express from 'express'
import {
    listLocations,
    addLocationPage,
    editLocationPage,
    getLocationsJson,
    saveLocation,
    toggleLocationStatus,
    deleteLocation,
} from '../../controllers/admin/location.controller.js'
import {
    listAreas,
    addAreaPage,
    editAreaPage,
    getAreasJson,
    getLocations,
    toggleAreaStatus,
    deleteArea,
    saveArea,
} from '../../controllers/admin/area.controller.js'
import {
    asyncHandler,
    validate,
} from '../../middlewares/validation.middleware.js'
import { areaSchema } from '../../validations/area.schema.js'
import { locationSchema } from '../../validations/location.schema.js'

const router = express.Router()

// area routes
// Page routes
router.get('/area', asyncHandler(listAreas))
router.get('/area/add', asyncHandler(addAreaPage))
router.get('/area/edit/:id', asyncHandler(editAreaPage))

// API routes
router.get('/area/json', asyncHandler(getAreasJson))
router.get('/area/locations', asyncHandler(getLocations))
router.post('/area/save', validate(areaSchema.save), asyncHandler(saveArea))
router.post('/area/toggle-status/:id', asyncHandler(toggleAreaStatus))
router.delete('/area/delete/:id', asyncHandler(deleteArea))

// Location routes
// View routes
router.get('/', asyncHandler(listLocations))
router.get('/add', asyncHandler(addLocationPage))
router.get('/edit/:id', asyncHandler(editLocationPage))

// API routes
router.get('/json', asyncHandler(getLocationsJson))
router.post('/save', validate(locationSchema.save), asyncHandler(saveLocation))
router.post('/toggle-status/:id', asyncHandler(toggleLocationStatus))
router.delete('/delete/:id', asyncHandler(deleteLocation))

export default router
