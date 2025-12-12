import express from "express";
import {
  asyncHandler,
  validate,
} from "../../middlewares/validation.middleware.js";
import {
  login,
  loginSubmit,
  logout,
} from "../../controllers/admin/auth.controller.js";
import { authSchema } from "../../validations/auth.schema..js";

const router = express.Router();

router.get("/login", asyncHandler(login));
router.post("/login", validate(authSchema.login), asyncHandler(loginSubmit));
router.get("/logout", asyncHandler(logout));

export default router;
