import OpenAI from "openai";
import { extractTextFromPdf, cleanText } from "../utils/resumeParser.js";
import { resumeAnalysisPrompt } from "../prompts/resumeAnalysis.prompt.js";

export const analyzeResumeAndJd = async (files, jobDescriptionText) => {
  const resume = files.resume ? files.resume[0] : null;
  const jdFile = files.jdFile ? files.jdFile[0] : null;

  if (!resume) {
    throw new Error("Missing resume PDF file.");
  }

  // Step 1: Extract Resume Text
  console.log(
    `[Resume Service] Extracting text from resume PDF: ${resume.originalname}`
  );

  let resumeRawText;
  try {
    resumeRawText = await extractTextFromPdf(
      resume.buffer,
      resume.originalname
    );
  } catch (error) {
    console.error("[Resume Service] Resume PDF parsing failed:", error);
    throw new Error(`Failed to read the resume PDF file: ${error.message}`);
  }

  const resumeText = cleanText(resumeRawText);

  // Step 2: Extract Job Description
  let jdText = "";

  if (jdFile) {
    console.log(
      `[Resume Service] Extracting text from JD PDF: ${jdFile.originalname}`
    );

    try {
      const jdRawText = await extractTextFromPdf(
        jdFile.buffer,
        jdFile.originalname
      );

      jdText = cleanText(jdRawText);
    } catch (error) {
      console.error("[Resume Service] JD PDF parsing failed:", error);
      throw new Error(`Failed to read the job description PDF: ${error.message}`);
    }
  } else if (jobDescriptionText) {
    console.log("[Resume Service] Using pasted Job Description");
    jdText = cleanText(jobDescriptionText);
  }

  if (!jdText.trim()) {
    throw new Error("Job description is empty.");
  }

  // Step 3: Check OpenAI API Key
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not configured in backend/.env"
    );
  }

  // Step 4: Build Prompt
  console.log("[Resume Service] Formatting Prompt...");

  const formattedPrompt = await resumeAnalysisPrompt.format({
    resumeText,
    jobDescriptionText: jdText,
  });

  // Step 5: Initialize OpenAI
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log("[Resume Service] Sending prompt to OpenAI...");

  let responseText = "";

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "You are an ATS Resume Analyzer. Always return ONLY valid JSON. Do not include markdown, explanations, or code fences.",
        },
        {
          role: "user",
          content: formattedPrompt,
        },
      ],
    });

    responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error("OpenAI returned an empty response.");
    }
  } catch (apiError) {
    console.error("[Resume Service] OpenAI API Error:", apiError);
    throw new Error(`OpenAI API Error: ${apiError.message}`);
  }

  // Step 6: Parse JSON
  try {
    const parsedAnalysis = JSON.parse(responseText);

    console.log("[Resume Service] Resume analysis generated successfully!");

    return {
      success: true,
      analysis: parsedAnalysis,
    };
  } catch (parseError) {
    console.error("[Resume Service] Invalid JSON received:");
    console.error(responseText);

    throw new Error(
      "Failed to parse OpenAI JSON response. The AI returned malformed JSON."
    );
  }
};