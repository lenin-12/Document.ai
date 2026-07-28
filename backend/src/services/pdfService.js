import pdfParse from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

/**
 * RAG STAGE 1 & 2: PDF Parsing & Text Chunking
 */
export const parseAndChunkPdf = async (fileBuffer, filename) => {
  // Support both ES module default import and CommonJS interop
  const parse = typeof pdfParse === "function" ? pdfParse : pdfParse.default;
  const pdfData = await parse(fileBuffer);
  // console.log(pdfData);
  const rawText = pdfData.text || "";
  // console.log(rawText);
  const totalPages = pdfData.numpages || 1;

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
