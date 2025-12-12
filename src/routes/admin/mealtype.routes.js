import express from "express";
import {
  validate,
  asyncHandler,
} from "../../middlewares/validation.middleware.js";
import { getAllMealType } from "../../controllers/admin/mealtype.controller.js";

const router = express.Router();

router.get("/all", asyncHandler(getAllMealType));

export default router;
