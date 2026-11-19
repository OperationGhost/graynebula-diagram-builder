"use client";

import { useEditorStore } from "../store";

export function Inspector() {
  const nodes = useEditorStore((state) => state.nodes);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const setNodes = useEditorStore((state) => state.setNodes);
  const commitHistory = useEditorStore((state) => state.commitHistory);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

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
          <h2>{selectedNode ? "Properties" : "Inspector"}</h2>
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
