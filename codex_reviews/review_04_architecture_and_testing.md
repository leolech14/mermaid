# Summary

The architecture document states that the project is modular and event‑driven: "The Mermaid Editor follows a modular architecture…components communicate through well‑defined interfaces" and "Event‑Driven Communication: Loose coupling between components via events."

Each module and style file resides in a clearly defined folder under src/, js/, and css, supporting separation of concerns.

Performance recommendations include lazy loading, debouncing updates, virtual scrolling, and worker threads for heavy diagrams.

Security guidance covers XSS prevention and CSP headers.

Minimum browser versions are documented (Chrome/Edge 88+, Firefox 85+, Safari 14+).

Features include real‑time preview, syntax highlighting, multiple diagram types, export options (PNG/SVG/PDF), and theme support.

Local-storage auto-save is one of the storage features.

In-progress items include PDF export and advanced auto-completion.

Purpose tags are mandatory for HTML, JS, and CSS components to ease identification and maintenance.

Before committing, contributors should verify purpose tags and test cross-browser behavior (Chrome, Firefox, Safari, mobile).

## Testing

npm install completed with warnings and reported 7 moderate vulnerabilities.

npm run lint failed because no ESLint configuration was found.

npm test executed but found no test files, exiting with code 1.

npm run build failed due to an unresolved import in editor.js ("Could not resolve '../renderer/canvas-renderer.js'").

## Notes