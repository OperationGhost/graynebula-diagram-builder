import {
  Activity,
  AppWindow,
  ArrowDown,
  Box,
  Braces,
  Circle,
  CircleDot,
  Cloud,
  Database,
  FileText,
  GitBranch,
  Hexagon,
  Layers,
  Monitor,
  Octagon,
  Package,
  Router,
  Server,
  Square,
  StickyNote,
  Table2,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type ShapeCategory =
  | "General"
  | "Flowchart"
  | "UML"
  | "Database"
  | "Network"
  | "Architecture";

export interface ShapeDefinition {
  id: string;
  label: string;
  category: ShapeCategory;
  width: number;
  height: number;
  icon: LucideIcon;
}

export const shapeCategories: ShapeCategory[] = [
  "General",
  "Flowchart",
  "UML",
  "Database",
  "Network",
  "Architecture",
];

export const shapeDefinitions: ShapeDefinition[] = [
  { id: "rectangle", label: "Rectangle", category: "General", width: 150, height: 88, icon: Square },
  { id: "rounded", label: "Rounded rectangle", category: "General", width: 150, height: 88, icon: AppWindow },
  { id: "ellipse", label: "Ellipse", category: "General", width: 132, height: 88, icon: Circle },
  { id: "diamond", label: "Diamond", category: "General", width: 124, height: 112, icon: GitBranch },
  { id: "hexagon", label: "Hexagon", category: "General", width: 144, height: 92, icon: Hexagon },
  { id: "octagon", label: "Octagon", category: "General", width: 144, height: 96, icon: Octagon },
  { id: "parallelogram", label: "Parallelogram", category: "General", width: 150, height: 88, icon: Layers },
  { id: "document", label: "Document", category: "General", width: 142, height: 98, icon: FileText },
  { id: "note", label: "Note", category: "General", width: 148, height: 96, icon: StickyNote },
  { id: "arrow", label: "Arrow", category: "General", width: 150, height: 80, icon: ArrowDown },
  { id: "process", label: "Process", category: "Flowchart", width: 150, height: 84, icon: Square },
  { id: "terminator", label: "Start / end", category: "Flowchart", width: 148, height: 76, icon: CircleDot },
  { id: "decision", label: "Decision", category: "Flowchart", width: 128, height: 112, icon: GitBranch },
  { id: "data", label: "Input / output", category: "Flowchart", width: 156, height: 84, icon: Activity },
  { id: "preparation", label: "Preparation", category: "Flowchart", width: 146, height: 88, icon: Hexagon },
  { id: "database", label: "Database", category: "Database", width: 128, height: 104, icon: Database },
  { id: "table", label: "Table", category: "Database", width: 152, height: 92, icon: Table2 },
  { id: "entity", label: "Entity", category: "Database", width: 146, height: 84, icon: Box },
  { id: "class", label: "Class", category: "UML", width: 156, height: 104, icon: Braces },
  { id: "interface", label: "Interface", category: "UML", width: 156, height: 104, icon: Braces },
  { id: "actor", label: "Actor", category: "UML", width: 104, height: 116, icon: UserRound },
  { id: "package", label: "Package", category: "UML", width: 150, height: 92, icon: Package },
  { id: "server", label: "Server", category: "Network", width: 132, height: 108, icon: Server },
  { id: "router", label: "Router", category: "Network", width: 116, height: 92, icon: Router },
  { id: "workstation", label: "Workstation", category: "Network", width: 136, height: 104, icon: Monitor },
  { id: "cloud", label: "Cloud", category: "Architecture", width: 148, height: 92, icon: Cloud },
  { id: "container", label: "Container", category: "Architecture", width: 160, height: 104, icon: Layers },
  { id: "component", label: "Component", category: "Architecture", width: 148, height: 92, icon: AppWindow },
];

export function getShapeDefinition(shapeId: string): ShapeDefinition {
  const shape = shapeDefinitions.find((definition) => definition.id === shapeId);
  if (!shape) throw new Error(`Unsupported diagram shape: ${shapeId}`);
  return shape;
}
