import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { Sidebar } from "../components/Sidebar";
import { AlertCircle } from "lucide-react";

export function MainLayout({
  currentDoc,
  documents,
  onSelectDoc,
  onDeleteDoc,
  onRenameDoc,
  onNewUpload,
  onOpenSettings,
  onTriggerUpload,
  globalError,
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-screen bg-[#050816] text-slate-100 flex flex-col overflow-hidden relative selection:bg-brand-purple selection:text-white">
      {/* Background radial glow & ambient blobs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-brand-purple/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-brand-cyan/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <Navbar
        currentDoc={currentDoc}
        onNewUpload={onNewUpload}
        onOpenSettings={onOpenSettings}
        onTriggerUpload={onTriggerUpload}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Global Error Banner */}
      {globalError && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2.5 text-center text-xs text-red-400 flex items-center justify-center space-x-2 z-40">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Body Area */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <Sidebar
          documents={documents}
          currentDocId={currentDoc?.docId}
          onSelectDoc={onSelectDoc}
          onDeleteDoc={onDeleteDoc}
          onRenameDoc={onRenameDoc}
          onNewUpload={onNewUpload}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Viewport Content Area */}
        <main className="flex-1 h-[calc(100vh-3.5rem)] overflow-y-auto relative flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
