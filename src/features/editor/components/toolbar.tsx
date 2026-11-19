"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Download,
  FileUp,
  FolderOpen,
  LoaderCircle,
  Plus,
  Redo2,
  Shapes,
  Undo2,
} from "lucide-react";
import { useEditorStore } from "../store";

interface ToolbarProps {
  onNewDocument: () => void;
  onOpenDocument: (id: string) => void;
  onImport: (file: File) => void;
  onExportJson: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
}

export function Toolbar({
  onNewDocument,
  onOpenDocument,
  onImport,
  onExportJson,
  onExportSvg,
  onExportPng,
}: ToolbarProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const title = useEditorStore((state) => state.title);
  const setTitle = useEditorStore((state) => state.setTitle);
  const documentId = useEditorStore((state) => state.documentId);
  const documents = useEditorStore((state) => state.documents);
  const saveState = useEditorStore((state) => state.saveState);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);

  const saveLabel = {
    loading: "Loading",
    saving: "Saving",
    saved: "Saved on this device",
    error: "Save failed",
  }[saveState];

  return (
    <header className="editor-header">
      <Link className="brand" href="/" aria-label="Graynebula home">
        <span className="brand-mark">
          <Shapes size={19} strokeWidth={2.2} />
        </span>
        <span>graynebula</span>
        <span className="brand-edition">studio</span>
      </Link>

      <div className="header-divider" />

      <div className="document-title">
        <input
          aria-label="Diagram name"
          value={title}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
        />
        <span className={`save-indicator save-indicator--${saveState}`}>
          {saveState === "saving" || saveState === "loading" ? (
            <LoaderCircle size={13} className="spin" />
          ) : saveState === "saved" ? (
            <Check size={13} />
          ) : null}
          {saveLabel}
        </span>
      </div>

      <div className="header-spacer" />

      <div className="header-actions">
        <div className="history-actions" aria-label="History">
          <button
            className="icon-button"
            type="button"
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
            onClick={undo}
          >
            <Undo2 size={17} />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
            disabled={!canRedo}
            onClick={redo}
          >
            <Redo2 size={17} />
          </button>
        </div>

        <details className="action-menu">
          <summary className="secondary-button">
            <FolderOpen size={16} />
            <span>My diagrams</span>
            <ChevronDown size={14} />
          </summary>
          <div className="menu-popover document-menu">
            <div className="menu-heading">Saved on this device</div>
            <button className="menu-action menu-action--primary" type="button" onClick={onNewDocument}>
              <Plus size={16} />
              New diagram
            </button>
            <div className="menu-separator" />
            {documents.length > 0 ? (
              documents.map((document) => (
                <button
                  className={`document-option${document.id === documentId ? " is-current" : ""}`}
                  key={document.id}
                  type="button"
                  onClick={() => onOpenDocument(document.id)}
                >
                  <span className="document-option__icon">
                    <Shapes size={15} />
                  </span>
                  <span className="document-option__text">
                    <strong>{document.title}</strong>
                    <small>{new Date(document.updatedAt).toLocaleDateString()}</small>
                  </span>
                </button>
              ))
            ) : (
              <p className="menu-empty">Your saved diagrams will appear here.</p>
            )}
            <div className="menu-separator" />
            <button
              className="menu-action"
              type="button"
              onClick={() => fileInput.current?.click()}
            >
              <FileUp size={16} />
              Import diagram…
            </button>
          </div>
        </details>

        <input
          ref={fileInput}
          className="visually-hidden"
          type="file"
          accept=".json,.graynebula"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImport(file);
            event.target.value = "";
          }}
        />

        <details className="action-menu">
          <summary className="primary-button">
            <Download size={16} />
            <span>Export</span>
            <ChevronDown size={14} />
          </summary>
          <div className="menu-popover export-menu">
            <div className="menu-heading">Export diagram</div>
            <button className="menu-action" type="button" onClick={onExportJson}>
              <Download size={16} />
              Graynebula JSON
            </button>
            <button className="menu-action" type="button" onClick={onExportSvg}>
              <Download size={16} />
              SVG image
            </button>
            <button className="menu-action" type="button" onClick={onExportPng}>
              <Download size={16} />
              PNG image
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}
