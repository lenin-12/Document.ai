import React, { useRef, useEffect, useState } from "react";
import {
  FileText,
  BookOpen,
  Layers,
  Sparkles,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Zap,
} from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { QuickActions } from "../dashboard/QuickActions";

export function ChatInterface({
  docData,
  messages,
  onSendMessage,
  isLoading,
  onNewUpload,
}) {
  const messagesEndRef = useRef(null);
  const [showDocDetails, setShowDocDetails] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 flex h-[calc(100vh-3.5rem)] overflow-hidden relative">
      {/* Left Document Context Inspector Drawer */}
      <div
        className={`${
          showDocDetails ? "w-80" : "w-0 hidden md:flex md:w-12"
        } bg-dark-950/60 backdrop-blur-xl border-r border-card-border transition-all duration-300 flex-col overflow-hidden relative z-20 flex-shrink-0`}
      >
        <div className="p-4 border-b border-card-border flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <FileText className="w-4 h-4 text-brand-purple flex-shrink-0" />
            <span className="font-heading font-semibold text-xs text-slate-200 truncate">
              {docData?.filename || "Document Inspector"}
            </span>
          </div>
          <button
            onClick={() => setShowDocDetails(!showDocDetails)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
          >
            {showDocDetails ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {showDocDetails && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-slate-500 font-medium block">Total Pages</span>
                <span className="text-sm font-bold text-slate-200">{docData?.pages || 1}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-slate-500 font-medium block">Vector Chunks</span>
                <span className="text-sm font-bold text-brand-cyan">{docData?.totalChunks || 0}</span>
              </div>
            </div>

            {/* Document Summary Accordion Box */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center space-x-2 text-slate-300 font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
                <span>Executive Summary</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {docData?.summary || "No summary available."}
              </p>
            </div>

            {/* AI Capability Badges */}
            <div className="p-4 rounded-xl bg-brand-purple/5 border border-brand-purple/20">
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-cyan block mb-2">
                Hybrid RAG Modes
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                <li className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Semantic Vector Retrieval (k=4)</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                  <span>GPT-4o-mini Answer Generation</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                  <span>General Knowledge Fallback</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Right Main Chat Thread Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050816] relative">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="my-auto py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 border border-brand-purple/30 flex items-center justify-center mx-auto mb-4 text-brand-cyan shadow-glow-purple">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-lg text-white">
                  Start Asking Questions
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
                  Document AI will query vector chunks from <span className="text-slate-200 font-semibold">{docData?.filename}</span> 
                </p>

                {/* Quick actions grid inside empty chat */}
                <QuickActions onActionSelect={onSendMessage} />
              </div>
            ) : (
              messages.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  message={msg}
                  docName={docData?.filename || "Document.pdf"}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating Chat Input */}
        <ChatInput
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          disabled={!docData?.docId}
        />
      </div>
    </div>
  );
}
