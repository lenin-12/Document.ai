import { analyzeResumeAndJd } from "../services/resume.service.js";

/**
 * Controller to handle the Resume Analyzer API request.
 * Invokes the service to compare Resume PDF vs Job Description and returns the structured JSON report.
 */
export const analyzeResumeController = async (req, res, next) => {
  try {
    // files are populated by multer.fields()
    const files = req.files || {};
    const body = req.body || {};

    const jobDescription = body.jobDescription;

    console.log(`[Resume Controller] Triggering analysis pipeline. Resume file uploaded: ${!!files.resume}, JD File: ${!!files.jdFile}, JD Text Length: ${jobDescription?.length || 0}`);

    const result = await analyzeResumeAndJd(files, jobDescription);

    return res.status(200).json(result);
  } catch (error) {
    console.error("[Resume Controller] Exception encountered during analysis execution:", error.message);
    next(error);
  }
};
