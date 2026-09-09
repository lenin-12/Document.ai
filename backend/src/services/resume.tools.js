import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import OpenAI from "openai";

const getClient = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const resumeParserTool = new DynamicStructuredTool({
  name: "resume_parser",
  description: "Parses a raw resume string into structured data including skills, experience, education, projects, certifications, and achievements.",
  schema: z.object({
    resumeText: z.string().describe("The raw extracted text from the candidate's resume PDF"),
  }),
  func: async ({ resumeText }) => {
    console.log("[Tool: resume_parser] Parsing resume...");
    const client = getClient();
    const prompt = `Extract the following structured information from the resume text below.
Do not invent information. If a section is missing, return an empty array.

{
  "skills": ["skill1", "skill2"],
  "experience": [{"role": "", "company": "", "duration": "", "description": ""}],
  "education": [{"degree": "", "institution": "", "year": ""}],
  "projects": [{"name": "", "description": "", "technologies": []}],
  "certifications": [],
  "achievements": []
}

Resume Text:
"""
${resumeText}
"""`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are an expert resume parser. Always return ONLY valid JSON matching the schema." },
        { role: "user", content: prompt }
      ]
    });
    return response.choices[0].message.content;
  }
});

export const jdParserTool = new DynamicStructuredTool({
  name: "jd_parser",
  description: "Parses a raw job description string into structured data including required/preferred skills, responsibilities, and qualifications.",
  schema: z.object({
    jdText: z.string().describe("The raw text from the job description"),
  }),
  func: async ({ jdText }) => {
    console.log("[Tool: jd_parser] Parsing job description...");
    const client = getClient();
    const prompt = `Extract the following structured information from the job description text below.

{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "responsibilities": ["resp1", "resp2"],
  "qualifications": ["qual1", "qual2"],
  "experienceRequirements": ["exp1"]
}

Job Description:
"""
${jdText}
"""`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are an expert job description parser. Always return ONLY valid JSON." },
        { role: "user", content: prompt }
      ]
    });
    return response.choices[0].message.content;
  }
});

export const skillMatcherTool = new DynamicStructuredTool({
  name: "skill_matcher",
  description: "Compares resume skills against JD skills and deterministically calculates a match percentage.",
  schema: z.object({
    resumeSkills: z.array(z.string()).describe("List of skills extracted from the resume"),
    jdRequiredSkills: z.array(z.string()).describe("List of required skills extracted from the JD"),
    jdPreferredSkills: z.array(z.string()).describe("List of preferred skills extracted from the JD")
  }),
  func: async ({ resumeSkills, jdRequiredSkills, jdPreferredSkills }) => {
    console.log("[Tool: skill_matcher] Matching skills...");
    const client = getClient();
    const prompt = `Compare the following Resume Skills against the Job Description (JD) Skills.
Identify which JD skills are explicitly or semantically present in the Resume Skills.

{
  "matchedSkills": ["skills present in both"],
  "missingSkills": ["skills in JD but missing in Resume"],
  "partialMatches": ["skills partially matching or lacking depth"]
}

Resume Skills: ${JSON.stringify(resumeSkills)}
JD Required Skills: ${JSON.stringify(jdRequiredSkills)}
JD Preferred Skills: ${JSON.stringify(jdPreferredSkills)}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are an expert ATS skill matcher. Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ]
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    
    // Deterministic match calculation
    const totalJdSkills = jdRequiredSkills.length + jdPreferredSkills.length;
    let matchPercentage = 0;
    
    if (totalJdSkills > 0) {
       const matchedCount = (result.matchedSkills || []).length;
       const partialCount = (result.partialMatches || []).length;
       // Weight matches fully, partial matches at 50%
       matchPercentage = Math.round(((matchedCount + (partialCount * 0.5)) / totalJdSkills) * 100);
       matchPercentage = Math.min(100, Math.max(0, matchPercentage));
    } else {
       matchPercentage = resumeSkills.length > 0 ? 100 : 0;
    }
    
    result.matchPercentage = matchPercentage;
    return JSON.stringify(result);
  }
});

export const atsScorerTool = new DynamicStructuredTool({
  name: "ats_scorer",
  description: "Evaluates the parsed resume against the parsed JD and skill match result to produce a weighted ATS-style score.",
  schema: z.object({
    parsedResume: z.any().describe("The structured resume data"),
    parsedJd: z.any().describe("The structured JD data"),
    skillMatchResult: z.any().describe("The result from the skill_matcher tool")
  }),
  func: async ({ parsedResume, parsedJd, skillMatchResult }) => {
    console.log("[Tool: ats_scorer] Calculating ATS scores...");
    const client = getClient();
    
    const prompt = `Evaluate the candidate's resume against the job description.
Provide sub-scores from 0 to 100 for the following categories based on alignment:
- keywordScore (keyword alignment and ATS parseability)
- experienceScore (relevance and depth of work history)
- projectScore (relevance of projects)
- educationScore (alignment with educational requirements)
- structureScore (resume structure, clarity, and formatting)

Also provide a short explanation summarizing the scoring rationale.

Return JSON EXACTLY like this:
{
  "keywordScore": 0,
  "experienceScore": 0,
  "projectScore": 0,
  "educationScore": 0,
  "structureScore": 0,
  "explanation": "..."
}

Resume Data: ${JSON.stringify(parsedResume)}
JD Data: ${JSON.stringify(parsedJd)}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are an expert ATS scoring engine. Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ]
    });
    
    const scores = JSON.parse(response.choices[0].message.content);
    const skillScore = skillMatchResult.matchPercentage || 0;
    
    // Deterministic overall score calculation based on explicit weights
    // Skill: 40%, Keyword: 20%, Experience: 15%, Projects: 10%, Education: 5%, Structure: 10%
    const overallScore = Math.round(
      (skillScore * 0.40) +
      (scores.keywordScore * 0.20) +
      (scores.experienceScore * 0.15) +
      (scores.projectScore * 0.10) +
      (scores.educationScore * 0.05) +
      (scores.structureScore * 0.10)
    );
    
    return JSON.stringify({
      overallScore: Math.min(100, Math.max(0, overallScore)),
      skillScore,
      keywordScore: scores.keywordScore,
      experienceScore: scores.experienceScore,
      projectScore: scores.projectScore,
      educationScore: scores.educationScore,
      structureScore: scores.structureScore,
      explanation: scores.explanation
    });
  }
});

export const gapAnalyzerTool = new DynamicStructuredTool({
  name: "gap_analyzer",
  description: "Identifies and prioritizes gaps in the candidate's resume compared to the JD.",
  schema: z.object({
    parsedResume: z.any().describe("The structured resume data"),
    parsedJd: z.any().describe("The structured JD data"),
    skillMatchResult: z.any().describe("The result from the skill_matcher tool"),
    atsScoreResult: z.any().describe("The result from the ats_scorer tool")
  }),
  func: async ({ parsedResume, parsedJd, skillMatchResult, atsScoreResult }) => {
    console.log("[Tool: gap_analyzer] Analyzing gaps...");
    const client = getClient();
    const prompt = `Analyze the gaps between the candidate's resume and the job description based on the provided data.
Prioritize the gaps based on their critical impact on hiring.

Return a structured JSON EXACTLY like this:
{
  "criticalGaps": ["gap description - HIGH/MEDIUM/LOW"],
  "skillGaps": ["skill gap 1", "skill gap 2"],
  "experienceGaps": ["experience gap 1"],
  "keywordGaps": ["keyword gap 1"],
  "projectGaps": ["project gap 1"],
  "priority": ["1. AWS experience missing - HIGH", "2. ..."]
}

Resume Data: ${JSON.stringify(parsedResume)}
JD Data: ${JSON.stringify(parsedJd)}
Skill Match: ${JSON.stringify(skillMatchResult)}
ATS Scores: ${JSON.stringify(atsScoreResult)}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are an expert talent acquisition gap analyzer. Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ]
    });
    
    return response.choices[0].message.content;
  }
});

export const recommendationGeneratorTool = new DynamicStructuredTool({
  name: "recommendation_generator",
  description: "Generates actionable recommendations based on all previous analysis to improve the resume.",
  schema: z.object({
    parsedResume: z.any().describe("The structured resume data"),
    parsedJd: z.any().describe("The structured JD data"),
    gapAnalysisResult: z.any().describe("The result from the gap_analyzer tool")
  }),
  func: async ({ parsedResume, parsedJd, gapAnalysisResult }) => {
    console.log("[Tool: recommendation_generator] Generating recommendations...");
    const client = getClient();
    const prompt = `Generate actionable recommendations to improve the resume for this specific job description.
CRITICAL: Recommendations must be grounded in the actual resume and JD. Do NOT invent or fabricate experience the candidate does not have. Focus on highlighting, restructuring, or identifying real skills to learn.

Return a structured JSON EXACTLY like this:
{
  "resumeChanges": ["change 1", "change 2"],
  "skillsToHighlight": ["skill 1", "skill 2"],
  "skillsToLearn": ["skill 1"],
  "projectsToImprove": ["project improvement 1"],
  "keywordsToAdd": ["keyword 1", "keyword 2"],
  "experienceImprovements": ["improvement 1"]
}

Resume Data: ${JSON.stringify(parsedResume)}
JD Data: ${JSON.stringify(parsedJd)}
Gap Analysis: ${JSON.stringify(gapAnalysisResult)}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are an expert career coach and resume writer. Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ]
    });
    
    return response.choices[0].message.content;
  }
});
