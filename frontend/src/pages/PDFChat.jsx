import React from "react";
import { UploadCard } from "../components/dashboard/UploadCard";
import { ProcessingLoader } from "../components/dashboard/ProcessingLoader";
import { QuickActions } from "../components/dashboard/QuickActions";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import { ChatInterface } from "../components/chat/ChatInterface";

export function PDFChat({
  step,
  docData,
  isProcessing,
  processingFilename,
  isChatLoading,
  messages,
  handleUpload,
  setIsProcessing,
  triggerFilePicker,
  handleQuickActionSelect,
  handleStartChat,
  handleSendMessage,
  handleNewUpload,
}) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* WORKSPACE VIEW 1: Upload & Dashboard Landing */}
      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center px-4 py-8 max-w-5xl mx-auto w-full overflow-y-auto">
          {isProcessing ? (
            <ProcessingLoader filename={processingFilename} />
          ) : (
            <>
              {/* Header intro */}
              <div className="text-center mb-8">
                <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
                  Analyze & Chat with PDFs in Seconds
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-2 leading-relaxed">
                  Transforms PDF documents into interactive AI conversations.
                </p>
              </div>

              {/* Upload Card */}
              <UploadCard
                onUploadSuccess={handleUpload}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                onTriggerUpload={triggerFilePicker}
              />

              {/* Quick Actions Shortcuts Grid */}
              <QuickActions onActionSelect={handleQuickActionSelect} />
            </>
          )}
        </div>
      )}

      {/* WORKSPACE VIEW 2: Executive Summary Card */}
      {step === 2 && docData && (
        <div className="flex-1 flex flex-col justify-center px-4 py-8 max-w-5xl mx-auto w-full overflow-y-auto">
          <SummaryCard
            docData={docData}
            onStartChat={handleStartChat}
            onQuickPrompt={handleSendMessage}
          />
        </div>
      )}

      {/* WORKSPACE VIEW 3: Full Dual-Pane Chat Interface */}
      {step === 3 && docData && (
        <ChatInterface
          docData={docData}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isChatLoading}
          onNewUpload={handleNewUpload}
        />
      )}
    </div>
  );
}

export default PDFChat;
