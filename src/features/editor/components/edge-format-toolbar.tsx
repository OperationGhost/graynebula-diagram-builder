"use client";

import { MarkerType } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import type { DiagramEdge } from "../model";
import { useEditorStore } from "../store";

interface EdgeFormatToolbarProps {
  edge: DiagramEdge;
}

export function EdgeFormatToolbar({ edge }: EdgeFormatToolbarProps) {
  function updateEdge(updater: (current: DiagramEdge) => DiagramEdge) {
    const state = useEditorStore.getState();
    const current = state.edges.find((item) => item.id === edge.id);
    if (!current) return;
    state.commitHistory();
    state.setEdges(
      state.edges.map((item) => (item.id === edge.id ? updater(current) : item)),
    );
  }

  function deleteEdge() {
    const state = useEditorStore.getState();
    state.commitHistory();
    state.setEdges(state.edges.filter((item) => item.id !== edge.id));
    state.setSelectedEdgeId(null);
  }

  const data = edge.data ?? {};
  const stroke = data.stroke ?? "#78849a";
  const strokeWidth = data.strokeWidth ?? 1.8;
  const lineStyle = data.lineStyle ?? "solid";
  const direction = data.direction ?? "end";

  return (
    <div className="edge-format-toolbar nodrag nopan" role="toolbar" aria-label="Selected connector formatting">
      <label className="edge-format-color" title="Line color">
        <span className="visually-hidden">Line color</span>
        <input
          type="color"
          aria-label="Line color"
          value={stroke}
          onFocus={() => useEditorStore.getState().commitHistory()}
          onChange={(event) => {
            const color = event.target.value;
            updateEdge((current) => ({
              ...current,
              data: { ...current.data, stroke: color },
              style: { ...current.style, stroke: color },
              markerStart: current.markerStart ? { type: MarkerType.ArrowClosed, color } : current.markerStart,
              markerEnd: current.markerEnd ? { type: MarkerType.ArrowClosed, color } : current.markerEnd,
            }));
          }}
        />
      </label>

      <span className="edge-format-separator" />

      <select
        className="edge-format-select"
        aria-label="Line width"
        title="Line width"
        value={String(strokeWidth)}
        onChange={(event) => {
          const width = Number(event.target.value);
          updateEdge((current) => ({
            ...current,
            data: { ...current.data, strokeWidth: width },
            style: { ...current.style, strokeWidth: width },
          }));
        }}
      >
        {[1, 1.5, 1.8, 2, 3, 4, 6, 8].map((width) => (
          <option key={width} value={width}>{width}px</option>
        ))}
      </select>

      <select
        className="edge-format-select"
        aria-label="Line style"
        title="Line style"
        value={lineStyle}
        onChange={(event) => {
          const nextStyle = event.target.value as "solid" | "dashed" | "dotted";
          const dashArray = nextStyle === "dashed" ? "10 7" : nextStyle === "dotted" ? "2 5" : undefined;
          updateEdge((current) => ({
            ...current,
            data: { ...current.data, lineStyle: nextStyle },
            style: { ...current.style, strokeDasharray: dashArray },
          }));
        }}
      >
        <option value="solid">Solid</option>
        <option value="dashed">Dashed</option>
        <option value="dotted">Dotted</option>
      </select>

      <select
        className="edge-format-select"
        aria-label="Arrow direction"
        title="Arrow direction"
        value={direction}
        onChange={(event) => {
          const nextDirection = event.target.value as "none" | "start" | "end" | "both";
          const marker = { type: MarkerType.ArrowClosed, color: stroke };
          updateEdge((current) => ({
            ...current,
            data: { ...current.data, direction: nextDirection },
            markerStart: nextDirection === "start" || nextDirection === "both" ? marker : undefined,
            markerEnd: nextDirection === "end" || nextDirection === "both" ? marker : undefined,
          }));
        }}
      >
        <option value="none">No arrows</option>
        <option value="start">Start arrow</option>
        <option value="end">End arrow</option>
        <option value="both">Both arrows</option>
      </select>

      <span className="edge-format-separator" />

      <button type="button" className="edge-format-delete" aria-label="Delete connector" title="Delete connector" onClick={deleteEdge}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}
