import { PromptTemplate } from "@langchain/core/prompts";


export const resumeAnalysisPrompt = new PromptTemplate({
  inputVariables: ["resumeText", "jobDescriptionText"],
  template: `You are an expert technical recruiter, senior talent acquisition manager, and Applicant Tracking System (ATS) optimization professional.
Compare the provided Resume Text against the Job Description (JD) Text to generate an intelligent structured analysis.

Resume Text:
"""
{resumeText}
"""

Job Description Text:
"""
{jobDescriptionText}
"""

Evaluate the candidate on their skills matching, experience relevance, projects relevance, education relevance, accomplishments/achievements, resume structure/keywords, ATS compliance, grammar, formatting, and professional summary.

CRITICAL OUTPUT RULES:
1. Return ONLY valid, stringified JSON.
2. Do NOT wrap the response in markdown blocks (like \`\`\`json or \`\`\`).
3. No conversational preambles, follow-ups, or notes outside the JSON structure.
4. Ensure all JSON keys are present and match the exact keys defined below.
5. All scores must be integers between 0 and 100.

JSON SCHEMA TO RETURN:
{{
  "overallScore": <integer: overall score 0-100 evaluating the candidate's total fit>,
  "atsScore": <integer: ATS score 0-100 evaluating keyword matching, format, and parseability>,
  "matchPercentage": <integer: 0-100 indicating core skill match percentage>,
  "strengths": [
    "<strength 1: e.g. strong experience in required technologies>",
    "<strength 2>",
    ...
  ],
  "weaknesses": [
    "<weakness 1: e.g. lack of direct experience in cloud infrastructure>",
    "<weakness 2>",
    ...
  ],
  "matchedSkills": [
    "<skill present in both resume and JD>",
    ...
  ],
  "missingSkills": [
    "<key skill or technology requested in JD but missing/weak in resume>",
    ...
  ],
  "experienceAnalysis": {{
    "score": <integer: 0-100>,
    "feedback": "<detailed critique of how candidate's job history, titles, scope, and seniority match the JD requirements>"
  }},
  "educationAnalysis": {{
    "score": <integer: 0-100>,
    "feedback": "<critique of educational background, major, degree levels, and specific certifications compared to requirements>"
  }},
  "projectAnalysis": {{
    "score": <integer: 0-100>,
    "feedback": "<evaluate project descriptions, technological alignment, impact, and check if metrics/quantification are present. Identify action verbs. Suggest better tech wording or phrasing.>"
  }},
  "resumeSummary": "<critique of the current professional summary or introduction in the resume, indicating its alignment with the job description>",
  "prioritySuggestions": [
    "<actionable suggestion 1 to optimize keywords, improve ATS format, or rephrase experience>",
    "<actionable suggestion 2>",
    ...
  ],
  "improvedSummary": "<a completely rewritten, highly optimized professional summary (3-4 sentences) tailored specifically to this Job Description, integrating key skills and experiences from the resume>",
  "hiringRecommendation": {{
    "decision": "Likely to Shortlist" | "Maybe" | "Needs Improvement",
    "explanation": "<short, professional explanation justifying the hiring decision based on strengths, gaps, and qualifications>"
  }},
  "interviewQuestions": [
    "<custom interview question 1 checking a strength or probing a potential gap/skill based on the resume and job description>",
    "<custom interview question 2>",
    ... (generate 5 to 10 questions)
  ]
}}
`
});
