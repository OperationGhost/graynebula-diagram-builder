"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { shapeCategories, shapeDefinitions, type ShapeDefinition } from "../shape-catalog";

interface ShapeLibraryProps {
  onAddShape: (shape: ShapeDefinition) => void;
}

export function ShapeLibrary({ onAddShape }: ShapeLibraryProps) {
  const [query, setQuery] = useState("");

  const visibleShapes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return shapeDefinitions.filter(
      (shape) =>
        !normalizedQuery ||
        shape.label.toLowerCase().includes(normalizedQuery) ||
        shape.category.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  return (
    <aside className="side-panel shape-library" aria-label="Shape library">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">BUILD YOUR DIAGRAM</p>
          <h2>Shape library</h2>
        </div>
        <span className="shape-count">{visibleShapes.length}</span>
      </div>

      <label className="search-field">
        <Search size={16} aria-hidden="true" />
        <input
          aria-label="Search shapes"
          placeholder="Search shapes"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <kbd>/</kbd>
      </label>

      <div className="shape-categories">
        {shapeCategories.map((category) => {
          const shapes = visibleShapes.filter((shape) => shape.category === category);
          if (shapes.length === 0) return null;

          return (
            <details className="shape-category" key={category} open>
              <summary>
                <span>{category}</span>
                <span className="category-count">{shapes.length}</span>
              </summary>
              <div className="shape-grid">
                {shapes.map((shape) => {
                  const Icon = shape.icon;
                  return (
                    <button
                      className="shape-tile"
                      draggable
                      key={shape.id}
                      onClick={() => onAddShape(shape)}
                      onDragStart={(event) => {
                        event.dataTransfer.setData(
                          "application/graynebula-shape",
                          shape.id,
                        );
                        event.dataTransfer.effectAllowed = "copy";
                      }}
                      title={`${shape.label} — click or drag onto the canvas`}
                    >
                      <span className={`shape-preview shape-preview--${shape.id}`}>
                        <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
                      </span>
                      <span className="shape-tile__label">{shape.label}</span>
                    </button>
                  );
                })}
              </div>
            </details>
          );
        })}
        {visibleShapes.length === 0 && (
          <p className="empty-search">No shapes match “{query}”.</p>
        )}
      </div>

      <div className="library-hint">
        <span className="hint-dot" />
        Drag a shape onto the canvas, or click to add it
      </div>
    </aside>
  );
}
