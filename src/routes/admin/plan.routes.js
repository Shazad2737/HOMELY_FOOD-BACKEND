import express from 'express'
import {
    validate,
    asyncHandler,
} from '../../middlewares/validation.middleware.js'
import {
    addEditPlanPage,
    getPlansJson,
    listPlans,
    planImageUpload,
    savePlan,
} from '../../controllers/admin/plan.controller.js'
import multer from 'multer'
import { planSchema } from '../../validations/plan.schema.js'

const upload = multer({ dest: 'uploads/' })

const router = express.Router()

router.get('/', asyncHandler(listPlans))
router.get('/json', asyncHandler(getPlansJson))
router.get('/add', asyncHandler(addEditPlanPage))
router.post('/image-upload', upload.any(), planImageUpload)
router.post('/save', validate(planSchema.save), asyncHandler(savePlan))
router.get('/edit/:id', asyncHandler(addEditPlanPage))

export default router
