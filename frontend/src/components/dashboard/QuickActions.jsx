import React from "react";
import { Sparkles, HelpCircle, BookOpen, Key, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function QuickActions({ onActionSelect }) {
  const actions = [
    {
      id: "summarize",
      title: "Executive Summary",
      desc: "Generate a concise 2-3 paragraph overview of key takeaways.",
      prompt: "Can you provide a comprehensive executive summary of this document?",
      icon: Sparkles,
      color: "from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-400",
    },
    {
      id: "quiz",
      title: "Generate Quiz",
      desc: "Create 5 multiple choice questions based on document facts.",
      prompt: "Generate a 5-question quiz based on the key facts in this PDF with answer keys.",
      icon: HelpCircle,
      color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400",
    },
    {
      id: "concepts",
      title: "Explain Core Concepts",
      desc: "Break down complex topics into simple layperson terms.",
      prompt: "What are the main core concepts explained in this document? Break them down simply.",
      icon: BookOpen,
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400",
    },
    {
      id: "definitions",
      title: "Find Key Definitions",
      desc: "Extract key terminology, formulas, and definitions.",
      prompt: "List all key technical definitions, formulas, and terminology from this PDF.",
      icon: Key,
      color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mt-10">
      <div className="flex items-center justify-between mb-4 px-1">
        <h4 className="font-heading font-bold text-sm text-slate-300 uppercase tracking-wider">
          AI Quick Shortcuts
        </h4>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              onClick={() => onActionSelect && onActionSelect(action.prompt)}
              className="group cursor-pointer rounded-xl p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-brand-purple/40 backdrop-blur-md transition-all duration-200 relative overflow-hidden"
            >
              <div className="flex items-start space-x-3.5 relative z-10">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="font-heading font-semibold text-sm text-slate-100 group-hover:text-brand-cyan transition-colors">
                      {action.title}
                    </h5>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {action.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
