import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, CornerDownLeft, StopCircle } from "lucide-react";

export function ChatInput({ onSendMessage, isLoading, disabled }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [text]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (text.trim() && !isLoading && !disabled) {
      onSendMessage(text.trim());
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-4xl mx-auto px-4 pb-4">
      <div className="relative rounded-2xl bg-dark-900/90 border border-card-border backdrop-blur-xl shadow-2xl transition-all focus-within:border-brand-purple/60 focus-within:shadow-glow-purple">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          placeholder="Ask any question about your PDF document... (Press Enter to send)"
          className="w-full bg-transparent px-4 py-3.5 pr-14 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none overflow-y-auto min-h-[48px] max-h-[160px]"
        />

        <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-white/[0.04] text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              <CornerDownLeft className="w-3 h-3 inline mr-0.5" /> Shift + Enter for new line
            </span>
            <button
              type="submit"
              disabled={!text.trim() || isLoading || disabled}
              className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                text.trim() && !isLoading && !disabled
                  ? "bg-gradient-to-r from-brand-purple to-indigo-600 text-white shadow-glow-purple hover:scale-105 active:scale-95"
                  : "bg-white/5 text-slate-600 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <StopCircle className="w-4 h-4 text-brand-cyan animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
