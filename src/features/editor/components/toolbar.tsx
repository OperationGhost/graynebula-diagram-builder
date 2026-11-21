"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  Download,
  FileUp,
  FolderOpen,
  LoaderCircle,
  Moon,
  Plus,
  Redo2,
  Shapes,
  Trash2,
  Sun,
  Undo2,
} from "lucide-react";
import { useEditorStore } from "../store";

interface ToolbarProps {
  onNewDocument: () => void;
  onOpenDocument: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onImport: (file: File) => void;
  onExportJson: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
}

export function Toolbar({
  onNewDocument,
  onOpenDocument,
  onDeleteDocument,
  onImport,
  onExportJson,
  onExportSvg,
  onExportPng,
}: ToolbarProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const title = useEditorStore((state) => state.title);
  const setTitle = useEditorStore((state) => state.setTitle);
  const documentId = useEditorStore((state) => state.documentId);
  const documents = useEditorStore((state) => state.documents);
  const saveState = useEditorStore((state) => state.saveState);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);

  useEffect(() => {
    const savedTheme =
      window.localStorage.getItem("graynebula-theme") === "light"
        ? "light"
        : "dark";
    document.documentElement.dataset.theme = savedTheme;
    const frame = window.requestAnimationFrame(() => setTheme(savedTheme));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("graynebula-theme", nextTheme);
    window.dispatchEvent(new Event("graynebula-theme-change"));
  }

  const saveLabel = {
    loading: "Loading",
    saving: "Saving",
    saved: "Saved on this device",
    error: "Save failed",
  }[saveState];

  return (
    <header className="editor-header">
      <Link className="brand" href="/" aria-label="Graynebula Diagram home">
        <span className="brand-mark">
          <Image
            className="brand-mark__image"
            src="/graynebula-logo.png"
            alt=""
            width={48}
            height={32}
            sizes="28px"
          />
        </span>
        <span className="brand-name">
          <span className="brand-name__primary">Graynebula</span>
          <span className="brand-name__secondary">Diagram</span>
        </span>
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
            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
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
                <div
                  className={`document-option${document.id === documentId ? " is-current" : ""}`}
                  key={document.id}
                >
                  <button
                    className="document-option__open"
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
                  <button
                    className="document-option__delete"
                    type="button"
                    aria-label={`Delete ${document.title}`}
                    title={`Delete ${document.title}`}
                    onClick={() => onDeleteDocument(document.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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

        <button
          className="theme-toggle"
          type="button"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Light theme" : "Dark theme"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

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
