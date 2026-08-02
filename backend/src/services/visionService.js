import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

/**
 * Helper to fetch the Gemini API key from environment variables.
 * Looks for GEMINI_API_KEY, GOOGLE_API_KEY, and falls back to OPENAI_API_KEY.
 */
const getGeminiApiKey = () => {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY;
};

/**
 * Send an image to Gemini Vision (gemini-1.5-flash) to generate a detailed semantic description.
 * Instructs the model to skip decorative/empty elements and prioritize graphs/diagrams.
 * 
 * @param {string} imagePath - Absolute path to the image file on disk
 * @returns {Promise<string>} Standalone semantic description, or "SKIP" if decorative
 */
export const generateImageDescription = async (imagePath) => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured in environment variables (please add GEMINI_API_KEY, GOOGLE_API_KEY, or OPENAI_API_KEY in backend/.env).");
  }

  // Initialize Google GenAI SDK
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Use gemini-1.5-flash as it is fast, highly capable, and cost-effective for multimodal tasks
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const imageBuffer = fs.readFileSync(imagePath);
  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType: "image/png",
    },
  };

  const prompt = `You are an expert technical document analyzer. Analyze the provided image.
  
  CRITICAL RULE:
  If this image is a logo, icon, decorative graphic, separator, watermark, banner, or blank image, respond ONLY with the exact string "SKIP". Do NOT explain why, do not write anything else.

  Otherwise, provide a detailed semantic description of the graph, table, chart, diagram, screenshot, or illustration. Explain the key data, data trends, structure, workflow, or architectural flow depicted. Format your description as a clear, standalone paragraph.`;

  console.log(`[Gemini Vision] Sending image to Gemini API...`);
  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  const description = response.text().trim();

  return description;
};
