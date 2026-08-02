import { execFile } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Helper to determine the pdfimages binary path.
 * On Apple Silicon macOS, Homebrew binaries reside in /opt/homebrew/bin.
 */
const getPdfImagesCmd = () => {
  if (process.platform === "darwin" && process.arch === "arm64") {
    return "/opt/homebrew/bin/pdfimages";
  }
  return "pdfimages";
};

/**
 * Extract all images from a specific page of a PDF file using Poppler's native pdfimages utility.
 * 
 * @param {string} pdfPath - Path to the PDF file on disk
 * @param {number} pageNumber - The 1-based page number to extract images from
 * @param {string} outputDir - Directory to save the extracted images
 * @returns {Promise<Array<string>>} Absolute paths to all successfully extracted images
 */
export const extractImagesFromPage = (pdfPath, pageNumber, outputDir) => {
  return new Promise((resolve, reject) => {
    // Prefix for the output image files
    const outPrefix = path.join(outputDir, `page_${pageNumber}_img`);
    
    // Command args: -png format, -f (first page), -l (last page), pdfPath, outputPrefix
    const args = [
      "-png",
      "-f",
      pageNumber.toString(),
      "-l",
      pageNumber.toString(),
      pdfPath,
      outPrefix
    ];

    const cmd = getPdfImagesCmd();
    console.log(`[Image Extraction] Running: ${cmd} ${args.join(" ")}`);

    execFile(cmd, args, (err, stdout, stderr) => {
      if (err) {
        console.error(`[Image Extraction Error] Failed on page ${pageNumber}:`, err.message);
        reject(err);
      } else {
        try {
          // Read the output directory to find the generated files starting with our prefix
          const files = fs.readdirSync(outputDir);
          const pageImages = files
            .filter((file) => file.startsWith(`page_${pageNumber}_img`))
            .map((file) => path.join(outputDir, file));
          
          console.log(`[Image Extraction] Page ${pageNumber}: Extracted ${pageImages.length} images.`);
          resolve(pageImages);
        } catch (readErr) {
          reject(readErr);
        }
      }
    });
  });
};
