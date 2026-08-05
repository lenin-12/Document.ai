import { parseAndChunkPdf } from "../services/pdfService.js";

/**
 * Extracts raw text from a PDF document buffer by reusing the existing parser + OCR service.
 * @param {Buffer} fileBuffer - The PDF file buffer
 * @param {string} filename - The name of the file (used for metadata/tracing)
 * @returns {Promise<string>} The extracted raw text
 */
export const extractTextFromPdf = async (fileBuffer, filename) => {
  if (!fileBuffer) {
    throw new Error("No file buffer provided for PDF parsing.");
  }
  
  // Reuses RAG pdfService parser + OCR fallback
  const parsed = await parseAndChunkPdf(fileBuffer, filename);
  return parsed.rawText;
};

/**
 * Cleans the extracted text by removing redundant whitespace, normalizing line breaks, and stripping formatting.
 * @param {string} text - The raw text
 * @returns {string} The cleaned text
 */
export const cleanText = (text) => {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n") // Replace triple/more newlines with double newlines
    .replace(/[ \t]+/g, " ")      // Replace multiple spaces/tabs with single space
    .trim();
};
