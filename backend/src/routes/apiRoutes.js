import express from "express";
import { upload } from "../middlewares/uploadMiddleware.js";
import { uploadPdfController } from "../controllers/pdfController.js";
import { chatController } from "../controllers/chatController.js";

const router = express.Router();

router.post("/upload", upload.single("pdf"), uploadPdfController);
router.post("/chat", chatController);

export default router;
