import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sparkles, Database, FileCode, Check } from "lucide-react";
import { motion } from "framer-motion";

export function ProcessingLoader({ filename = "Document.pdf" }) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { label: "Uploading PDF Document", icon: FileCode, desc: "Reading byte stream & validating structure" },
    { label: "Extracting Raw Text & Pages", icon: Loader2, desc: "Parsing PDF buffer & calculating page boundaries" },
    { label: "Generating Vector Embeddings", icon: Database, desc: "Chunking 1000-char passages with 200-char overlap" },
    { label: "Indexing in ChromaDB Vector Store", icon: Sparkles, desc: "Building HNSW vector distance graph & AI summary" },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setActiveStep(1), 1200);
    const timer2 = setTimeout(() => setActiveStep(2), 2500);
    const timer3 = setTimeout(() => setActiveStep(3), 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-xl mx-auto p-8 rounded-2xl bg-dark-900/90 backdrop-blur-xl border border-card-border shadow-2xl relative overflow-hidden"
    >
      {/* Subtle Glow Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/15 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center mb-8">
        <div className="inline-flex p-3 rounded-2xl bg-brand-purple/10 border border-brand-purple/30 text-brand-cyan mb-3 shadow-glow-purple">
          <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: "6s" }} />
        </div>
        <h3 className="font-heading font-bold text-lg text-white tracking-tight">
          Processing RAG Pipeline
        </h3>
        <p className="text-xs text-slate-400 mt-1 truncate max-w-md mx-auto">
          {filename}
        </p>
      </div>

      {/* Progress Steps List */}
      <div className="space-y-4 relative z-10">
        {steps.map((step, idx) => {
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center space-x-3.5 ${
                isDone
                  ? "bg-emerald-500/5 border-emerald-500/20 text-slate-200"
                  : isCurrent
                  ? "bg-brand-purple/10 border-brand-purple/40 text-white shadow-glow-purple"
                  : "bg-white/[0.02] border-white/[0.05] text-slate-500 opacity-60"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                  isDone
                    ? "bg-emerald-500/20 text-emerald-400"
                    : isCurrent
                    ? "bg-brand-purple/30 text-brand-cyan animate-pulse"
                    : "bg-white/5 text-slate-500"
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin text-brand-cyan" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">{step.label}</p>
                  {isDone && (
                    <span className="text-[10px] text-emerald-400 font-medium">Completed</span>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] text-brand-cyan font-medium animate-pulse">
                      In Progress...
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
