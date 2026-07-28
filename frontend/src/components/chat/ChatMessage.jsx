import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  User,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Globe,
  Loader2,
} from "lucide-react";
import { SourceCard } from "./SourceCard";

export function ChatMessage({ message, docName = "Document.pdf" }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.sender === "user";

  const copyMessage = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`flex items-start space-x-3 my-4 ${
        isUser ? "flex-row-reverse space-x-reverse" : "flex-row"
      }`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
          isUser
            ? "bg-gradient-to-tr from-brand-purple to-indigo-600 text-white"
            : "bg-gradient-to-tr from-brand-purple/20 to-brand-cyan/20 border border-brand-purple/30 text-brand-cyan"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Bubble Body */}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 transition-all ${
          isUser
            ? "bg-gradient-to-r from-brand-purple to-indigo-600 text-white rounded-tr-none shadow-glow-purple"
            : "bg-white/[0.035] border border-white/[0.08] backdrop-blur-xl text-slate-100 rounded-tl-none"
        }`}
      >
        {/* Header Badge for AI */}
        {!isUser && (
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06] text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-heading font-semibold text-slate-300">DocuMind AI</span>
              {message.answerType === "rag" ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <BookOpen className="w-3 h-3" />
                  <span>PDF Context Grounded</span>
                </span>
              ) : message.answerType === "general" ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Globe className="w-3 h-3" />
                  <span>General AI Fallback</span>
                </span>
              ) : null}
            </div>

            <button
              onClick={copyMessage}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Copy message text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Loading Spinner / Stream Indicator */}
        {message.isLoading && !message.text ? (
          <div className="flex items-center space-x-2 text-slate-400 py-1 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-brand-cyan" />
            <span className="animate-pulse">Retrieving vector chunks & generating answer...</span>
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none leading-relaxed text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.text}
            </ReactMarkdown>
          </div>
        )}

        {/* Citations Section */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/[0.08]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
              <Sparkles className="w-3 h-3 text-brand-cyan" />
              <span>Retrieved PDF Citation Sources ({message.sources.length})</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {message.sources.map((src, idx) => (
                <SourceCard key={idx} source={src} docName={docName} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
