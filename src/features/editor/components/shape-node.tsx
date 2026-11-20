"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  Handle,
  NodeResizeControl,
  Position,
  ResizeControlVariant,
  type NodeProps,
} from "@xyflow/react";
import type { DiagramNode } from "../model";
import { getShapeDefinition } from "../shape-catalog";
import { useEditorStore } from "../store";

const resizeControlPositions = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;

const edgeResizeControls = [
  { position: "top", resizeDirection: "vertical" },
  { position: "right", resizeDirection: "horizontal" },
  { position: "bottom", resizeDirection: "vertical" },
  { position: "left", resizeDirection: "horizontal" },
] as const;

const polygonOutlinePoints: Record<string, string> = {
  diamond: "50,2 98,50 50,98 2,50",
  decision: "50,2 98,50 50,98 2,50",
  hexagon: "25,2 75,2 98,50 75,98 25,98 2,50",
  preparation: "25,2 75,2 98,50 75,98 25,98 2,50",
  octagon: "30,2 70,2 98,30 98,70 70,98 30,98 2,70 2,30",
  parallelogram: "19,2 98,2 81,98 2,98",
  data: "19,2 98,2 81,98 2,98",
  arrow: "2,35 60,35 60,7 98,50 60,93 60,65 2,65",
};

export function ShapeNode({ id, data, selected }: NodeProps<DiagramNode>) {
  const shape = getShapeDefinition(data.shapeId);
  const outlinePoints = polygonOutlinePoints[data.shapeId];
  const hasPolygonOutline = outlinePoints !== undefined;
  const hasCircularLabel = shape.id === "actor" || shape.id === "router";
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState("");
  const editingRef = useRef(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const textStyle: CSSProperties = {
    fontFamily: data.fontFamily,
    fontSize: data.fontSize,
    fontWeight: data.fontWeight === "bold" ? 700 : 550,
    fontStyle: data.fontStyle,
    textAlign: data.textAlign ?? "center",
  };
  const shapeStyle: CSSProperties & { "--diagram-stroke": string } = {
    "--diagram-stroke": data.stroke,
    backgroundColor: hasPolygonOutline ? "transparent" : data.fill,
    borderColor: hasPolygonOutline ? "transparent" : data.stroke,
    clipPath: isEditing && hasPolygonOutline ? "none" : undefined,
    color: data.color,
  };
  const onResizeStart = useCallback(() => {
    useEditorStore.getState().commitHistory();
  }, []);
  const startEditing = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (editingRef.current) return;

      editingRef.current = true;
      setDraftLabel(data.label || shape.label);
      setIsEditing(true);
    },
    [data.label, shape.label],
  );
  const finishEditing = useCallback(
    (save: boolean) => {
      if (!editingRef.current) return;
      editingRef.current = false;

      if (save) {
        const state = useEditorStore.getState();
        const currentNode = state.nodes.find((node) => node.id === id);
        if (currentNode && currentNode.data.label !== draftLabel) {
          state.commitHistory();
          state.setNodes(
            state.nodes.map((node) =>
              node.id === id
                ? { ...node, data: { ...node.data, label: draftLabel } }
                : node,
            ),
          );
        }
      }

      setIsEditing(false);
    },
    [draftLabel, id],
  );

  const resizeEditor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.style.height = "auto";
    editor.style.height = `${editor.scrollHeight}px`;
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    editorRef.current?.focus();
    editorRef.current?.select();
    resizeEditor();
  }, [isEditing, resizeEditor]);

  const onEditorKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        finishEditing(false);
      } else if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.nativeEvent.isComposing
      ) {
        event.preventDefault();
        event.stopPropagation();
        finishEditing(true);
      }
    },
    [finishEditing],
  );
  const connectionPoints = [
    { id: "top", position: Position.Top },
    { id: "right", position: Position.Right },
    { id: "bottom", position: Position.Bottom },
    { id: "left", position: Position.Left },
  ];

  return (
    <div
      className={`diagram-node-container${selected ? " is-selected" : ""}`}
    >
      {selected &&
        edgeResizeControls.map(({ position, resizeDirection }) => (
          <NodeResizeControl
            key={position}
            className="diagram-edge-resize-control"
            position={position}
            variant={ResizeControlVariant.Line}
            resizeDirection={resizeDirection}
            style={{
              zIndex: 2,
              borderColor: "transparent",
              backgroundColor: "transparent",
              ...(resizeDirection === "horizontal"
                ? { width: 12 }
                : { height: 12 }),
            }}
            minWidth={56}
            minHeight={48}
            maxWidth={640}
            maxHeight={640}
            onResizeStart={onResizeStart}
          />
        ))}
      {selected &&
        resizeControlPositions.map((position) => (
          <NodeResizeControl
            key={position}
            className="diagram-resize-control"
            position={position}
            minWidth={56}
            minHeight={48}
            maxWidth={640}
            maxHeight={640}
            onResizeStart={onResizeStart}
          />
        ))}
      {outlinePoints && (
        <svg
          className="diagram-node-outline"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <polygon
            points={outlinePoints}
            fill={data.fill}
            stroke={data.stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      <div
        className={`diagram-node diagram-node--${data.shapeId}${selected ? " is-selected" : ""}`}
        style={shapeStyle}
        aria-label={`${shape.label}: ${data.label}`}
        onDoubleClick={startEditing}
      >
        {isEditing ? (
          <textarea
            ref={editorRef}
            className="diagram-node__editor nodrag nopan"
            aria-label={`Edit ${shape.label} text`}
            rows={1}
            wrap="soft"
            value={draftLabel}
            style={textStyle}
            onChange={(event) => {
              setDraftLabel(event.target.value);
              resizeEditor();
            }}
            onBlur={() => finishEditing(true)}
            onKeyDown={onEditorKeyDown}
          />
        ) : (
          <div
            className={`diagram-node__label${hasCircularLabel ? " diagram-node__label--symbol" : ""}`}
            style={{
              ...textStyle,
              borderColor: hasCircularLabel ? data.stroke : undefined,
            }}
          >
            {data.label || shape.label}
          </div>
        )}
      </div>
      {connectionPoints.map((point) => (
        <Handle
          key={point.id}
          id={point.id}
          type="source"
          position={point.position}
          className="diagram-handle"
          aria-label={`Connect from ${point.id}`}
        />
      ))}
    </div>
  );
}
