import { ChatOpenAI } from "@langchain/openai";
import { createOpenAIToolsAgent, AgentExecutor } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import {
  extractTextFromPdf,
  cleanText,
} from "../utils/resumeParser.js";

import {
  resumeParserTool,
  jdParserTool,
  skillMatcherTool,
  atsScorerTool,
  gapAnalyzerTool,
  recommendationGeneratorTool,
} from "./resume.tools.js";


const SYSTEM_PROMPT = `You are an expert Talent Acquisition Agent. Your task is to analyze a candidate's resume against a job description.

You MUST call your tools in the following sequence to build a complete analysis:
  1. resume_parser      — parse the resume text into structured data.
  2. jd_parser          — parse the JD text into structured data.
  3. skill_matcher      — compare resume skills vs JD skills (pass outputs from step 1 & 2).
  4. ats_scorer         — calculate ATS sub-scores (pass outputs from steps 1, 2 & 3).
  5. gap_analyzer       — identify and prioritize gaps (pass outputs from steps 1, 2, 3 & 4).
  6. recommendation_generator — generate actionable improvements (pass outputs from steps 1, 2 & 5).

Do NOT skip any step. Do NOT call a tool before its dependencies are ready.
After all tools have been called, synthesize their outputs into the final JSON answer.

CRITICAL — Your FINAL answer must be a raw JSON object (no markdown code fences, no prose outside the JSON).

The JSON must match this schema exactly:

{{
  "overallScore": <integer 0-100>,
  "atsScore": <integer 0-100>,
  "matchPercentage": <integer 0-100>,
  "strengths": ["<strength>"],
  "weaknesses": ["<weakness or gap>"],
  "matchedSkills": ["<matched skill>"],
  "missingSkills": ["<missing skill>"],
  "experienceAnalysis": {{
    "score": <0-100>,
    "feedback": "<detailed feedback>"
  }},
  "educationAnalysis": {{
    "score": <0-100>,
    "feedback": "<detailed feedback>"
  }},
  "projectAnalysis": {{
    "score": <0-100>,
    "feedback": "<detailed feedback>"
  }},
  "resumeSummary": "<critique of the current professional summary>",
  "prioritySuggestions": ["<actionable suggestion>"],
  "improvedSummary": "<completely rewritten professional summary tailored to this JD>",
  "hiringRecommendation": {{
    "decision": "Likely to Shortlist",
    "explanation": "<justification>"
  }},
  "interviewQuestions": ["<interview question>"]
}}

Valid values for hiringRecommendation.decision:
"Likely to Shortlist", "Maybe", "Needs Improvement".`;


export const analyzeResumeAndJd = async (files, jobDescriptionText) => {
  const resume = files.resume ? files.resume[0] : null;
  const jdFile = files.jdFile ? files.jdFile[0] : null;

  if (!resume) {
    throw new Error("Missing resume PDF file.");
  }


  console.log(
    `[Resume Agent] Extracting resume text: ${resume.originalname}`
  );

  let resumeText;

  try {
    const raw = await extractTextFromPdf(
      resume.buffer,
      resume.originalname
    );

    resumeText = cleanText(raw);
  } catch (err) {
    console.error(
      "[Resume Agent] Resume PDF extraction failed:",
      err.message
    );

    throw new Error(
      `Failed to read resume PDF: ${err.message}`
    );
  }

  if (!resumeText.trim()) {
    throw new Error(
      "Resume PDF appears to be empty or unreadable."
    );
  }


  let jdText = "";

  if (jdFile) {
    console.log(
      `[Resume Agent] Extracting JD text: ${jdFile.originalname}`
    );

    try {
      const raw = await extractTextFromPdf(
        jdFile.buffer,
        jdFile.originalname
      );

      jdText = cleanText(raw);
    } catch (err) {
      console.error(
        "[Resume Agent] JD PDF extraction failed:",
        err.message
      );

      throw new Error(
        `Failed to read JD PDF: ${err.message}`
      );
    }
  } else if (jobDescriptionText) {
    console.log(
      "[Resume Agent] Using pasted job description."
    );

    jdText = cleanText(jobDescriptionText);
  }


  if (!jdText.trim()) {
    throw new Error("Job description is empty.");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not configured."
    );
  }


  const tools = [
    resumeParserTool,
    jdParserTool,
    skillMatcherTool,
    atsScorerTool,
    gapAnalyzerTool,
    recommendationGeneratorTool,
  ];


  const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o-mini",
    temperature: 0.1,
  });


  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],

    [
      "human",
      "Resume Text:\n{resumeText}\n\nJob Description Text:\n{jobDescriptionText}\n\nBegin the analysis now.",
    ],

    new MessagesPlaceholder("agent_scratchpad"),
  ]);


  console.log(
    "[Resume Agent] Initialising agent..."
  );

  let agent;

  try {
    agent = await createOpenAIToolsAgent({
      llm,
      tools,
      prompt,
    });
  } catch (err) {
    console.error(
      "[Resume Agent] Agent creation failed:",
      err.message
    );

    throw new Error(
      `Agent initialisation failed: ${err.message}`
    );
  }


  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    maxIterations: 8,
    returnIntermediateSteps: true,
    handleParsingErrors: true,
  });


  console.log(
    "[Resume Agent] Starting multi-step tool-calling loop..."
  );

  let result;

  try {
    result = await agentExecutor.invoke({
      resumeText,
      jobDescriptionText: jdText,
    });
  } catch (err) {
    console.error(
      "[Resume Agent] Executor threw:",
      err.message
    );

    throw new Error(
      `Agent execution failed: ${err.message}`
    );
  }


  const iterations =
    result.intermediateSteps?.length ?? 0;

  console.log(
    `[Resume Agent] Loop completed — ${iterations} tool call(s) made.`
  );


  if (iterations > 0) {
    result.intermediateSteps.forEach((step, i) => {
      const toolName =
        step.action?.tool ?? "unknown";

      console.log(
        `[Resume Agent]   Iteration ${i + 1}: ${toolName} completed.`
      );
    });
  }


  if (iterations >= 8) {
    console.warn(
      "[Resume Agent] maxIterations limit reached — returning best available output."
    );
  }


  let outputText =
    (result.output ?? "").trim();


  if (outputText.startsWith("```json")) {
    outputText = outputText.slice(7);

    if (outputText.endsWith("```")) {
      outputText = outputText.slice(0, -3);
    }

    outputText = outputText.trim();

  } else if (outputText.startsWith("```")) {
    outputText = outputText.slice(3);

    if (outputText.endsWith("```")) {
      outputText = outputText.slice(0, -3);
    }

    outputText = outputText.trim();
  }


  let parsedAnalysis;

  try {
    parsedAnalysis = JSON.parse(outputText);

  } catch (parseErr) {
    console.error(
      "[Resume Agent] Malformed JSON from agent — first 500 chars:"
    );

    console.error(
      outputText.slice(0, 500)
    );

    throw new Error(
      "Agent failed to produce a valid structured JSON response. Please try again."
    );
  }


  const clamp = (v) =>
    Math.min(
      100,
      Math.max(
        0,
        parseInt(v ?? 0, 10) || 0
      )
    );


  parsedAnalysis.overallScore =
    clamp(parsedAnalysis.overallScore);

  parsedAnalysis.atsScore =
    clamp(parsedAnalysis.atsScore);

  parsedAnalysis.matchPercentage =
    clamp(parsedAnalysis.matchPercentage);


  console.log(
    `[Resume Agent] Analysis complete — ` +
    `overallScore=${parsedAnalysis.overallScore}, ` +
    `atsScore=${parsedAnalysis.atsScore}, ` +
    `matchPercentage=${parsedAnalysis.matchPercentage}%`
  );


  return {
    success: true,
    analysis: parsedAnalysis,
  };
};