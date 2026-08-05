import fs from "fs";
import path from "path";
import os from "os";
import { Document } from "@langchain/core/documents";
import { getVectorStore } from "../config/vectorstore.js";
import { extractImagesFromPage } from "./imageExtractionService.js";
import { generateImageDescription } from "./visionService.js";
import { appendBM25Chunk } from "./hybridSearchService.js";

/**
 * Process multimodal ingestion for a PDF file buffer.
 * It extracts images page-by-page, processes them with Gemini Vision, and saves descriptions in ChromaDB + MongoDB (BM25 index).
 *
 * @param {string} docId - Unique document identifier
 * @param {Buffer} pdfBuffer - PDF file in memory
 * @param {number} totalPages - Total pages of the PDF
 * @param {string} filename - Original PDF filename
 */
export const processMultimodalIngestion = async (docId, pdfBuffer, totalPages, filename) => {
  console.log(`\n📸 Starting Multimodal Ingestion for ${filename} (Pages: ${totalPages})...`);

  // Create a temporary file path for the PDF
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "multimodal-"));
  const tempPdfPath = path.join(tempDir, "document.pdf");

  try {
    fs.writeFileSync(tempPdfPath, pdfBuffer);

    const vectorStore = await getVectorStore(docId);
    let totalImagesProcessed = 0;
    let totalDescriptionsSaved = 0;

    // Loop through each page of the PDF to extract and process images (Requirement 1 under IMAGE EXTRACTION)
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      console.log(`[Multimodal Ingestion] Processing page ${pageNum}/${totalPages}...`);

      try {
        // Extract all images on this page using our extraction service
        const extractedImages = await extractImagesFromPage(tempPdfPath, pageNum, tempDir);

        if (!extractedImages || extractedImages.length === 0) {
          continue;
        }

        // Process each extracted image sequentially to maintain order (Requirement 3 under IMAGE EXTRACTION)
        for (let idx = 0; idx < extractedImages.length; idx++) {
          const imagePath = extractedImages[idx];
          const imageIndex = idx + 1;
          totalImagesProcessed++;

          try {
            // Programmatic pre-filtering: skip small image files (< 5KB) as they are likely logos, icons, bullets (Requirement under IMAGE FILTERING)
            const stats = fs.statSync(imagePath);
            if (stats.size < 5120) {
              console.log(`[Multimodal Ingestion] Skipping tiny image page ${pageNum} index ${imageIndex} (${stats.size} bytes) - likely a bullet/logo/separator.`);
              continue;
            }

            // Generate semantic description using Gemini Vision API
            const description = await generateImageDescription(imagePath);

            // Skip if Gemini classifies it as decorative/watermark/logo and responds with "SKIP"
            if (description === "SKIP" || description.includes("SKIP")) {
              console.log(`[Multimodal Ingestion] Gemini classified page ${pageNum} index ${imageIndex} as decorative. Skipping.`);
              continue;
            }

            console.log(`[Multimodal Ingestion] Generated Description: "${description.slice(0, 100)}..."`);

            // Create LangChain Document (Requirement 3 under VECTOR STORAGE)
            const imgDoc = new Document({
              pageContent: description,
              metadata: {
                source: filename,
                page: pageNum,
                imageIndex: imageIndex,
                contentType: "image",
              },
            });

            // 1. Store in ChromaDB vector store
            console.log(`[Multimodal Ingestion] Adding image description to ChromaDB...`);
            await vectorStore.addDocuments([imgDoc]);

            // 2. Store in MongoDB BM25 index (replaces the previous storage/bm25_<docId>.json file write)
            await appendBM25Chunk(docId, imgDoc);
            console.log(`[Multimodal Ingestion] Appended description to MongoDB BM25 index.`);

            totalDescriptionsSaved++;
          } catch (imageErr) {
            // Ensure Gemini Vision failures or embedding failures do not stop processing remaining images (Requirement 2 & 3 under ERROR HANDLING)
            console.error(`[Multimodal Ingestion Error] Failed to process image ${imageIndex} on page ${pageNum}:`, imageErr.message);
          }
        }
      } catch (pageErr) {
        // Ensure image extraction failures on one page do not stop processing remaining pages (Requirement 1 under ERROR HANDLING)
        console.error(`[Multimodal Ingestion Error] Failed to extract images for page ${pageNum}:`, pageErr.message);
      }
    }

    console.log(`\n🎉 Multimodal Ingestion Complete! Processed: ${totalImagesProcessed} images, Saved: ${totalDescriptionsSaved} descriptions.`);
  } catch (error) {
    console.error("[Multimodal Ingestion Error] Critical pipeline error:", error.message);
  } finally {
    // Clean up temporary directory recursively
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      console.error("[Multimodal Ingestion Cleanup Error] Failed to delete temp directory:", cleanupErr.message);
    }
  }
};