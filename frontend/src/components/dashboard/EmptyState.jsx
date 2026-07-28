import React from "react";
import { Sparkles, FileUp, Cpu, Compass } from "lucide-react";
import { motion } from "framer-motion";

export function EmptyState({ onUploadClick }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-purple/20 to-brand-cyan/20 border border-brand-purple/30 flex items-center justify-center mb-6 shadow-glow-purple"
      >
        <Sparkles className="w-8 h-8 text-brand-cyan" />
      </motion.div>

      <h2 className="font-heading font-bold text-2xl text-white mb-2 tracking-tight">
        Welcome to DocuMind AI
      </h2>
      <p className="text-xs text-slate-400 leading-relaxed mb-8">
        Upload your first PDF document to build vector embeddings, extract executive summaries, and interact using streaming AI intelligence.
      </p>

      <button
        onClick={onUploadClick}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purple/90 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-purple transition-all active:scale-95 flex items-center space-x-2"
      >
        <FileUp className="w-4 h-4" />
        <span>Upload First PDF Document</span>
      </button>
    </div>
  );
}
