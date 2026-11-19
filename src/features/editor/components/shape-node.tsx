"use client";

import { useCallback } from "react";
import {
  Handle,
  NodeResizeControl,
  Position,
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

export function ShapeNode({ data, selected }: NodeProps<DiagramNode>) {
  const shape = getShapeDefinition(data.shapeId);
  const onResizeStart = useCallback(() => {
    useEditorStore.getState().commitHistory();
  }, []);
  const connectionPoints = [
    { id: "top", position: Position.Top },
    { id: "right", position: Position.Right },
    { id: "bottom", position: Position.Bottom },
    { id: "left", position: Position.Left },
  ];

  return (
    <div className="diagram-node-container">
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
      <div
        className={`diagram-node diagram-node--${data.shapeId}${selected ? " is-selected" : ""}`}
        style={{
          backgroundColor: data.fill,
          borderColor: data.stroke,
          color: data.color,
        }}
        aria-label={`${shape.label}: ${data.label}`}
      >
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
        <div className="diagram-node__label">{data.label || shape.label}</div>
      </div>
    </div>
  );
}
