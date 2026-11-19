import Dexie, { type Table } from "dexie";
import type { DiagramDocument } from "./model";

class DiagramDatabase extends Dexie {
  diagrams!: Table<DiagramDocument, string>;

  constructor() {
    super("graynebula-diagrams");
    this.version(1).stores({
      diagrams: "id, updatedAt",
    });
  }
}

const database = new DiagramDatabase();

export async function listDiagrams(): Promise<DiagramDocument[]> {
  return database.diagrams.orderBy("updatedAt").reverse().toArray();
}

export async function getDiagram(id: string): Promise<DiagramDocument | undefined> {
  return database.diagrams.get(id);
}

export async function saveDiagram(
  document: DiagramDocument,
): Promise<DiagramDocument> {
  const savedDocument = { ...document, updatedAt: Date.now() };
  await database.diagrams.put(savedDocument);
  return savedDocument;
}

export async function deleteDiagram(id: string): Promise<void> {
  await database.diagrams.delete(id);
}
