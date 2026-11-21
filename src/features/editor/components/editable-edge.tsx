"use client";

import { useRef, type PointerEvent } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
  type XYPosition,
} from "@xyflow/react";
import { Move, Plus } from "lucide-react";
import type { DiagramEdge, DiagramEdgeData, DiagramWaypoint } from "../model";
import { useEditorStore } from "../store";

type EdgeControlDrag =
  | {
      pointerId: number;
      kind: "addBend";
      start: XYPosition;
      waypoints: DiagramWaypoint[];
      bendIndex: number;
      data: DiagramEdgeData;
    }
  | {
      pointerId: number;
      kind: "bend";
      start: XYPosition;
      waypoints: DiagramWaypoint[];
      bendIndex: number;
      data: DiagramEdgeData;
    }
  | {
      pointerId: number;
      kind: "route";
      start: XYPosition;
      waypoints: DiagramWaypoint[];
      centerX: number;
      centerY: number;
      data: DiagramEdgeData;
    };

function getPolylineMidpoint(points: XYPosition[]) {
  const lengths = points.slice(1).map((point, index) => {
    const previous = points[index];
    return Math.hypot(point.x - previous.x, point.y - previous.y);
  });
  const totalLength = lengths.reduce((total, length) => total + length, 0);

  if (totalLength === 0) return points[0];

  let distance = totalLength / 2;
  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index];
    if (distance <= length) {
      const start = points[index];
      const end = points[index + 1];
      const ratio = length === 0 ? 0 : distance / length;
      return {
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      };
    }
    distance -= length;
  }

  return points[points.length - 1];
}

function updateEdgeData(id: string, data: DiagramEdgeData) {
  const state = useEditorStore.getState();
  state.setEdges(
    state.edges.map((edge) => (edge.id === id ? { ...edge, data } : edge)),
  );
}

export function EditableEdge({
  id,
  data,
  selected,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  markerEnd,
  markerStart,
  style,
}: EdgeProps<DiagramEdge>) {
  const { screenToFlowPosition } = useReactFlow();
  const dragRef = useRef<EdgeControlDrag | null>(null);
  const edgeData = data ?? {};
  const waypoints = edgeData.waypoints ?? [];
  const [defaultPath, defaultLabelX, defaultLabelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    centerX: edgeData.centerX,
    centerY: edgeData.centerY,
  });
  const points: XYPosition[] = [
    { x: sourceX, y: sourceY },
    ...waypoints,
    { x: targetX, y: targetY },
  ];
  const path =
    waypoints.length === 0
      ? defaultPath
      : points
          .map(
            (point, index) =>
              `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
          )
          .join(" ");
  const routeCenter =
    waypoints.length === 0
      ? { x: defaultLabelX, y: defaultLabelY }
      : getPolylineMidpoint(points);
  const bendControls =
    waypoints.length === 0
      ? [{ x: defaultLabelX, y: defaultLabelY, insertIndex: 0 }]
      : points.slice(1).map((point, index) => {
          const previous = points[index];
          return {
            x: (previous.x + point.x) / 2,
            y: (previous.y + point.y) / 2,
            insertIndex: index,
          };
        });

  function startDrag(
    event: PointerEvent<HTMLButtonElement>,
    kind: "addBend" | "bend" | "route",
    bendIndex = 0,
  ) {
    event.preventDefault();
    event.stopPropagation();
    const start = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    const originalWaypoints = waypoints.map((point) => ({ ...point }));
    const originalData = { ...edgeData };
    const state = useEditorStore.getState();
    state.commitHistory();

    if (kind === "addBend") {
      originalWaypoints.splice(bendIndex, 0, start);
      dragRef.current = {
        pointerId: event.pointerId,
        kind,
        start,
        waypoints: originalWaypoints,
        bendIndex,
        data: originalData,
      };
      updateEdgeData(id, {
        ...originalData,
        waypoints: originalWaypoints,
        centerX: undefined,
        centerY: undefined,
      });
    } else if (kind === "bend") {
      dragRef.current = {
        pointerId: event.pointerId,
        kind,
        start,
        waypoints: originalWaypoints,
        bendIndex,
        data: originalData,
      };
    } else {
      dragRef.current = {
        pointerId: event.pointerId,
        kind,
        start,
        waypoints: originalWaypoints,
        centerX: edgeData.centerX ?? (sourceX + targetX) / 2,
        centerY: edgeData.centerY ?? (sourceY + targetY) / 2,
        data: originalData,
      };
    }

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    const delta = {
      x: position.x - drag.start.x,
      y: position.y - drag.start.y,
    };

    if (drag.kind === "bend" || drag.kind === "addBend") {
      const nextWaypoints = drag.waypoints.map((point, index) =>
        index === drag.bendIndex
          ? { x: position.x, y: position.y }
          : point,
      );
      updateEdgeData(id, {
        ...drag.data,
        waypoints: nextWaypoints,
        centerX: undefined,
        centerY: undefined,
      });
      return;
    }

    if (drag.waypoints.length > 0) {
      updateEdgeData(id, {
        ...drag.data,
        waypoints: drag.waypoints.map((point) => ({
          x: point.x + delta.x,
          y: point.y + delta.y,
        })),
        centerX: undefined,
        centerY: undefined,
      });
      return;
    }

    updateEdgeData(id, {
      ...drag.data,
      centerX: drag.centerX + delta.x,
      centerY: drag.centerY + delta.y,
    });
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    event.stopPropagation();
    dragRef.current = null;
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={style}
        interactionWidth={20}
      />
      {selected && (
        <EdgeLabelRenderer>
          <div
            className="edge-edit-controls nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${routeCenter.x}px, ${routeCenter.y - 24}px)`,
            }}
          >
            <button
              type="button"
              className="edge-edit-control edge-edit-control--move"
              aria-label="Move entire connector route"
              title="Drag to move the route"
              onPointerDown={(event) => startDrag(event, "route")}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <Move size={13} />
            </button>
          </div>
          {bendControls.map((control) => (
            <div
              className="edge-edit-controls nodrag nopan"
              key={control.insertIndex}
              style={{
                transform: `translate(-50%, -50%) translate(${control.x}px, ${control.y}px)`,
              }}
            >
              <button
                type="button"
                className="edge-edit-control edge-edit-control--bend"
                aria-label="Drag to add a connector bend"
                title="Drag to add a bend point"
                onPointerDown={(event) =>
                  startDrag(event, "addBend", control.insertIndex)
                }
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <Plus size={12} />
              </button>
            </div>
          ))}
          {waypoints.map((point, index) => (
            <div
              className="edge-edit-controls nodrag nopan"
              key={`waypoint-${index}`}
              style={{
                transform: `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)`,
              }}
            >
              <button
                type="button"
                className="edge-edit-control edge-edit-control--waypoint"
                aria-label={`Move connector bend ${index + 1}`}
                title="Drag to move this bend"
                onPointerDown={(event) =>
                  startDrag(event, "bend", index)
                }
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              />
            </div>
          ))}
        </EdgeLabelRenderer>
      )}
    </>
  );
}
