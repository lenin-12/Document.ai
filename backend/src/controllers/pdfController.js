import { parseAndChunkPdf } from "../services/pdfService.js";
import { processDocumentAndStore } from "../services/ragService.js";
import crypto from "crypto";

export const uploadPdfController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No PDF file uploaded." });
    }

    const file = req.file;
    const filename = file.originalname;

    console.log(`📄 Received PDF upload: ${filename} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    const docId = `doc_${crypto.randomBytes(8).toString("hex")}`;

    const { chunks, pages, totalChunks } = await parseAndChunkPdf(file.buffer, filename, docId);

    const metadata = await processDocumentAndStore(docId, chunks, pages, filename);

    console.log(`✅ PDF Ingested Successfully! Doc ID: ${docId}, Pages: ${pages}, Chunks: ${totalChunks}`);

    return res.status(200).json({
      success: true,
      message: "PDF uploaded, chunked, embedded, and summarized successfully.",
      data: {
        docId: metadata.docId,
        filename: metadata.filename,
        pages: metadata.pages,
        totalChunks: metadata.totalChunks,
        summary: metadata.summary,
        uploadedAt: metadata.uploadedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
