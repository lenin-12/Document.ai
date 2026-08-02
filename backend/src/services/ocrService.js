import fs from "fs";
import path from "path";
import os from "os";
import pdfPoppler from "pdf-poppler";
import Tesseract from "tesseract.js";

/**
 * Perform OCR on a specific page of a PDF by writing it temporarily to disk,
 * rendering it as an image, running Tesseract.js, and cleaning up.
 * 
 * @param {Buffer} pdfBuffer - The PDF file content in memory
 * @param {number} pageNumber - The 1-based page number to OCR
 * @returns {Promise<string>} The extracted text from the page
 */
export const ocrPdfPage = async (pdfBuffer, pageNumber) => {
  // Create a unique temporary directory for this conversion process
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-ocr-"));
  const tempPdfPath = path.join(tempDir, "document.pdf");
  
  try {
    // Write PDF buffer to temporary file
    fs.writeFileSync(tempPdfPath, pdfBuffer);

    const outPrefix = "page";
    const options = {
      format: "png",
      out_dir: tempDir,
      out_prefix: outPrefix,
      page: pageNumber,
    };

    console.log(`[OCR] Converting PDF page ${pageNumber} to image...`);
    await pdfPoppler.convert(tempPdfPath, options);

    // Read the temp directory to locate the generated image file.
    // poppler names files as prefix-1.png, prefix-01.png, etc. depending on page count.
    const files = fs.readdirSync(tempDir);
    const imageFile = files.find(
      (file) =>
        file.startsWith(`${outPrefix}-${pageNumber}`) ||
        file.startsWith(`${outPrefix}-${String(pageNumber).padStart(2, "0")}`) ||
        file.startsWith(`${outPrefix}-${String(pageNumber).padStart(3, "0")}`)
    );

    if (!imageFile) {
      throw new Error(`Failed to render page ${pageNumber} to image.`);
    }

    const imagePath = path.join(tempDir, imageFile);
    console.log(`[OCR] Running Tesseract OCR on page ${pageNumber}...`);
    
    // Perform OCR on the image path
    const result = await Tesseract.recognize(imagePath, "eng");
    const ocrText = result.data.text || "";
    
    console.log(`[OCR] Successfully extracted ${ocrText.trim().length} characters from page ${pageNumber}.`);
    return ocrText;
  } catch (error) {
    console.error(`[OCR Error] Page ${pageNumber} failed:`, error.message);
    throw error;
  } finally {
    // Ensure all temporary files are completely cleaned up
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.error("[OCR Cleanup Error] Failed to delete temp directory:", cleanupError.message);
    }
  }
};
