"use client";

import { useCallback, useEffect } from "react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MarkerType,
  ReactFlow,
  useReactFlow,
  type Connection,
  type EdgeChangeset,
  type NodeChangeset,
} from "@xyflow/react";
import { Minus, Plus, Scan } from "lucide-react";
import {
  createDiagramNode,
  getShapePlacementOffset,
  type DiagramEdge,
  type DiagramNode,
} from "../model";
import { useEditorStore } from "../store";
import { getShapeDefinition } from "../shape-catalog";
import { ShapeFormatToolbar } from "./shape-format-toolbar";
import { ShapeNode } from "./shape-node";

const nodeTypes = { diagramShape: ShapeNode };

export function DiagramCanvas() {
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow<
    DiagramNode,
    DiagramEdge
  >();
  const nodes = useEditorStore((state) => state.nodes);
  const edges = useEditorStore((state) => state.edges);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const viewport = useEditorStore((state) => state.viewport);
  const setNodes = useEditorStore((state) => state.setNodes);
  const setEdges = useEditorStore((state) => state.setEdges);
  const setViewport = useEditorStore((state) => state.setViewport);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  const onNodesChange = useCallback(
    (changes: NodeChangeset<DiagramNode>) => {
      setNodes(changes.applyTo(useEditorStore.getState().nodes));
    },
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChangeset<DiagramEdge>) => {
      setEdges(changes.applyTo(useEditorStore.getState().edges));
    },
    [setEdges],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const state = useEditorStore.getState();
      state.commitHistory();
      state.setEdges(
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, color: "#78849a" },
            style: { stroke: "#78849a", strokeWidth: 1.8 },
          },
          useEditorStore.getState().edges,
        ),
      );
    },
    [],
  );

  const addShapeAt = useCallback(
    (shapeId: string, screenPosition: { x: number; y: number }) => {
      const shape = getShapeDefinition(shapeId);
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

  const addShapeToCenter = useCallback(
    (shapeId: string) => {
      const canvas = document.querySelector(".react-flow")?.getBoundingClientRect();
      const { x, y } = getShapePlacementOffset(useEditorStore.getState().nodes.length);
      const center = canvas
        ? {
            x: canvas.left + canvas.width / 2 + x,
            y: canvas.top + canvas.height / 2 + y,
          }
        : {
            x: window.innerWidth / 2 + x,
            y: window.innerHeight / 2 + y,
          };
      addShapeAt(shapeId, center);
    },
    [addShapeAt],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }

      const isMac = navigator.platform.toLowerCase().includes("mac");
      const modifierPressed = isMac ? event.metaKey : event.ctrlKey;
      if (modifierPressed && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) useEditorStore.getState().redo();
        else useEditorStore.getState().undo();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        const state = useEditorStore.getState();
        const selectedNodes = state.nodes.filter((node) => node.selected);
        const selectedEdges = state.edges.filter((edge) => edge.selected);
        if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

        event.preventDefault();
        state.commitHistory();
        state.setNodes(state.nodes.filter((node) => !node.selected));
        state.setEdges(state.edges.filter((edge) => !edge.selected));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="canvas-stage">
      <ReactFlow<DiagramNode, DiagramEdge>
        key={useEditorStore.getState().documentId ?? "new"}
        className="diagram-flow"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={({ nodes: selectedNodes }) =>
          useEditorStore
            .getState()
            .setSelectedNodeId(selectedNodes[0]?.id ?? null)
        }
        zIndexMode="manual"
        connectionMode={ConnectionMode.Loose}
        onNodeDragStart={() => useEditorStore.getState().commitHistory()}
        onMoveEnd={(_, nextViewport) => setViewport(nextViewport)}
        defaultViewport={viewport}
        defaultEdgeOptions={{
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed, color: "#78849a" },
          style: { stroke: "#78849a", strokeWidth: 1.8 },
        }}
        deleteKeyCode={null}
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.15}
        maxZoom={2.5}
        onDrop={(event) => {
          event.preventDefault();
          const shapeId = event.dataTransfer.getData("application/graynebula-shape");
          if (shapeId) addShapeAt(shapeId, { x: event.clientX, y: event.clientY });
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        aria-label="Diagram canvas"
      >
        <Background
          color="#dce2ec"
          gap={22}
          size={1.2}
          variant={BackgroundVariant.Dots}
        />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>

      {selectedNode && <ShapeFormatToolbar node={selectedNode} />}

      <div className="canvas-zoom-controls" aria-label="Canvas zoom controls">
        <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => zoomOut()}>
          <Minus size={15} />
        </button>
        <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => zoomIn()}>
          <Plus size={15} />
        </button>
        <span className="zoom-divider" />
        <button
          type="button"
          aria-label="Fit diagram to view"
          title="Fit diagram to view"
          onClick={() => fitView({ padding: 0.18, duration: 250 })}
        >
          <Scan size={15} />
        </button>
      </div>

      {nodes.length === 0 && (
        <div className="canvas-empty-state" aria-hidden="true">
          <div className="empty-canvas-icon">
            <Plus size={18} />
          </div>
          <strong>Your canvas is ready</strong>
          <span>Choose a shape from the library to get started</span>
        </div>
      )}

      <div className="canvas-status">
        <span className="canvas-status-dot" />
        {nodes.length} {nodes.length === 1 ? "shape" : "shapes"}
        <span className="canvas-status-separator">·</span>
        {edges.length} {edges.length === 1 ? "connector" : "connectors"}
      </div>

      <button
        className="canvas-add-helper"
        type="button"
        onClick={() => addShapeToCenter("rectangle")}
      >
        <Plus size={15} />
        Add shape
      </button>
    </div>
  );
}
