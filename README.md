# Graynebula Studio

A free, browser-based diagram editor. No account is required: diagrams are saved
automatically in the current browser's local IndexedDB storage.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the editor.

```bash
npm run lint
npm run build
```

## Project structure

```text
app/
  globals.css                  Editor, canvas, and responsive workspace styles
  layout.tsx                   Root layout and page metadata
  page.tsx                     Home route and editor entry point
src/
  features/
    editor/
      components/
        canvas.tsx             React Flow canvas and keyboard shortcuts
        editor.tsx             Workspace orchestration and autosave
        inspector.tsx          Selection properties and appearance
        shape-library.tsx      Searchable, categorized shape sidebar
        shape-node.tsx         Custom diagram node renderer
        toolbar.tsx            Document actions, history, and export menu
      model.ts                 Typed, versioned diagram document format
      shape-catalog.ts         Shape definitions and categories
      storage.ts               IndexedDB repository
      store.ts                 Editor state and bounded undo history
```

Keep related diagram-editor work in `src/features/editor`. The App Router
provides the application shell; the interactive canvas and browser storage stay
in the client-side editor feature.

## Included editor features

- Searchable, drag-and-drop shape library: General, Flowchart, UML, Database,
  Network, and Architecture, including an octagon.
- Pan and zoom, multi-selection, draggable shapes, and custom shape rendering.
- Four connection points appear only while hovering over a shape, including
  clipped shapes such as decisions and hexagons; each point supports multiple
  connectors.
- Polygonal shape outlines, including the octagon and Input/Output shapes,
  follow the selected border color.
- Select a shape and drag a border or corner to resize it; the border resize
  cursor appears on hover, and the inspector dimensions stay in sync.
- Double-click a shape to edit its label inline; the editor expands to show all
  text without scrolling. Enter saves, Shift+Enter adds a line, and Escape
  cancels.
- Selecting a shape opens a canvas formatting toolbar for fill, border and
  text colors, fonts, alignment, layer order, duplication, and deletion.
- Shape labels, dimensions, fill, border, and text color in the inspector.
- Multiple local documents, autosave status, and undo/redo.
- Versioned JSON import and export, plus SVG and PNG image export.

## Local-first data and privacy

Diagram content stays in the browser and is not sent to an application server.
Automatic saving writes to IndexedDB in the current browser profile. Browser
storage is not a folder on disk and does not sync to another browser or device;
the browser or user can clear it. Export diagrams to keep a portable backup.
Import validates the Graynebula JSON format and supported schema version.

## Main dependencies

- Next.js, React, and TypeScript: application and user interface.
- `@xyflow/react`: interactive node-and-edge canvas.
- `dexie`: IndexedDB document storage.
- `zustand`: editor state and history.
- `zod`: imported diagram validation.
- `lucide-react`: editor icons.
- `html-to-image`: SVG and PNG export.

## Extending the shape library

Add a typed entry to `shapeDefinitions` in
`src/features/editor/shape-catalog.ts`. To add a category, update
`ShapeCategory` and `shapeCategories` in the same file. The sidebar uses these
definitions for search, grouping, and previews; `ShapeNode` and
`app/globals.css` control the corresponding canvas rendering. Imported
documents are checked against the supported shape definitions.
