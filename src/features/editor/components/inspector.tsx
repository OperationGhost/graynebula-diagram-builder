"use client";

import { MarkerType } from "@xyflow/react";
import { useEditorStore } from "../store";
import type { DiagramEdge } from "../model";

export function Inspector() {
  const nodes = useEditorStore((state) => state.nodes);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const selectedEdgeId = useEditorStore((state) => state.selectedEdgeId);
  const edges = useEditorStore((state) => state.edges);
  const setNodes = useEditorStore((state) => state.setNodes);
  const setEdges = useEditorStore((state) => state.setEdges);
  const commitHistory = useEditorStore((state) => state.commitHistory);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);

  function updateSelectedNode(
    updater: (node: (typeof nodes)[number]) => (typeof nodes)[number],
  ) {
    if (!selectedNodeId) return;
    setNodes(nodes.map((node) => (node.id === selectedNodeId ? updater(node) : node)));
  }

  return (
    <aside className="side-panel inspector" aria-label="Properties">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">CANVAS DETAILS</p>
          <h2>{selectedNode || selectedEdge ? "Properties" : "Inspector"}</h2>
        </div>
      </div>

      {selectedNode ? (
        <div className="inspector-fields">
          <label className="field">
            <span>Text</span>
            <textarea
              value={selectedNode.data.label}
              rows={3}
              onFocus={commitHistory}
              onChange={(event) =>
                updateSelectedNode((node) => ({
                  ...node,
                  data: { ...node.data, label: event.target.value },
                }))
              }
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Width</span>
              <input
                type="number"
                min={56}
                max={640}
                value={Number(
                  selectedNode.width ?? selectedNode.style?.width ?? 150,
                )}
                onFocus={commitHistory}
                onChange={(event) =>
                  updateSelectedNode((node) => ({
                    ...node,
                    width: Math.min(
                      640,
                      Math.max(56, Number(event.target.value) || 56),
                    ),
                    style: {
                      ...node.style,
                      width: Math.min(
                        640,
                        Math.max(56, Number(event.target.value) || 56),
                      ),
                    },
                  }))
                }
              />
            </label>
            <label className="field">
              <span>Height</span>
              <input
                type="number"
                min={48}
                max={640}
                value={Number(
                  selectedNode.height ?? selectedNode.style?.height ?? 88,
                )}
                onFocus={commitHistory}
                onChange={(event) =>
                  updateSelectedNode((node) => ({
                    ...node,
                    height: Math.min(
                      640,
                      Math.max(48, Number(event.target.value) || 48),
                    ),
                    style: {
                      ...node.style,
                      height: Math.min(
                        640,
                        Math.max(48, Number(event.target.value) || 48),
                      ),
                    },
                  }))
                }
              />
            </label>
          </div>

          <div className="field-divider" />
          <p className="section-label">APPEARANCE</p>

          <label className="color-field">
            <span>Fill</span>
            <input
              aria-label="Shape fill color"
              type="color"
              value={selectedNode.data.fill}
              onFocus={commitHistory}
              onChange={(event) =>
                updateSelectedNode((node) => ({
                  ...node,
                  data: { ...node.data, fill: event.target.value },
                }))
              }
            />
            <code>{selectedNode.data.fill.toUpperCase()}</code>
          </label>
          <label className="color-field">
            <span>Border</span>
            <input
              aria-label="Shape border color"
              type="color"
              value={selectedNode.data.stroke}
              onFocus={commitHistory}
              onChange={(event) =>
                updateSelectedNode((node) => ({
                  ...node,
                  data: { ...node.data, stroke: event.target.value },
                }))
              }
            />
            <code>{selectedNode.data.stroke.toUpperCase()}</code>
          </label>
          <label className="color-field">
            <span>Text</span>
            <input
              aria-label="Text color"
              type="color"
              value={selectedNode.data.color}
              onFocus={commitHistory}
              onChange={(event) =>
                updateSelectedNode((node) => ({
                  ...node,
                  data: { ...node.data, color: event.target.value },
                }))
              }
            />
            <code>{selectedNode.data.color.toUpperCase()}</code>
          </label>

          <div className="node-meta">
            <span>Shape type</span>
            <strong>{selectedNode.data.shapeId.replaceAll("-", " ")}</strong>
          </div>
        </div>
      ) : selectedEdge ? (
        <div className="inspector-fields">
          <p className="section-label">CONNECTOR</p>
          {(() => {
            const edge = selectedEdge;
            if (!edge) return null;
            const data = edge.data ?? {};
            const stroke = data.stroke ?? "#78849a";
            const strokeWidth = data.strokeWidth ?? 1.8;
            const lineStyle = data.lineStyle ?? "solid";
            const direction = data.direction ?? "end";

            function updateEdge(updater: (edge: DiagramEdge) => DiagramEdge) {
              commitHistory();
              setEdges(edges.map((item) => (item.id === edge.id ? updater(item) : item)));
            }

            return (
              <>
                <label className="color-field">
                  <span>Line</span>
                  <input
                    aria-label="Connector line color"
                    type="color"
                    value={stroke}
                    onFocus={commitHistory}
                    onChange={(event) => {
                      const color = event.target.value;
                      updateEdge((edge) => ({
                        ...edge,
                        data: { ...edge.data, stroke: color },
                        style: { ...edge.style, stroke: color },
                      }));
                    }}
                  />
                  <code>{stroke.toUpperCase()}</code>
                </label>
                <label className="field">
                  <span>Width</span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    step={0.5}
                    value={strokeWidth}
                    onFocus={commitHistory}
                    onChange={(event) => {
                      const width = Math.min(12, Math.max(1, Number(event.target.value) || 1));
                      updateEdge((edge) => ({
                        ...edge,
                        data: { ...edge.data, strokeWidth: width },
                        style: { ...edge.style, strokeWidth: width },
                      }));
                    }}
                  />
                </label>
                <label className="field">
                  <span>Line style</span>
                  <select
                    value={lineStyle}
                    onChange={(event) => {
                      const nextStyle = event.target.value as "solid" | "dashed" | "dotted";
                      const dashArray = nextStyle === "dashed" ? "10 7" : nextStyle === "dotted" ? "2 5" : undefined;
                      updateEdge((edge) => ({
                        ...edge,
                        data: { ...edge.data, lineStyle: nextStyle },
                        style: { ...edge.style, strokeDasharray: dashArray },
                      }));
                    }}
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </label>
                <label className="field">
                  <span>Direction</span>
                  <select
                    value={direction}
                    onChange={(event) => {
                      const nextDirection = event.target.value as "none" | "start" | "end" | "both";
                      const marker = { type: MarkerType.ArrowClosed, color: stroke };
                      updateEdge((edge) => ({
                        ...edge,
                        data: { ...edge.data, direction: nextDirection },
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
                </label>
              </>
            );
          })()}
        </div>
      ) : (
        <div className="inspector-empty">
          <div className="inspector-empty__icon">✦</div>
          <h3>Nothing selected</h3>
          <p>Select a shape on the canvas to edit its text, size, and style.</p>
          <div className="shortcut-card">
            <span>Quick tip</span>
            <p>Drag from any of the four connection points. Each point can have multiple connections.</p>
          </div>
        </div>
      )}
    </aside>
  );
}
