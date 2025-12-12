import express from 'express'
import {
    validate,
    asyncHandler,
} from '../../middlewares/validation.middleware.js'
import {
    getHolidayForm,
    getHolidayJson,
    renderListPage,
    saveHoliday,
    toggleStatus,
} from '../../controllers/admin/holiday.controller.js'
import { holidaySchema } from '../../validations/holiday.schema.js'

const router = express.Router()

router.get('/', asyncHandler(renderListPage))
router.get('/add', asyncHandler(getHolidayForm))
router.get('/edit/:id', asyncHandler(getHolidayForm))
router.post('/save', validate(holidaySchema), asyncHandler(saveHoliday))
router.get('/json', asyncHandler(getHolidayJson))
router.patch('/toggle-status/:id', asyncHandler(toggleStatus))

export default router
