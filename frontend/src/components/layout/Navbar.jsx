import React, { useState } from "react";
import {
  Sparkles,
  Search,
  Settings,
  Sliders,
  FileText,
  UploadCloud,
  ChevronRight,
  Command,
} from "lucide-react";

export function Navbar({ currentDoc, onNewUpload, onOpenSettings }) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="h-14 bg-dark-950/80 backdrop-blur-xl border-b border-card-border px-4 flex items-center justify-between sticky top-0 z-40 select-none">
     
      <div className="flex items-center space-x-3">
        <div
          onClick={onNewUpload}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-purple to-brand-cyan p-[1px] shadow-glow-purple group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-dark-950 rounded-[7px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-cyan group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <span className="font-heading font-bold text-base tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Document<span className="text-brand-purple">.ai</span>
          </span>
        </div>

        {currentDoc && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <div className="flex items-center space-x-1.5 text-xs text-slate-300 bg-brand-purple/10 border border-brand-purple/20 px-2.5 py-1 rounded-md max-w-[200px] sm:max-w-[300px] truncate">
              <FileText className="w-3.5 h-3.5 text-brand-purple flex-shrink-0" />
              <span className="truncate">{currentDoc.filename}</span>
            </div>
          </>
        )}
      </div>

      
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onNewUpload}
          className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purple/90 hover:to-indigo-500 text-white shadow-glow-purple transition-all duration-200 active:scale-95"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload PDF</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all"
          title="Settings & System Status"
        >
          <Settings className="w-4 h-4" />
        </button>

       
        
      </div>
    </header>
  );
}
