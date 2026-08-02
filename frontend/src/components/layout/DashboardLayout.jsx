import React from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function DashboardLayout({
  children,
  currentDoc,
  documents,
  onSelectDoc,
  onDeleteDoc,
  onRenameDoc,
  onNewUpload,
  onOpenSettings,
  onTriggerUpload,
}) {
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
      />

      {/* Body: Sidebar + Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <Sidebar
          documents={documents}
          currentDocId={currentDoc?.docId}
          onSelectDoc={onSelectDoc}
          onDeleteDoc={onDeleteDoc}
          onRenameDoc={onRenameDoc}
          onNewUpload={onNewUpload}
        />

        {/* Main Viewport Content Area */}
        <main className="flex-1 h-[calc(100vh-3.5rem)] overflow-y-auto relative flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
