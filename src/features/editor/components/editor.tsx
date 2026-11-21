"use client";

import { useCallback, useEffect, useRef } from "react";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { toPng, toSvg } from "html-to-image";
import { ShapeLibrary } from "./shape-library";
import { DiagramCanvas } from "./canvas";
import { Toolbar } from "./toolbar";
import {
  createBlankDocument,
  createDiagramNode,
  getShapePlacementOffset,
  DIAGRAM_FORMAT,
  DIAGRAM_SCHEMA_VERSION,
  parseDiagramDocument,
  type DiagramDocument,
  type DiagramEdge,
  type DiagramNode,
} from "../model";
import { deleteDiagram, listDiagrams, saveDiagram } from "../storage";
import { useEditorStore } from "../store";
import type { ShapeDefinition } from "../shape-catalog";

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

function fileNameFromTitle(title: string, extension: string): string {
  const safeTitle = title
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

  return `${safeTitle || "diagram"}.${extension}`;
}

function downloadUrl(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function EditorWorkspace() {
  const started = useRef(false);
  const { screenToFlowPosition } = useReactFlow<DiagramNode, DiagramEdge>();
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);
  const title = useEditorStore((state) => state.title);
  const documentId = useEditorStore((state) => state.documentId);
  const viewport = useEditorStore((state) => state.viewport);
  const initialized = useEditorStore((state) => state.initialized);
  const initializationError = useEditorStore((state) => state.initializationError);
  const notice = useEditorStore((state) => state.notice);
  const openDocument = useEditorStore((state) => state.openDocument);
  const setDocuments = useEditorStore((state) => state.setDocuments);
  const setSaveState = useEditorStore((state) => state.setSaveState);
  const setNotice = useEditorStore((state) => state.setNotice);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      try {
        let documents = await listDiagrams();
        if (documents.length === 0) {
          const firstDocument = await saveDiagram(createBlankDocument());
          documents = [firstDocument];
        }

        setDocuments(documents);
        openDocument(documents[0]);
      } catch (error) {
        useEditorStore
          .getState()
          .setInitializationError(
            `Local diagrams could not be opened. Check your browser storage settings and reload. ${messageFromError(error)}`,
          );
      }
    })();
  }, [openDocument, setDocuments]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice, setNotice]);

  useEffect(() => {
    if (!initialized || !documentId) return;

    setSaveState("saving");
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const document: DiagramDocument = {
            format: DIAGRAM_FORMAT,
            schemaVersion: DIAGRAM_SCHEMA_VERSION,
            id: documentId,
            title: title.trim() || "Untitled diagram",
            createdAt:
              useEditorStore
                .getState()
                .documents.find((item) => item.id === documentId)?.createdAt ??
              Date.now(),
            updatedAt: Date.now(),
            nodes,
            edges,
            viewport,
          };
          await saveDiagram(document);
          setSaveState("saved");
          setDocuments(await listDiagrams());
        } catch (error) {
          setSaveState("error");
          setNotice(`Autosave failed: ${messageFromError(error)}`);
        }
      })();
    }, 450);

    return () => window.clearTimeout(timer);
  }, [
    documentId,
    edges,
    initialized,
    nodes,
    setDocuments,
    setNotice,
    setSaveState,
    title,
    viewport,
  ]);

  const refreshDocuments = useCallback(async () => {
    setDocuments(await listDiagrams());
  }, [setDocuments]);

  const handleNewDocument = useCallback(async () => {
    try {
      const document = await saveDiagram(createBlankDocument());
      await refreshDocuments();
      openDocument(document);
    } catch (error) {
      setNotice(`Could not create a diagram: ${messageFromError(error)}`);
    }
  }, [openDocument, refreshDocuments, setNotice]);

  const handleOpenDocument = useCallback(
    async (id: string) => {
      try {
        const document = await listDiagrams().then((items) =>
          items.find((item) => item.id === id),
        );
        if (!document) throw new Error("That diagram could not be found in local storage.");
        openDocument(document);
      } catch (error) {
        setNotice(`Could not open diagram: ${messageFromError(error)}`);
      }
    },
    [openDocument, setNotice],
  );

  const handleDeleteDocument = useCallback(
    async (id: string) => {
      const document = useEditorStore
        .getState()
        .documents.find((item) => item.id === id);
      if (!document) return;
      if (!window.confirm(`Delete "${document.title}"?`)) return;

      try {
        await deleteDiagram(id);
        const remaining = await listDiagrams();

        if (useEditorStore.getState().documentId === id) {
          if (remaining.length > 0) {
            openDocument(remaining[0]);
          } else {
            const blankDocument = await saveDiagram(createBlankDocument());
            openDocument(blankDocument);
            remaining.push(blankDocument);
          }
        }

        setDocuments(remaining);
        setNotice(`Deleted "${document.title}".`);
      } catch (error) {
        setNotice(`Could not delete diagram: ${messageFromError(error)}`);
      }
    },
    [openDocument, setDocuments, setNotice],
  );

  const handleImport = useCallback(
    async (file: File) => {
      try {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Diagram files must be smaller than 10 MB.");
        }
        const parsed = parseDiagramDocument(JSON.parse(await file.text()));
        const imported = await saveDiagram({
          ...parsed,
          id: crypto.randomUUID(),
          title: `${parsed.title} copy`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        await refreshDocuments();
        openDocument(imported);
        setNotice("Diagram imported and saved on this device.");
      } catch (error) {
        setNotice(`Import failed: ${messageFromError(error)}`);
      }
    },
    [openDocument, refreshDocuments, setNotice],
  );

  const handleExportJson = useCallback(() => {
    if (!documentId) return;
    const document: DiagramDocument = {
      format: DIAGRAM_FORMAT,
      schemaVersion: DIAGRAM_SCHEMA_VERSION,
      id: documentId,
      title: title.trim() || "Untitled diagram",
      createdAt:
        useEditorStore
          .getState()
          .documents.find((item) => item.id === documentId)?.createdAt ??
        Date.now(),
      updatedAt: Date.now(),
      nodes,
      edges,
      viewport,
    };
    const blob = new Blob([JSON.stringify(document, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    downloadUrl(url, fileNameFromTitle(title, "graynebula"));
  }, [documentId, edges, nodes, title, viewport]);

  const exportImage = useCallback(
    async (format: "svg" | "png") => {
      const target = document.querySelector<HTMLElement>(
        ".react-flow__viewport",
      );
      if (!target) {
        setNotice("The canvas is not ready to export yet.");
        return;
      }

      try {
        const isLightTheme =
          document.documentElement.dataset.theme === "light";
        const options = {
          backgroundColor: isLightTheme ? "#ffffff" : "#000000",
          pixelRatio: 2,
          filter: (element: HTMLElement) =>
            !element.classList?.contains("react-flow__background"),
        };
        const url =
          format === "svg"
            ? await toSvg(target, options)
            : await toPng(target, options);
        downloadUrl(url, fileNameFromTitle(title, format));
      } catch (error) {
        setNotice(`${format.toUpperCase()} export failed: ${messageFromError(error)}`);
      }
    },
    [setNotice, title],
  );

  const handleAddShape = useCallback(
    (shape: ShapeDefinition) => {
      const canvas = document.querySelector(".react-flow")?.getBoundingClientRect();
      const { x, y } = getShapePlacementOffset(useEditorStore.getState().nodes.length);
      const screenPosition = canvas
        ? {
            x: canvas.left + canvas.width / 2 + x,
            y: canvas.top + canvas.height / 2 + y,
          }
        : {
            x: window.innerWidth / 2 + x,
            y: window.innerHeight / 2 + y,
          };
      const state = useEditorStore.getState();
      state.commitHistory();
      state.setNodes([
        ...state.nodes,
        createDiagramNode(
          shape.id,
          shape.label,
          screenToFlowPosition(screenPosition),
          { width: shape.width, height: shape.height },
        ),
      ]);
    },
    [screenToFlowPosition],
  );

  if (initializationError) {
    return (
      <main className="startup-error">
        <div className="startup-error__card">
          <span className="brand-mark">
            <span className="brand-mark__glyph">G</span>
          </span>
          <p className="eyebrow">LOCAL STORAGE UNAVAILABLE</p>
          <h1>Your diagrams could not be loaded</h1>
          <p>{initializationError}</p>
          <button className="primary-button" onClick={() => window.location.reload()}>
            Reload editor
          </button>
        </div>
      </main>
    );
  }

  if (!initialized) {
    return (
      <main className="loading-screen">
        <span className="brand-mark">
          <span className="brand-mark__glyph">G</span>
        </span>
        <span>Opening your local workspace…</span>
      </main>
    );
  }

  return (
    <main className="editor-app">
      <Toolbar
        onNewDocument={() => void handleNewDocument()}
        onOpenDocument={(id) => void handleOpenDocument(id)}
        onDeleteDocument={(id) => void handleDeleteDocument(id)}
        onImport={(file) => void handleImport(file)}
        onExportJson={handleExportJson}
        onExportSvg={() => void exportImage("svg")}
        onExportPng={() => void exportImage("png")}
      />
      <div className="editor-workspace">
        <ShapeLibrary onAddShape={handleAddShape} />
        <section className="canvas-column" aria-label="Diagram workspace">
          <DiagramCanvas />
        </section>
      </div>
      {notice && (
        <div className="toast-notice" role="status">
          <span className="toast-notice__dot" />
          {notice}
        </div>
      )}
      <footer className="editor-footer">
        <span>Private by design · Your diagrams stay in this browser</span>
        <span>Graynebula Diagram · Free forever</span>
      </footer>
    </main>
  );
}

export function Editor() {
  return (
    <ReactFlowProvider>
      <EditorWorkspace />
    </ReactFlowProvider>
  );
}
