import React from "react";
import { X, CheckCircle, Shield, Cpu, Database, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SettingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-dark-900 border border-card-border rounded-2xl p-6 shadow-2xl relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-purple/10 border border-brand-purple/30 flex items-center justify-center text-brand-purple">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">System & Engine Settings</h3>
            </div>
          </div>

          <div className="space-y-4">
            {/* OpenAI LLM Status */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">LLM Model</p>
                  <p className="text-[11px] text-slate-400">OpenAI GPT-4o-mini (Streaming Enabled)</p>
                </div>
              </div>
            </div>

            {/* Vector DB status */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="w-4 h-4 text-brand-cyan" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">Vector Store Engine</p>
                  <p className="text-[11px] text-slate-400">ChromaDB + OpenAI Embeddings (3-small)</p>
                </div>
              </div>
            </div>

            {/* Text Splitting Parameters */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="w-4 h-4 text-brand-purple" />
                <p className="text-xs font-semibold text-slate-200">RAG Chunking Parameters</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
                <div className="bg-white/[0.02] p-2 rounded border border-white/[0.04]">
                  <span className="block text-[10px] text-slate-500">Chunk Size</span>
                  <span className="font-semibold text-slate-200">1,000 characters</span>
                </div>
                <div className="bg-white/[0.02] p-2 rounded border border-white/[0.04]">
                  <span className="block text-[10px] text-slate-500">Chunk Overlap</span>
                  <span className="font-semibold text-slate-200">200 characters</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-card-border flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-brand-purple text-white text-xs font-semibold hover:bg-brand-purple/90 transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
