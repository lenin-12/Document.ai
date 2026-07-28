import React, { useState } from "react";
import { FileText, ExternalLink, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

export function SourceCard({ source, docName = "Document.pdf" }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const copySnippet = (e) => {
    e.stopPropagation();
    if (source.text) {
      navigator.clipboard.writeText(source.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-brand-purple/40 transition-all p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center text-brand-purple flex-shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="font-semibold text-slate-200 block truncate">{docName}</span>
            <span className="text-[10px] text-brand-cyan font-bold">
              Page {source.page || 1} • Chunk #{source.chunkIndex || source.id || 1}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={copySnippet}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Copy source text snippet"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Snippet content */}
      <div className={`mt-2 text-[11px] text-slate-400 leading-relaxed font-mono bg-black/30 p-2 rounded-lg border border-white/[0.04] ${expanded ? "" : "line-clamp-2"}`}>
        "{source.text || "Source passage retrieved from vector store."}"
      </div>
    </div>
  );
}
