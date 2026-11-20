"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  BringToFront,
  Copy,
  Italic,
  SendToBack,
  Trash2,
} from "lucide-react";
import type { DiagramNode } from "../model";
import { useEditorStore } from "../store";

const fontFamilies = [
  { value: "", label: "Default" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: '"Courier New", monospace', label: "Courier" },
  { value: "Verdana, sans-serif", label: "Verdana" },
];

const fontSizes = [10, 12, 14, 16, 18, 24, 32, 40, 48, 64];

const textAlignments = [
  { value: "left", label: "Align text left", Icon: AlignLeft },
  { value: "center", label: "Align text center", Icon: AlignCenter },
  { value: "right", label: "Align text right", Icon: AlignRight },
] as const;

interface ShapeFormatToolbarProps {
  node: DiagramNode;
}

export function ShapeFormatToolbar({ node }: ShapeFormatToolbarProps) {
  function updateNode(
    updater: (currentNode: DiagramNode) => DiagramNode,
    recordHistory = true,
  ) {
    const state = useEditorStore.getState();
    const currentNode = state.nodes.find((item) => item.id === node.id);
    if (!currentNode) return;

    if (recordHistory) state.commitHistory();
    state.setNodes(
      state.nodes.map((item) =>
        item.id === node.id ? updater(currentNode) : item,
      ),
    );
  }

  function moveLayer(direction: "front" | "back") {
    const state = useEditorStore.getState();
    const currentNode = state.nodes.find((item) => item.id === node.id);
    if (!currentNode) return;

    const otherNodes = state.nodes.filter((item) => item.id !== node.id);
    if (otherNodes.length === 0) return;

    const otherLayers = otherNodes.map((item) => item.zIndex ?? 0);
    const targetLayer =
      direction === "front"
        ? Math.max(...otherLayers) + 1
        : Math.min(...otherLayers) - 1;
    const currentLayer = currentNode.zIndex ?? 0;

    if (
      (direction === "front" && currentLayer >= targetLayer) ||
      (direction === "back" && currentLayer <= targetLayer)
    ) {
      return;
    }

    state.commitHistory();
    state.setNodes(
      state.nodes.map((item) =>
        item.id === node.id ? { ...item, zIndex: targetLayer } : item,
      ),
    );
  }

  function duplicateNode() {
    const state = useEditorStore.getState();
    const currentNode = state.nodes.find((item) => item.id === node.id);
    if (!currentNode) return;

    state.commitHistory();
    const topLayer = Math.max(...state.nodes.map((item) => item.zIndex ?? 0));
    const duplicate: DiagramNode = {
      ...currentNode,
      id: crypto.randomUUID(),
      position: {
        x: currentNode.position.x + 32,
        y: currentNode.position.y + 32,
      },
      selected: true,
      zIndex: topLayer + 1,
    };
    state.setNodes([
      ...state.nodes.map((item) => ({ ...item, selected: false })),
      duplicate,
    ]);
  }

  function deleteNode() {
    const state = useEditorStore.getState();
    if (!state.nodes.some((item) => item.id === node.id)) return;

    state.commitHistory();
    state.setNodes(state.nodes.filter((item) => item.id !== node.id));
    state.setEdges(
      state.edges.filter(
        (edge) => edge.source !== node.id && edge.target !== node.id,
      ),
    );
  }

  return (
    <div
      className="shape-format-toolbar nodrag nopan"
      role="toolbar"
      aria-label="Selected shape formatting"
    >
      <div className="shape-format-group" role="group" aria-label="Shape colors">
        <label className="shape-format-color" title="Fill color">
          <span className="visually-hidden">Fill color</span>
          <input
            type="color"
            aria-label="Fill color"
            value={node.data.fill}
            onFocus={() => useEditorStore.getState().commitHistory()}
            onChange={(event) =>
              updateNode(
                (current) => ({
                  ...current,
                  data: { ...current.data, fill: event.target.value },
                }),
                false,
              )
            }
          />
        </label>
        <label className="shape-format-color" title="Border color">
          <span className="visually-hidden">Border color</span>
          <input
            type="color"
            aria-label="Border color"
            value={node.data.stroke}
            onFocus={() => useEditorStore.getState().commitHistory()}
            onChange={(event) =>
              updateNode(
                (current) => ({
                  ...current,
                  data: { ...current.data, stroke: event.target.value },
                }),
                false,
              )
            }
          />
        </label>
        <label className="shape-format-color" title="Text color">
          <span className="visually-hidden">Text color</span>
          <input
            type="color"
            aria-label="Text color"
            value={node.data.color}
            onFocus={() => useEditorStore.getState().commitHistory()}
            onChange={(event) =>
              updateNode(
                (current) => ({
                  ...current,
                  data: { ...current.data, color: event.target.value },
                }),
                false,
              )
            }
          />
        </label>
      </div>

      <span className="shape-format-separator" />

      <div className="shape-format-group" role="group" aria-label="Font style">
        <select
          className="shape-format-select shape-format-select--family"
          aria-label="Font family"
          title="Font family"
          value={node.data.fontFamily ?? ""}
          onChange={(event) =>
            updateNode((current) => ({
              ...current,
              data: {
                ...current.data,
                fontFamily: event.target.value || undefined,
              },
            }))
          }
        >
          {fontFamilies.map((font) => (
            <option key={font.label} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
        <select
          className="shape-format-select shape-format-select--size"
          aria-label="Font size"
          title="Font size"
          value={String(node.data.fontSize ?? 12)}
          onChange={(event) =>
            updateNode((current) => ({
              ...current,
              data: { ...current.data, fontSize: Number(event.target.value) },
            }))
          }
        >
          {fontSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <button
          className="shape-format-button"
          type="button"
          aria-label="Bold"
          title="Bold"
          aria-pressed={node.data.fontWeight === "bold"}
          onClick={() =>
            updateNode((current) => ({
              ...current,
              data: {
                ...current.data,
                fontWeight:
                  current.data.fontWeight === "bold" ? "normal" : "bold",
              },
            }))
          }
        >
          <Bold size={15} />
        </button>
        <button
          className="shape-format-button"
          type="button"
          aria-label="Italic"
          title="Italic"
          aria-pressed={node.data.fontStyle === "italic"}
          onClick={() =>
            updateNode((current) => ({
              ...current,
              data: {
                ...current.data,
                fontStyle:
                  current.data.fontStyle === "italic" ? "normal" : "italic",
              },
            }))
          }
        >
          <Italic size={15} />
        </button>
      </div>

      <span className="shape-format-separator" />

      <div className="shape-format-group" role="group" aria-label="Text alignment">
        {textAlignments.map(({ value, label, Icon }) => (
          <button
            key={value}
            className="shape-format-button"
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={(node.data.textAlign ?? "center") === value}
            onClick={() =>
              updateNode((current) => ({
                ...current,
                data: {
                  ...current.data,
                  textAlign: value,
                },
              }))
            }
          >
            <Icon size={15} />
          </button>
        ))}
      </div>

      <span className="shape-format-separator" />

      <div className="shape-format-group" role="group" aria-label="Layer order">
        <button
          className="shape-format-button"
          type="button"
          aria-label="Bring to front"
          title="Bring to front"
          onClick={() => moveLayer("front")}
        >
          <BringToFront size={15} />
        </button>
        <button
          className="shape-format-button"
          type="button"
          aria-label="Send to back"
          title="Send to back"
          onClick={() => moveLayer("back")}
        >
          <SendToBack size={15} />
        </button>
      </div>

      <span className="shape-format-separator" />

      <div className="shape-format-group" role="group" aria-label="Shape actions">
        <button
          className="shape-format-button"
          type="button"
          aria-label="Duplicate shape"
          title="Duplicate shape"
          onClick={duplicateNode}
        >
          <Copy size={15} />
        </button>
        <button
          className="shape-format-button shape-format-button--danger"
          type="button"
          aria-label="Delete shape"
          title="Delete shape"
          onClick={deleteNode}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
