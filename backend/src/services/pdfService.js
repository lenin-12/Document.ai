import pdfParse from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { ocrPdfPage } from "./ocrService.js";

/**
 * Post-process raw Tesseract OCR output before it gets embedded/indexed.
 *
 * Tesseract commonly introduces:
 *  - Stray control/non-printable characters
 *  - Excess whitespace, tabs, and repeated blank lines
 *  - "Noise lines" — lines that are mostly punctuation/symbols with almost
 *    no real letters or digits (page borders, table gridlines, watermarks,
 *    scan artifacts misread as characters)
 *  - Repeated punctuation runs (e.g. "-----", "......", "||||")
 *
 * This does NOT try to "fix" misspelled OCR words (that needs a spellchecker/
 * LLM pass and risks altering real content) — it only strips clearly garbage
 * lines/characters so they don't pollute embeddings and BM25 tokens.
 *
 * @param {string} rawText - Raw text returned by Tesseract
 * @returns {string} Cleaned text
 */
export const cleanOcrText = (rawText) => {
  if (!rawText) return "";

  let text = rawText;

  // 1. Strip non-printable / control characters (keep standard whitespace)
  text = text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");

  // 2. Collapse repeated punctuation runs (e.g. "-----", "....", "||||") down to a single char
  text = text.replace(/([-_.|~=*#+])\1{3,}/g, "$1");

  // 3. Normalize whitespace: tabs -> space, collapse multiple spaces
  text = text.replace(/\t+/g, " ").replace(/ {2,}/g, " ");

  // 4. Drop "noise" lines: lines with almost no alphanumeric content
  //    (e.g. stray symbols from scan borders/gridlines misread by OCR)
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const keptLines = lines.filter((line) => {
    if (line.length === 0) return true; // preserve paragraph breaks
    const alphanumericCount = (line.match(/[a-zA-Z0-9]/g) || []).length;
    const ratio = alphanumericCount / line.length;
    // Keep the line if it has a reasonable amount of real text.
    // Short lines (like page numbers, headers) are allowed through as long
    // as they're mostly alphanumeric rather than symbol noise.
    return ratio >= 0.4;
  });
  text = keptLines.join("\n");

  // 5. Collapse 3+ consecutive blank lines down to a single blank line
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
};

/**
 * RAG STAGE 1 & 2: PDF Parsing & Text Chunking
 */
export const parseAndChunkPdf = async (fileBuffer, filename) => {
  // Collect text per page using a custom page renderer
  const pagesText = [];
  const pagerender = async (pageData) => {
    const content = await pageData.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    pagesText.push({
      pageNumber: pageData.pageIndex + 1,
      text: pageText,
    });
    return pageText;
  };

  // Support both ES module default import and CommonJS interop
  const parse = typeof pdfParse === "function" ? pdfParse : pdfParse.default;
  const pdfData = await parse(fileBuffer, { pagerender });
  const totalPages = pdfData.numpages || 1;

  // Sort pages to ensure they are in chronological order
  pagesText.sort((a, b) => a.pageNumber - b.pageNumber);

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", " ", ""],
  });

  // Process pages and perform OCR on demand if little or no selectable text is found
  const chunks = [];
  const combinedTextParts = [];
  let globalChunkIndex = 1;

  for (const pageObj of pagesText) {
    const pageNumber = typeof pageObj.pageNumber === "number" ? pageObj.pageNumber : null;
    let pageText = pageObj.text || "";

    // Threshold of 50 characters to detect scanned/blank pages
    if (pageText.trim().length < 50) {
      console.log(`[OCR Integration] Page ${pageNumber} has scarce selectable text (${pageText.trim().length} chars). Triggering OCR...`);
      try {
        const rawOcrText = await ocrPdfPage(fileBuffer, pageNumber);

        if (rawOcrText && rawOcrText.trim().length > 0) {
          const cleanedOcrText = cleanOcrText(rawOcrText);

          console.log(
            `[OCR Integration] Page ${pageNumber}: cleaned OCR output from ${rawOcrText.trim().length} to ${cleanedOcrText.length} characters.`
          );

          if (cleanedOcrText.length > 0) {
            pageText = cleanedOcrText;
          } else {
            console.warn(
              `[OCR Integration] Page ${pageNumber}: OCR text was entirely noise after cleaning. Skipping page content.`
            );
          }
        }
      } catch (ocrError) {
        // Ensure OCR failures do not stop processing of the remaining pages (Requirement 15)
        console.error(`[OCR Integration Error] Failed to OCR page ${pageNumber}:`, ocrError.message);
      }
    } else {
      console.log(`[OCR Integration] Page ${pageNumber} has sufficient selectable text (${pageText.trim().length} chars). Skipping OCR.`);
    }

    combinedTextParts.push(pageText);

    // Chunk each page independently if it contains readable text
    if (pageText.trim().length > 0) {
      const pageChunks = await textSplitter.splitText(pageText);
      pageChunks.forEach((chunkText, index) => {
        const chunkIndex = index + 1;
        const chunkId = `${filename}_page_${pageNumber !== null ? pageNumber : "unknown"}_chunk_${chunkIndex}`;

        chunks.push(new Document({
          pageContent: chunkText,
          metadata: {
            source: filename,
            filename: filename,
            page: pageNumber,
            chunkId: chunkId,
            chunkIndex: globalChunkIndex++,
          },
        }));

        // Logging: During indexing log "Indexed chunk Page 3 Chunk 17" (Requirement 11)
        console.log(`Indexed chunk\nPage ${pageNumber !== null ? pageNumber : "null"}\nChunk ${globalChunkIndex - 1}`);
      });
    }
  }

  const rawText = combinedTextParts.join("\n\n");

  if (!rawText.trim()) {
    throw new Error("The uploaded PDF file contains no readable text or is password protected.");
  }

  return {
    chunks,
    pages: totalPages,
    totalChunks: chunks.length,
    rawText,
  };
};