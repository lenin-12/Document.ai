/**
 * Express middleware validator to check file upload fields and body params for the resume analysis endpoint.
 */
export const validateResumeAnalysisRequest = (req, res, next) => {
  const files = req.files || {};
  const body = req.body || {};

  const resume = files.resume ? files.resume[0] : null;
  const jdFile = files.jdFile ? files.jdFile[0] : null;
  const jobDescription = body.jobDescription;

  // 1. Validate Resume Presence
  if (!resume) {
    return res.status(400).json({
      success: false,
      error: "Missing resume PDF. Please upload a resume file in the 'resume' field.",
    });
  }

  // 2. Validate Resume is PDF
  const isResumePdf = 
    resume.mimetype === "application/pdf" || 
    resume.originalname.toLowerCase().endsWith(".pdf");
    
  if (!isResumePdf) {
    return res.status(400).json({
      success: false,
      error: "Invalid file format for resume. Only PDF documents (.pdf) are allowed.",
    });
  }

  // 3. Validate Job Description Presence (Either Text or File)
  const hasJdText = jobDescription && jobDescription.trim().length > 0;
  const hasJdFile = !!jdFile;

  if (!hasJdText && !hasJdFile) {
    return res.status(400).json({
      success: false,
      error: "Missing Job Description. Please provide either a plain text job description in the 'jobDescription' field OR upload a PDF in the 'jdFile' field.",
    });
  }

  // 4. Validate Job Description File is PDF if uploaded
  if (jdFile) {
    const isJdPdf = 
      jdFile.mimetype === "application/pdf" || 
      jdFile.originalname.toLowerCase().endsWith(".pdf");
      
    if (!isJdPdf) {
      return res.status(400).json({
        success: false,
        error: "Invalid file format for job description file. Only PDF documents (.pdf) are allowed.",
      });
    }
  }

  next();
};
