import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle, Sparkles, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function UploadCard({ onUploadSuccess, isProcessing, setIsProcessing, onTriggerUpload }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const validateFile = (file) => {
    if (!file) return false;
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Please select a valid PDF document (.pdf).");
      return false;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("File size exceeds 25MB limit.");
      return false;
    }
    setError(null);
    return true;
  };

  const processFile = async (file) => {
    if (!validateFile(file)) return;
    setSelectedFile(file);
    setIsProcessing(true);
    setError(null);

    try {
      await onUploadSuccess(file, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
      });
    } catch (err) {
      setError(err.message || "Failed to upload document.");
      setIsProcessing(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };



  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onTriggerUpload}
        className={`relative group cursor-pointer rounded-2xl p-8 transition-all duration-300 overflow-hidden backdrop-blur-xl border ${
          dragActive
            ? "border-brand-purple bg-brand-purple/10 shadow-glow-purple scale-[1.01]"
            : "border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.05] hover:border-brand-purple/40 hover:shadow-glow-purple"
        }`}
      >
        {/* Animated Background Blob & Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-purple/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-cyan/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />



        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Glowing Upload Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-purple/30 to-brand-cyan/20 border border-brand-purple/40 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-glow-purple">
            <UploadCloud className="w-8 h-8 text-brand-cyan" />
          </div>

          <h3 className="font-heading font-bold text-xl text-white mb-2 tracking-tight">
            Drop your PDF document here
          </h3>
          

         
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300">
              <FileText className="w-3 h-3 text-brand-purple" />
              <span>PDF Files Only</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Max Size 25MB</span>
            </span>
            
          </div>

          {/* File Picker CTA */}
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purple/90 hover:to-indigo-500 text-white font-semibold text-xs shadow-glow-purple transition-all active:scale-95 flex items-center space-x-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload File</span>
          </button>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-1.5"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
