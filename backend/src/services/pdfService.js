import pdfParse from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { ocrPdfPage } from "./ocrService.js";

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

  // Process pages and perform OCR on demand if little or no selectable text is found
  const combinedTextParts = [];
  for (const pageObj of pagesText) {
    const pageNumber = pageObj.pageNumber;
    let pageText = pageObj.text || "";

    // Threshold of 50 characters to detect scanned/blank pages
    if (pageText.trim().length < 50) {
      console.log(`[OCR Integration] Page ${pageNumber} has scarce selectable text (${pageText.trim().length} chars). Triggering OCR...`);
      try {
        const ocrText = await ocrPdfPage(fileBuffer, pageNumber);
        if (ocrText && ocrText.trim().length > 0) {
          pageText = ocrText;
        }
      } catch (ocrError) {
        // Ensure OCR failures do not stop processing of the remaining pages (Requirement 15)
        console.error(`[OCR Integration Error] Failed to OCR page ${pageNumber}:`, ocrError.message);
      }
    } else {
      console.log(`[OCR Integration] Page ${pageNumber} has sufficient selectable text (${pageText.trim().length} chars). Skipping OCR.`);
    }

    combinedTextParts.push(pageText);
  }

  // Combine back into rawText using page breaks/newlines
  const rawText = combinedTextParts.join("\n\n");

  if (!rawText.trim()) {
    throw new Error("The uploaded PDF file contains no readable text or is password protected.");
  }
  
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", " ", ""],
  });

  const totalLength = rawText.length;
  const avgCharsPerPage = Math.max(1, Math.ceil(totalLength / totalPages));

  const rawChunks = await textSplitter.splitText(rawText);
  // rawChunks.forEach((chunk, index) => {
  //   console.log(`\n========= CHUNK ${index + 1} =========`);
  //   console.log(chunk);
  //   console.log(`Characters: ${chunk.length}`);
  // });

  let currentPosition = 0;
  const chunks = rawChunks.map((chunkText, index) => {
    const pageNumber = Math.min(
      totalPages,
      Math.max(1, Math.ceil((currentPosition + chunkText.length / 2) / avgCharsPerPage))
    );
    currentPosition += chunkText.length - 200;

    return new Document({
      pageContent: chunkText,
      metadata: {
        source: filename,
        page: pageNumber,
        chunkIndex: index + 1,
      },
    });
  });

  return {
    chunks,
    pages: totalPages,
    totalChunks: chunks.length,
    rawText,
  };
};
