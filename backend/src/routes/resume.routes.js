import express from "express";
import { upload } from "../middlewares/uploadMiddleware.js";
import { validateResumeAnalysisRequest } from "../validators/resume.validator.js";
import { analyzeResumeController } from "../controllers/resume.controller.js";

const router = express.Router();

// Configure multer fields to handle two separate input file keys: 'resume' and 'jdFile'
const uploadFields = upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "jdFile", maxCount: 1 }
]);

/**
 * Route: POST /api/resume/analyze
 * Desc: Compare a resume PDF against a job description (either via plain text or uploaded PDF)
 */
router.post("/analyze", uploadFields, validateResumeAnalysisRequest, analyzeResumeController);

export default router;
