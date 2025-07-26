# Summary

The repository provides a modular Mermaid diagram editor with both a full and minimal version. Documentation outlines quick start instructions and key features including real‑time preview, CodeMirror highlighting, theme support, PNG/SVG export, auto-save, and responsive design.

FEATURES.md lists supported diagram types (flowcharts, sequence diagrams, class diagrams, etc.), export options, theme support, and advanced capabilities such as zoom controls and diagram navigation. Implementation status shows PDF export, advanced autocomplete, template library, and keyboard shortcuts are still in progress, while collaboration, cloud storage, diagram versioning, plugin system, and API integrations are only planned.

ARCHITECTURE.md describes a separation-of-concerns structure with ES6 modules communicating via an event bus. Key components are EditorCore, DiagramEngine, StorageManager, etc. The document notes performance tactics like lazy loading, debouncing, virtual scrolling, and worker threads for complex diagrams. Security measures include XSS prevention, CSP headers, and input validation.

BESTPRACTICES.md mandates purpose tags in both HTML and JS, precise edits rather than rewriting full files, and maintenance of edit_log.md and todo_list.md for transparency.

## Testing

npm test ran Vitest but found no test files and exited with code 1.

npm run build failed because src/core/editor.js references an unresolved canvas-renderer.js module.

## Network access

Some requests for package downloads were blocked or redirected through a proxy during npm install. Ensure network access is configured appropriately in your environment.