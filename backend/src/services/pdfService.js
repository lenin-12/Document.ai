import pdfParse from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";


export const parseAndChunkPdf = async (fileBuffer, filename, docId) => {
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

  const chunks = [];
  const combinedTextParts = [];
  let globalChunkIndex = 1;

  for (const pageObj of pagesText) {
    const pageNumber = typeof pageObj.pageNumber === "number" ? pageObj.pageNumber : null;
    const pageText = (pageObj.text || "").trim();

    if (!pageText) {
      console.warn(`[Page ${pageNumber}] WARNING: No usable native text content extracted.`);
      continue;
    }

    combinedTextParts.push(pageText);

    // Chunk the page document independently
    const pageChunks = await textSplitter.splitText(pageText);

    pageChunks.forEach((chunkText, index) => {
      const chunkIndex = index + 1;
      const chunkId = `${filename}_page_${pageNumber !== null ? pageNumber : "unknown"}_chunk_${chunkIndex}`;

      chunks.push(new Document({
        pageContent: chunkText,
        metadata: {
          source: filename,
          filename: filename,
          docId: docId || filename,
          page: pageNumber,
          pageNumber: pageNumber,
          totalPages: totalPages,
          extractionMethod: "native",
          sourceType: "pdf",
          chunkId: chunkId,
          chunkIndex: globalChunkIndex++,
        },
      }));

      console.log(`Indexed chunk\nPage ${pageNumber !== null ? pageNumber : "null"}\nChunk ${globalChunkIndex - 1}`);
    });

    console.log(`[Page ${pageNumber}] Native PDF text: ${pageText.length} chars | Chunks created: ${pageChunks.length}`);
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