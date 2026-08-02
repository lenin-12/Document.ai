import React, { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { UploadCard } from "./components/dashboard/UploadCard";
import { ProcessingLoader } from "./components/dashboard/ProcessingLoader";
import { QuickActions } from "./components/dashboard/QuickActions";
import { SummaryCard } from "./components/dashboard/SummaryCard";
import { ChatInterface } from "./components/chat/ChatInterface";
import { SettingsModal } from "./components/modals/SettingsModal";
import { uploadPdfApi, sendQuestionStreamApi } from "./services/api";
import { AlertCircle, Sparkles } from "lucide-react";

const STORAGE_KEY = "DOCUMIND_DOCUMENT_HISTORY";

export function App() {
  const [step, setStep] = useState(1); // 1: Upload Workspace, 2: Executive Summary, 3: Chat Interface
  const [docData, setDocData] = useState(null);
  const [documentsHistory, setDocumentsHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFilename, setProcessingFilename] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [globalError, setGlobalError] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Programmatically trigger the hidden file picker
  const triggerFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // Handle file selection from the shared file picker
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate PDF format
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        setGlobalError("Please select a valid PDF document (.pdf).");
        return;
      }
      
      // Validate 25MB file size
      if (file.size > 25 * 1024 * 1024) {
        setGlobalError("File size exceeds 25MB limit.");
        return;
      }

      setGlobalError(null);
      handleUpload(file);
    }
  };

  // Load document history from localStorage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setDocumentsHistory(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to parse document history from localStorage:", err);
    }
  }, []);

  // Save document history to localStorage when updated
  const saveHistory = (newList) => {
    setDocumentsHistory(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (err) {
      console.error("Failed to save document history to localStorage:", err);
    }
  };

  const handleUpload = async (file, onProgress) => {
    setGlobalError(null);
    setProcessingFilename(file.name);
    setIsProcessing(true);

    try {
      const response = await uploadPdfApi(file, onProgress);
      if (response.success && response.data) {
        const newDoc = {
          docId: response.data.docId,
          filename: response.data.filename || file.name,
          pages: response.data.pages || 1,
          totalChunks: response.data.totalChunks || 1,
          summary: response.data.summary || "",
          uploadedAt: new Date().toISOString(),
        };

        setDocData(newDoc);

        // Prepend to history without duplicates
        const filtered = documentsHistory.filter((d) => d.docId !== newDoc.docId);
        saveHistory([newDoc, ...filtered]);

        setStep(2);
      } else {
        setGlobalError(response.error || "Failed to process PDF document.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      const errMsg =
        err.response?.data?.error || err.message || "Network error while processing PDF.";
      setGlobalError(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectDocFromSidebar = (doc) => {
    setDocData(doc);
    setStep(3); // Jump directly into chat view for selected document
    setMessages([]);
    setGlobalError(null);
  };

  const handleDeleteDocFromSidebar = (docId) => {
    const updated = documentsHistory.filter((d) => d.docId !== docId);
    saveHistory(updated);
    if (docData?.docId === docId) {
      setDocData(null);
      setStep(1);
      setMessages([]);
    }
  };

  const handleRenameDocFromSidebar = (docId, newName) => {
    const updated = documentsHistory.map((d) =>
      d.docId === docId ? { ...d, filename: newName } : d
    );
    saveHistory(updated);
    if (docData?.docId === docId) {
      setDocData((prev) => (prev ? { ...prev, filename: newName } : null));
    }
  };

  const handleSendMessage = async (questionText) => {
    if (!docData?.docId) return;

    setGlobalError(null);

    const userMsg = { sender: "user", text: questionText };
    setMessages((prev) => [...prev, userMsg]);

    const placeholderAiMsg = {
      sender: "ai",
      text: "",
      isLoading: true,
      answerType: null,
      sources: [],
    };
    setMessages((prev) => [...prev, placeholderAiMsg]);
    setIsChatLoading(true);

    try {
      await sendQuestionStreamApi(docData.docId, questionText, {
        onMetadata: (metadata) => {
          setMessages((prev) =>
            prev.map((msg, idx) =>
              idx === prev.length - 1
                ? {
                    ...msg,
                    answerType: metadata.answerType,
                    sources: metadata.sources || [],
                    isLoading: false,
                  }
                : msg
            )
          );
        },
        onToken: (chunk) => {
          setMessages((prev) =>
            prev.map((msg, idx) =>
              idx === prev.length - 1
                ? { ...msg, text: msg.text + chunk, isLoading: false }
                : msg
            )
          );
        },
        onError: (errMsg) => {
          setMessages((prev) =>
            prev.map((msg, idx) =>
              idx === prev.length - 1
                ? {
                    ...msg,
                    text: `⚠️ **Error:** ${errMsg}`,
                    isLoading: false,
                  }
                : msg
            )
          );
        },
      });
    } catch (err) {
      console.error("Chat streaming error:", err);
      const errMsg = err.message || "Failed to stream response from backend.";
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === prev.length - 1
            ? {
                ...msg,
                text: `⚠️ **Error:** ${errMsg}`,
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleQuickActionSelect = (promptText) => {
    if (step === 1 && documentsHistory.length > 0) {
      // If user clicks quick action on main screen and history exists, load most recent doc
      const mostRecent = documentsHistory[0];
      setDocData(mostRecent);
      setStep(3);
      setTimeout(() => {
        handleSendMessage(promptText);
      }, 100);
    } else if (docData) {
      setStep(3);
      handleSendMessage(promptText);
    } else {
      setGlobalError("Please upload a PDF document first before running AI actions.");
    }
  };

  const handleStartChat = () => {
    setStep(3);
  };

  const handleNewUpload = () => {
    setStep(1);
    setDocData(null);
    setMessages([]);
    setGlobalError(null);
  };

  return (
    <DashboardLayout
      currentDoc={docData}
      documents={documentsHistory}
      onSelectDoc={handleSelectDocFromSidebar}
      onDeleteDoc={handleDeleteDocFromSidebar}
      onRenameDoc={handleRenameDocFromSidebar}
      onNewUpload={handleNewUpload}
      onOpenSettings={() => setIsSettingsOpen(true)}
      onTriggerUpload={triggerFilePicker}
    >
      {/* Global Error Banner */}
      {globalError && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2.5 text-center text-xs text-red-400 flex items-center justify-center space-x-2 z-40">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* WORKSPACE VIEW 1: Upload & Dashboard Landing */}
      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center px-4 py-8 max-w-5xl mx-auto w-full">
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
        <div className="flex-1 flex flex-col justify-center px-4 py-8 max-w-5xl mx-auto w-full">
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

      {/* System Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Hidden file input shared across navbar and dashboard card */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </DashboardLayout>
  );
}

export default App;
