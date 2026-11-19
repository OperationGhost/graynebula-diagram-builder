import { z } from "zod";
import type { Edge, Node } from "@xyflow/react";
import { shapeDefinitions } from "./shape-catalog";

export const DIAGRAM_FORMAT = "graynebula.diagram";
export const DIAGRAM_SCHEMA_VERSION = 1;

export interface DiagramNodeData extends Record<string, unknown> {
  shapeId: string;
  label: string;
  fill: string;
  stroke: string;
  color: string;
}

export type DiagramNode = Node<DiagramNodeData, "diagramShape">;
export type DiagramEdge = Edge<Record<string, unknown>>;

export interface DiagramViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface DiagramDocument {
  format: typeof DIAGRAM_FORMAT;
  schemaVersion: number;
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  viewport: DiagramViewport;
}

const pointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const nodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().optional(),
    position: pointSchema,
    data: z
      .object({
        shapeId: z.string().min(1),
        label: z.string().max(10_000),
        fill: z.string().regex(/^#[\da-f]{6}$/i),
        stroke: z.string().regex(/^#[\da-f]{6}$/i),
        color: z.string().regex(/^#[\da-f]{6}$/i),
      })
      .passthrough(),
  })
  .passthrough();

const edgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
  })
  .passthrough();

export const diagramDocumentSchema = z
  .object({
    format: z.literal(DIAGRAM_FORMAT),
    schemaVersion: z.number().int().positive(),
    id: z.string().min(1),
    title: z.string().min(1),
    createdAt: z.number(),
    updatedAt: z.number(),
    nodes: z.array(nodeSchema),
    edges: z.array(edgeSchema),
    viewport: z
      .object({
        x: z.number(),
        y: z.number(),
        zoom: z.number().positive(),
      })
      .optional(),
  })
  .passthrough();

export function parseDiagramDocument(input: unknown): DiagramDocument {
  const parsed = diagramDocumentSchema.parse(input);

  if (parsed.schemaVersion !== DIAGRAM_SCHEMA_VERSION) {
    throw new Error(
      `This diagram uses schema version ${parsed.schemaVersion}, which this version of Graynebula cannot open.`,
    );
  }

  const supportedShapes = new Set(shapeDefinitions.map((shape) => shape.id));
  const nodeIds = new Set(parsed.nodes.map((node) => node.id));

  if (nodeIds.size !== parsed.nodes.length) {
    throw new Error("This diagram contains duplicate shape IDs.");
  }

  for (const node of parsed.nodes) {
    if (!supportedShapes.has(node.data.shapeId)) {
      throw new Error(`This diagram contains an unsupported shape: ${node.data.shapeId}.`);
    }
  }

  for (const edge of parsed.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error("This diagram contains a connector connected to a missing shape.");
    }
  }

  return {
    ...parsed,
    nodes: parsed.nodes as DiagramNode[],
    edges: parsed.edges as DiagramEdge[],
    viewport: parsed.viewport ?? { x: 0, y: 0, zoom: 1 },
  };
}

export function createBlankDocument(title = "Untitled diagram"): DiagramDocument {
  const now = Date.now();

  return {
    format: DIAGRAM_FORMAT,
    schemaVersion: DIAGRAM_SCHEMA_VERSION,
    id: crypto.randomUUID(),
    title,
    createdAt: now,
    updatedAt: now,
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

export function createDiagramNode(
  shapeId: string,
  label: string,
  position: { x: number; y: number },
  size: { width: number; height: number },
): DiagramNode {
  return {
    id: crypto.randomUUID(),
    type: "diagramShape",
    position,
    style: { width: size.width, height: size.height },
    data: {
      shapeId,
      label,
      fill: "#ffffff",
      stroke: "#64748b",
      color: "#172033",
    },
  };
}

export function getShapePlacementOffset(shapeCount: number): {
  x: number;
  y: number;
} {
  const columns = 4;
  return {
    x: (shapeCount % columns) * 28,
    y: Math.floor(shapeCount / columns) * 28,
  };
}
