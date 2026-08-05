import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Copy,
  Check,
  HelpCircle,
  Award,
  BookOpen,
  Briefcase,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeResumeApi } from "../services/api";

export function ResumeAnalyzer() {
  // State for Resume File
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeDragActive, setResumeDragActive] = useState(false);
  const [resumeError, setResumeError] = useState(null);
  const resumeFileInputRef = useRef(null);

  // State for Job Description Selection (paste vs pdf)
  const [jdMode, setJdMode] = useState("paste"); // "paste" | "pdf"
  const [jdText, setJdText] = useState("");

  // State for JD File
  const [jdFile, setJdFile] = useState(null);
  const [jdDragActive, setJdDragActive] = useState(false);
  const [jdError, setJdError] = useState(null);
  const jdFileInputRef = useRef(null);

  // API Execution States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [globalError, setGlobalError] = useState(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Resume File Validation & Processing
  const validateResume = (file) => {
    if (!file) return false;
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setResumeError("Please select a valid PDF document (.pdf).");
      return false;
    }
    if (file.size > 15 * 1024 * 1024) {
      setResumeError("File size exceeds 15MB limit.");
      return false;
    }
    setResumeError(null);
    return true;
  };

  const handleResumeDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setResumeDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateResume(file)) {
        setResumeFile(file);
      }
    }
  };

  const handleResumeSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateResume(file)) {
        setResumeFile(file);
      }
    }
  };

  // Job Description PDF Validation & Processing
  const validateJd = (file) => {
    if (!file) return false;
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setJdError("Please select a valid PDF document (.pdf).");
      return false;
    }
    if (file.size > 15 * 1024 * 1024) {
      setJdError("File size exceeds 15MB limit.");
      return false;
    }
    setJdError(null);
    return true;
  };

  const handleJdDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setJdDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateJd(file)) {
        setJdFile(file);
      }
    }
  };

  const handleJdSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateJd(file)) {
        setJdFile(file);
      }
    }
  };

  // Copy optimization helper
  const handleCopySummary = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Trigger analysis action calling node API
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setGlobalError(null);
    setAnalysisResult(null);

    try {
      const targetJdFile = jdMode === "pdf" ? jdFile : null;
      const targetJdText = jdMode === "paste" ? jdText : "";

      console.log("[Resume Analyzer] Invoking backend API endpoint...");
      const response = await analyzeResumeApi(resumeFile, targetJdFile, targetJdText);
      
      if (response.success && response.analysis) {
        setAnalysisResult(response.analysis);
      } else {
        setGlobalError("Failed to fetch structured analysis. Empty backend response.");
      }
    } catch (err) {
      console.error("[Resume Analyzer API Error]:", err);
      const errMsg = err.response?.data?.error || err.message || "Network error during resume analysis.";
      setGlobalError(errMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset Analyzer State to scan another file
  const handleReset = () => {
    setResumeFile(null);
    setJdFile(null);
    setJdText("");
    setAnalysisResult(null);
    setGlobalError(null);
    if (resumeFileInputRef.current) resumeFileInputRef.current.value = "";
    if (jdFileInputRef.current) jdFileInputRef.current.value = "";
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-8 max-w-5xl mx-auto w-full overflow-y-auto">
      {/* Title & Subtitle */}
      <div className="text-center mb-8">
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
          Resume Analyzer
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-2 leading-relaxed">
          Analyze your resume against a job description using AI.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* State 1: Loading/Processing Screen */}
        {isAnalyzing && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 flex flex-col items-center justify-center py-16"
          >
            <div className="relative mb-6">
              {/* Outer rotating glow ring */}
              <div className="w-20 h-20 rounded-full border-4 border-t-brand-purple border-r-brand-cyan border-b-transparent border-l-transparent animate-spin" />
              <BrainCircuit className="w-8 h-8 text-brand-cyan absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <h3 className="font-heading font-bold text-lg text-white mb-2">Analyzing Resume Match...</h3>
            <p className="text-xs text-slate-400 max-w-sm text-center leading-relaxed">
              Extracting text content, running semantic keyword matches, checking ATS format rules, and compiling shortlist suitability.
            </p>
          </motion.div>
        )}

        {/* State 2: Results Dashboard */}
        {!isAnalyzing && analysisResult && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Top Score Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl relative overflow-hidden flex items-center justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-purple/5 rounded-full blur-2xl pointer-events-none" />
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Overall Match</span>
                  <span className="text-3xl font-extrabold font-heading text-white">{analysisResult.overallScore}</span>
                  <span className="text-xs text-slate-500 font-medium block mt-1">out of 100</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple shadow-glow-purple">
                  <Award className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl relative overflow-hidden flex items-center justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/5 rounded-full blur-2xl pointer-events-none" />
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">ATS keyword score</span>
                  <span className="text-3xl font-extrabold font-heading text-white">{analysisResult.atsScore}</span>
                  <span className="text-xs text-slate-500 font-medium block mt-1">ATS compatibility</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan shadow-glow-cyan">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl relative overflow-hidden flex items-center justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Skill Match</span>
                  <span className="text-3xl font-extrabold font-heading text-white">{analysisResult.matchPercentage}%</span>
                  <span className="text-xs text-slate-500 font-medium block mt-1">core skills matched</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <BrainCircuit className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Hiring Recommendation Banner */}
            <div className={`p-5 rounded-2xl border backdrop-blur-xl ${
              analysisResult.hiringRecommendation?.decision === "Likely to Shortlist"
                ? "bg-emerald-500/[0.02] border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                : analysisResult.hiringRecommendation?.decision === "Maybe"
                ? "bg-amber-500/[0.02] border-amber-500/20"
                : "bg-red-500/[0.02] border-red-500/20"
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Hiring Recommendation</span>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                <div>
                  <h4 className={`font-heading font-extrabold text-lg ${
                    analysisResult.hiringRecommendation?.decision === "Likely to Shortlist"
                      ? "text-emerald-400"
                      : analysisResult.hiringRecommendation?.decision === "Maybe"
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}>
                    {analysisResult.hiringRecommendation?.decision}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    {analysisResult.hiringRecommendation?.explanation}
                  </p>
                </div>
              </div>
            </div>

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
                <h3 className="font-heading font-bold text-sm text-emerald-400 mb-3 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Key Strengths</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {analysisResult.strengths?.map((str, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
                <h3 className="font-heading font-bold text-sm text-red-400 mb-3 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Key Gaps / Weaknesses</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {analysisResult.weaknesses?.map((weak, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Keyword Comparison badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
                <h3 className="font-heading font-bold text-sm text-indigo-300 mb-3 block">Matched ATS Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.matchedSkills?.map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                      {skill}
                    </span>
                  ))}
                  {(!analysisResult.matchedSkills || analysisResult.matchedSkills.length === 0) && (
                    <span className="text-xs text-slate-500">No matching skills found.</span>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
                <h3 className="font-heading font-bold text-sm text-indigo-300 mb-3 block">Missing Keywords / Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.missingSkills?.map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-medium">
                      {skill}
                    </span>
                  ))}
                  {(!analysisResult.missingSkills || analysisResult.missingSkills.length === 0) && (
                    <span className="text-xs text-emerald-400 font-medium">100% Keyword Matching!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section Breakdown Feedback Accordion Cards */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl space-y-4">
              <h3 className="font-heading font-bold text-sm text-white mb-2">Section Critiques</h3>
              
              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-semibold text-xs text-slate-200 flex items-center space-x-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-brand-purple" />
                    <span>Experience Alignment</span>
                  </span>
                  <span className="text-xs text-brand-purple font-bold bg-brand-purple/10 px-2 py-0.5 rounded">
                    Score: {analysisResult.experienceAnalysis?.score}/100
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                  {analysisResult.experienceAnalysis?.feedback}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-semibold text-xs text-slate-200 flex items-center space-x-1.5">
                    <Award className="w-3.5 h-3.5 text-brand-cyan" />
                    <span>Projects Evaluation</span>
                  </span>
                  <span className="text-xs text-brand-cyan font-bold bg-brand-cyan/10 px-2 py-0.5 rounded">
                    Score: {analysisResult.projectAnalysis?.score}/100
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                  {analysisResult.projectAnalysis?.feedback}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-semibold text-xs text-slate-200 flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Education Compatibility</span>
                  </span>
                  <span className="text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">
                    Score: {analysisResult.educationAnalysis?.score}/100
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                  {analysisResult.educationAnalysis?.feedback}
                </p>
              </div>
            </div>

            {/* Current Summary Critique & Rewritten Optimized Summary */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl space-y-4">
              <div>
                <h3 className="font-heading font-bold text-sm text-white mb-1">Professional Summary Analysis</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {analysisResult.resumeSummary}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-brand-purple/5 border border-brand-purple/20 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold text-xs text-brand-cyan uppercase tracking-wider block">
                    Optimized AI Professional Summary
                  </span>
                  <button
                    onClick={() => handleCopySummary(analysisResult.improvedSummary)}
                    className="p-1 rounded bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all flex items-center space-x-1.5 text-[10px]"
                    title="Copy to clipboard"
                  >
                    {copiedSummary ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSummary ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed italic">
                  "{analysisResult.improvedSummary}"
                </p>
              </div>
            </div>

            {/* Priority Suggestions */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
              <h3 className="font-heading font-bold text-sm text-brand-cyan mb-3 flex items-center space-x-2">
                <Lightbulb className="w-4 h-4" />
                <span>Priority Action Recommendations</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {analysisResult.prioritySuggestions?.map((sug, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-brand-purple font-extrabold text-[11px] mt-0.5">{idx + 1}.</span>
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Interview Questions */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
              <h3 className="font-heading font-bold text-sm text-indigo-300 mb-3 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4" />
                <span>Custom Interview Preparation Questions</span>
              </h3>
              <div className="space-y-2.5">
                {analysisResult.interviewQuestions?.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white/[0.01] border border-white/[0.04] text-xs text-slate-300 flex items-start space-x-3">
                    <span className="px-2 py-0.5 rounded bg-brand-purple/10 border border-brand-purple/20 text-brand-cyan text-[10px] font-bold flex-shrink-0">
                      Q{idx + 1}
                    </span>
                    <span className="leading-relaxed">{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Back Button / Reset to analyze another resume */}
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold transition-all hover:text-white"
              >
                Analyze Another Resume
              </button>
            </div>
          </motion.div>
        )}

        {/* State 3: Base Forms Upload (Initial View) */}
        {!isAnalyzing && !analysisResult && (
          <motion.div
            key="input-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Global API Error */}
            {globalError && (
              <div className="px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{globalError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {/* Section 1: Resume Upload Card */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-brand-purple/20 text-brand-purple flex items-center justify-center font-heading text-xs font-bold">1</span>
                  <h2 className="font-heading font-semibold text-base text-slate-200">Upload Resume</h2>
                </div>

                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setResumeDragActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setResumeDragActive(true);
                  }}
                  onDragLeave={() => setResumeDragActive(false)}
                  onDrop={handleResumeDrop}
                  onClick={() => !resumeFile && resumeFileInputRef.current?.click()}
                  className={`flex-1 min-h-[260px] relative group rounded-2xl p-6 transition-all duration-300 overflow-hidden backdrop-blur-xl border flex flex-col justify-center items-center text-center ${
                    resumeFile
                      ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                      : resumeDragActive
                      ? "border-brand-purple bg-brand-purple/10 shadow-glow-purple scale-[1.01] cursor-pointer"
                      : "border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.05] hover:border-brand-purple/40 hover:shadow-glow-purple cursor-pointer"
                  }`}
                >
                  {/* Glowing Blob */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />

                  <input
                    ref={resumeFileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleResumeSelect}
                    className="hidden"
                  />

                  <AnimatePresence mode="wait">
                    {resumeFile ? (
                      <motion.div
                        key="uploaded"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center p-2 z-10"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h4 className="font-heading font-semibold text-slate-200 text-sm mb-1">
                          Resume Uploaded Successfully
                        </h4>
                        <p className="text-xs text-emerald-400 font-medium max-w-xs truncate mb-4">
                          {resumeFile.name}
                        </p>
                        
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              resumeFileInputRef.current.value = "";
                              resumeFileInputRef.current.click();
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] text-slate-300 text-xs font-semibold transition-all"
                          >
                            Change File
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setResumeFile(null);
                              setResumeError(null);
                              if (resumeFileInputRef.current) resumeFileInputRef.current.value = "";
                            }}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center z-10"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-purple/20 to-brand-cyan/10 border border-brand-purple/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                          <UploadCloud className="w-6 h-6 text-brand-cyan" />
                        </div>
                        <h3 className="font-heading font-bold text-sm text-slate-200 mb-1">
                          Drag & Drop your Resume here
                        </h3>
                        <p className="text-[11px] text-slate-400 mb-4">or click to browse your files</p>
                        
                        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.04] border border-white/[0.08] text-slate-400">
                            <FileText className="w-3 h-3 text-brand-purple" />
                            <span>PDF Only</span>
                          </span>
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.04] border border-white/[0.08] text-slate-400">
                            <ShieldCheck className="w-3 h-3 text-brand-cyan" />
                            <span>Max 15MB</span>
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {resumeError && (
                    <div className="mt-3 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] flex items-center space-x-1.5 z-10">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{resumeError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Job Description Card */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-brand-purple/20 text-brand-purple flex items-center justify-center font-heading text-xs font-bold">2</span>
                    <h2 className="font-heading font-semibold text-base text-slate-200">Job Description</h2>
                  </div>

                  {/* Selection Options */}
                  <div className="flex items-center space-x-3 bg-white/[0.03] border border-white/[0.08] rounded-lg p-0.5 text-[11px] font-medium">
                    <button
                      type="button"
                      onClick={() => setJdMode("paste")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        jdMode === "paste"
                          ? "bg-brand-purple text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Paste Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setJdMode("pdf")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        jdMode === "pdf"
                          ? "bg-brand-purple text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Upload PDF
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-[260px]">
                  <AnimatePresence mode="wait">
                    {jdMode === "paste" ? (
                      <motion.div
                        key="paste"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 flex flex-col"
                      >
                        <textarea
                          value={jdText}
                          onChange={(e) => setJdText(e.target.value)}
                          placeholder="Paste the complete job description here..."
                          className="flex-1 w-full h-full min-h-[200px] rounded-2xl glass-input p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-purple/60 focus:ring-1 focus:ring-brand-purple/35 text-xs sm:text-sm resize-none transition-all"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="pdf"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          setJdDragActive(true);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setJdDragActive(true);
                        }}
                        onDragLeave={() => setJdDragActive(false)}
                        onDrop={handleJdDrop}
                        onClick={() => !jdFile && jdFileInputRef.current?.click()}
                        className={`flex-1 min-h-[200px] relative group rounded-2xl p-6 transition-all duration-300 overflow-hidden backdrop-blur-xl border flex flex-col justify-center items-center text-center ${
                          jdFile
                            ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                            : jdDragActive
                            ? "border-brand-purple bg-brand-purple/10 shadow-glow-purple scale-[1.01] cursor-pointer"
                            : "border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.05] hover:border-brand-purple/40 hover:shadow-glow-purple cursor-pointer"
                        }`}
                      >
                        {/* Glowing Blob */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />

                        <input
                          ref={jdFileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleJdSelect}
                          className="hidden"
                        />

                        {jdFile ? (
                          <div className="flex flex-col items-center p-2 z-10">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                            </div>
                            <h4 className="font-heading font-semibold text-slate-200 text-sm mb-1">
                              JD PDF Uploaded Successfully
                            </h4>
                            <p className="text-xs text-emerald-400 font-medium max-w-xs truncate mb-4">
                              {jdFile.name}
                            </p>
                            
                            <div className="flex items-center space-x-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  jdFileInputRef.current.value = "";
                                  jdFileInputRef.current.click();
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] text-slate-300 text-xs font-semibold transition-all"
                              >
                                Change File
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setJdFile(null);
                                  setJdError(null);
                                  if (jdFileInputRef.current) jdFileInputRef.current.value = "";
                                }}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all"
                                title="Remove file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center z-10">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-purple/20 to-brand-cyan/10 border border-brand-purple/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                              <UploadCloud className="w-6 h-6 text-brand-cyan" />
                            </div>
                            <h3 className="font-heading font-bold text-sm text-slate-200 mb-1">
                              Drag & Drop Job Description PDF
                            </h3>
                            <p className="text-[11px] text-slate-400 mb-4">or click to browse your files</p>
                            
                            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2">
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.04] border border-white/[0.08] text-slate-400">
                                <FileText className="w-3 h-3 text-brand-purple" />
                                <span>PDF Only</span>
                              </span>
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.04] border border-white/[0.08] text-slate-400">
                                <ShieldCheck className="w-3 h-3 text-brand-cyan" />
                                <span>Max 15MB</span>
                              </span>
                            </div>
                          </div>
                        )}

                        {jdError && (
                          <div className="mt-3 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] flex items-center space-x-1.5 z-10">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{jdError}</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Action Button Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex justify-center mt-4"
            >
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!resumeFile || (jdMode === "paste" ? !jdText.trim() : !jdFile)}
                className={`px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purple/90 hover:to-indigo-500 text-white font-semibold text-sm shadow-glow-purple transition-all duration-200 active:scale-95 flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-brand-purple disabled:hover:to-indigo-600 disabled:shadow-none disabled:scale-100`}
              >
                <Sparkles className="w-4 h-4 text-brand-cyan" />
                <span>Analyze Resume</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ResumeAnalyzer;
