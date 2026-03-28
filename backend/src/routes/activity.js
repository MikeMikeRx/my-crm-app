import express from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middleware/auth.js";
import { demoGuard } from "../middleware/demoGuard.js";
import { validateRequest } from "../middleware/validator.js";
import { requirePermission } from "../middleware/permissions.js";
import { createNote } from "../controllers/noteController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(demoGuard);

const noteValidationRules = [
  body("entityType")
    .trim()
    .notEmpty()
    .withMessage("entityType is required"),

  body("entityId")
    .trim()
    .notEmpty()
    .withMessage("entityId is required"),

  body("message")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("message is required"),
];

router.post("/notes", requirePermission("activities", "write"), noteValidationRules, validateRequest, createNote);

export default router;
