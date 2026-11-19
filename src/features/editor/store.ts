import { create } from "zustand";
import type { DiagramDocument, DiagramEdge, DiagramNode, DiagramViewport } from "./model";

interface DiagramSnapshot {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

interface EditorState {
  documentId: string | null;
  title: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  viewport: DiagramViewport;
  documents: DiagramDocument[];
  selectedNodeId: string | null;
  initialized: boolean;
  initializationError: string | null;
  saveState: "loading" | "saved" | "saving" | "error";
  notice: string | null;
  past: DiagramSnapshot[];
  future: DiagramSnapshot[];
  openDocument: (document: DiagramDocument) => void;
  setDocuments: (documents: DiagramDocument[]) => void;
  setNodes: (nodes: DiagramNode[]) => void;
  setEdges: (edges: DiagramEdge[]) => void;
  setViewport: (viewport: DiagramViewport) => void;
  setTitle: (title: string) => void;
  setSaveState: (saveState: EditorState["saveState"]) => void;
  setNotice: (notice: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  setInitializationError: (message: string) => void;
  commitHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  documentId: null,
  title: "Untitled diagram",
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  documents: [],
  selectedNodeId: null,
  initialized: false,
  initializationError: null,
  saveState: "loading",
  notice: null,
  past: [],
  future: [],
  openDocument: (document) =>
    set({
      documentId: document.id,
      title: document.title,
      nodes: document.nodes,
      edges: document.edges,
      viewport: document.viewport,
      selectedNodeId: null,
      past: [],
      future: [],
      initialized: true,
      initializationError: null,
      saveState: "saved",
    }),
  setDocuments: (documents) => set({ documents }),
  setNodes: (nodes) =>
    set({
      nodes,
      selectedNodeId: nodes.find((node) => node.selected)?.id ?? null,
    }),
  setEdges: (edges) => set({ edges }),
  setViewport: (viewport) => set({ viewport }),
  setTitle: (title) => set({ title }),
  setSaveState: (saveState) => set({ saveState }),
  setNotice: (notice) => set({ notice }),
  setInitialized: (initialized) => set({ initialized }),
  setInitializationError: (message) =>
    set({ initializationError: message, saveState: "error" }),
  commitHistory: () => {
    const { nodes, edges, past } = get();
    set({
      past: [
        ...past,
        {
          nodes: nodes.map((node) => ({ ...node, selected: false })),
          edges: edges.map((edge) => ({ ...edge, selected: false })),
        },
      ].slice(-50),
      future: [],
    });
  },
  undo: () => {
    const { nodes, edges, past, future } = get();
    const previous = past[past.length - 1];
    if (!previous) return;

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      selectedNodeId: null,
      past: past.slice(0, -1),
      future: [
        {
          nodes: nodes.map((node) => ({ ...node, selected: false })),
          edges: edges.map((edge) => ({ ...edge, selected: false })),
        },
        ...future,
      ].slice(0, 50),
    });
  },
  redo: () => {
    const { nodes, edges, past, future } = get();
    const next = future[0];
    if (!next) return;

    set({
      nodes: next.nodes,
      edges: next.edges,
      selectedNodeId: null,
      past: [
        ...past,
        {
          nodes: nodes.map((node) => ({ ...node, selected: false })),
          edges: edges.map((edge) => ({ ...edge, selected: false })),
        },
      ].slice(-50),
      future: future.slice(1),
    });
  },
}));
