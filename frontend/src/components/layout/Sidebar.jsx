import React, { useState } from "react";
import {
  FileText,
  Trash2,
  Edit2,
  FolderOpen,
  Plus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Layers,
  MoreVertical,
  X,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar({
  documents = [],
  currentDocId,
  onSelectDoc,
  onDeleteDoc,
  onRenameDoc,
  onNewUpload,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [editName, setEditName] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const startRename = (doc, e) => {
    e.stopPropagation();
    setEditingDocId(doc.docId);
    setEditName(doc.filename);
    setOpenMenuId(null);
  };

  const submitRename = (docId, e) => {
    e.stopPropagation();
    if (editName.trim()) {
      onRenameDoc(docId, editName.trim());
    }
    setEditingDocId(null);
  };

  return (
    <aside
      className={`relative h-[calc(100vh-3.5rem)] bg-dark-950/60 backdrop-blur-xl border-r border-card-border transition-all duration-300 flex flex-col z-30 select-none ${
        isCollapsed ? "w-16" : "w-72"
      }`}
    >
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white shadow-md z-40"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Top Header */}
      <div className="p-4 border-b border-card-border flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-brand-purple" />
            <span className="font-heading font-semibold text-xs text-slate-300 uppercase tracking-wider">
              Recent Documents
            </span>
            <span className="text-[10px] bg-brand-purple/20 text-brand-cyan px-2 py-0.5 rounded-full font-bold">
              {documents.length}
            </span>
          </div>
        ) : (
          <div className="mx-auto" title="Recent Documents">
            <Layers className="w-5 h-5 text-brand-purple" />
          </div>
        )}
      </div>

      {/* Upload New Document CTA */}
      <div className="p-3">
        <button
          onClick={onNewUpload}
          className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border border-dashed border-brand-purple/30 bg-brand-purple/5 hover:bg-brand-purple/10 text-brand-cyan text-xs font-medium transition-all ${
            isCollapsed ? "p-2" : ""
          }`}
        >
          <Plus className="w-4 h-4 text-brand-cyan flex-shrink-0" />
          {!isCollapsed && <span>Upload New PDF</span>}
        </button>
      </div>

      {/* PDF List Container */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {documents.length === 0 ? (
          !isCollapsed && (
            <div className="p-6 text-center text-slate-500">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
              <p className="text-xs font-medium text-slate-400">No documents yet</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Uploaded PDFs will appear here for easy access.
              </p>
            </div>
          )
        ) : (
          documents.map((doc) => {
            const isActive = doc.docId === currentDocId;
            const isEditing = editingDocId === doc.docId;

            return (
              <div
                key={doc.docId}
                onClick={() => onSelectDoc(doc)}
                className={`group relative rounded-lg p-2.5 transition-all cursor-pointer flex items-center ${
                  isActive
                    ? "bg-brand-purple/15 border border-brand-purple/40 text-white shadow-sm"
                    : "hover:bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-transparent"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-purple" />
                )}

                <div className="relative flex-shrink-0 mr-2.5">
                  <FileText
                    className={`w-4 h-4 ${
                      isActive ? "text-brand-cyan" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 absolute -bottom-1 -right-1 bg-dark-950 rounded-full" />
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0 pr-6">
                    {isEditing ? (
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full text-xs bg-dark-900 border border-brand-purple/50 rounded px-1.5 py-0.5 text-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={(e) => submitRename(doc.docId, e)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDocId(null);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-semibold truncate leading-tight">
                          {doc.filename}
                        </p>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-1">
                          <span>{doc.pages || 1} pages</span>               
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Context Menu Trigger */}
                {!isCollapsed && !isEditing && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === doc.docId ? null : doc.docId);
                      }}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {openMenuId === doc.docId && (
                      <div
                        className="absolute right-0 top-6 w-32 bg-dark-900 border border-card-border rounded-lg shadow-xl py-1 z-50 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => startRename(doc, e)}
                          className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-white/10 flex items-center space-x-2"
                        >
                          <Edit2 className="w-3 h-3 text-slate-400" />
                          <span>Rename</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDoc(doc.docId);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
    </aside>
  );
}
