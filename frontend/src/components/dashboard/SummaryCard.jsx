import React from "react";
import {
  FileText,
  Layers,
  Sparkles,
  MessageSquare,
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Database,
} from "lucide-react";
import { motion } from "framer-motion";

export function SummaryCard({ docData, onStartChat, onQuickPrompt }) {
  if (!docData) return null;

  const { filename, pages, totalChunks, summary } = docData;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-3xl mx-auto my-auto p-8 rounded-2xl bg-dark-900/90 backdrop-blur-xl border border-card-border shadow-2xl relative overflow-hidden"
    >
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-brand-purple/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-card-border mb-6 gap-4 relative z-10">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-purple/30 to-brand-cyan/20 border border-brand-purple/40 flex items-center justify-center text-brand-cyan shadow-glow-purple flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Indexed & Ready
              </span>
            </div>
            <h3 className="font-heading font-bold text-lg text-white truncate mt-1">
              {filename}
            </h3>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center space-x-2 text-xs">
            <BookOpen className="w-3.5 h-3.5 text-brand-purple" />
            <span className="text-slate-300 font-semibold">{pages || 1}</span>
            <span className="text-slate-500">Pages</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center space-x-2 text-xs">
            <Layers className="w-3.5 h-3.5 text-brand-cyan" />
            <span className="text-slate-300 font-semibold">{totalChunks || 0}</span>
            <span className="text-slate-500">Vector Chunks</span>
          </div>
        </div>
      </div>

      {/* Executive Summary Body */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-4 h-4 text-brand-cyan" />
          <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-300">
            AI Executive Summary
          </h4>
        </div>
        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-200 text-sm leading-relaxed">
          {summary || "PDF document parsed and vectors stored successfully."}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-card-border relative z-10">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>HNSW Vector Indexing Completed</span>
        </div>

        <button
          onClick={onStartChat}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purple/90 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-purple transition-all active:scale-95 flex items-center justify-center space-x-2"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Start Chatting with PDF</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
