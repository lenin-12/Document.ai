import { parseAndChunkPdf } from "../services/pdfService.js";


export const extractTextFromPdf = async (fileBuffer, filename) => {
  if (!fileBuffer) {
    throw new Error("No file buffer provided for PDF parsing.");
  }
  
  // Reuses RAG pdfService parser
  const parsed = await parseAndChunkPdf(fileBuffer, filename);
  return parsed.rawText;
};


export const cleanText = (text) => {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n") // Replace triple/more newlines with double newlines
    .replace(/[ \t]+/g, " ")      // Replace multiple spaces/tabs with single space
    .trim();
};
